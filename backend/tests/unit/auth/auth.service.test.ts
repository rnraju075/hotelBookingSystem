import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  login,
  logout,
  refreshAccessToken,
} from '../../../src/modules/auth/auth.service.js';

import { userRepository } from '../../../src/modules/users/user.repository.js';

import {
  createAuthTokens,
  verifyRefreshToken,
} from '../../../src/shared/security/jwt.js';

import {
  createRefreshSession,
  getRefreshSession,
  revokeRefreshSession,
} from '../../../src/modules/auth/auth-session.service.js';

import bcrypt from 'bcrypt';

vi.mock('../../../src/modules/users/user.repository.js', () => ({
  userRepository: {
    findByEmail: vi.fn(),
  },
}));

vi.mock('bcrypt', () => ({
  default: {
    compare: vi.fn(),
  },
}));

vi.mock('../../../src/shared/security/jwt.js', () => ({
  createAuthTokens: vi.fn(),
  verifyRefreshToken: vi.fn(),
}));

vi.mock(
  '../../../src/modules/auth/auth-session.service.js',
  () => ({
    createRefreshSession: vi.fn(),
    getRefreshSession: vi.fn(),
    revokeRefreshSession: vi.fn(),
  }),
);

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================
  // LOGIN
  // ============================================================

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const user = {
        _id: {
          toString: () => 'user-123',
        },
        firstName: 'Deepthi',
        lastName: 'Test',
        email: 'deepthi@example.com',
        passwordHash: 'hashed-password',
        role: 'HOTEL_MANAGER',
        status: 'ACTIVE',
      };

      vi.mocked(userRepository.findByEmail)
        .mockResolvedValue(user as any);

      vi.mocked(bcrypt.compare)
        .mockResolvedValue(true as never);

      vi.mocked(createAuthTokens)
        .mockReturnValue({
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
        } as any);

      vi.mocked(createRefreshSession)
        .mockResolvedValue(undefined);

      const result = await login({
        email: '  DEEPTHI@EXAMPLE.COM ',
        password: 'Password@123',
      });

      expect(userRepository.findByEmail)
        .toHaveBeenCalledWith(
          'deepthi@example.com',
          true,
        );

      expect(bcrypt.compare)
        .toHaveBeenCalledWith(
          'Password@123',
          'hashed-password',
        );

      expect(createAuthTokens)
        .toHaveBeenCalledWith(
          expect.objectContaining({
            sub: 'user-123',
            role: 'HOTEL_MANAGER',
            sid: expect.any(String),
          }),
        );

      expect(createRefreshSession)
        .toHaveBeenCalledWith(
          expect.any(String),
          'user-123',
          7 * 24 * 60 * 60,
        );

      expect(result.user.id)
        .toBe('user-123');

      expect(result.user.email)
        .toBe('deepthi@example.com');

      expect(result.user.role)
        .toBe('HOTEL_MANAGER');

      expect(result.tokens.accessToken)
        .toBe('access-token');

      expect(result.tokens.refreshToken)
        .toBe('refresh-token');
    });

    it('should reject unknown user', async () => {
      vi.mocked(userRepository.findByEmail)
        .mockResolvedValue(null);

      await expect(
        login({
          email: 'unknown@example.com',
          password: 'Password@123',
        }),
      ).rejects.toMatchObject({
        statusCode: 401,
        code: 'INVALID_CREDENTIALS',
      });

      expect(bcrypt.compare)
        .not.toHaveBeenCalled();

      expect(createAuthTokens)
        .not.toHaveBeenCalled();

      expect(createRefreshSession)
        .not.toHaveBeenCalled();
    });

    it('should reject inactive user', async () => {
      vi.mocked(userRepository.findByEmail)
        .mockResolvedValue({
          _id: {
            toString: () => 'user-123',
          },
          firstName: 'Deepthi',
          lastName: 'Test',
          email: 'deepthi@example.com',
          passwordHash: 'hashed-password',
          role: 'CUSTOMER',
          status: 'INACTIVE',
        } as any);

      await expect(
        login({
          email: 'deepthi@example.com',
          password: 'Password@123',
        }),
      ).rejects.toMatchObject({
        statusCode: 403,
        code: 'USER_NOT_ACTIVE',
      });

      expect(bcrypt.compare)
        .not.toHaveBeenCalled();

      expect(createAuthTokens)
        .not.toHaveBeenCalled();

      expect(createRefreshSession)
        .not.toHaveBeenCalled();
    });

    it('should reject user without password hash', async () => {
      vi.mocked(userRepository.findByEmail)
        .mockResolvedValue({
          _id: {
            toString: () => 'user-123',
          },
          firstName: 'Deepthi',
          lastName: 'Test',
          email: 'deepthi@example.com',
          passwordHash: null,
          role: 'CUSTOMER',
          status: 'ACTIVE',
        } as any);

      await expect(
        login({
          email: 'deepthi@example.com',
          password: 'Password@123',
        }),
      ).rejects.toMatchObject({
        statusCode: 401,
        code: 'INVALID_CREDENTIALS',
      });

      expect(bcrypt.compare)
        .not.toHaveBeenCalled();
    });

    it('should reject incorrect password', async () => {
      vi.mocked(userRepository.findByEmail)
        .mockResolvedValue({
          _id: {
            toString: () => 'user-123',
          },
          firstName: 'Deepthi',
          lastName: 'Test',
          email: 'deepthi@example.com',
          passwordHash: 'hashed-password',
          role: 'CUSTOMER',
          status: 'ACTIVE',
        } as any);

      vi.mocked(bcrypt.compare)
        .mockResolvedValue(false as never);

      await expect(
        login({
          email: 'deepthi@example.com',
          password: 'WrongPassword',
        }),
      ).rejects.toMatchObject({
        statusCode: 401,
        code: 'INVALID_CREDENTIALS',
      });

      expect(createAuthTokens)
        .not.toHaveBeenCalled();

      expect(createRefreshSession)
        .not.toHaveBeenCalled();
    });
  });

  // ============================================================
  // REFRESH ACCESS TOKEN
  // ============================================================

  describe('refreshAccessToken', () => {
    it('should generate new tokens for valid refresh session', async () => {
      vi.mocked(verifyRefreshToken)
        .mockReturnValue({
          sub: 'user-123',
          role: 'HOTEL_MANAGER',
          sid: 'old-session',
        } as any);

      vi.mocked(getRefreshSession)
        .mockResolvedValue({
          userId: 'user-123',
          status: 'ACTIVE',
        });

      vi.mocked(revokeRefreshSession)
        .mockResolvedValue(undefined);

      vi.mocked(createRefreshSession)
        .mockResolvedValue(undefined);

      vi.mocked(createAuthTokens)
        .mockReturnValue({
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
        } as any);

      const result = await refreshAccessToken(
        'old-refresh-token',
      );

      expect(verifyRefreshToken)
        .toHaveBeenCalledWith(
          'old-refresh-token',
        );

      expect(getRefreshSession)
        .toHaveBeenCalledWith(
          'old-session',
        );

      expect(revokeRefreshSession)
        .toHaveBeenCalledWith(
          'old-session',
        );

      expect(createAuthTokens)
        .toHaveBeenCalledWith(
          expect.objectContaining({
            sub: 'user-123',
            role: 'HOTEL_MANAGER',
            sid: expect.any(String),
          }),
        );

      expect(createRefreshSession)
        .toHaveBeenCalledWith(
          expect.any(String),
          'user-123',
          7 * 24 * 60 * 60,
        );

      expect(result.accessToken)
        .toBe('new-access-token');

      expect(result.refreshToken)
        .toBe('new-refresh-token');
    });

    it('should reject invalid refresh token', async () => {
      vi.mocked(verifyRefreshToken)
        .mockImplementation(() => {
          throw new Error('Invalid token');
        });

      await expect(
        refreshAccessToken(
          'invalid-refresh-token',
        ),
      ).rejects.toMatchObject({
        statusCode: 401,
        code: 'INVALID_REFRESH_TOKEN',
      });

      expect(getRefreshSession)
        .not.toHaveBeenCalled();

      expect(revokeRefreshSession)
        .not.toHaveBeenCalled();

      expect(createAuthTokens)
        .not.toHaveBeenCalled();
    });

    it('should reject when refresh session does not exist', async () => {
      vi.mocked(verifyRefreshToken)
        .mockReturnValue({
          sub: 'user-123',
          role: 'CUSTOMER',
          sid: 'missing-session',
        } as any);

      vi.mocked(getRefreshSession)
        .mockResolvedValue(null);

      await expect(
        refreshAccessToken(
          'refresh-token',
        ),
      ).rejects.toMatchObject({
        statusCode: 401,
        code: 'REFRESH_SESSION_NOT_FOUND',
      });

      expect(revokeRefreshSession)
        .not.toHaveBeenCalled();

      expect(createAuthTokens)
        .not.toHaveBeenCalled();
    });

    it('should reject revoked refresh session', async () => {
      vi.mocked(verifyRefreshToken)
        .mockReturnValue({
          sub: 'user-123',
          role: 'CUSTOMER',
          sid: 'revoked-session',
        } as any);

      vi.mocked(getRefreshSession)
        .mockResolvedValue({
          userId: 'user-123',
          status: 'REVOKED',
        });

      await expect(
        refreshAccessToken(
          'refresh-token',
        ),
      ).rejects.toMatchObject({
        statusCode: 401,
        code: 'REFRESH_SESSION_REVOKED',
      });

      expect(revokeRefreshSession)
        .not.toHaveBeenCalled();

      expect(createAuthTokens)
        .not.toHaveBeenCalled();
    });

    it('should reject when session belongs to another user', async () => {
      vi.mocked(verifyRefreshToken)
        .mockReturnValue({
          sub: 'user-123',
          role: 'CUSTOMER',
          sid: 'session-123',
        } as any);

      vi.mocked(getRefreshSession)
        .mockResolvedValue({
          userId: 'different-user',
          status: 'ACTIVE',
        });

      await expect(
        refreshAccessToken(
          'refresh-token',
        ),
      ).rejects.toMatchObject({
        statusCode: 401,
        code: 'INVALID_REFRESH_SESSION',
      });

      expect(revokeRefreshSession)
        .not.toHaveBeenCalled();

      expect(createAuthTokens)
        .not.toHaveBeenCalled();
    });
  });

  // ============================================================
  // LOGOUT
  // ============================================================

  describe('logout', () => {
    it('should revoke a valid refresh session', async () => {
      vi.mocked(verifyRefreshToken)
        .mockReturnValue({
          sub: 'user-123',
          role: 'CUSTOMER',
          sid: 'session-123',
        } as any);

      vi.mocked(getRefreshSession)
        .mockResolvedValue({
          userId: 'user-123',
          status: 'ACTIVE',
        });

      vi.mocked(revokeRefreshSession)
        .mockResolvedValue(undefined);

      await logout('refresh-token');

      expect(verifyRefreshToken)
        .toHaveBeenCalledWith(
          'refresh-token',
        );

      expect(getRefreshSession)
        .toHaveBeenCalledWith(
          'session-123',
        );

      expect(revokeRefreshSession)
        .toHaveBeenCalledWith(
          'session-123',
        );
    });

    it('should reject logout when refresh session does not exist', async () => {
      vi.mocked(verifyRefreshToken)
        .mockReturnValue({
          sub: 'user-123',
          role: 'CUSTOMER',
          sid: 'missing-session',
        } as any);

      vi.mocked(getRefreshSession)
        .mockResolvedValue(null);

      await expect(
        logout('refresh-token'),
      ).rejects.toMatchObject({
        statusCode: 401,
        code: 'REFRESH_SESSION_NOT_FOUND',
      });

      expect(revokeRefreshSession)
        .not.toHaveBeenCalled();
    });

    it('should reject logout when session belongs to another user', async () => {
      vi.mocked(verifyRefreshToken)
        .mockReturnValue({
          sub: 'user-123',
          role: 'CUSTOMER',
          sid: 'session-123',
        } as any);

      vi.mocked(getRefreshSession)
        .mockResolvedValue({
          userId: 'different-user',
          status: 'ACTIVE',
        });

      await expect(
        logout('refresh-token'),
      ).rejects.toMatchObject({
        statusCode: 401,
        code: 'INVALID_REFRESH_SESSION',
      });

      expect(revokeRefreshSession)
        .not.toHaveBeenCalled();
    });
  });
});