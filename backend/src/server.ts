import 'dotenv/config';

import { createApp } from './app/create-app.js';
import { env } from './config/env.js';

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`[backend] running on http://localhost:${env.PORT} (${env.NODE_ENV})`);
});

const shutdown = (signal: NodeJS.Signals) => {
  console.log(`[backend] ${signal} received. Shutting down gracefully...`);

  server.close(() => {
    console.log('[backend] HTTP server closed.');
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
