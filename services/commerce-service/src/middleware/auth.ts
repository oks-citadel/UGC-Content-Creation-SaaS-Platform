import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';
import logger from '../config/logger';

interface JWTPayload {
  userId: string;
  tenantId: string;
  email: string;
  role?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
      tenantId?: string;
    }
  }
}

/**
 * Middleware to authenticate JWT tokens
 */
export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'No token provided',
      });
      return;
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;
      req.user = decoded;
      req.tenantId = decoded.tenantId;
      next();
    } catch (error) {
      logger.warn('Invalid token:', error);
      res.status(401).json({
        success: false,
        message: 'Invalid token',
      });
    }
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed',
    });
  }
};

/**
 * Optional authentication - sets user if token is valid, but doesn't require it
 */
export const optionalAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      try {
        const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;
        req.user = decoded;
        req.tenantId = decoded.tenantId;
      } catch (error) {
        // Invalid token, but we don't fail - just continue without user
        logger.debug('Optional auth - invalid token');
      }
    }

    next();
  } catch (error) {
    logger.error('Optional authentication error:', error);
    next();
  }
};

/**
 * Middleware to check if user has required role
 */
export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    if (!req.user.role || !roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
      });
      return;
    }

    next();
  };
};
