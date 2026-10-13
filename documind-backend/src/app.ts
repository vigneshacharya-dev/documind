import { randomUUID } from 'node:crypto';
import express, { type Express } from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { logger } from './utils/logger';
import routes from './routes';
import { notFoundHandler } from './middlewares/notFound';
import { errorHandler } from './middlewares/errorHandler';

/**
 * Builds the Express app but does NOT start listening.
 * Tests can import this and fire fake requests without opening a port.
 *
 * ORDER MATTERS: Express runs middleware top to bottom.
 *   1. request id + logging first, so every later step is logged with the id
 *   2. security headers, body parsing
 *   3. routes
 *   4. 404 handler (reached only if no route matched)
 *   5. error handler LAST (catches everything that went wrong above)
 */
export function createApp(): Express {
  const app = express();

  app.disable('x-powered-by'); // don't advertise our framework
  app.set('trust proxy', 1); // we will sit behind a load balancer (ALB) on AWS

  app.use(
    pinoHttp({
      logger,
      // Reuse the caller's id if present (tracing across services), else make one.
      genReqId: (req, res) => {
        const incoming = req.headers['x-request-id'];
        const id = typeof incoming === 'string' && incoming.length > 0 ? incoming : randomUUID();
        res.setHeader('x-request-id', id);
        return id;
      },
      // Log only what helps debugging. Dumping every header on every request
      // is noisy, costs money in CloudWatch, and risks leaking secrets.
      serializers: {
        req: (req) => ({ id: req.id, method: req.method, url: req.url }),
        res: (res) => ({ statusCode: res.statusCode }),
      },
      customLogLevel: (_req, res, err) => {
        if (err || res.statusCode >= 500) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'info';
      },
    }),
  );

  app.use(helmet());
  app.use(express.json({ limit: '1mb' }));

  app.use(routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
