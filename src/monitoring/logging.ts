/**
 * Enhanced Structured Logging
 * Provides JSON logging with correlation IDs and context
 */

import winston from 'winston';
import { CONFIG } from '../config';
import { v4 as uuidv4 } from 'uuid';

// Correlation ID storage (using AsyncLocalStorage for request context)
const correlationIds = new Map<string, string>();

/**
 * Generate or retrieve correlation ID for request tracing
 */
export function getCorrelationId(): string {
  // In a real implementation, use AsyncLocalStorage or request context
  const id = uuidv4();
  correlationIds.set('current', id);
  return id;
}

export function setCorrelationId(id: string): void {
  correlationIds.set('current', id);
}

export function getCurrentCorrelationId(): string | undefined {
  return correlationIds.get('current');
}

// Custom format for structured JSON logging
const jsonFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...rest } = info;
    const logEntry: any = {
      timestamp,
      level,
      message,
      correlationId: getCurrentCorrelationId() || 'unknown',
      ...rest,
    };

    // Remove winston-specific fields
    delete logEntry[Symbol.for('level')];
    delete logEntry[Symbol.for('message')];

    return JSON.stringify(logEntry);
  })
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf((info) => {
    const correlationId = getCurrentCorrelationId() || 'unknown';
    return `${info.timestamp} [${info.level}] [${correlationId}] ${info.message} ${
      info.stack ? '\n' + info.stack : ''
    }`;
  })
);

// Create enhanced logger
export const structuredLogger = winston.createLogger({
  level: CONFIG.LOG_LEVEL || 'info',
  format: process.env.NODE_ENV === 'production' ? jsonFormat : consoleFormat,
  transports: [
    // Console transport
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'production' ? jsonFormat : consoleFormat,
    }),
    // File transport for errors
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: jsonFormat,
    }),
    // File transport for all logs
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: jsonFormat,
    }),
    // Separate file for structured JSON logs (for log aggregation)
    new winston.transports.File({
      filename: 'logs/structured.json',
      maxsize: 5242880,
      maxFiles: 10,
      format: jsonFormat,
    }),
  ],
  // Don't exit on handled exceptions
  exitOnError: false,
});

/**
 * Log with context
 */
export function logWithContext(
  level: 'info' | 'warn' | 'error' | 'debug',
  message: string,
  context: Record<string, any> = {}
): void {
  const correlationId = getCurrentCorrelationId();
  structuredLogger[level](message, {
    ...context,
    correlationId,
  });
}

/**
 * Log trade event with full context
 */
export function logTradeEvent(
  event: string,
  tradeData: {
    tokenAddress: string;
    tokenSymbol: string;
    action: string;
    amount: number;
    price?: number;
    txHash?: string;
    outcome?: string;
  }
): void {
  logWithContext('info', `Trade ${event}`, {
    event: 'trade',
    tradeType: event,
    ...tradeData,
  });
}

/**
 * Log AI decision with context
 */
export function logAIDecision(decisionData: {
  tokenAddress: string;
  tokenSymbol: string;
  action: string;
  confidence: number;
  reasoning: string;
  strategy: string;
}): void {
  logWithContext('info', 'AI decision made', {
    event: 'ai_decision',
    ...decisionData,
  });
}

/**
 * Log error with full context
 */
export function logErrorWithContext(
  error: Error,
  context: Record<string, any> = {}
): void {
  logWithContext('error', error.message, {
    event: 'error',
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    ...context,
  });
}

/**
 * Log performance metric
 */
export function logPerformance(
  operation: string,
  duration: number,
  metadata: Record<string, any> = {}
): void {
  logWithContext('info', `Performance: ${operation}`, {
    event: 'performance',
    operation,
    durationMs: duration,
    ...metadata,
  });
}

// Export default logger for backward compatibility
export default structuredLogger;

