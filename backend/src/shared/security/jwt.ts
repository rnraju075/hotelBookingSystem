import jwt from 'jsonwebtoken';

import { env } from '../../config/env.js';
import { tokenPayloadSchema } from './jwt.schema.js';

import type {
  AuthTokens,
  TokenPayload,
} from '../../modules/auth/auth.types.js';

export const createAccessToken = (
  payload: TokenPayload,
): string => {
  return jwt.sign(
    payload,
    env.JWT_ACCESS_SECRET,
    {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN as `${number}${'s' | 'm' | 'h' | 'd' | 'w' | 'y'}`,
    },
  );
};

export const createRefreshToken = (
  payload: TokenPayload,
): string => {
  return jwt.sign(
    payload,
    env.JWT_REFRESH_SECRET,
    {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN as `${number}${'s' | 'm' | 'h' | 'd' | 'w' | 'y'}`,
    },
  );
};

export const createAuthTokens = (
  payload: TokenPayload,
): AuthTokens => {
  return {
    accessToken: createAccessToken(payload),
    refreshToken: createRefreshToken(payload),
  };
};

export const verifyRefreshToken = (
  token: string,
): TokenPayload => {
  const decoded = jwt.verify(
    token,
    env.JWT_REFRESH_SECRET,
  );

  return tokenPayloadSchema.parse(decoded);
};

export const verifyAccessToken = (
  token: string,
): TokenPayload => {
  const decoded = jwt.verify(
    token,
    env.JWT_ACCESS_SECRET,
  );

  return tokenPayloadSchema.parse(decoded);
};