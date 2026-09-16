import type { Request, Response } from 'express';

import * as hotelService from './hotel.service.js';
import type {
  CreateHotelInput,
  UpdateHotelInput,
} from './hotel.schema.js';

export const createHotel = async (
  req: Request,
  res: Response,
) => {
  const hotel = await hotelService.createHotel(
    req.body as CreateHotelInput,
    req.user!.id,
  );

  res.status(201).json({
    status: 'success',
    data: hotel,
  });
};

export const getHotels = async (
  _req: Request,
  res: Response,
) => {
  const hotels = await hotelService.getHotels();

  res.status(200).json({
    status: 'success',
    data: hotels,
  });
};

export const getHotelById = async (
  req: Request<{ hotelId: string }>,
  res: Response,
) => {
  const hotel = await hotelService.getHotelById(
    req.params.hotelId,
  );

  res.status(200).json({
    status: 'success',
    data: hotel,
  });
};

export const getMyHotels = async (
  req: Request,
  res: Response,
) => {
  const hotels = await hotelService.getMyHotels(
    req.user!.id,
  );

  res.status(200).json({
    status: 'success',
    data: hotels,
  });
};

export const updateHotel = async (
  req: Request<{ hotelId: string }>,
  res: Response,
) => {
  const hotel = await hotelService.updateHotel(
    req.params.hotelId,
    req.user!.id,
    req.body as UpdateHotelInput,
  );

  res.status(200).json({
    status: 'success',
    data: hotel,
  });
};

export const deactivateHotel = async (
  req: Request<{ hotelId: string }>,
  res: Response,
) => {
  const hotel = await hotelService.deactivateHotel(
    req.params.hotelId,
    req.user!.id,
  );

  res.status(200).json({
    status: 'success',
    data: hotel,
  });
};