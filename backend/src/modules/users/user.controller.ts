import type { Request, Response } from 'express';

import { userService } from './user.service.js';

export const createUser = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const user = await userService.createUser(req.body);

  res.status(201).json({
    status: 'success',
    data: {
      user,
    },
  });
};