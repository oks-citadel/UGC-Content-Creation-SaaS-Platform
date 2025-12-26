/**
 * =============================================================================
 * B2C Authorization Middleware
 * Server-side Token Validation & Group-based Access Control
 * =============================================================================
 *
 * This middleware provides:
 * - JWT token validation against Azure AD B2C
 * - Group-based subscription tier enforcement
 * - Origin protection (Front Door header validation)
 * - Rate limiting helpers
 * - Audit logging
 */

import { Request, Response, NextFunction } from 'express';
import * as jose from 'jose';

// =============================================================================
// Types
// =============================================================================

export type SubscriptionTier = 'free' | 'starter' | 'growth' | 'pro' | 'business' | 'enterprise';

export interface B2CConfig {
  tenantName: string;
  policyName: string;
  clientId: string;
  frontDoorId?: string;
  groups: GroupConfig;
}

export interface GroupConfig {
  // Subscription tiers
  free: string;
  starter: string;
  growth: string;
  pro: string;
  business: string;
  enterprise: string;
  // Special groups
  verified: string;
  support: string;
  admin: string;
  suspended: string;
}

export interface PlatformUser {
  userId: string;
  email: string;
  name?: string;
  groups: string[];
  subscriptionTier: SubscriptionTier;
  isVerified: boolean;
  isSupport: boolean;
  isAdmin: boolean;
  isSuspended: boolean;
  rawClaims: Record<string, unknown>;
}

export interface FeatureDefinition {
  requiredTier?: SubscriptionTier;
  requireVerified?: boolean;
  requireSupport?: boolean;
  requireAdmin?: boolean;
  custom?: (user: PlatformUser) => boolean;
}

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: PlatformUser;
      frontDoorId?: string;
    }
  }
}

// =============================================================================
// Configuration
// =============================================================================

const TIER_HIERARCHY: readonly SubscriptionTier[] = [
  'free',
  'starter',
  'growth',
  'pro',
  'business',
  'enterprise',
] as const;

let config: B2CConfig | null = null;
let jwksClient: jose.JWTVerifyGetKey | null = null;

/**
 * Initialize the B2C authorization module
 */
export function initializeB2CAuth(b2cConfig: B2CConfig): void {
  config = b2cConfig;

  // Create JWKS client for token signature verification
  const jwksUri = `https://${config.tenantName}.b2clogin.com/${config.tenantName}.onmicrosoft.com/${config.policyName}/discovery/v2.0/keys`;

  jwksClient = jose.createRemoteJWKSet(new URL(jwksUri));
}

/**
 * Load configuration from environment variables
 */
export function initializeFromEnv(): void {
  const tenantName = process.env.B2C_TENANT_NAME;
  const policyName = process.env.B2C_POLICY_NAME || 'B2C_1_SignUpSignIn';
  const clientId = process.env.B2C_API_CLIENT_ID;

  if (!tenantName || !clientId) {
    console.warn('B2C configuration incomplete - B2C auth will be disabled');
    return;
  }

  initializeB2CAuth({
    tenantName,
    policyName,
    clientId,
    frontDoorId: process.env.FRONTDOOR_ID,
    groups: {
      free: process.env.GROUP_ID_FREE || '',
      starter: process.env.GROUP_ID_STARTER || '',
      growth: process.env.GROUP_ID_GROWTH || '',
      pro: process.env.GROUP_ID_PRO || '',
      business: process.env.GROUP_ID_BUSINESS || '',
      enterprise: process.env.GROUP_ID_ENTERPRISE || '',
      verified: process.env.GROUP_ID_VERIFIED || '',
      support: process.env.GROUP_ID_SUPPORT || '',
      admin: process.env.GROUP_ID_ADMIN || '',
      suspended: process.env.GROUP_ID_SUSPENDED || '',
    },
  });
}

// =============================================================================
// Token Validation
// =============================================================================

/**
 * Validate a B2C JWT token
 */
export async function validateB2CToken(token: string): Promise<jose.JWTPayload> {
  if (!config || !jwksClient) {
    throw new Error('B2C authorization not initialized');
  }

  const { payload } = await jose.jwtVerify(token, jwksClient, {
    audience: config.clientId,
    issuer: `https://${config.tenantName}.b2clogin.com/${config.tenantName}.onmicrosoft.com/${config.policyName}/v2.0/`,
  });

  return payload;
}

