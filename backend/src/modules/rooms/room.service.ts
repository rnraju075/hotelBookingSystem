import { AppError } from '../../shared/errors/app-error.js';

import * as hotelRepository from '../hotels/hotel.repository.js';
import * as roomRepository from './room.repository.js';

import type {
  CreateRoomInput,
  UpdateRoomInput,
} from './room.schema.js';

export const createRoom = async (
  input: CreateRoomInput,
  managerId: string,
) => {
  const hotel = await hotelRepository.findById(
    input.hotelId,
  );

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
      'You are not allowed to add rooms to this hotel',
    );
  }

  const existingRoom =
    await roomRepository.findByHotelAndRoomNumber(
      input.hotelId,
      input.roomNumber,
    );

  if (existingRoom) {
    throw new AppError(
      409,
      'ROOM_ALREADY_EXISTS',
      'A room with this number already exists in this hotel',
    );
  }

  return roomRepository.create(input);
};

export const getRoomById = async (
  roomId: string,
) => {
  const room = await roomRepository.findById(roomId);

  if (!room) {
    throw new AppError(
      404,
      'ROOM_NOT_FOUND',
      'Room not found',
    );
  }

  return room;
};

export const getRoomsByHotel = async (
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

  return roomRepository.findByHotelId(hotelId);
};

export const updateRoom = async (
  roomId: string,
  managerId: string,
  input: UpdateRoomInput,
) => {
  const room = await roomRepository.findById(roomId);

  if (!room) {
    throw new AppError(
      404,
      'ROOM_NOT_FOUND',
      'Room not found',
    );
  }

  const hotel = await hotelRepository.findById(
    room.hotelId,
  );

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
      'You are not allowed to update this room',
    );
  }

  if (
    input.roomNumber &&
    input.roomNumber !== room.roomNumber
  ) {
    const existingRoom =
      await roomRepository.findByHotelAndRoomNumber(
        room.hotelId,
        input.roomNumber,
      );

    if (existingRoom) {
      throw new AppError(
        409,
        'ROOM_ALREADY_EXISTS',
        'A room with this number already exists in this hotel',
      );
    }
  }

  return roomRepository.updateById(
    roomId,
    input,
  );
};

export const deactivateRoom = async (
  roomId: string,
  managerId: string,
) => {
  const room = await roomRepository.findById(roomId);

  if (!room) {
    throw new AppError(
      404,
      'ROOM_NOT_FOUND',
      'Room not found',
    );
  }

  const hotel = await hotelRepository.findById(
    room.hotelId,
  );

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
      'You are not allowed to deactivate this room',
    );
  }

  return roomRepository.deactivateById(roomId);
};