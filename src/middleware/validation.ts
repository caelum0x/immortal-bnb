/**
 * Request Validation Middleware
 * Validates all incoming API requests using express-validator
 */

import { body, query, validationResult, ValidationChain } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Middleware to handle validation errors
 */
export function handleValidationErrors(
  req: Request,
  res: Response,
  next: NextFunction
): void | Response {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    logger.warn('Validation failed:', {
      path: req.path,
      errors: errors.array(),
    });

    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map((err) => ({
        field: 'path' in err ? err.path : 'unknown',
        message: err.msg,
        value: 'value' in err ? err.value : undefined,
      })),
    });
  }

  next();
}

/**
 * Validates Ethereum address format
 */
const isEthereumAddress = (value: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(value);
};

/**
 * Validation rules for POST /api/start-bot
 */
export const validateStartBot: ValidationChain[] = [
  body('tokens')
    .isArray({ min: 0, max: 10 })
    .withMessage('Tokens must be an array with maximum 10 addresses'),

  body('tokens.*')
    .custom((value) => {
      if (!value || value === '') {
        // Empty strings are allowed (will be filtered out)
        return true;
      }
      if (!isEthereumAddress(value)) {
        throw new Error('Invalid Ethereum address format');
      }
      return true;
    })
    .withMessage('Each token must be a valid Ethereum address (0x + 40 hex chars)'),

  body('risk')
    .isInt({ min: 1, max: 10 })
    .withMessage('Risk level must be an integer between 1 and 10'),
];

/**
 * Validation rules for GET /api/trade-logs
 */
export const validateTradeLogsQuery: ValidationChain[] = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be an integer between 1 and 100')
    .toInt(), // Convert string to number
];

/**
 * Validation rules for GET /api/memories
 */
export const validateMemoriesQuery: ValidationChain[] = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be an integer between 1 and 100')
    .toInt(),
];

/**
 * Validation rules for GET /api/discover-tokens
 */
export const validateDiscoverTokensQuery: ValidationChain[] = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be an integer between 1 and 50')
    .toInt(),
];

/**
 * General request sanitization
 * Strips dangerous characters and prevents XSS
 */
export function sanitizeRequest(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Sanitize query parameters
  if (req.query) {
    for (const key in req.query) {
      if (typeof req.query[key] === 'string') {
        // Remove potential script tags and dangerous characters
        req.query[key] = (req.query[key] as string)
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .trim();
      }
    }
  }

  // Sanitize body parameters
  if (req.body && typeof req.body === 'object') {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key]
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .trim();
      }
    }
  }

  next();
}

/**
 * Validate and sanitize token addresses array
 */
export function validateAndSanitizeTokens(tokens: string[]): string[] {
  if (!Array.isArray(tokens)) {
    return [];
  }

  return tokens
    .filter((token) => token && token.trim() !== '') // Remove empty strings
    .filter((token) => isEthereumAddress(token)) // Only valid addresses
    .map((token) => token.toLowerCase()); // Normalize to lowercase
}

/**
 * Export all validations for easy import
 */
export default {
  validateStartBot,
  validateTradeLogsQuery,
  validateMemoriesQuery,
  validateDiscoverTokensQuery,
  handleValidationErrors,
  sanitizeRequest,
  validateAndSanitizeTokens,
};
