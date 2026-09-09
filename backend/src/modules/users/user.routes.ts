import { Router } from 'express';

import { validateRequest } from '../../shared/middleware/validate-request.js';

import { createUser } from './user.controller.js';
import { createUserSchema } from './user.schema.js';

const router = Router();

router.post(
  '/',
  validateRequest(createUserSchema),
  createUser,
);

export default router;