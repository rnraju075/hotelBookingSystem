import express from 'express';
import type { Express, NextFunction, Request, Response } from 'express';

import { env } from '../config/env.js';

export const createApp = (): Express => {
  const app = express();

  app.disable('x-powered-by');

  app.use(
    express.json({
      limit: '1mb',
    }),
  );

  app.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'ok',
      service: 'hotel-booking-backend',
      environment: env.NODE_ENV,
      timestamp: new Date().toISOString(),
    });
  });

  app.use((_req, res) => {
    res.status(404).json({
      status: 'error',
      code: 'NOT_FOUND',
      message: 'Route not found',
    });
  });

  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[backend] unhandled error:', error);

    if (res.headersSent) {
      return;
    }

    res.status(500).json({
      status: 'error',
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  });

  return app;
};
