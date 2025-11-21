/**
 * Rate Limiting Middleware
 * Prevents abuse and DDoS attacks
 */

import rateLimit from 'express-rate-limit';
import { logger } from '../utils/logger.js';

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    error: 'Too many requests',
    message: 'Please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: Math.ceil((Date.now() + 60000) / 1000), // Default 60 seconds
    });
  },
});

// Strict rate limiter for sensitive operations
export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    error: 'Too many requests',
    message: 'Too many requests from this IP',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth endpoints rate limiter
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    error: 'Too many login attempts',
    message: 'Please wait before trying again',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Trading operations rate limiter
export const tradingLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: {
    error: 'Trading rate limit exceeded',
    message: 'Maximum 10 trades per minute',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Read operations rate limiter (more permissive)
export const readLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: {
    error: 'Too many requests',
    message: 'Rate limit exceeded',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Bot control operations rate limiter
export const botControlLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 start/stop operations per minute
  message: {
    error: 'Too many bot control requests',
    message: 'Please wait before trying again',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Health check rate limiter (very permissive)
export const healthCheckLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 health checks per minute
  message: {
    error: 'Too many health check requests',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
