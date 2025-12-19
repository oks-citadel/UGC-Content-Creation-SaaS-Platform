import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  // Log request
  logger.info(`Incoming request: ${req.method} ${req.path}`, {
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
  });

  // Log response
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`Request completed: ${req.method} ${req.path}`, {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
    });
  });

  next();
}
