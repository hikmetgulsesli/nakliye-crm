import { Request, Response, NextFunction } from 'express';
import { Sentry } from '../config/sentry';
import { logger } from '../config/logger';

export class AppError extends Error {
  statusCode: number;
  constructor(message: string, statusCode: number = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  logger.error({ err, path: req.path, method: req.method }, 'Beklenmeyen hata');
  Sentry.captureException(err, {
    tags: { path: req.path, method: req.method },
    user: req.user ? { id: String(req.user.userId), email: req.user.email } : undefined,
  });
  return res.status(500).json({
    success: false,
    message: 'Sunucu hatasi oluştu',
  });
}
