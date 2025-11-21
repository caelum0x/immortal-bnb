/**
 * Secret Management
 * Provides secure access to secrets with rotation support
 */

import { logger } from '../utils/logger';
import crypto from 'crypto';

// In-memory cache for secrets (in production, use AWS Secrets Manager, HashiCorp Vault, etc.)
const secretCache = new Map<string, { value: string; expiresAt: number }>();

/**
 * Get secret value
 * In production, this would fetch from a secret manager
 */
export function getSecret(key: string): string {
  // Check cache first
  const cached = secretCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  // Fallback to environment variable
  const value = process.env[key];
  if (!value) {
    throw new Error(`Secret ${key} not found`);
  }

  // Cache for 1 hour
  secretCache.set(key, {
    value,
    expiresAt: Date.now() + 60 * 60 * 1000,
  });

  return value;
}

/**
 * Rotate secret (for API keys, etc.)
 */
export function rotateSecret(key: string, newValue: string): void {
  secretCache.set(key, {
    value: newValue,
    expiresAt: Date.now() + 60 * 60 * 1000,
  });
  logger.info(`Secret ${key} rotated`);
}

/**
 * Generate secure random secret
 */
export function generateSecret(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Hash secret (for storage)
 */
export function hashSecret(secret: string): string {
  return crypto.createHash('sha256').update(secret).digest('hex');
}

/**
 * Verify secret against hash
 */
export function verifySecret(secret: string, hash: string): boolean {
  const secretHash = hashSecret(secret);
  return crypto.timingSafeEqual(
    Buffer.from(secretHash),
    Buffer.from(hash)
  );
}

/**
 * Never log secrets
 */
export function sanitizeForLogging(data: any): any {
  const sensitiveKeys = [
    'password',
    'privateKey',
    'apiKey',
    'secret',
    'token',
    'wallet',
  ];

  const sanitized = { ...data };
  for (const key of Object.keys(sanitized)) {
    if (
      sensitiveKeys.some((sk) =>
        key.toLowerCase().includes(sk.toLowerCase())
      )
    ) {
      sanitized[key] = '***REDACTED***';
    } else if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizeForLogging(sanitized[key]);
    }
  }

  return sanitized;
}

