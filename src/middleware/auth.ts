/**
 * Authentication Middleware
 * Handles JWT token generation and validation
 */

import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';
import { CONFIG } from '../config.js';

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
