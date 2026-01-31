import { redis } from '../config/redis';
import { config } from '../config/env';
import { logger } from './logger';

// ==========================================
// CACHE SERVICE
// ==========================================

// Default TTL in seconds
const DEFAULT_TTL = 3600; // 1 hour

// Key prefix
const PREFIX = config.redis.keyPrefix;

// Helper to add prefix to keys
const withPrefix = (key: string) => `${PREFIX}${key}`;

// Cache key prefixes for different data types
export const CacheKeys = {
  USER: 'user:',
  EMPLOYEE: 'employee:',
  DEPARTMENT: 'department:',
  POSITION: 'position:',
  ATTENDANCE: 'attendance:',
  LEAVE_BALANCE: 'leave_balance:',
  PAYROLL: 'payroll:',
  DASHBOARD: 'dashboard:',
  SESSION: 'session:',
  CONFIG: 'config:',
} as const;

// ==========================================
// BASIC CACHE OPERATIONS
// ==========================================

/**
 * Get value from cache
 */
export const cacheGet = async <T>(key: string): Promise<T | null> => {
  try {
    const data = await redis.get(withPrefix(key));
    if (!data) return null;
    return JSON.parse(data) as T;
  } catch (error) {
    logger.error({ error, key }, 'Cache get error');
    return null;
  }
};

/**
 * Set value in cache with optional TTL
 */
export const cacheSet = async <T>(
  key: string,
  value: T,
  ttlSeconds: number = DEFAULT_TTL
): Promise<boolean> => {
  try {
    const data = JSON.stringify(value);
    if (ttlSeconds > 0) {
      await redis.setEx(withPrefix(key), ttlSeconds, data);
    } else {
      await redis.set(withPrefix(key), data);
    }
    return true;
  } catch (error) {
    logger.error({ error, key }, 'Cache set error');
    return false;
  }
};

/**
 * Delete value from cache
 */
export const cacheDel = async (key: string): Promise<boolean> => {
  try {
    await redis.del(withPrefix(key));
    return true;
  } catch (error) {
    logger.error({ error, key }, 'Cache delete error');
    return false;
  }
};

/**
 * Delete multiple keys matching a pattern
 */
export const cacheDelPattern = async (pattern: string): Promise<number> => {
  try {
    const keys = await redis.keys(withPrefix(pattern));
    if (keys.length === 0) return 0;
    return await redis.del(keys);
  } catch (error) {
    logger.error({ error, pattern }, 'Cache delete pattern error');
    return 0;
  }
};

/**
 * Check if key exists in cache
 */
export const cacheExists = async (key: string): Promise<boolean> => {
  try {
    const exists = await redis.exists(withPrefix(key));
    return exists === 1;
  } catch (error) {
    logger.error({ error, key }, 'Cache exists error');
    return false;
  }
};

/**
 * Get TTL of a key
 */
export const cacheTTL = async (key: string): Promise<number> => {
  try {
    return await redis.ttl(withPrefix(key));
  } catch (error) {
    logger.error({ error, key }, 'Cache TTL error');
    return -1;
  }
};

// ==========================================
// CACHE-ASIDE PATTERN (GET OR SET)
// ==========================================

/**
 * Get from cache or fetch and cache
 */
export const cacheGetOrSet = async <T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttlSeconds: number = DEFAULT_TTL
): Promise<T> => {
  // Try to get from cache first
  const cached = await cacheGet<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Fetch fresh data
  const data = await fetchFn();

  // Cache the result
  await cacheSet(key, data, ttlSeconds);

  return data;
};

// ==========================================
// HASH OPERATIONS (for structured data)
// ==========================================

/**
 * Set hash field
 */
export const cacheHSet = async (
  key: string,
  field: string,
  value: any
): Promise<boolean> => {
  try {
    await redis.hSet(withPrefix(key), field, JSON.stringify(value));
    return true;
  } catch (error) {
    logger.error({ error, key, field }, 'Cache hset error');
    return false;
  }
};

/**
 * Get hash field
 */
export const cacheHGet = async <T>(
  key: string,
  field: string
): Promise<T | null> => {
  try {
    const data = await redis.hGet(withPrefix(key), field);
    if (!data) return null;
    return JSON.parse(data) as T;
  } catch (error) {
    logger.error({ error, key, field }, 'Cache hget error');
    return null;
  }
};

/**
 * Get all hash fields
 */
export const cacheHGetAll = async <T extends Record<string, any>>(
  key: string
): Promise<T | null> => {
  try {
    const data = await redis.hGetAll(withPrefix(key));
    if (!data || Object.keys(data).length === 0) return null;
    const result: Record<string, any> = {};
    for (const [field, value] of Object.entries(data)) {
      result[field] = JSON.parse(value);
    }
    return result as T;
  } catch (error) {
    logger.error({ error, key }, 'Cache hgetall error');
    return null;
  }
};

