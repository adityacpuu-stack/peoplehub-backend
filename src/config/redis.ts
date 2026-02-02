import { createClient, RedisClientType } from 'redis';
import { config } from './env';
import { logger } from '../utils/logger';

// ==========================================
// REDIS CLIENT CONFIGURATION (OPTIONAL)
// ==========================================

let redis: RedisClientType | null = null;
let isRedisAvailable = false;

// Only create Redis client if URL is provided
if (config.redis.host) {
  redis = createClient({
    username: config.redis.username,
    password: config.redis.password,
    socket: {
      host: config.redis.host,
      port: config.redis.port,
      reconnectStrategy: (retries) => {
        if (retries > 3) {
          logger.warn('Redis connection failed after 3 retries, continuing without cache');
          isRedisAvailable = false;
          return false; // Stop retrying
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
    isRedisAvailable = true;
  });

  redis.on('error', (err) => {
    logger.warn({ err }, 'Redis client error - continuing without cache');
    isRedisAvailable = false;
  });

  redis.on('end', () => {
    logger.warn('Redis connection closed');
    isRedisAvailable = false;
  });

  redis.on('reconnecting', () => {
    logger.info('Redis client reconnecting...');
  });
} else {
  logger.info('Redis not configured - running without cache');
}

// ==========================================
// CONNECT TO REDIS (OPTIONAL)
// ==========================================

export const connectRedis = async (): Promise<void> => {
  if (!redis) {
    logger.info('Redis not configured - skipping connection');
    return;
  }

  try {
    await redis.connect();
    isRedisAvailable = true;
    logger.info('Redis connected successfully');
  } catch (error) {
    logger.warn({ error }, 'Failed to connect to Redis - continuing without cache');
    isRedisAvailable = false;
    // Don't throw - let the app continue without Redis
  }
};

// ==========================================
// REDIS HEALTH CHECK
// ==========================================

export const checkRedisHealth = async (): Promise<{
  status: 'healthy' | 'unhealthy' | 'disabled';
  latency?: number;
  error?: string;
}> => {
  if (!redis || !isRedisAvailable) {
    return { status: 'disabled' };
  }

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
  if (!redis || !isRedisAvailable) {
    return;
  }

  try {
    await redis.quit();
    logger.info('Redis connection closed gracefully');
  } catch (error) {
    logger.error({ error }, 'Error closing Redis connection');
    try {
      await redis.disconnect();
    } catch {
      // Ignore
    }
  }
};

// ==========================================
// EXPORTS
// ==========================================

export const isRedisEnabled = () => isRedisAvailable;
export { redis };
export default redis;
