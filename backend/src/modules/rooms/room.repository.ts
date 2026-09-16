import { RoomModel } from './room.model.js';

import type {
  CreateRoomInput,
  UpdateRoomInput,
} from './room.schema.js';

export const create = async (
  data: CreateRoomInput,
) => {
  return RoomModel.create(data);
};

export const findById = async (
  roomId: string,
) => {
  return RoomModel.findById(roomId)
    .lean()
    .exec();
};

export const findByHotelId = async (
  hotelId: string,
) => {
  return RoomModel.find({
    hotelId,
    isAvailable: true,
  })
    .sort({ roomNumber: 1 })
    .lean()
    .exec();
};

export const findByHotelAndRoomNumber = async (
  hotelId: string,
  roomNumber: string,
) => {
  return RoomModel.findOne({
    hotelId,
    roomNumber,
  })
    .lean()
    .exec();
};

export const updateById = async (
  roomId: string,
  data: UpdateRoomInput,
) => {
  return RoomModel.findByIdAndUpdate(
    roomId,
    { $set: data },
    {
      new: true,
      runValidators: true,
    },
  )
    .lean()
    .exec();
};

export const deactivateById = async (
  roomId: string,
) => {
  return RoomModel.findByIdAndUpdate(
    roomId,
    {
      $set: {
        isAvailable: false,
      },
    },
    {
      new: true,
      runValidators: true,
    },
  )
    .lean()
    .exec();
};