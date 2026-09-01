import 'dotenv/config';

import mongoose from 'mongoose';

import { createApp } from './app/create-app.js';
import { env } from './config/env.js';
import { connectMongoDB } from './infrastructure/database/mongodb.js';
import {
  connectRedis,
  redisClient,
} from './infrastructure/redis/redis.js';

const startServer = async (): Promise<void> => {
  try {
    await connectMongoDB();
    await connectRedis();

    const app = createApp();

    const server = app.listen(env.PORT, () => {
      console.log(
        `[backend] running on http://localhost:${env.PORT} (${env.NODE_ENV})`,
      );
    });

    const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
      console.log(
        `[backend] ${signal} received. Shutting down gracefully...`,
      );

      server.close(async () => {
        console.log('[backend] HTTP server closed.');

        try {
          if (redisClient.isOpen) {
            await redisClient.quit();
            console.log('[backend] Redis connection closed.');
          }

          if (mongoose.connection.readyState !== 0) {
            await mongoose.connection.close();
            console.log('[backend] MongoDB connection closed.');
          }

          console.log('[backend] Shutdown complete.');
          process.exit(0);
        } catch (error) {
          console.error('[backend] Error during shutdown:', error);
          process.exit(1);
        }
      });
    };

    process.once('SIGINT', () => {
      void shutdown('SIGINT');
    });

    process.once('SIGTERM', () => {
      void shutdown('SIGTERM');
    });
  } catch (error) {
    console.error('[backend] Failed to start application:', error);
    process.exit(1);
  }
};

void startServer();