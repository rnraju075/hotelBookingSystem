import type {
  ErrorRequestHandler,
  Request,
  Response,
} from 'express';

import { AppError } from '../errors/app-error.js';

export const errorHandler: ErrorRequestHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  _next,
) => {
  console.error('[backend] error:', error);

  if (res.headersSent) {
    return;
  }

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      status: 'error',
      code: error.code,
      message: error.message,
    });

    return;
  }

  res.status(500).json({
    status: 'error',
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Internal server error',
  });
};