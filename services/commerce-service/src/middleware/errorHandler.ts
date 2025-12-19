import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Global error handler middleware
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (err instanceof AppError) {
    logger.error(`AppError: ${err.message}`, {
      statusCode: err.statusCode,
      path: req.path,
      method: req.method,
    });

    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // Handle Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    logger.error('Prisma error:', err);
    res.status(400).json({
      success: false,
      message: 'Database operation failed',
    });
    return;
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    logger.error('Validation error:', err);
    res.status(400).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // Unknown error
  logger.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
};

/**
 * 404 handler
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
};

/**
 * Async handler wrapper
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
