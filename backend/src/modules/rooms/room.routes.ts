import { Router } from 'express';

import * as roomController from './room.controller.js';
import { authenticate } from '../../shared/middleware/authenticate.js';
import { requireRole } from '../../shared/middleware/authorize.js';



const router = Router();

// Public: get all active rooms belonging to a hotel
router.get(
  '/hotel/:hotelId',
  roomController.getRoomsByHotel,
);

// Public: get one room
router.get(
  '/:roomId',
  roomController.getRoomById,
);

// Hotel Manager / Admin: create room
router.post(
  '/',
  authenticate,
  requireRole('HOTEL_MANAGER', 'ADMIN'),
  roomController.createRoom,
);

// Hotel Manager / Admin: update room
router.patch(
  '/:roomId',
  authenticate,
  requireRole('HOTEL_MANAGER', 'ADMIN'),
  roomController.updateRoom,
);

// Hotel Manager / Admin: deactivate room
router.delete(
  '/:roomId',
  authenticate,
  requireRole('HOTEL_MANAGER', 'ADMIN'),
  roomController.deactivateRoom,
);

export default router;