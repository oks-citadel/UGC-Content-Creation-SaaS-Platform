import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../lib/logger';

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  logger.error({ err, path: req.path }, 'Request error');
  
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: err.errors,
    });
  }
  
  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
}
