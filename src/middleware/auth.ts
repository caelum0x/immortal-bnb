/**
 * Authentication Middleware
 * Provides API key authentication for securing backend endpoints
 */

import type { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { randomBytes } from 'crypto';

/**
 * Generate a secure API key (run once and save to .env)
 */
export function generateApiKey(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Get API key from environment
 * If not set, generate a new one and warn (development only)
 */
export function getApiKey(): string {
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('API_KEY must be set in production environment');
    }

    // Development: generate and log a warning
    const generatedKey = generateApiKey();
    logger.warn('⚠️  API_KEY not set in .env - using generated key for development');
    logger.warn(`Add this to your .env file: API_KEY=${generatedKey}`);
    return generatedKey;
  }

  return apiKey;
}

/**
 * Middleware to require API key authentication
 * Checks for X-API-Key header
 */
export function requireApiKey(req: Request, res: Response, next: NextFunction): void | Response {
  const providedKey = req.headers['x-api-key'];
  const validKey = getApiKey();

  // Log authentication attempt
  logger.debug('API key authentication attempt', {
    path: req.path,
    method: req.method,
    hasKey: !!providedKey,
  });

  // Check if key is provided
  if (!providedKey) {
    logger.warn('API key missing', {
      path: req.path,
      ip: req.ip,
    });

    return res.status(401).json({
      error: 'Unauthorized',
      message: 'API key required. Please provide X-API-Key header.',
    });
  }

  // Check if key is valid
  if (providedKey !== validKey) {
    logger.warn('Invalid API key attempt', {
      path: req.path,
      ip: req.ip,
    });

    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid API key',
    });
  }

  // Success
  logger.debug('API key authenticated successfully', {
    path: req.path,
  });

  next();
}

/**
 * Optional API key authentication (allows requests without key but logs them)
 * Useful for public endpoints that you want to monitor
 */
export function optionalApiKey(req: Request, res: Response, next: NextFunction): void {
  const providedKey = req.headers['x-api-key'];
  const validKey = getApiKey();

  if (!providedKey) {
    logger.info('Public endpoint access (no API key)', {
      path: req.path,
      ip: req.ip,
    });
  } else if (providedKey === validKey) {
    logger.debug('Authenticated access to public endpoint', {
      path: req.path,
    });
  } else {
    logger.warn('Invalid API key on public endpoint', {
      path: req.path,
      ip: req.ip,
    });
  }

  next();
}

/**
 * Middleware to restrict access by IP address
 * Useful for admin endpoints or high-security operations
 */
export function restrictToIPs(allowedIPs: string[]) {
  return function (req: Request, res: Response, next: NextFunction): void | Response {
    const clientIP = req.ip || req.socket.remoteAddress || '';

    logger.debug('IP restriction check', {
      clientIP,
      allowedIPs,
      path: req.path,
    });

    // Check if IP is in allowed list
    const isAllowed = allowedIPs.some((allowedIP) => {
      // Support CIDR notation or exact match
      if (allowedIP.includes('/')) {
        // TODO: Implement CIDR checking if needed
        return false;
      }
      return clientIP === allowedIP || clientIP.endsWith(allowedIP);
    });

    if (!isAllowed) {
      logger.warn('IP restriction: access denied', {
        clientIP,
        path: req.path,
      });

      return res.status(403).json({
        error: 'Forbidden',
        message: 'Access denied from your IP address',
      });
    }

    next();
  };
}

/**
 * Combine multiple auth middlewares
 * Example: combine API key + IP restriction
 */
type AuthMiddleware = (req: Request, res: Response, next: NextFunction) => void;

export function combineAuth(...middlewares: AuthMiddleware[]) {
  return function (req: Request, res: Response, next: NextFunction): void {
    let index = 0;

    const runNext = (): void => {
      if (index < middlewares.length) {
        const middleware = middlewares[index++];
        if (middleware) {
          middleware(req, res, runNext);
        }
      } else {
        next();
      }
    };

    runNext();
  };
}

export default {
  generateApiKey,
  getApiKey,
  requireApiKey,
  optionalApiKey,
  restrictToIPs,
  combineAuth,
};
