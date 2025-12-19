// =============================================================================
// Authentication Middleware
// =============================================================================

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { config } from '../config';
import { logger } from '../utils/logger';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
      organizationId?: string;
    }
  }
}

interface JWTPayload {
  sub: string;
  email: string;
  name?: string;
  role: string;
  organizationId?: string;
  permissions?: string[];
  iat: number;
  exp: number;
  iss: string;
  aud: string;
}

// JWKS client for Azure AD B2C
const jwksClientInstance = config.jwt.jwksUri
  ? jwksClient({
      jwksUri: config.jwt.jwksUri,
      cache: true,
      cacheMaxAge: 86400000, // 24 hours
      rateLimit: true,
      jwksRequestsPerMinute: 10,
    })
  : null;

function getSigningKey(header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) {
  if (!jwksClientInstance) {
    callback(new Error('JWKS client not configured'));
    return;
  }

  jwksClientInstance.getSigningKey(header.kid, (err, key) => {
    if (err) {
      callback(err);
      return;
    }
    const signingKey = key?.getPublicKey();
    callback(null, signingKey);
  });
}

// Public routes that don't require authentication
const publicRoutes = [
  '/api/v1/auth/login',
  '/api/v1/auth/register',
  '/api/v1/auth/refresh',
  '/api/v1/auth/forgot-password',
  '/api/v1/auth/reset-password',
  '/api/v1/auth/verify-email',
  '/api/v1/auth/oauth',
  '/api/v1/public',
  '/api/v1/webhooks',
];

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  // Check if route is public
  const isPublicRoute = publicRoutes.some((route) => req.path.startsWith(route));

  if (isPublicRoute) {
    return next();
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: {
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication required',
      },
    });
    return;
  }

  const token = authHeader.substring(7);

  try {
    let payload: JWTPayload;

    if (config.jwt.jwksUri && jwksClientInstance) {
      // Verify with JWKS (Azure AD B2C)
      payload = await new Promise((resolve, reject) => {
        jwt.verify(
          token,
          getSigningKey,
          {
            issuer: config.jwt.issuer,
            audience: config.jwt.audience,
            algorithms: ['RS256'],
          },
          (err, decoded) => {
            if (err) reject(err);
            else resolve(decoded as JWTPayload);
          }
        );
      });
    } else if (config.jwt.secret) {
      // Verify with secret (development)
      payload = jwt.verify(token, config.jwt.secret, {
        issuer: config.jwt.issuer,
        audience: config.jwt.audience,
      }) as JWTPayload;
    } else {
      throw new Error('No JWT verification method configured');
    }

    req.user = payload;
    req.organizationId = payload.organizationId || req.headers['x-organization-id'] as string;

    // Add user info to response headers for debugging
    res.setHeader('X-User-ID', payload.sub);

    next();
  } catch (error) {
    logger.warn({
      message: 'Authentication failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      path: req.path,
    });

    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Access token has expired',
        },
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid access token',
        },
      });
      return;
    }

    res.status(401).json({
      success: false,
      error: {
        code: 'AUTHENTICATION_FAILED',
        message: 'Authentication failed',
      },
    });
  }
}

// Role-based authorization middleware
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication required',
        },
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        },
      });
      return;
    }

    next();
  };
}

// Permission-based authorization middleware
export function requirePermission(...permissions: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication required',
        },
      });
      return;
    }

    const userPermissions = req.user.permissions || [];
    const hasPermission = permissions.every((p) => userPermissions.includes(p));

    if (!hasPermission) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        },
      });
      return;
    }

    next();
  };
}
