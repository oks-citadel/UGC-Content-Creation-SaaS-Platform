import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError } from '@nexus/utils';
import pino from 'pino';

const logger = pino({ name: 'auth-service' });

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  logger.error({
    err,
    method: req.method,
    path: req.path,
    body: req.body,
  }, 'Request error');

  if (err instanceof ValidationError) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: err.message,
        details: err.errors,
      },
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
      },
    });
    return;
  }

  // Handle Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    res.status(400).json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'A database error occurred',
      },
    });
    return;
  }

  // Handle JWT errors
  if (err.name === 'JWTExpired' || err.name === 'JWTClaimValidationFailed') {
    res.status(401).json({
      success: false,
      error: {
        code: 'TOKEN_EXPIRED',
        message: 'Token has expired',
      },
    });
    return;
  }

  if (err.name === 'JWSSignatureVerificationFailed' || err.name === 'JWTInvalid') {
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid token',
      },
    });
    return;
  }

  // Default error response
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred'
        : err.message,
    },
  });
}
