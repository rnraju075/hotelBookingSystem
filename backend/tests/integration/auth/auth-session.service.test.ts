import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

import {
  connectRedis,
  redisClient,
} from '../../../src/infrastructure/redis/redis.js';

import {
  createRefreshSession,
  getRefreshSession,
  revokeRefreshSession,
} from '../../../src/modules/auth/auth-session.service.js';

describe('Auth Session Service - Redis Integration', () => {
  const sessionIds: string[] = [];

  beforeAll(async () => {
    if (!redisClient.isOpen) {
      await connectRedis();
    }
  });

  beforeEach(async () => {
    for (const sessionId of sessionIds) {
      await redisClient.del(
        `auth:refresh:${sessionId}`,
      );
    }

    sessionIds.length = 0;
  });

  afterAll(async () => {
    for (const sessionId of sessionIds) {
      await redisClient.del(
        `auth:refresh:${sessionId}`,
      );
    }

    if (redisClient.isOpen) {
      await redisClient.quit();
    }
  });

  // ============================================================
  // createRefreshSession()
  // ============================================================

  describe('createRefreshSession()', () => {
    it('should create an ACTIVE refresh session in Redis', async () => {
      const sessionId =
        `integration-create-${Date.now()}`;

      sessionIds.push(sessionId);

      await createRefreshSession(
        sessionId,
        'user-123',
        604800,
      );

      const session =
        await getRefreshSession(sessionId);

      expect(session).toEqual({
        userId: 'user-123',
        status: 'ACTIVE',
      });
    });

    it('should store the correct userId', async () => {
      const sessionId =
        `integration-user-${Date.now()}`;

      sessionIds.push(sessionId);

      await createRefreshSession(
        sessionId,
        'manager-456',
        604800,
      );

      const session =
        await getRefreshSession(sessionId);

      expect(session?.userId).toBe(
        'manager-456',
      );
    });

    it('should store the session with the requested TTL', async () => {
      const sessionId =
        `integration-ttl-${Date.now()}`;

      sessionIds.push(sessionId);

      await createRefreshSession(
        sessionId,
        'user-789',
        3600,
      );

      const ttl =
        await redisClient.ttl(
          `auth:refresh:${sessionId}`,
        );

      expect(ttl).toBeGreaterThan(0);

      expect(ttl).toBeLessThanOrEqual(3600);
    });
  });

  // ============================================================
  // getRefreshSession()
  // ============================================================

  describe('getRefreshSession()', () => {
    it('should return an existing session', async () => {
      const sessionId =
        `integration-get-${Date.now()}`;

      sessionIds.push(sessionId);

      await createRefreshSession(
        sessionId,
        'user-123',
        604800,
      );

      const session =
        await getRefreshSession(sessionId);

      expect(session).not.toBeNull();

      expect(session?.userId).toBe(
        'user-123',
      );

      expect(session?.status).toBe(
        'ACTIVE',
      );
    });

    it('should return null for a session that does not exist', async () => {
      const sessionId =
        `integration-missing-${Date.now()}`;

      const session =
        await getRefreshSession(sessionId);

      expect(session).toBeNull();
    });
  });

  // ============================================================
  // revokeRefreshSession()
  // ============================================================

  describe('revokeRefreshSession()', () => {
    it('should change an ACTIVE session to REVOKED', async () => {
      const sessionId =
        `integration-revoke-${Date.now()}`;

      sessionIds.push(sessionId);

      await createRefreshSession(
        sessionId,
        'user-123',
        604800,
      );

      await revokeRefreshSession(
        sessionId,
      );

      const session =
        await getRefreshSession(sessionId);

      expect(session).toEqual({
        userId: 'user-123',
        status: 'REVOKED',
      });
    });

    it('should preserve the userId when revoking a session', async () => {
      const sessionId =
        `integration-preserve-${Date.now()}`;

      sessionIds.push(sessionId);

      await createRefreshSession(
        sessionId,
        'hotel-manager-123',
        604800,
      );

      await revokeRefreshSession(
        sessionId,
      );

      const session =
        await getRefreshSession(sessionId);

      expect(session?.userId).toBe(
        'hotel-manager-123',
      );

      expect(session?.status).toBe(
        'REVOKED',
      );
    });

    it('should set a shorter TTL after revocation', async () => {
      const sessionId =
        `integration-revoke-ttl-${Date.now()}`;

      sessionIds.push(sessionId);

      await createRefreshSession(
        sessionId,
        'user-123',
        604800,
      );

      await revokeRefreshSession(
        sessionId,
      );

      const ttl =
        await redisClient.ttl(
          `auth:refresh:${sessionId}`,
        );

      expect(ttl).toBeGreaterThan(0);

      expect(ttl).toBeLessThanOrEqual(
        60 * 60,
      );
    });

    it('should do nothing when the session does not exist', async () => {
      const sessionId =
        `integration-revoke-missing-${Date.now()}`;

      await revokeRefreshSession(
        sessionId,
      );

      const session =
        await getRefreshSession(sessionId);

      expect(session).toBeNull();
    });
  });

  // ============================================================
  // REAL REDIS DATA
  // ============================================================

  describe('Redis persistence', () => {
    it('should store the session using the expected Redis key', async () => {
      const sessionId =
        `integration-key-${Date.now()}`;

      sessionIds.push(sessionId);

      await createRefreshSession(
        sessionId,
        'user-123',
        604800,
      );

      const rawValue =
        await redisClient.get(
          `auth:refresh:${sessionId}`,
        );

      expect(rawValue).not.toBeNull();

      expect(JSON.parse(rawValue!))
        .toEqual({
          userId: 'user-123',
          status: 'ACTIVE',
        });
    });
  });
});