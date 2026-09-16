
import { AppError } from '../../shared/errors/app-error.js';
import * as hotelRepository from './hotel.repository.js';

import type {
  CreateHotelInput,
  UpdateHotelInput,
} from './hotel.schema.js';

export const createHotel = async (
  input: CreateHotelInput,
  managerId: string,
) => {
  return hotelRepository.create({
    ...input,
    managerId,
  });
};

export const getHotelById = async (
  hotelId: string,
) => {
  const hotel = await hotelRepository.findById(hotelId);

  if (!hotel) {
    throw new AppError(
      404,
      'HOTEL_NOT_FOUND',
      'Hotel not found',
    );
  }

  return hotel;
};

export const getHotels = async () => {
  return hotelRepository.findAll();
};

export const getMyHotels = async (
  managerId: string,
) => {
  return hotelRepository.findByManagerId(managerId);
};

export const updateHotel = async (
  hotelId: string,
  managerId: string,
  input: UpdateHotelInput,
) => {
  const hotel = await hotelRepository.findById(hotelId);

  if (!hotel) {
    throw new AppError(
      404,
      'HOTEL_NOT_FOUND',
      'Hotel not found',
    );
  }

  if (hotel.managerId !== managerId) {
    throw new AppError(
      403,
      'FORBIDDEN',
      'You are not allowed to update this hotel',
    );
  }

  const updatedHotel = await hotelRepository.updateById(
    hotelId,
    input,
  );

  if (!updatedHotel) {
    throw new AppError(
      404,
      'HOTEL_NOT_FOUND',
      'Hotel not found',
    );
  }

  return updatedHotel;
};

export const deactivateHotel = async (
  hotelId: string,
  managerId: string,
) => {
  const hotel = await hotelRepository.findById(hotelId);

  if (!hotel) {
    throw new AppError(
      404,
      'HOTEL_NOT_FOUND',
      'Hotel not found',
    );
  }

  if (hotel.managerId !== managerId) {
    throw new AppError(
      403,
      'FORBIDDEN',
      'You are not allowed to deactivate this hotel',
    );
  }

  const updatedHotel =
    await hotelRepository.deactivateById(hotelId);

  if (!updatedHotel) {
    throw new AppError(
      404,
      'HOTEL_NOT_FOUND',
      'Hotel not found',
    );
  }

  return updatedHotel;
};