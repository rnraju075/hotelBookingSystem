import { z } from 'zod';

import { USER_ROLES } from '../../modules/users/user.types.js';

export const tokenPayloadSchema = z.object({
  sub: z.string().min(1),
  role: z.enum([
    USER_ROLES.CUSTOMER,
    USER_ROLES.HOTEL_MANAGER,
    USER_ROLES.ADMIN,
  ]),
  sid: z.string().min(1),
});

export type ValidatedTokenPayload = z.infer<
  typeof tokenPayloadSchema
>;