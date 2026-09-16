import { Schema, model, type HydratedDocument } from 'mongoose';

import type { Hotel } from './hotel.types.js';

const hotelAddressSchema = new Schema(
  {
    street: {
      type: String,
      required: true,
      trim: true,
    },

    city: {
      type: String,
      required: true,
      trim: true,
    },

    state: {
      type: String,
      required: true,
      trim: true,
    },

    country: {
      type: String,
      required: true,
      trim: true,
    },

    zipCode: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false },
);

const hotelSchema = new Schema<Hotel>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    address: {
      type: hotelAddressSchema,
      required: true,
    },

    managerId: {
      type: String,
      required: true,
      index: true,
    },

    amenities: {
      type: [String],
      default: [],
    },

    images: {
      type: [String],
      default: [],
    },

    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

export type HotelDocument = HydratedDocument<Hotel>;

export const HotelModel = model<Hotel>('Hotel', hotelSchema);