/**
 * Delete hash field
 */
export const cacheHDel = async (
  key: string,
  ...fields: string[]
): Promise<number> => {
  try {
    return await redis.hDel(withPrefix(key), fields);
  } catch (error) {
    logger.error({ error, key, fields }, 'Cache hdel error');
    return 0;
  }
};

// ==========================================
// LIST OPERATIONS (for queues)
// ==========================================

/**
 * Push to list (right)
 */
export const cacheLPush = async (key: string, ...values: any[]): Promise<number> => {
  try {
    const data = values.map((v) => JSON.stringify(v));
    return await redis.rPush(withPrefix(key), data);
  } catch (error) {
    logger.error({ error, key }, 'Cache lpush error');
    return 0;
  }
};

/**
 * Pop from list (left)
 */
export const cacheLPop = async <T>(key: string): Promise<T | null> => {
  try {
    const data = await redis.lPop(withPrefix(key));
    if (!data) return null;
    return JSON.parse(data) as T;
  } catch (error) {
    logger.error({ error, key }, 'Cache lpop error');
    return null;
  }
};

/**
 * Get list length
 */
export const cacheLLen = async (key: string): Promise<number> => {
  try {
    return await redis.lLen(withPrefix(key));
  } catch (error) {
    logger.error({ error, key }, 'Cache llen error');
    return 0;
  }
};

// ==========================================
// SET OPERATIONS (for unique collections)
// ==========================================

/**
 * Add to set
 */
export const cacheSAdd = async (key: string, ...members: string[]): Promise<number> => {
  try {
    return await redis.sAdd(withPrefix(key), members);
  } catch (error) {
    logger.error({ error, key }, 'Cache sadd error');
    return 0;
  }
};

/**
 * Check if member exists in set
 */
export const cacheSIsMember = async (key: string, member: string): Promise<boolean> => {
  try {
    const result = await redis.sIsMember(withPrefix(key), member);
    return Boolean(result);
  } catch (error) {
    logger.error({ error, key, member }, 'Cache sismember error');
    return false;
  }
};

/**
 * Get all set members
 */
export const cacheSMembers = async (key: string): Promise<string[]> => {
  try {
    return await redis.sMembers(withPrefix(key));
  } catch (error) {
    logger.error({ error, key }, 'Cache smembers error');
    return [];
  }
};

/**
 * Remove from set
 */
export const cacheSRem = async (key: string, ...members: string[]): Promise<number> => {
  try {
    return await redis.sRem(withPrefix(key), members);
  } catch (error) {
    logger.error({ error, key }, 'Cache srem error');
    return 0;
  }
};

// ==========================================
// INCREMENT/DECREMENT OPERATIONS
// ==========================================

/**
 * Increment a counter
 */
export const cacheIncr = async (key: string): Promise<number> => {
  try {
    return await redis.incr(withPrefix(key));
  } catch (error) {
    logger.error({ error, key }, 'Cache incr error');
    return 0;
  }
};

/**
 * Increment by specific amount
 */
export const cacheIncrBy = async (key: string, amount: number): Promise<number> => {
  try {
    return await redis.incrBy(withPrefix(key), amount);
  } catch (error) {
    logger.error({ error, key }, 'Cache incrby error');
    return 0;
  }
};

/**
 * Decrement a counter
 */
export const cacheDecr = async (key: string): Promise<number> => {
  try {
    return await redis.decr(withPrefix(key));
  } catch (error) {
    logger.error({ error, key }, 'Cache decr error');
    return 0;
  }
};

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Flush all keys with the app prefix
 */
export const cacheFlushAll = async (): Promise<boolean> => {
  try {
    const keys = await redis.keys(`${PREFIX}*`);
    if (keys.length > 0) {
      await redis.del(keys);
    }
    return true;
  } catch (error) {
    logger.error({ error }, 'Cache flush error');
    return false;
  }
};

/**
 * Get cache stats
 */
export const getCacheStats = async (): Promise<{
  keys: number;
  memory: string;
  uptime: number;
}> => {
  try {
    const info = await redis.info();
    const keys = await redis.dbSize();

    // Parse memory usage from info
    const memoryMatch = info.match(/used_memory_human:(\S+)/);
    const uptimeMatch = info.match(/uptime_in_seconds:(\d+)/);

    return {
      keys,
      memory: memoryMatch ? memoryMatch[1] : 'unknown',
      uptime: uptimeMatch ? parseInt(uptimeMatch[1]) : 0,
    };
  } catch (error) {
    logger.error({ error }, 'Get cache stats error');
    return { keys: 0, memory: 'unknown', uptime: 0 };
  }
};
