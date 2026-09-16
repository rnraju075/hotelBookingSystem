import { z } from 'zod';

export const hotelAddressSchema = z.object({
  street: z.string().trim().min(1, 'Street is required'),
  city: z.string().trim().min(1, 'City is required'),
  state: z.string().trim().min(1, 'State is required'),
  country: z.string().trim().min(1, 'Country is required'),
  zipCode: z.string().trim().min(1, 'Zip code is required'),
});

export const createHotelSchema = z.object({
  name: z.string().trim().min(2, 'Hotel name must be at least 2 characters'),

  description: z
    .string()
    .trim()
    .min(10, 'Description must be at least 10 characters'),

  address: hotelAddressSchema,

  amenities: z
    .array(z.string().trim().min(1))
    .default([]),

  images: z
    .array(z.string().url('Each image must be a valid URL'))
    .default([]),
});

export const updateHotelSchema = createHotelSchema.partial();

export type CreateHotelInput = z.infer<typeof createHotelSchema>;
export type UpdateHotelInput = z.infer<typeof updateHotelSchema>;