import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import logger from '../lib/logger';
import { config } from '../config';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource already exists') {
    super(message, 409);
  }
}

interface ErrorResponse {
  status: 'error';
  message: string;
  code?: string;
  details?: any;
  stack?: string;
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let details: any = undefined;
  let code: string | undefined = undefined;

  // Log error
  logger.error({
    err,
    req: {
      method: req.method,
      url: req.url,
      params: req.params,
      query: req.query,
      body: req.body,
    },
  }, 'Error occurred');

  // Handle custom AppError
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  }
  // Handle Zod validation errors
  else if (err instanceof ZodError) {
    statusCode = 400;
    message = 'Validation Error';
    details = err.errors.map((error) => ({
      path: error.path.join('.'),
      message: error.message,
    }));
    code = 'VALIDATION_ERROR';
  }
  // Handle Prisma errors
  else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    statusCode = 400;

    switch (err.code) {
      case 'P2002':
        message = 'A record with this unique field already exists';
        code = 'DUPLICATE_RECORD';
        details = { field: err.meta?.target };
        break;
      case 'P2025':
        message = 'Record not found';
        statusCode = 404;
        code = 'NOT_FOUND';
        break;
      case 'P2003':
        message = 'Foreign key constraint failed';
        code = 'FOREIGN_KEY_VIOLATION';
        break;
      case 'P2014':
        message = 'Invalid relation';
        code = 'INVALID_RELATION';
        break;
      default:
        message = 'Database operation failed';
        code = err.code;
    }
  }
  else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    message = 'Invalid data provided';
    code = 'VALIDATION_ERROR';
  }
  else if (err instanceof Prisma.PrismaClientInitializationError) {
    statusCode = 503;
    message = 'Database connection failed';
    code = 'DATABASE_CONNECTION_ERROR';
  }

  const errorResponse: ErrorResponse = {
    status: 'error',
    message,
    ...(code && { code }),
    ...(details && { details }),
    ...(config.isDevelopment() && { stack: err.stack }),
  };

  res.status(statusCode).json(errorResponse);
};

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.method} ${req.url} not found`,
    code: 'ROUTE_NOT_FOUND',
  });
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
