import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import logger from '../utils/logger';

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

export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Log error
  logger.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Handle known errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      statusCode: err.statusCode,
    });
  }

  // Handle Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    return handlePrismaError(err, res);
  }

  // Handle validation errors
  if (err instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({
      error: 'Validation error',
      message: 'Invalid data provided',
    });
  }

  // Default error response
  return res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
  });
}

function handlePrismaError(err: Prisma.PrismaClientKnownRequestError, res: Response) {
  switch (err.code) {
    case 'P2002':
      return res.status(409).json({
        error: 'Unique constraint violation',
        message: 'A record with this data already exists',
      });
    case 'P2025':
      return res.status(404).json({
        error: 'Not found',
        message: 'The requested resource was not found',
      });
    case 'P2003':
      return res.status(400).json({
        error: 'Foreign key constraint failed',
        message: 'Related record not found',
      });
    default:
      return res.status(500).json({
        error: 'Database error',
        message: 'A database error occurred',
      });
  }
}
