import type { NextFunction, Request, Response } from 'express';

import { AppError } from '../errors/app-error.js';
import { verifyAccessToken } from '../security/jwt.js';

export const authenticate = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  const authorization = req.headers.authorization;

  if (!authorization) {
    throw new AppError(
      401,
      'UNAUTHORIZED',
      'Authentication is required.',
    );
  }

  const [scheme, token] = authorization.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw new AppError(
      401,
      'INVALID_AUTHORIZATION_HEADER',
      'Invalid authorization header.',
    );
  }

  try {
    const payload = verifyAccessToken(token);

    req.user = {
      id: payload.sub,
      role: payload.role,
      sessionId: payload.sid,
    };

    next();
  } catch {
    throw new AppError(
      401,
      'INVALID_ACCESS_TOKEN',
      'Invalid or expired access token.',
    );
  }
};