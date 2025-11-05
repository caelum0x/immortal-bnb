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

export default {
  withErrorHandling,
  withRetry,
  safeJsonParse,
  validateEnv,
  TradingError,
  APIError,
  InsufficientFundsError,
  SlippageError,
};
