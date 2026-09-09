import bcrypt from 'bcrypt';
import { randomUUID } from 'node:crypto';

import { AppError } from '../../shared/errors/app-error.js';
import { createAuthTokens, verifyRefreshToken } from '../../shared/security/jwt.js';
import { userRepository } from '../users/user.repository.js';
import { createRefreshSession, getRefreshSession, revokeRefreshSession } from './auth-session.service.js';

import type { LoginInput } from './auth.schema.js';
import { TokenPayload } from './auth.types.js';

export const login = async (
  input: LoginInput,
) => {
  const email = input.email.trim().toLowerCase();

  const user = await userRepository.findByEmail(
    email,
    true,
  );

  if (!user) {
    throw new AppError(
      401,
      'INVALID_CREDENTIALS',
      'Invalid email or password.',
    );
  }

  if (user.status !== 'ACTIVE') {
    throw new AppError(
      403,
      'USER_NOT_ACTIVE',
      'User account is not active.',
    );
  }

  const passwordHash = user.passwordHash;

  if (!passwordHash) {
    throw new AppError(
      401,
      'INVALID_CREDENTIALS',
      'Invalid email or password.',
    );
  }

  const passwordMatches = await bcrypt.compare(
    input.password,
    passwordHash,
  );

  if (!passwordMatches) {
    throw new AppError(
      401,
      'INVALID_CREDENTIALS',
      'Invalid email or password.',
    );
  }

  const sessionId = randomUUID();
  const tokens = createAuthTokens({
    sub: user._id.toString(),
    role: user.role,
    sid: sessionId,
  });

  await createRefreshSession(
  sessionId,
  user._id.toString(),
  7 * 24 * 60 * 60,
);

  return {
    user: {
      id: user._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      status: user.status,
    },
    tokens,
  };
};

export const refreshAccessToken = async (
  refreshToken: string,
) => {
  let payload: TokenPayload;

  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError(
      401,
      'INVALID_REFRESH_TOKEN',
      'Invalid or expired refresh token.',
    );
  }

  const session = await getRefreshSession(
    payload.sid,
  );

  if (!session) {
    throw new AppError(
      401,
      'REFRESH_SESSION_NOT_FOUND',
      'Refresh session is no longer valid.',
    );
  }

  if (session.status !== 'ACTIVE') {
    throw new AppError(
      401,
      'REFRESH_SESSION_REVOKED',
      'Refresh session is no longer active.',
    );
  }

  if (session.userId !== payload.sub) {
    throw new AppError(
      401,
      'INVALID_REFRESH_SESSION',
      'Invalid refresh session.',
    );
  }

  await revokeRefreshSession(payload.sid);

  const newSessionId = randomUUID();

  const tokens = createAuthTokens({
    sub: payload.sub,
    role: payload.role,
    sid: newSessionId,
  });

  await createRefreshSession(
    newSessionId,
    payload.sub,
    7 * 24 * 60 * 60,
  );

  return tokens;
};

export const logout = async (
  refreshToken: string,
): Promise<void> => {
  let payload: TokenPayload;

  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError(
      401,
      'INVALID_REFRESH_TOKEN',
      'Invalid or expired refresh token.',
    );
  }

  const session = await getRefreshSession(payload.sid);

  if (!session) {
    throw new AppError(
      401,
      'REFRESH_SESSION_NOT_FOUND',
      'Refresh session is no longer valid.',
    );
  }

  if (session.userId !== payload.sub) {
    throw new AppError(
      401,
      'INVALID_REFRESH_SESSION',
      'Invalid refresh session.',
    );
  }

  await revokeRefreshSession(payload.sid);
};