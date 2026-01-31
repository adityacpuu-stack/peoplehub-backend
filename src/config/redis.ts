import { createClient } from 'redis';
import { config } from './env';
import { logger } from '../utils/logger';

// ==========================================
// REDIS CLIENT CONFIGURATION
// ==========================================

export const redis = createClient({
  username: config.redis.username,
  password: config.redis.password,
  socket: {
    host: config.redis.host,
    port: config.redis.port,
    reconnectStrategy: (retries) => {
      if (retries > 3) {
        logger.error('Redis connection failed after 3 retries');
        return new Error('Redis connection failed');
      }
      return Math.min(retries * 200, 2000);
    },
  },
});

// Connection event handlers
redis.on('connect', () => {
  logger.info('Redis client connecting...');
});

redis.on('ready', () => {
  logger.info('Redis client connected and ready');
});

redis.on('error', (err) => {
  logger.error({ err }, 'Redis client error');
});

redis.on('end', () => {
  logger.warn('Redis connection closed');
});

redis.on('reconnecting', () => {
  logger.info('Redis client reconnecting...');
});

// ==========================================
// CONNECT TO REDIS
// ==========================================

export const connectRedis = async (): Promise<void> => {
  try {
    await redis.connect();
    logger.info('Redis connected successfully');
  } catch (error) {
    logger.error({ error }, 'Failed to connect to Redis');
    throw error;
  }
};

// ==========================================
// REDIS HEALTH CHECK
// ==========================================

export const checkRedisHealth = async (): Promise<{
  status: 'healthy' | 'unhealthy';
  latency?: number;
  error?: string;
}> => {
  try {
    const start = Date.now();
    await redis.ping();
    const latency = Date.now() - start;
    return { status: 'healthy', latency };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

// ==========================================
// GRACEFUL SHUTDOWN
// ==========================================

export const disconnectRedis = async (): Promise<void> => {
  try {
    await redis.quit();
    logger.info('Redis connection closed gracefully');
  } catch (error) {
    logger.error({ error }, 'Error closing Redis connection');
    await redis.disconnect();
  }
};

export default redis;
