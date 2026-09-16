import express from 'express';
import type { Express } from 'express';

import { env } from '../config/env.js';
import userRoutes from '../modules/users/user.routes.js';
import authRoutes from '../modules/auth/auth.routes.js';
import { errorHandler } from '../shared/middleware/error-handler.js';
import hotelRoutes from '../modules/hotels/hotel.routes.js';
import roomRoutes from '../modules/rooms/room.routes.js';

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

  app.use('/api/users', userRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/hotels', hotelRoutes);
  app.use('/api/rooms', roomRoutes);

  app.use((_req, res) => {
    res.status(404).json({  
      status: 'error',
      code: 'NOT_FOUND',
      message: 'Route not found',
    });
  });
  app.use(errorHandler);
  return app;
};
