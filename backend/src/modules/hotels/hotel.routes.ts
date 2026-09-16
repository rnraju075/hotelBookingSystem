import { Router } from 'express';

import * as hotelController from './hotel.controller.js';
import { requireRole } from '../../shared/middleware/authorize.js';
import { authenticate } from '../../shared/middleware/authenticate.js';



const router = Router();

// Public
router.get('/', hotelController.getHotels);

router.get('/:hotelId', hotelController.getHotelById);

// Hotel Manager / Admin
router.post(
  '/',
  authenticate,
  requireRole('HOTEL_MANAGER', 'ADMIN'),
  hotelController.createHotel,
);

router.get(
  '/manager/me',
  authenticate,
  requireRole('HOTEL_MANAGER', 'ADMIN'),
  hotelController.getMyHotels,
);

router.patch(
  '/:hotelId',
  authenticate,
  requireRole('HOTEL_MANAGER', 'ADMIN'),
  hotelController.updateHotel,
);

router.delete(
  '/:hotelId',
  authenticate,
  requireRole('HOTEL_MANAGER', 'ADMIN'),
  hotelController.deactivateHotel,
);

export default router;