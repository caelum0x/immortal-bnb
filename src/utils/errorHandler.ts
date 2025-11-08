import { logger, logError } from './logger';

export class TradingError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: any
  ) {
    super(message);
    this.name = 'TradingError';
  }
}

export class APIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public endpoint?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export class InsufficientFundsError extends TradingError {
  constructor(required: number, available: number) {
    super(
      `Insufficient funds: required ${required} BNB, available ${available} BNB`,
      'INSUFFICIENT_FUNDS',
      { required, available }
    );
  }
}

export class SlippageError extends TradingError {
  constructor(expected: number, actual: number) {
    super(
      `Slippage too high: expected ${expected}%, actual ${actual}%`,
      'SLIPPAGE_TOO_HIGH',
      { expected, actual }
    );
  }
}

/**
 * Wrapper for async functions with error handling
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context: string,
  fallbackValue?: T
): Promise<T | undefined> {
  try {
    return await operation();
  } catch (error) {
    logError(context, error as Error);

    if (fallbackValue !== undefined) {
      logger.warn(`Using fallback value for ${context}`);
      return fallbackValue;
    }

    return undefined;
  }
}

/**
 * Retry logic for failed operations
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000,
  context: string = 'Operation'
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      logger.warn(`${context} failed (attempt ${attempt}/${maxRetries}): ${lastError.message}`);

      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
      }
    }
  }

  throw new Error(`${context} failed after ${maxRetries} attempts: ${lastError?.message}`);
}

/**
 * Safe JSON parsing
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json);
  } catch (error) {
    logger.warn(`Failed to parse JSON, using fallback: ${(error as Error).message}`);
    return fallback;
  }
}

/**
 * Validate environment variables
 */
export function validateEnv(requiredVars: string[]): void {
  const missing = requiredVars.filter(varName => !process.env[varName]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

/**
 * Enhanced error handling utilities for the immortal trading bot
 */

export class NetworkError extends TradingError {
  constructor(message: string, chainId?: number) {
    super(
      `Network error${chainId ? ` on chain ${chainId}` : ''}: ${message}`,
      'NETWORK_ERROR',
      { chainId }
    );
  }
}

export class ValidationError extends TradingError {
  constructor(field: string, value: any, expected?: string) {
    super(
      `Validation failed for ${field}: ${value}${expected ? `, expected ${expected}` : ''}`,
      'VALIDATION_ERROR',
      { field, value, expected }
    );
  }
}

export class RateLimitError extends APIError {
  constructor(endpoint: string, retryAfter?: number) {
    super(
      `Rate limit exceeded for ${endpoint}${retryAfter ? `, retry after ${retryAfter}s` : ''}`,
      429,
      endpoint
    );
    this.name = 'RateLimitError';
  }
}

export class MemoryError extends TradingError {
  constructor(operation: string, details?: string) {
    super(
      `Memory operation failed: ${operation}${details ? ` - ${details}` : ''}`,
      'MEMORY_ERROR',
      { operation, details }
    );
  }
}

/**
 * Enhanced error handling with categorization and recovery strategies
 */
export class ErrorHandler {
  private errorCounts = new Map<string, number>();
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000; // 1 second

  /**
   * Handle errors with automatic categorization and recovery
   */
  async handleError(error: Error, context: string, operation?: () => Promise<any>): Promise<any> {
    const errorKey = `${context}:${error.constructor.name}`;
    const count = this.errorCounts.get(errorKey) || 0;
    this.errorCounts.set(errorKey, count + 1);

    logger.error(`🚨 Error in ${context}: ${error.message} (occurrence #${count + 1})`);

    // Categorize error and determine recovery strategy
    const recovery = this.categorizeError(error);

    if (recovery.canRetry && count < this.maxRetries && operation) {
      logger.info(`🔄 Attempting recovery for ${context} (attempt ${count + 1}/${this.maxRetries})`);
      
      if (recovery.delayMs > 0) {
        await this.delay(recovery.delayMs);
      }

      try {
        return await operation();
      } catch (retryError) {
        return this.handleError(retryError as Error, context, operation);
      }
    }

    // Log final failure
    if (count >= this.maxRetries) {
      logger.error(`❌ Max retries exceeded for ${context}, giving up`);
    }

    // Apply fallback strategy
    return recovery.fallback ? recovery.fallback() : null;
  }

  /**
   * Categorize errors and determine recovery strategies
   */
  private categorizeError(error: Error): {
    canRetry: boolean;
    delayMs: number;
    fallback?: () => any;
    severity: 'low' | 'medium' | 'high' | 'critical';
  } {
    // Network-related errors - usually retryable
    if (error instanceof NetworkError || error.message.includes('network') || error.message.includes('connection')) {
      return {
        canRetry: true,
        delayMs: 2000,
        severity: 'medium'
      };
    }

    // Rate limiting - wait and retry
    if (error instanceof RateLimitError || error.message.includes('rate limit')) {
      return {
        canRetry: true,
        delayMs: 5000,
        severity: 'low'
      };
    }

    // API errors - might be transient
    if (error instanceof APIError) {
      return {
        canRetry: error.statusCode ? error.statusCode >= 500 : true,
        delayMs: 1000,
        severity: 'medium'
      };
    }

    // Trading errors - usually not retryable
    if (error instanceof InsufficientFundsError || error instanceof SlippageError) {
      return {
        canRetry: false,
        delayMs: 0,
        severity: 'high',
        fallback: () => ({
          success: false,
          error: error.message,
          code: error instanceof TradingError ? error.code : 'TRADING_ERROR'
        })
      };
    }

    // Validation errors - not retryable
    if (error instanceof ValidationError) {
      return {
        canRetry: false,
        delayMs: 0,
        severity: 'high'
      };
    }

    // Memory errors - might be transient
    if (error instanceof MemoryError) {
      return {
        canRetry: true,
        delayMs: 1000,
        severity: 'medium'
      };
    }

    // Unknown errors - be cautious
    return {
      canRetry: false,
      delayMs: 0,
      severity: 'high'
    };
  }

  /**
   * Get error statistics
   */
  getErrorStats(): Record<string, number> {
    return Object.fromEntries(this.errorCounts.entries());
  }

  /**
   * Reset error counts
   */
  resetErrorCounts(): void {
    this.errorCounts.clear();
    logger.info('🔄 Error counts reset');
  }

  /**
   * Check if context has too many errors
   */
  isContextUnhealthy(context: string, threshold = 10): boolean {
    const totalErrors = Array.from(this.errorCounts.entries())
      .filter(([key]) => key.startsWith(`${context}:`))
      .reduce((sum, [_, count]) => sum + count, 0);

    return totalErrors >= threshold;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Global error handler instance
export const globalErrorHandler = new ErrorHandler();

/**
 * Enhanced version of withErrorHandling using the new ErrorHandler
 */
export async function handleAsyncOperation<T>(
  operation: () => Promise<T>,
  context: string,
  fallback?: T
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    const result = await globalErrorHandler.handleError(error as Error, context, operation);
    return result !== null ? result : (fallback as T);
  }
}

/**
 * Decorator for automatic error handling
 */
export function withAutoRetry(retries = 3, delayMs = 1000) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      for (let i = 0; i <= retries; i++) {
        try {
          return await method.apply(this, args);
        } catch (error) {
          if (i === retries) {
            throw error;
          }

          logger.warn(`🔄 Retrying ${propertyName} (attempt ${i + 1}/${retries})`);
          await new Promise(resolve => setTimeout(resolve, delayMs * (i + 1))); // Exponential backoff
        }
      }
    };

    return descriptor;
  };
}

export default globalErrorHandler;
