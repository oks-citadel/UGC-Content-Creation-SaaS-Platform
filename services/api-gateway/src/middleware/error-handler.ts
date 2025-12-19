// =============================================================================
// Error Handler Middleware
// =============================================================================

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { config } from '../config';

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
  details?: Record<string, unknown>;
}

export function errorHandler(
  err: ApiError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void {
  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = statusCode === 500 && config.env === 'production'
    ? 'An unexpected error occurred'
    : err.message;

  logger.error({
    message: 'Request error',
    error: err.message,
    stack: err.stack,
    code,
    statusCode,
    path: req.path,
    method: req.method,
    requestId: req.headers['x-request-id'],
    userId: req.user?.sub,
  });

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(config.env !== 'production' && err.details && { details: err.details }),
      ...(config.env !== 'production' && { stack: err.stack }),
    },
  });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
}

// Custom error classes
export class AppError extends Error implements ApiError {
  statusCode: number;
  code: string;
  details?: Record<string, unknown>;

  constructor(
    message: string,
    statusCode = 500,
    code = 'INTERNAL_ERROR',
    details?: Record<string, unknown>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_REQUIRED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(service: string) {
    super(`Service ${service} is temporarily unavailable`, 503, 'SERVICE_UNAVAILABLE');
  }
}
