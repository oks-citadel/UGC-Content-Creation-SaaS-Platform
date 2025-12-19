import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';
import { AppError } from './error-handler';
import logger from '../utils/logger';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: 'creator' | 'brand' | 'admin';
  };
}

/**
 * Middleware to verify JWT token
 */
export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(401, 'No token provided');
    }

    const token = authHeader.substring(7);

    const decoded = jwt.verify(token, config.jwt.secret) as any;

    req.user = {
      id: decoded.id || decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError(401, 'Invalid token'));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new AppError(401, 'Token expired'));
    }
    next(error);
  }
}

/**
 * Middleware to check if user has required role
 */
export function authorize(...allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(401, 'Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn(`Unauthorized access attempt by user ${req.user.id} with role ${req.user.role}`);
      return next(new AppError(403, 'Insufficient permissions'));
    }

    next();
  };
}

/**
 * Optional authentication - doesn't fail if no token
 */
export function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, config.jwt.secret) as any;

    req.user = {
      id: decoded.id || decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    // Silently continue without user info
    next();
  }
}

/**
 * Generate JWT token
 */
export function generateToken(payload: {
  id: string;
  email: string;
  role: string;
}): string {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiry,
  });
}

/**
 * Verify token
 */
export function verifyToken(token: string): any {
  return jwt.verify(token, config.jwt.secret);
}

export default {
  authenticate,
  authorize,
  optionalAuth,
  generateToken,
  verifyToken,
};
