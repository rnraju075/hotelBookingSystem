import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import {
  createRefreshSession,
  getRefreshSession,
  revokeRefreshSession,
} from '../../../src/modules/auth/auth-session.service.js';

import { redisClient } from '../../../src/infrastructure/redis/redis.js';

vi.mock(
  '../../../src/infrastructure/redis/redis.js',
  () => ({
    redisClient: {
      set: vi.fn(),
      get: vi.fn(),
    },
  }),
);

describe('Auth Session Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================
  // createRefreshSession
  // ============================================================

  describe('createRefreshSession', () => {
    it('should create an ACTIVE refresh session in Redis', async () => {
      vi.mocked(redisClient.set).mockResolvedValue(
        'OK',
      );

      await createRefreshSession(
        'session-123',
        'user-123',
        604800,
      );

      expect(redisClient.set).toHaveBeenCalledWith(
        'auth:refresh:session-123',
        JSON.stringify({
          userId: 'user-123',
          status: 'ACTIVE',
        }),
        {
          EX: 604800,
        },
      );
    });

    it('should use the provided TTL when creating the session', async () => {
      vi.mocked(redisClient.set).mockResolvedValue(
        'OK',
      );

      await createRefreshSession(
        'session-456',
        'user-456',
        3600,
      );

      expect(redisClient.set).toHaveBeenCalledWith(
        'auth:refresh:session-456',
        JSON.stringify({
          userId: 'user-456',
          status: 'ACTIVE',
        }),
        {
          EX: 3600,
        },
      );
    });

    it('should propagate Redis errors', async () => {
      const redisError = new Error(
        'Redis connection failed',
      );

      vi.mocked(redisClient.set).mockRejectedValue(
        redisError,
      );

      await expect(
        createRefreshSession(
          'session-error',
          'user-error',
          3600,
        ),
      ).rejects.toThrow(
        'Redis connection failed',
      );
    });
  });

  // ============================================================
  // getRefreshSession
  // ============================================================

  describe('getRefreshSession', () => {
    it('should return the refresh session when it exists', async () => {
      vi.mocked(redisClient.get).mockResolvedValue(
        JSON.stringify({
          userId: 'user-123',
          status: 'ACTIVE',
        }),
      );

      const result =
        await getRefreshSession(
          'session-123',
        );

      expect(redisClient.get).toHaveBeenCalledWith(
        'auth:refresh:session-123',
      );

      expect(result).toEqual({
        userId: 'user-123',
        status: 'ACTIVE',
      });
    });

    it('should return null when the session does not exist', async () => {
      vi.mocked(redisClient.get).mockResolvedValue(
        null,
      );

      const result =
        await getRefreshSession(
          'missing-session',
        );

      expect(redisClient.get).toHaveBeenCalledWith(
        'auth:refresh:missing-session',
      );

      expect(result).toBeNull();
    });

    it('should correctly parse a revoked session', async () => {
      vi.mocked(redisClient.get).mockResolvedValue(
        JSON.stringify({
          userId: 'user-123',
          status: 'REVOKED',
        }),
      );

      const result =
        await getRefreshSession(
          'revoked-session',
        );

      expect(result).toEqual({
        userId: 'user-123',
        status: 'REVOKED',
      });
    });

    it('should propagate Redis errors', async () => {
      const redisError = new Error(
        'Redis connection failed',
      );

      vi.mocked(redisClient.get).mockRejectedValue(
        redisError,
      );

      await expect(
        getRefreshSession(
          'session-error',
        ),
      ).rejects.toThrow(
        'Redis connection failed',
      );
    });
  });

  // ============================================================
  // revokeRefreshSession
  // ============================================================

  describe('revokeRefreshSession', () => {
    it('should change an ACTIVE session to REVOKED', async () => {
      vi.mocked(redisClient.get).mockResolvedValue(
        JSON.stringify({
          userId: 'user-123',
          status: 'ACTIVE',
        }),
      );

      vi.mocked(redisClient.set).mockResolvedValue(
        'OK',
      );

      await revokeRefreshSession(
        'session-123',
      );

      expect(redisClient.get).toHaveBeenCalledWith(
        'auth:refresh:session-123',
      );

      expect(redisClient.set).toHaveBeenCalledWith(
        'auth:refresh:session-123',
        JSON.stringify({
          userId: 'user-123',
          status: 'REVOKED',
        }),
        {
          EX: 60 * 60,
        },
      );
    });

    it('should do nothing when the session does not exist', async () => {
      vi.mocked(redisClient.get).mockResolvedValue(
        null,
      );

      await revokeRefreshSession(
        'missing-session',
      );

      expect(redisClient.get).toHaveBeenCalledWith(
        'auth:refresh:missing-session',
      );

      expect(redisClient.set).not.toHaveBeenCalled();
    });

    it('should preserve the userId when revoking the session', async () => {
      vi.mocked(redisClient.get).mockResolvedValue(
        JSON.stringify({
          userId: 'manager-456',
          status: 'ACTIVE',
        }),
      );

      vi.mocked(redisClient.set).mockResolvedValue(
        'OK',
      );

      await revokeRefreshSession(
        'manager-session',
      );

      expect(redisClient.set).toHaveBeenCalledWith(
        'auth:refresh:manager-session',
        JSON.stringify({
          userId: 'manager-456',
          status: 'REVOKED',
        }),
        {
          EX: 60 * 60,
        },
      );
    });

    it('should propagate Redis errors while reading the session', async () => {
      const redisError = new Error(
        'Redis connection failed',
      );

      vi.mocked(redisClient.get).mockRejectedValue(
        redisError,
      );

      await expect(
        revokeRefreshSession(
          'session-error',
        ),
      ).rejects.toThrow(
        'Redis connection failed',
      );

      expect(
        redisClient.set,
      ).not.toHaveBeenCalled();
    });

    it('should propagate Redis errors while revoking the session', async () => {
      vi.mocked(redisClient.get).mockResolvedValue(
        JSON.stringify({
          userId: 'user-123',
          status: 'ACTIVE',
        }),
      );

      const redisError = new Error(
        'Redis connection failed',
      );

      vi.mocked(redisClient.set).mockRejectedValue(
        redisError,
      );

      await expect(
        revokeRefreshSession(
          'session-123',
        ),
      ).rejects.toThrow(
        'Redis connection failed',
      );
    });
  });
});