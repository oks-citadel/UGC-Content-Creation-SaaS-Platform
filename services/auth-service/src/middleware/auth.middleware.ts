/**
 * SECURITY FIX: JWT Authentication Middleware for Auth Service
 *
 * This middleware validates JWT tokens from the Authorization header before
 * allowing access to sensitive operations like MFA setup/enable/disable.
 *
 * Previously, the MFA endpoints only checked for x-user-id header which could be
 * spoofed if the service was accessed directly (bypassing the API gateway).
 *
 * This middleware ensures that only requests with valid JWT tokens can access
 * protected endpoints, preventing header spoofing attacks.
 */

import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../lib/jwt';

// Extended request interface for authenticated requests
export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

/**
 * Middleware to require valid JWT authentication
 *
 * This validates:
 * 1. Presence of Authorization header with Bearer token
 * 2. Token signature and expiration
 * 3. Token type is 'access' (not 'refresh')
 *
 * On success, attaches the decoded token payload to req.user
 */
export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required - missing or invalid token'
        },
      });
      return;
    }

    const token = authHeader.substring(7);
    const payload = await verifyToken(token);

    // Ensure it's an access token, not a refresh token
    if (payload.type !== 'access') {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN_TYPE',
          message: 'Access token required'
        },
      });
      return;
    }

    req.user = payload;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired token'
      },
    });
  }
}
