import 'dotenv/config';

import { createApp } from './app.js';

const DEFAULT_PORT = 4000;

const rawPort = process.env.PORT;
const port = rawPort ? Number(rawPort) : DEFAULT_PORT;

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error(`Invalid PORT value: ${rawPort}`);
}

const app = createApp();

const server = app.listen(port, () => {
  console.log(
    `[backend] running on http://localhost:${port} (${process.env.NODE_ENV ?? 'development'})`,
  );
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