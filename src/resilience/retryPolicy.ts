/**
 * Retry Policy
 * Implements exponential backoff and retry strategies
 */

import { logger } from '../utils/logger';

export interface RetryOptions {
  maxRetries: number;
  initialDelay: number; // Initial delay in ms
  maxDelay: number; // Maximum delay in ms
  backoffMultiplier: number; // Exponential backoff multiplier
  retryableErrors?: string[]; // Error messages that should trigger retry
}

export class RetryPolicy {
  private options: RetryOptions;

  constructor(options: Partial<RetryOptions> = {}) {
    this.options = {
      maxRetries: options.maxRetries || 3,
      initialDelay: options.initialDelay || 1000,
      maxDelay: options.maxDelay || 30000,
      backoffMultiplier: options.backoffMultiplier || 2,
      retryableErrors: options.retryableErrors || [
        'network',
        'timeout',
        'ECONNRESET',
        'ETIMEDOUT',
      ],
    };
  }

  /**
   * Execute function with retry logic
   */
  async execute<T>(
    fn: () => Promise<T>,
    context: string = 'Operation'
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.options.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;

        // Check if error is retryable
        if (!this.isRetryable(error)) {
          throw error;
        }

        // Don't retry on last attempt
        if (attempt === this.options.maxRetries) {
          break;
        }

        const delay = this.calculateDelay(attempt);
        logger.warn(
          `${context} failed (attempt ${attempt + 1}/${this.options.maxRetries + 1}), retrying in ${delay}ms...`
        );

        await this.sleep(delay);
      }
    }

    logger.error(
      `${context} failed after ${this.options.maxRetries + 1} attempts`
    );
    throw lastError || new Error(`${context} failed`);
  }

  private isRetryable(error: any): boolean {
    if (!error) return false;

    const errorMessage = error.message?.toLowerCase() || '';
    const errorCode = error.code?.toLowerCase() || '';

    return (
      this.options.retryableErrors?.some(
        (retryable) =>
          errorMessage.includes(retryable.toLowerCase()) ||
          errorCode.includes(retryable.toLowerCase())
      ) || false
    );
  }

  private calculateDelay(attempt: number): number {
    const delay =
      this.options.initialDelay *
      Math.pow(this.options.backoffMultiplier, attempt);
    return Math.min(delay, this.options.maxDelay);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Pre-configured retry policies
export const networkRetryPolicy = new RetryPolicy({
  maxRetries: 5,
  initialDelay: 1000,
  maxDelay: 10000,
  retryableErrors: ['network', 'timeout', 'ECONNRESET', 'ETIMEDOUT'],
});

export const apiRetryPolicy = new RetryPolicy({
  maxRetries: 3,
  initialDelay: 500,
  maxDelay: 5000,
  retryableErrors: ['rate limit', '429', '503', '502'],
});

export const blockchainRetryPolicy = new RetryPolicy({
  maxRetries: 10,
  initialDelay: 2000,
  maxDelay: 30000,
  retryableErrors: ['nonce', 'replacement', 'underpriced'],
});

