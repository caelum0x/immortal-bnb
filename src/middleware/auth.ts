/**
 * Enhanced Authentication Middleware
 * Handles JWT token generation, validation, and API key management
 */

import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';
import { CONFIG } from '../config.js';
import { getSecret, hashSecret, verifySecret } from '../config/secrets.js';
import { prisma } from '../db/client.js';

const JWT_SECRET = process.env.JWT_SECRET || 'immortal-ai-trading-bot-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

export interface AuthPayload {
  userId: string;
  walletAddress: string;
  role: 'user' | 'admin';
}

export function generateToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): AuthPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthPayload;
  } catch (error) {
    logger.error('Token verification failed:', error);
    return null;
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized', message: 'No authorization header' });
    }

    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
    const payload = verifyToken(token);

    if (!payload) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Invalid token' });
    }

    (req as any).user = payload;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

/**
 * API Key authentication middleware
 */
export async function requireApiKey(req: Request, res: Response, next: NextFunction) {
  try {
    const apiKey = req.headers['x-api-key'] as string;
    if (!apiKey) {
      return res.status(401).json({ error: 'Unauthorized', message: 'API key required' });
    }

    // Check database for API key
    const keyHash = hashSecret(apiKey);
    const apiKeyRecord = await prisma.apiKey.findUnique({
      where: { keyHash },
    });

    if (!apiKeyRecord || apiKeyRecord.revoked) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Invalid API key' });
    }

    // Check expiration
    if (apiKeyRecord.expiresAt && apiKeyRecord.expiresAt < new Date()) {
      return res.status(401).json({ error: 'Unauthorized', message: 'API key expired' });
    }

    // Update last used
    await prisma.apiKey.update({
      where: { id: apiKeyRecord.id },
      data: { lastUsedAt: new Date() },
    });

    (req as any).apiKey = apiKeyRecord;
    next();
  } catch (error) {
    logger.error('API key authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
}

/**
 * Optional API key (for rate limiting differentiation)
 */
export async function optionalApiKey(req: Request, res: Response, next: NextFunction) {
  try {
    const apiKey = req.headers['x-api-key'] as string;
    if (apiKey) {
      const keyHash = hashSecret(apiKey);
      const apiKeyRecord = await prisma.apiKey.findUnique({
        where: { keyHash },
      });

      if (apiKeyRecord && !apiKeyRecord.revoked) {
        (req as any).apiKey = apiKeyRecord;
      }
    }
    next();
  } catch (error) {
    // Continue without API key
    next();
  }
}

/**
 * IP whitelist middleware
 */
export function restrictToIPs(allowedIPs: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const clientIP = req.ip || req.socket.remoteAddress;
    if (!allowedIPs.includes(clientIP || '')) {
      logger.warn(`IP ${clientIP} attempted to access restricted endpoint`);
      return res.status(403).json({ error: 'Forbidden', message: 'IP not allowed' });
    }
    next();
  };
}

/**
 * Combine multiple auth methods
 */
export function combineAuth(...middlewares: Array<(req: Request, res: Response, next: NextFunction) => void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    let currentIndex = 0;

    const runNext = () => {
      if (currentIndex < middlewares.length) {
        const middleware = middlewares[currentIndex++];
        middleware(req, res, (err?: any) => {
          if (err) {
            return next(err);
          }
          if (res.headersSent) {
            return;
          }
          runNext();
        });
      } else {
        next();
      }
    };

    runNext();
  };
}

export async function login(req: Request, res: Response) {
  try {
    const { walletAddress } = req.body;
    if (!walletAddress) {
      return res.status(400).json({ error: 'Wallet address required' });
    }

    const payload: AuthPayload = {
      userId: walletAddress,
      walletAddress,
      role: 'user',
    };

    const token = generateToken(payload);
    res.json({ token, expiresIn: JWT_EXPIRES_IN, user: payload });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
}

/**
 * Generate API key
 */
export async function generateApiKey(name: string, permissions: string[] = [], expiresInDays?: number) {
  const crypto = await import('crypto');
  const apiKey = crypto.randomBytes(32).toString('hex');
  const keyHash = hashSecret(apiKey);

  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
    : null;

  const record = await prisma.apiKey.create({
    data: {
      name,
      keyHash,
      permissions,
      expiresAt,
    },
  });

  // Return the plain API key only once (for user to save)
  return { apiKey, id: record.id, name: record.name };
}

/**
 * Get API key info (without the key itself)
 */
export async function getApiKey(id: string) {
  return prisma.apiKey.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      permissions: true,
      rateLimit: true,
      lastUsedAt: true,
      expiresAt: true,
      revoked: true,
      createdAt: true,
    },
  });
}