/**
 * Extract user information from token payload
 */
export function extractUserFromToken(payload: jose.JWTPayload): PlatformUser {
  if (!config) {
    throw new Error('B2C authorization not initialized');
  }

  const groups = (payload.groups as string[]) || [];

  // Determine subscription tier (highest tier wins)
  let subscriptionTier: SubscriptionTier = 'free';
  for (const tier of [...TIER_HIERARCHY].reverse()) {
    const groupId = config.groups[tier];
    if (groupId && groups.includes(groupId)) {
      subscriptionTier = tier;
      break;
    }
  }

  // Extract email from various claim locations
  const email =
    (payload.emails as string[])?.[0] ||
    (payload.email as string) ||
    (payload.preferred_username as string) ||
    '';

  return {
    userId: (payload.sub as string) || (payload.oid as string) || '',
    email,
    name: (payload.name as string) || (payload.given_name as string),
    groups,
    subscriptionTier,
    isVerified: groups.includes(config.groups.verified),
    isSupport: groups.includes(config.groups.support),
    isAdmin: groups.includes(config.groups.admin),
    isSuspended: groups.includes(config.groups.suspended),
    rawClaims: payload as Record<string, unknown>,
  };
}

// =============================================================================
// Middleware: Origin Protection
// =============================================================================

/**
 * Validate Front Door origin header
 * Blocks requests that don't come through Azure Front Door
 */
export function requireFrontDoor(req: Request, res: Response, next: NextFunction): void {
  if (!config?.frontDoorId) {
    // Front Door not configured, skip validation
    return next();
  }

  const fdid = req.headers['x-azure-fdid'] as string;

  if (!fdid) {
    res.status(403).json({
      error: 'forbidden',
      message: 'Direct access not allowed',
      code: 'ORIGIN_PROTECTION',
    });
    return;
  }

  if (fdid !== config.frontDoorId) {
    console.warn(`Invalid Front Door ID: ${fdid}, expected: ${config.frontDoorId}`);
    res.status(403).json({
      error: 'forbidden',
      message: 'Invalid origin',
      code: 'ORIGIN_PROTECTION',
    });
    return;
  }

  req.frontDoorId = fdid;
  next();
}

// =============================================================================
// Middleware: Authentication
// =============================================================================

/**
 * Authenticate request using B2C token
 */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        error: 'unauthorized',
        message: 'Missing or invalid authorization header',
        code: 'AUTH_MISSING',
      });
      return;
    }

    const token = authHeader.substring(7);

    // Validate token
    const payload = await validateB2CToken(token);

    // Extract user info
    const user = extractUserFromToken(payload);

    // CRITICAL: Check if user is suspended
    if (user.isSuspended) {
      console.warn(`Suspended user attempted access: ${user.userId}`);
      res.status(403).json({
        error: 'forbidden',
        message: 'Account has been suspended',
        code: 'ACCOUNT_SUSPENDED',
        supportUrl: '/support/appeal',
      });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication failed:', error);

    if (error instanceof jose.errors.JWTExpired) {
      res.status(401).json({
        error: 'unauthorized',
        message: 'Token has expired',
        code: 'TOKEN_EXPIRED',
      });
      return;
    }

    res.status(401).json({
      error: 'unauthorized',
      message: 'Invalid or expired token',
      code: 'AUTH_FAILED',
    });
  }
}

/**
 * Optional authentication - doesn't fail if no token present
 */
export async function optionalAuthenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  try {
    const token = authHeader.substring(7);
    const payload = await validateB2CToken(token);
    const user = extractUserFromToken(payload);

    if (!user.isSuspended) {
      req.user = user;
    }
  } catch {
    // Ignore token errors for optional auth
  }

  next();
}

// =============================================================================
// Middleware: Authorization
// =============================================================================

/**
 * Require minimum subscription tier
 */
export function requireTier(minimumTier: SubscriptionTier) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'unauthorized',
        message: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
      return;
    }

    const userTierIndex = TIER_HIERARCHY.indexOf(req.user.subscriptionTier);
    const requiredTierIndex = TIER_HIERARCHY.indexOf(minimumTier);

    if (userTierIndex < requiredTierIndex) {
      res.status(403).json({
        error: 'forbidden',
        message: `${minimumTier} subscription required`,
        code: 'TIER_REQUIRED',
        currentTier: req.user.subscriptionTier,
        requiredTier: minimumTier,
        upgradeUrl: '/subscription/upgrade',
      });
      return;
    }

    next();
  };
}

