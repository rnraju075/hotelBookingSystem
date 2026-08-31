import { createClient } from 'redis';
import { env } from '../../config/env.js';


export const redisClient = createClient({
  url: env.REDIS_URL,
});

redisClient.on('error', (error) => {
  console.error('Redis client error', error);
});

export const connectRedis = async (): Promise<void> => {
  try {
    await redisClient.connect();

    console.log('Redis connected successfully');
  } catch (error) {
    console.error('Redis connection failed', error);

    throw error;
  }
};