import { Router } from 'express';

import { validateRequest } from '../../shared/middleware/validate-request.js';

import { getMe, loginUser, logout, refreshToken } from './auth.controller.js';
import { loginSchema, refreshTokenSchema } from './auth.schema.js';
import { authenticate } from '../../shared/middleware/authenticate.js';
// import { requireRole } from '../../shared/middleware/authorize.js';
// import { USER_ROLES } from '../users/user.types.js';

const router = Router();

router.post(
  '/login',
  validateRequest(loginSchema),
  loginUser,
);

router.post(
  '/refresh',
  validateRequest(refreshTokenSchema),
  refreshToken,
);

router.get(
  '/me',
  authenticate,
  getMe,
);
router.post('/logout', logout);

// router.get(
//   '/admin-test',
//   authenticate,
//   requireRole(USER_ROLES.ADMIN),
//   (_req, res) => {
//     res.status(200).json({
//       status: 'success',
//       message: 'Admin access granted.',
//     });
//   },
// );

export default router;