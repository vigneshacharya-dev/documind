import type { RequestHandler } from 'express';
import { AppError } from '../utils/AppError';

/**
 * Registered AFTER all routes. If a request reaches this point,
 * no route matched it.
 */
export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(AppError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
};
