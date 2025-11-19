/**
 * Cache Manager
 * High-level caching interface with TTL and invalidation
 */

import { getRedisClient } from './redisClient';
import { logger } from '../utils/logger';

const DEFAULT_TTL = 300; // 5 minutes

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string;
}

export class CacheManager {
  private prefix: string;

  constructor(prefix: string = 'immortal-bot:') {
    this.prefix = prefix;
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const client = await getRedisClient();
      const value = await client.get(`${this.prefix}${key}`);
      if (value) {
        return JSON.parse(value) as T;
      }
      return null;
    } catch (error) {
      logger.error(`Cache get error for key ${key}:`, error);
      return null; // Fail gracefully
    }
  }

  /**
   * Set value in cache
   */
  async set(key: string, value: any, options: CacheOptions = {}): Promise<void> {
    try {
      const client = await getRedisClient();
      const ttl = options.ttl || DEFAULT_TTL;
      const fullKey = `${this.prefix}${key}`;
      
      await client.setEx(fullKey, ttl, JSON.stringify(value));
    } catch (error) {
      logger.error(`Cache set error for key ${key}:`, error);
      // Fail silently - cache is not critical
    }
  }

  /**
   * Delete key from cache
   */
  async delete(key: string): Promise<void> {
    try {
      const client = await getRedisClient();
      await client.del(`${this.prefix}${key}`);
    } catch (error) {
      logger.error(`Cache delete error for key ${key}:`, error);
    }
  }

  /**
   * Delete keys matching pattern
   */
  async deletePattern(pattern: string): Promise<void> {
    try {
      const client = await getRedisClient();
      const keys = await client.keys(`${this.prefix}${pattern}`);
      if (keys.length > 0) {
        await client.del(keys);
      }
    } catch (error) {
      logger.error(`Cache delete pattern error for ${pattern}:`, error);
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const client = await getRedisClient();
      const result = await client.exists(`${this.prefix}${key}`);
      return result === 1;
    } catch (error) {
      logger.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get or set (cache-aside pattern)
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options: CacheOptions = {}
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const value = await fetchFn();
    await this.set(key, value, options);
    return value;
  }

  /**
   * Invalidate cache for token
   */
  async invalidateToken(tokenAddress: string): Promise<void> {
    await this.deletePattern(`token:${tokenAddress}:*`);
    await this.deletePattern(`market:${tokenAddress}:*`);
  }

  /**
   * Warm cache with critical data
   */
  async warmCache(): Promise<void> {
    logger.info('🔥 Warming cache...');
    // Add cache warming logic here
    // e.g., pre-fetch trending tokens, market data, etc.
  }
}

// Singleton instance
export const cacheManager = new CacheManager();

