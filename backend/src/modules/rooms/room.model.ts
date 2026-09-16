import {
  Schema,
  model,
  type HydratedDocument,
} from 'mongoose';

import type { Room } from './room.types.js';

const roomSchema = new Schema<Room>(
  {
    hotelId: {
      type: String,
      required: true,
      index: true,
    },

    roomNumber: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: [
        'SINGLE',
        'DOUBLE',
        'TWIN',
        'SUITE',
        'DELUXE',
      ],
      required: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    pricePerNight: {
      type: Number,
      required: true,
      min: 0,
    },

    capacity: {
      type: Number,
      required: true,
      min: 1,
    },

    amenities: {
      type: [String],
      default: [],
    },

    images: {
      type: [String],
      default: [],
    },

    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

roomSchema.index(
  { hotelId: 1, roomNumber: 1 },
  { unique: true },
);

export type RoomDocument =
  HydratedDocument<Room>;

export const RoomModel = model<Room>(
  'Room',
  roomSchema,
);