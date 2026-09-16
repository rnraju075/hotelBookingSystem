import type { Request, Response } from 'express';

import * as roomService from './room.service.js';
import type {
  CreateRoomInput,
  UpdateRoomInput,
} from './room.schema.js';

export const createRoom = async (
  req: Request,
  res: Response,
) => {
  const room = await roomService.createRoom(
    req.body as CreateRoomInput,
    req.user!.id,
  );

  res.status(201).json({
    status: 'success',
    data: room,
  });
};

export const getRoomById = async (
  req: Request<{ roomId: string }>,
  res: Response,
) => {
  const room = await roomService.getRoomById(
    req.params.roomId,
  );

  res.status(200).json({
    status: 'success',
    data: room,
  });
};

export const getRoomsByHotel = async (
  req: Request<{ hotelId: string }>,
  res: Response,
) => {
  const rooms = await roomService.getRoomsByHotel(
    req.params.hotelId,
  );

  res.status(200).json({
    status: 'success',
    data: rooms,
  });
};

export const updateRoom = async (
  req: Request<{ roomId: string }>,
  res: Response,
) => {
  const room = await roomService.updateRoom(
    req.params.roomId,
    req.user!.id,
    req.body as UpdateRoomInput,
  );

  res.status(200).json({
    status: 'success',
    data: room,
  });
};

export const deactivateRoom = async (
  req: Request<{ roomId: string }>,
  res: Response,
) => {
  const room = await roomService.deactivateRoom(
    req.params.roomId,
    req.user!.id,
  );

  res.status(200).json({
    status: 'success',
    data: room,
  });
};