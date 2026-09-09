import { redisClient } from "../../infrastructure/redis/redis.js";

interface RefreshSession {
  userId: string;
  status: 'ACTIVE' | 'REVOKED';
}

const getSessionKey = (sessionId: string): string => {
  return `auth:refresh:${sessionId}`;
};

export const createRefreshSession = async (
  sessionId: string,
  userId: string,
  ttlSeconds: number,
): Promise<void> => {
  const session: RefreshSession = {
    userId,
    status: 'ACTIVE',
  };

  await redisClient.set(
    getSessionKey(sessionId),
    JSON.stringify(session),
    {
      EX: ttlSeconds,
    },
  );
};

export const getRefreshSession = async (
  sessionId: string,
): Promise<RefreshSession | null> => {
  const value = await redisClient.get(
    getSessionKey(sessionId),
  );

  if (!value) {
    return null;
  }

  return JSON.parse(value) as RefreshSession;
};

export const revokeRefreshSession = async (
  sessionId: string,
): Promise<void> => {
  const session = await getRefreshSession(sessionId);

  if (!session) {
    return;
  }

  await redisClient.set(
    getSessionKey(sessionId),
    JSON.stringify({
      ...session,
      status: 'REVOKED',
    }),
    {
      EX: 60 * 60,
    },
  );
};