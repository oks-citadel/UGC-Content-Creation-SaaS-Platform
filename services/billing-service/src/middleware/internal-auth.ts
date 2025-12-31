/**
 * Internal Service Authentication Middleware
 * Validates JWT tokens for service-to-service communication
 *
 * This middleware ensures that requests to backend services are properly
 * authenticated, preventing header spoofing if the API Gateway is bypassed.
 */

import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import config from '../config';
import logger from '../utils/logger';

export interface InternalAuthPayload {
  sub: string;           // User ID
  email?: string;
  role?: string;
  organizationId?: string;
  permissions?: string[];
  iss: string;           // Issuer (api-gateway)
  aud: string;           // Audience (internal-services)
  iat: number;
  exp: number;
}

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userEmail?: string;
  userRole?: string;
  organizationId?: string;
  permissions?: string[];
}

/**
 * Validates internal service JWT token
 * Falls back to header-based auth only in development with explicit flag
 */
export const validateInternalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Check for internal service token in X-Internal-Token header
    const internalToken = req.headers['x-internal-token'] as string;

    if (internalToken) {
      // Validate internal JWT token
      const payload = jwt.verify(internalToken, config.internalAuth.secret, {
        issuer: config.internalAuth.issuer,
        audience: config.internalAuth.audience,
      }) as InternalAuthPayload;

      req.userId = payload.sub;
      req.userEmail = payload.email;
      req.userRole = payload.role;
      req.organizationId = payload.organizationId;
      req.permissions = payload.permissions;

      logger.debug('Internal auth validated', { userId: payload.sub });
      return next();
    }

    // Check for standard Authorization header (for direct API access)
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      // Validate the token using the same secret
      const payload = jwt.verify(token, config.internalAuth.secret, {
        issuer: config.internalAuth.issuer,
        audience: config.internalAuth.audience,
      }) as InternalAuthPayload;

      req.userId = payload.sub;
      req.userEmail = payload.email;
      req.userRole = payload.role;
      req.organizationId = payload.organizationId;
      req.permissions = payload.permissions;

      logger.debug('Bearer auth validated', { userId: payload.sub });
      return next();
    }

    // In development only, allow header-based auth with explicit flag
    // This should NEVER be enabled in production
    if (config.nodeEnv === 'development' && process.env.ALLOW_HEADER_AUTH === 'true') {
      const userId = req.headers['x-user-id'] as string;
      if (userId) {
        logger.warn('Using insecure header-based auth (dev only)', { userId });
        req.userId = userId;
        req.organizationId = req.headers['x-organization-id'] as string;
        return next();
      }
    }

    // No valid authentication provided
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Valid internal service token required',
    });
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      logger.warn('Internal token expired', { error: error.message });
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Internal service token has expired',
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      logger.warn('Invalid internal token', { error: error.message });
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid internal service token',
      });
      return;
    }

    logger.error('Internal auth error', { error });
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication check failed',
    });
  }
};

/**
 * Middleware to extract user ID - now uses validated auth
 * This replaces the old header-trusting middleware
 */
export const extractUserId = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'User ID required - ensure internal auth middleware is applied',
    });
    return;
  }
  next();
};
