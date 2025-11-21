/**
 * Input Validation Middleware
 * Validates and sanitizes user input
 */

import { body, param, query, validationResult } from 'express-validator';
import type { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

// Validation error handler
export function handleValidationErrors(req: Request, res: Response, next: NextFunction) {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    logger.warn('Validation errors:', errors.array());
    return res.status(400).json({
      error: 'Validation failed',
      errors: errors.array(),
    });
  }
  
  next();
}

// Common validations
export const validateWalletAddress = body('walletAddress')
  .trim()
  .isLength({ min: 42, max: 42 })
  .withMessage('Invalid wallet address format');

export const validateTokenAddress = param('address')
  .trim()
  .isLength({ min: 42, max: 42 })
  .withMessage('Invalid token address');

export const validateAmount = body('amount')
  .isFloat({ min: 0 })
  .withMessage('Amount must be a positive number');

export const validateConfidence = body('confidence')
  .optional()
  .isFloat({ min: 0, max: 1 })
  .withMessage('Confidence must be between 0 and 1');

export const validateLimit = query('limit')
  .optional()
  .isInt({ min: 1, max: 100 })
  .withMessage('Limit must be between 1 and 100');

export const validatePlatform = body('platform')
  .optional()
  .isIn(['pancakeswap', 'polymarket', 'cross-chain'])
  .withMessage('Invalid platform');

export const validateChain = body('chain')
  .optional()
  .isIn(['bnb', 'opbnb', 'polygon'])
  .withMessage('Invalid chain');

// Trading decision validation
export const validateTradingDecision = [
  body('platform').isIn(['dex', 'polymarket', 'cross-chain']),
  body('urgency').optional().isIn(['low', 'medium', 'high']),
  body('requiresResearch').optional().isBoolean(),
  handleValidationErrors,
];

// Memory query validation
export const validateMemoryQuery = [
  body('platform').optional().isIn(['pancakeswap', 'polymarket', 'cross-chain']),
  body('chain').optional().isIn(['bnb', 'opbnb', 'polygon']),
  body('limit').optional().isInt({ min: 1, max: 1000 }),
  body('offset').optional().isInt({ min: 0 }),
  handleValidationErrors,
];

// Trade execution validation
export const validateTradeExecution = [
  body('market_id').optional().isString(),
  body('side').isIn(['BUY', 'SELL']),
  body('amount').isFloat({ min: 0.01 }),
  handleValidationErrors,
];

// Start bot validation
export const validateStartBot = [
  body('tokens').isArray().withMessage('Tokens must be an array'),
  body('tokens.*').optional().isString().isLength({ min: 42, max: 42 }),
  body('risk').optional().isIn(['low', 'medium', 'high']),
  handleValidationErrors,
];

// Trade logs query validation
export const validateTradeLogsQuery = [
  query('limit').optional().isInt({ min: 1, max: 1000 }),
  query('offset').optional().isInt({ min: 0 }),
  query('tokenAddress').optional().isString().isLength({ min: 42, max: 42 }),
  handleValidationErrors,
];

// Memories query validation (alias for validateMemoryQuery)
export const validateMemoriesQuery = validateMemoryQuery;

// Discover tokens query validation
export const validateDiscoverTokensQuery = [
  query('limit').optional().isInt({ min: 1, max: 100 }),
  handleValidationErrors,
];

// Request sanitization middleware
export function sanitizeRequest(req: Request, res: Response, next: NextFunction) {
  // Basic XSS protection - sanitize string inputs
  if (req.body && typeof req.body === 'object') {
    const sanitize = (obj: any): any => {
      if (typeof obj === 'string') {
        // Remove potentially dangerous characters
        return obj.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      }
      if (Array.isArray(obj)) {
        return obj.map(sanitize);
      }
      if (obj && typeof obj === 'object') {
        const sanitized: any = {};
        for (const key in obj) {
          sanitized[key] = sanitize(obj[key]);
        }
        return sanitized;
      }
      return obj;
    };
    req.body = sanitize(req.body);
  }
  next();
}
