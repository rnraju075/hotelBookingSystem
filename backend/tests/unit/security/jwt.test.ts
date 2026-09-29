import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import jwt from 'jsonwebtoken';

vi.mock('../../../src/config/env.js', () => ({
  env: {
    JWT_ACCESS_SECRET:
      'test-access-secret-that-is-at-least-32-characters',

    JWT_REFRESH_SECRET:
      'test-refresh-secret-that-is-at-least-32-characters',

    JWT_ACCESS_EXPIRES_IN: '15m',

    JWT_REFRESH_EXPIRES_IN: '7d',
  },
}));

import {
  createAccessToken,
  createRefreshToken,
  createAuthTokens,
  verifyAccessToken,
  verifyRefreshToken,
} from '../../../src/shared/security/jwt.js';

describe('JWT Utilities', () => {
  const payload = {
    sub: 'user-123',
    role: 'HOTEL_MANAGER',
    sid: 'session-123',
  } as const;

  // ============================================================
  // ACCESS TOKEN CREATION
  // ============================================================

  describe('createAccessToken', () => {
    it('should create a valid access token', () => {
      const token = createAccessToken(payload);

      expect(token).toBeTypeOf('string');

      expect(token.split('.')).toHaveLength(3);
    });

    it('should contain the expected payload', () => {
      const token = createAccessToken(payload);

      const decoded = jwt.verify(
        token,
        'test-access-secret-that-is-at-least-32-characters',
      ) as jwt.JwtPayload;

      expect(decoded.sub).toBe(
        payload.sub,
      );

      expect(decoded.role).toBe(
        payload.role,
      );

      expect(decoded.sid).toBe(
        payload.sid,
      );
    });

    it('should use the access-token secret', () => {
      const token = createAccessToken(payload);

      expect(() =>
        jwt.verify(
          token,
          'test-access-secret-that-is-at-least-32-characters',
        ),
      ).not.toThrow();

      expect(() =>
        jwt.verify(
          token,
          'test-refresh-secret-that-is-at-least-32-characters',
        ),
      ).toThrow();
    });
  });

  // ============================================================
  // REFRESH TOKEN CREATION
  // ============================================================

  describe('createRefreshToken', () => {
    it('should create a valid refresh token', () => {
      const token = createRefreshToken(payload);

      expect(token).toBeTypeOf('string');

      expect(token.split('.')).toHaveLength(3);
    });

    it('should contain the expected payload', () => {
      const token = createRefreshToken(payload);

      const decoded = jwt.verify(
        token,
        'test-refresh-secret-that-is-at-least-32-characters',
      ) as jwt.JwtPayload;

      expect(decoded.sub).toBe(
        payload.sub,
      );

      expect(decoded.role).toBe(
        payload.role,
      );

      expect(decoded.sid).toBe(
        payload.sid,
      );
    });

    it('should use the refresh-token secret', () => {
      const token = createRefreshToken(payload);

      expect(() =>
        jwt.verify(
          token,
          'test-refresh-secret-that-is-at-least-32-characters',
        ),
      ).not.toThrow();

      expect(() =>
        jwt.verify(
          token,
          'test-access-secret-that-is-at-least-32-characters',
        ),
      ).toThrow();
    });
  });

  // ============================================================
  // CREATE BOTH TOKENS
  // ============================================================

  describe('createAuthTokens', () => {
    it('should create both access and refresh tokens', () => {
      const tokens =
        createAuthTokens(payload);

      expect(tokens.accessToken)
        .toBeTypeOf('string');

      expect(tokens.refreshToken)
        .toBeTypeOf('string');

      expect(
        tokens.accessToken.split('.'),
      ).toHaveLength(3);

      expect(
        tokens.refreshToken.split('.'),
      ).toHaveLength(3);
    });

    it('should create different access and refresh tokens', () => {
      const tokens =
        createAuthTokens(payload);

      expect(
        tokens.accessToken,
      ).not.toBe(
        tokens.refreshToken,
      );
    });
  });

  // ============================================================
  // VERIFY REFRESH TOKEN
  // ============================================================

  describe('verifyRefreshToken', () => {
    it('should verify a valid refresh token', () => {
      const token =
        createRefreshToken(payload);

      const decoded =
        verifyRefreshToken(token);

      expect(decoded.sub).toBe(
        'user-123',
      );

      expect(decoded.role).toBe(
        'HOTEL_MANAGER',
      );

      expect(decoded.sid).toBe(
        'session-123',
      );
    });

    it('should reject a token signed with the wrong secret', () => {
      const token = jwt.sign(
        payload,
        'wrong-secret-that-is-different',
      );

      expect(() =>
        verifyRefreshToken(token),
      ).toThrow();
    });

    it('should reject a malformed token', () => {
      expect(() =>
        verifyRefreshToken(
          'this-is-not-a-valid-jwt',
        ),
      ).toThrow();
    });

    it('should reject a tampered token', () => {
      const token =
        createRefreshToken(payload);

      const parts = token.split('.');

      parts[1] =
        `${parts[1]}tampered`;

      const tamperedToken =
        parts.join('.');

      expect(() =>
        verifyRefreshToken(
          tamperedToken,
        ),
      ).toThrow();
    });

    it('should reject an access token', () => {
      const accessToken =
        createAccessToken(payload);

      expect(() =>
        verifyRefreshToken(
          accessToken,
        ),
      ).toThrow();
    });
  });

  // ============================================================
  // VERIFY ACCESS TOKEN
  // ============================================================

  describe('verifyAccessToken', () => {
    it('should verify a valid access token', () => {
      const token =
        createAccessToken(payload);

      const decoded =
        verifyAccessToken(token);

      expect(decoded.sub).toBe(
        'user-123',
      );

      expect(decoded.role).toBe(
        'HOTEL_MANAGER',
      );

      expect(decoded.sid).toBe(
        'session-123',
      );
    });

    it('should reject a refresh token', () => {
      const refreshToken =
        createRefreshToken(payload);

      expect(() =>
        verifyAccessToken(
          refreshToken,
        ),
      ).toThrow();
    });

    it('should reject a malformed token', () => {
      expect(() =>
        verifyAccessToken(
          'invalid-access-token',
        ),
      ).toThrow();
    });

    it('should reject a token signed with the wrong secret', () => {
      const token = jwt.sign(
        payload,
        'wrong-secret-that-is-different',
      );

      expect(() =>
        verifyAccessToken(token),
      ).toThrow();
    });

    it('should reject a tampered token', () => {
      const token =
        createAccessToken(payload);

      const parts = token.split('.');

      parts[1] =
        `${parts[1]}tampered`;

      const tamperedToken =
        parts.join('.');

      expect(() =>
        verifyAccessToken(
          tamperedToken,
        ),
      ).toThrow();
    });
  });
});