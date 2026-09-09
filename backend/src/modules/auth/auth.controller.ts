import type { Request, Response } from 'express';

import { login, refreshAccessToken } from './auth.service.js';
import { logoutSchema } from './auth.schema.js';
import { AppError } from '../../shared/errors/app-error.js';
import * as authService from './auth.service.js';

export const loginUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const result = await login(req.body);

  res.status(200).json({
    status: 'success',
    data: result,
  });
};

export const refreshToken = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const tokens = await refreshAccessToken(
    req.body.refreshToken,
  );

  res.status(200).json({
    status: 'success',
    data: {
      tokens,
    },
  });
};

export const logout = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const result = logoutSchema.safeParse(req.body);

  if (!result.success) {
    throw new AppError(
      400,
      'VALIDATION_ERROR',
      'Invalid logout request.',
    );
  }

  await authService.logout(result.data.refreshToken);

  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully.',
  });
};

export const getMe = (
  req: Request,
  res: Response,
): void => {
  if (!req.user) {
    throw new AppError(
      401,
      'UNAUTHORIZED',
      'Authentication is required.',
    );
  }

  res.status(200).json({
    status: 'success',
    data: {
      user: req.user,
    },
  });
};