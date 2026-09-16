import { z } from 'zod';

export const roomTypeSchema = z.enum([
  'SINGLE',
  'DOUBLE',
  'TWIN',
  'SUITE',
  'DELUXE',
]);

export const createRoomSchema = z.object({
  hotelId: z.string().min(1, 'Hotel ID is required'),

  roomNumber: z
    .string()
    .trim()
    .min(1, 'Room number is required'),

  type: roomTypeSchema,

  description: z
    .string()
    .trim()
    .min(1, 'Description is required'),

  pricePerNight: z
    .number()
    .positive('Price must be greater than 0'),

  capacity: z
    .number()
    .int('Capacity must be an integer')
    .positive('Capacity must be greater than 0'),

  amenities: z
    .array(z.string().trim())
    .default([]),

  images: z
    .array(z.string().url())
    .default([]),

  isAvailable: z
    .boolean()
    .default(true),
});

export const updateRoomSchema =
  createRoomSchema.partial();

export type CreateRoomInput = z.infer<
  typeof createRoomSchema
>;

export type UpdateRoomInput = z.infer<
  typeof updateRoomSchema
>;