/**
 * Rate Limiting Middleware
 * Protects API endpoints from abuse and DDoS attacks
 */

import rateLimit from 'express-rate-limit';
import { logger } from '../utils/logger';

/**
 * General API rate limiter
 * Applies to all /api/* endpoints
 * Allows 100 requests per 15 minutes per IP
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests',
    message: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method,
    });

    res.status(429).json({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: res.getHeader('RateLimit-Reset'),
    });
  },
});

/**
 * Stricter rate limiter for bot control endpoints
 * Prevents rapid start/stop spam
 * Allows 10 requests per minute
 */
export const botControlLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: {
    error: 'Too many bot control requests',
    message: 'You are controlling the bot too frequently. Please slow down.',
    retryAfter: '1 minute',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Count all requests
  handler: (req, res) => {
    logger.warn('Bot control rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method,
    });

    res.status(429).json({
      error: 'Too many bot control requests',
      message: 'Please wait before starting/stopping the bot again.',
      retryAfter: res.getHeader('RateLimit-Reset'),
    });
  },
});

/**
 * Very strict rate limiter for sensitive operations
 * E.g., changing configuration, deploying contracts
 * Allows 5 requests per hour
 */
export const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 requests per hour
  message: {
    error: 'Rate limit exceeded',
    message: 'This operation is rate-limited. Please try again later.',
    retryAfter: '1 hour',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.error('Strict rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method,
    });

    res.status(429).json({
      error: 'Rate limit exceeded',
      message: 'Too many attempts. Please wait before trying again.',
      retryAfter: res.getHeader('RateLimit-Reset'),
    });
  },
});

/**
 * Lenient rate limiter for read-only endpoints
 * Allows more requests for data fetching
 * 200 requests per 15 minutes
 */
export const readLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 requests per 15 minutes
  message: {
    error: 'Too many requests',
    message: 'Please slow down your requests.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

/**
 * Health check limiter - very permissive
 * Allows 300 requests per 15 minutes
 * For monitoring services
 */
export const healthCheckLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // 300 requests per 15 minutes
  message: {
    error: 'Too many health checks',
    message: 'Health check endpoint rate limited.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Create a custom rate limiter with specific configuration
 */
export function createRateLimiter(options: {
  windowMs: number;
  max: number;
  message: string;
  name?: string;
}) {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: {
      error: 'Rate limit exceeded',
      message: options.message,
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn(`Rate limit exceeded: ${options.name || 'custom'}`, {
        ip: req.ip,
        path: req.path,
      });

      res.status(429).json({
        error: 'Rate limit exceeded',
        message: options.message,
      });
    },
  });
}

/**
 * Skip rate limiting for certain conditions
 * E.g., localhost in development, specific API keys
 */
export function createConditionalLimiter(
  limiter: any,
  skipCondition: (req: any) => boolean
) {
  return (req: any, res: any, next: any) => {
    if (skipCondition(req)) {
      logger.debug('Rate limiting skipped', {
        path: req.path,
        reason: 'skip condition met',
      });
      return next();
    }

    return limiter(req, res, next);
  };
}

/**
 * Skip rate limiting for localhost in development
 */
export function skipLocalhost(req: any): boolean {
  const isLocalhost =
    req.ip === '127.0.0.1' ||
    req.ip === '::1' ||
    req.ip === 'localhost' ||
    req.hostname === 'localhost';

  return process.env.NODE_ENV !== 'production' && isLocalhost;
}

/**
 * Export all rate limiters
 */
export default {
  apiLimiter,
  botControlLimiter,
  strictLimiter,
  readLimiter,
  healthCheckLimiter,
  createRateLimiter,
  createConditionalLimiter,
  skipLocalhost,
};
