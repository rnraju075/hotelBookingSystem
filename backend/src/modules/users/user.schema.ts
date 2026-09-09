import { z } from 'zod';

export const createUserSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, 'First name must contain at least 2 characters')
    .max(50, 'First name cannot exceed 50 characters'),

  lastName: z
    .string()
    .trim()
    .min(2, 'Last name must contain at least 2 characters')
    .max(50, 'Last name cannot exceed 50 characters'),

  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Invalid email address'),

  password: z
    .string()
    .min(8, 'Password must contain at least 8 characters')
    .max(72, 'Password cannot exceed 72 characters'),

  phone: z
    .string()
    .trim()
    .min(7, 'Phone number is too short')
    .max(20, 'Phone number is too long')
    .optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;