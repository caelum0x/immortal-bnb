/**
 * Recovery Strategies
 * Implements graceful degradation and error recovery
 */

import { logger } from '../utils/logger';
import { cacheManager } from '../cache/cacheManager';

export interface RecoveryStrategy {
  name: string;
  execute: () => Promise<any>;
  priority: number; // Lower = higher priority
}

export class RecoveryManager {
  private strategies: RecoveryStrategy[] = [];

  /**
   * Register a recovery strategy
   */
  register(strategy: RecoveryStrategy): void {
    this.strategies.push(strategy);
    this.strategies.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Attempt recovery using registered strategies
   */
  async attemptRecovery(context: string): Promise<any> {
    logger.info(`Attempting recovery for: ${context}`);

    for (const strategy of this.strategies) {
      try {
        logger.info(`Trying recovery strategy: ${strategy.name}`);
        const result = await strategy.execute();
        logger.info(`Recovery successful with strategy: ${strategy.name}`);
        return result;
      } catch (error) {
        logger.warn(`Recovery strategy ${strategy.name} failed:`, error);
        continue;
      }
    }

    throw new Error(`All recovery strategies failed for: ${context}`);
  }
}

// Default recovery strategies
export const recoveryManager = new RecoveryManager();

// Cache-based recovery (use cached data)
recoveryManager.register({
  name: 'cache-fallback',
  priority: 1,
  execute: async () => {
    // Try to get data from cache
    const cached = await cacheManager.get('fallback-data');
    if (cached) {
      return cached;
    }
    throw new Error('No cached data available');
  },
});

// Default value recovery
recoveryManager.register({
  name: 'default-values',
  priority: 2,
  execute: async () => {
    // Return safe default values
    return {
      success: false,
      message: 'Service temporarily unavailable, using defaults',
      data: null,
    };
  },
});

/**
 * Graceful degradation wrapper
 */
export async function withGracefulDegradation<T>(
  primary: () => Promise<T>,
  fallback: () => Promise<T>,
  context: string = 'Operation'
): Promise<T> {
  try {
    return await primary();
  } catch (error) {
    logger.warn(`${context} failed, attempting graceful degradation:`, error);
    try {
      return await fallback();
    } catch (fallbackError) {
      logger.error(`${context} fallback also failed:`, fallbackError);
      throw fallbackError;
    }
  }
}

