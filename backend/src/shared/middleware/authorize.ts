import type { NextFunction, Request, Response } from 'express';

import type { UserRole } from '../../modules/users/user.types.js';

import { AppError } from '../errors/app-error.js';

export const requireRole = (
  ...allowedRoles: UserRole[]
) => {
  return (
    req: Request,
    _res: Response,
    next: NextFunction,
  ): void => {
    if (!req.user) {
      throw new AppError(
        401,
        'UNAUTHORIZED',
        'Authentication is required.',
      );
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError(
        403,
        'FORBIDDEN',
        'You do not have permission to perform this action.',
      );
    }

    next();
  };
};