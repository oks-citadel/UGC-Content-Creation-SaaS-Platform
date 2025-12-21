import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { UnauthorizedError, ForbiddenError } from './error-handler';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  creatorId?: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedError('No authorization token provided');
    }

    const token = authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : authHeader;

    if (!token) {
      throw new UnauthorizedError('Invalid authorization token format');
    }

    const decoded = jwt.verify(token, config.get('JWT_SECRET')) as AuthUser;
    req.user = decoded;

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new UnauthorizedError('Invalid token'));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new UnauthorizedError('Token expired'));
    } else {
      next(error);
    }
  }
};

export const optionalAuth = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return next();
    }

    const token = authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : authHeader;

    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, config.get('JWT_SECRET')) as AuthUser;
    req.user = decoded;

    next();
  } catch (error) {
    // If token is invalid, just continue without user
    next();
  }
};

export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    if (!roles.includes(req.user.role)) {
      throw new ForbiddenError(`Requires one of these roles: ${roles.join(', ')}`);
    }

    next();
  };
};

export const requireCreator = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }

  if (!req.user.creatorId) {
    throw new ForbiddenError('Creator profile required');
  }

  next();
};

export const requireSelfOrAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    throw new UnauthorizedError('Authentication required');
  }

  const creatorId = req.params.id || req.params.creatorId;

  if (req.user.role === 'admin' || req.user.creatorId === creatorId) {
    return next();
  }

  throw new ForbiddenError('You can only access your own resources');
};
