import { HotelModel } from './hotel.model.js';

import type { CreateHotelInput, UpdateHotelInput } from './hotel.schema.js';

export const create = async (
  data: CreateHotelInput & { managerId: string },
) => {
  return HotelModel.create(data);
};

export const findById = async (hotelId: string) => {
  return HotelModel.findById(hotelId).exec();
};

export const findAll = async () => {
  return HotelModel.find({
    isActive: true,
  })
    .sort({ createdAt: -1 })
    .lean()
    .exec();
};

export const findByManagerId = async (managerId: string) => {
  return HotelModel.find({
    managerId,
    isActive: true,
  })
    .sort({ createdAt: -1 })
    .lean()
    .exec();
};

export const updateById = async (
  hotelId: string,
  data: UpdateHotelInput,
) => {
  return HotelModel.findByIdAndUpdate(
    hotelId,
    { $set: data },
    {
      new: true,
      runValidators: true,
    },
  ).exec();
};

export const deactivateById = async (hotelId: string) => {
  return HotelModel.findByIdAndUpdate(
    hotelId,
    {
      $set: {
        isActive: false,
      },
    },
    {
      new: true,
      runValidators: true,
    },
  ).exec();
};