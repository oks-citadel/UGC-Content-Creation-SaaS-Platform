import { Request, Response, NextFunction } from 'express';
import pino from 'pino';

const logger = pino({ name: 'compliance-service' });

export class AppError extends Error {
  constructor(public statusCode: number, public code: string, message: string, public isOperational = true) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const errorHandler = (err: Error | AppError, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ success: false, error: { code: err.code, message: err.message } });
  }
  logger.error(err, 'Unhandled error');
  return res.status(500).json({ success: false, error: { code: 'INTERNAL_SERVER_ERROR', message: 'An unexpected error occurred' } });
};