/**
 * Require account verification
 */
export function requireVerified(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({
      error: 'unauthorized',
      message: 'Authentication required',
      code: 'AUTH_REQUIRED',
    });
    return;
  }

  if (!req.user.isVerified) {
    res.status(403).json({
      error: 'forbidden',
      message: 'Account verification required',
      code: 'VERIFICATION_REQUIRED',
      verifyUrl: '/account/verify',
    });
    return;
  }

  next();
}

/**
 * Require support role
 */
export function requireSupport(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({
      error: 'unauthorized',
      message: 'Authentication required',
      code: 'AUTH_REQUIRED',
    });
    return;
  }

  if (!req.user.isSupport && !req.user.isAdmin) {
    res.status(403).json({
      error: 'forbidden',
      message: 'Support access required',
      code: 'SUPPORT_REQUIRED',
    });
    return;
  }

  next();
}

/**
 * Require admin role
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({
      error: 'unauthorized',
      message: 'Authentication required',
      code: 'AUTH_REQUIRED',
    });
    return;
  }

  if (!req.user.isAdmin) {
    console.warn(`Unauthorized admin access attempt by user: ${req.user.userId}`);
    res.status(403).json({
      error: 'forbidden',
      message: 'Administrator access required',
      code: 'ADMIN_REQUIRED',
    });
    return;
  }

  next();
}

// =============================================================================
// Feature Access Control
// =============================================================================

/**
 * Check if user can access a feature
 */
export function canAccessFeature(user: PlatformUser, feature: FeatureDefinition): boolean {
  // Check tier requirement
  if (feature.requiredTier) {
    const userTierIndex = TIER_HIERARCHY.indexOf(user.subscriptionTier);
    const requiredTierIndex = TIER_HIERARCHY.indexOf(feature.requiredTier);
    if (userTierIndex < requiredTierIndex) return false;
  }

  // Check verification
  if (feature.requireVerified && !user.isVerified) return false;

  // Check support role
  if (feature.requireSupport && !user.isSupport && !user.isAdmin) return false;

  // Check admin role
  if (feature.requireAdmin && !user.isAdmin) return false;

  // Custom check
  if (feature.custom && !feature.custom(user)) return false;

  return true;
}

/**
 * Create middleware that requires specific feature access
 */
export function requireFeature(feature: FeatureDefinition) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'unauthorized',
        message: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
      return;
    }

    if (!canAccessFeature(req.user, feature)) {
      res.status(403).json({
        error: 'forbidden',
        message: 'Access to this feature is restricted',
        code: 'FEATURE_RESTRICTED',
        currentTier: req.user.subscriptionTier,
        requiredTier: feature.requiredTier,
        upgradeUrl: '/subscription/upgrade',
      });
      return;
    }

    next();
  };
}

// =============================================================================
// Tier Utilities
// =============================================================================

/**
 * Get tier hierarchy index
 */
export function getTierIndex(tier: SubscriptionTier): number {
  return TIER_HIERARCHY.indexOf(tier);
}

/**
 * Compare two tiers
 * Returns: -1 if a < b, 0 if equal, 1 if a > b
 */
export function compareTiers(a: SubscriptionTier, b: SubscriptionTier): number {
  const indexA = TIER_HIERARCHY.indexOf(a);
  const indexB = TIER_HIERARCHY.indexOf(b);
  return Math.sign(indexA - indexB);
}

/**
 * Check if tier A meets or exceeds tier B
 */
export function tierMeetsRequirement(userTier: SubscriptionTier, requiredTier: SubscriptionTier): boolean {
  return getTierIndex(userTier) >= getTierIndex(requiredTier);
}

/**
 * Get all tiers at or above the specified tier
 */
export function getTiersAtOrAbove(tier: SubscriptionTier): SubscriptionTier[] {
  const index = TIER_HIERARCHY.indexOf(tier);
  return [...TIER_HIERARCHY.slice(index)];
}

// =============================================================================
// Exports
// =============================================================================

export { TIER_HIERARCHY };
