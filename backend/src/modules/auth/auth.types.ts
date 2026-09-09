import type { UserRole } from '../users/user.types.js';

export interface LoginInput {
  email: string;
  password: string;
}

export interface TokenPayload {
  sub: string;
  role: UserRole;
  sid: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
