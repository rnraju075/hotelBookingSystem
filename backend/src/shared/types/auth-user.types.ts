import type { UserRole } from '../../modules/users/user.types.js';

export interface AuthenticatedUser {
  id: string;
  role: UserRole;
  sessionId: string;
}