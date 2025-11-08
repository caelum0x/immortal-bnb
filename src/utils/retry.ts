/**
 * Retry Utility for External Service Calls
 * Handles transient failures with exponential backoff
 */

import { logger } from './logger';

export interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

const defaultOptions: Required<RetryOptions> = {
  maxAttempts: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 2,
  onRetry: () => {},
};

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...defaultOptions, ...options };
  let lastError: Error;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt === opts.maxAttempts) {
        throw lastError;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        opts.initialDelay * Math.pow(opts.backoffMultiplier, attempt - 1),
        opts.maxDelay
      );

      opts.onRetry(attempt, lastError);
      logger.warn(`Retry attempt ${attempt}/${opts.maxAttempts} after ${delay}ms: ${lastError.message}`);

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

/**
 * Retry with custom error handling
 */
export async function retryWithFallback<T>(
  fn: () => Promise<T>,
  fallback: T,
  options: RetryOptions = {}
): Promise<T> {
  try {
    return await retry(fn, options);
  } catch (error) {
    logger.error(`All retry attempts failed, using fallback: ${(error as Error).message}`);
    return fallback;
  }
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: Error): boolean {
  const message = error.message.toLowerCase();

  // Network errors
  if (message.includes('network') ||
      message.includes('timeout') ||
      message.includes('econnrefused') ||
      message.includes('enotfound') ||
      message.includes('etimedout')) {
    return true;
  }

  // HTTP errors (5xx are retryable, 4xx are not)
  if (message.includes('status code')) {
    const statusMatch = message.match(/status code (\d+)/);
    if (statusMatch) {
      const status = parseInt(statusMatch[1] || '0');
      return status >= 500 && status < 600;
    }
  }

  // Rate limiting
  if (message.includes('rate limit') || message.includes('too many requests')) {
    return true;
  }

  return false;
}

/**
 * Retry only if error is retryable
 */
export async function retryOnNetworkError<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  return retry(async () => {
    try {
      return await fn();
    } catch (error) {
      if (!isRetryableError(error as Error)) {
        throw error; // Don't retry non-network errors
      }
      throw error;
    }
  }, options);
}

/**
 * Create a retryable version of a function
 */
export function makeRetryable<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: RetryOptions = {}
): T {
  return (async (...args: any[]) => {
    return retry(() => fn(...args), options);
  }) as T;
}
