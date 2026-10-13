import type { Request, Response } from 'express';
import { getHealthStatus } from '../services/health.service';

/**
 * Controllers are the HTTP adapter: read the request, call a service,
 * shape the response. No business logic here.
 */
export function getHealth(_req: Request, res: Response): void {
  res.status(200).json(getHealthStatus());
}
