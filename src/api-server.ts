/**
 * Production API Server for Immortal AI Trading Bot Frontend
 * Express server with bot state management, validation, auth, and rate limiting
 */

import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import { logger } from './utils/logger';
import { fetchAllMemories, fetchMemory } from './blockchain/memoryStorage';
import { getTrendingTokens } from './data/marketFetcher';
import { CONFIG } from './config';
import { BotState } from './bot-state';

// Import middleware
import {
  validateStartBot,
  validateTradeLogsQuery,
  validateMemoriesQuery,
  validateDiscoverTokensQuery,
  handleValidationErrors,
  sanitizeRequest,
} from './middleware/validation';

import {
  apiLimiter,
  botControlLimiter,
  readLimiter,
  healthCheckLimiter,
} from './middleware/rateLimiting';

// Note: API authentication is optional for now
// To enable: import { requireApiKey } from './middleware/auth';
// And add requireApiKey middleware to protected routes

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// Body parser
app.use(express.json());

// Request sanitization (XSS protection)
app.use(sanitizeRequest);

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

/**
 * POST /api/start-bot
 * Start the trading bot with user parameters
 * Protected with: validation, rate limiting
 */
app.post(
  '/api/start-bot',
  botControlLimiter,
  validateStartBot,
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const { tokens, risk } = req.body;

      // Filter out empty token addresses
      const validTokens = tokens.filter((t: string) => t && t.trim() !== '');

      // Check if already running
      if (BotState.isRunning()) {
        return res.status(400).json({ error: 'Bot is already running' });
      }

      // Start bot with BotState
      BotState.start({
        tokens: validTokens,
        riskLevel: risk,
        maxTradeAmount: CONFIG.MAX_TRADE_AMOUNT_BNB,
        stopLoss: CONFIG.STOP_LOSS_PERCENTAGE,
        interval: CONFIG.BOT_LOOP_INTERVAL_MS,
        network: CONFIG.NETWORK as 'testnet' | 'mainnet',
      });

      logger.info(`✅ Bot started via API`, {
        tokenCount: validTokens.length,
        risk,
        network: CONFIG.NETWORK,
      });

      res.json({
        status: 'started',
        message: 'Bot is now running',
        config: {
          tokens: validTokens,
          riskLevel: risk,
          interval: CONFIG.BOT_LOOP_INTERVAL_MS,
          maxTradeAmount: CONFIG.MAX_TRADE_AMOUNT_BNB,
          stopLoss: CONFIG.STOP_LOSS_PERCENTAGE,
          network: CONFIG.NETWORK,
        },
      });
    } catch (error) {
      logger.error(`API /start-bot error`, {
        error: (error as Error).message,
        stack: (error as Error).stack,
      });
      res.status(500).json({ error: (error as Error).message });
    }
  }
);

/**
 * POST /api/stop-bot
 * Stop the trading bot
 * Protected with: rate limiting
 */
app.post('/api/stop-bot', botControlLimiter, async (req: Request, res: Response) => {
  try {
    if (!BotState.isRunning()) {
      return res.status(400).json({ error: 'Bot is not running' });
    }

    BotState.stop();
    logger.info('🛑 Bot stopped via API');

    res.json({
      status: 'stopped',
      message: 'Bot has been stopped',
    });
  } catch (error) {
    logger.error(`API /stop-bot error: ${(error as Error).message}`);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * GET /api/bot-status
 * Get current bot status
 * Protected with: read rate limiting
 */
app.get('/api/bot-status', readLimiter, async (req: Request, res: Response) => {
  try {
    const status = BotState.getStatus();
    res.json(status);
  } catch (error) {
    logger.error(`API /bot-status error: ${(error as Error).message}`);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * GET /api/memories
 * Get all stored trading memories from Greenfield
 * Protected with: validation, read rate limiting
 */
app.get(
  '/api/memories',
  readLimiter,
  validateMemoriesQuery,
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const memoryIds = await fetchAllMemories();

      const memories = await Promise.all(
        memoryIds.slice(-limit).map(async (id) => {
          const memory = await fetchMemory(id);
          return memory;
        })
      );

      const validMemories = memories.filter((m) => m !== null);

      res.json({
        total: memoryIds.length,
        memories: validMemories,
        message: validMemories.length === 0 ? 'No memories yet - start trading!' : undefined,
      });
    } catch (error) {
      logger.error(`API /memories error: ${(error as Error).message}`);
      res.status(500).json({ error: (error as Error).message });
    }
  }
);

/**
 * GET /api/discover-tokens
 * Get trending tokens from DexScreener
 * Protected with: validation, read rate limiting
 */
app.get(
  '/api/discover-tokens',
  readLimiter,
  validateDiscoverTokensQuery,
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const trending = await getTrendingTokens(limit);

      res.json({
        tokens: trending,
        timestamp: Date.now(),
        source: 'DexScreener',
      });
    } catch (error) {
      logger.error(`API /discover-tokens error: ${(error as Error).message}`);
      res.status(500).json({ error: (error as Error).message });
    }
  }
);

/**
 * GET /api/trade-logs
 * Get recent trade logs
 * Protected with: validation, read rate limiting
 */
app.get(
  '/api/trade-logs',
  readLimiter,
  validateTradeLogsQuery,
  handleValidationErrors,
  async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const logs = BotState.getTradeLogs(limit);

      res.json({
        total: logs.length,
        logs,
      });
    } catch (error) {
      logger.error(`API /trade-logs error: ${(error as Error).message}`);
      res.status(500).json({ error: (error as Error).message });
    }
  }
);

/**
 * GET /api/trading-stats
 * Get trading statistics
 * Protected with: read rate limiting
 */
app.get('/api/trading-stats', readLimiter, async (req: Request, res: Response) => {
  try {
    // Get stats from BotState (real-time from current session)
    const stats = BotState.getStats();

    // Optionally also fetch from Greenfield for historical data
    try {
      const memoryIds = await fetchAllMemories();
      const memories = await Promise.all(
        memoryIds.map(id => fetchMemory(id))
      );

      const completedTrades = memories.filter(m => m && m.outcome !== 'pending');
      const profitableTrades = completedTrades.filter(m => m!.outcome === 'profit');
      const totalPL = completedTrades.reduce((sum, m) => sum + (m!.profitLoss || 0), 0);

      // Merge with historical data
      const historicalStats = {
        totalTrades: completedTrades.length,
        wins: profitableTrades.length,
        losses: completedTrades.length - profitableTrades.length,
        winRate: completedTrades.length > 0
          ? (profitableTrades.length / completedTrades.length) * 100
          : 0,
        totalPL,
        avgPL: completedTrades.length > 0
          ? totalPL / completedTrades.length
          : 0
      };

      // Return combined stats (current session + historical)
      res.json({
        ...historicalStats,
        currentSession: stats,
      });
    } catch (memoryError) {
      // If Greenfield fails, return only current session stats
      logger.warn('Failed to fetch historical stats from Greenfield:', memoryError);
      res.json(stats);
    }
  } catch (error) {
    logger.error(`API /trading-stats error: ${(error as Error).message}`);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * Health check
 * Protected with: health check rate limiting
 */
app.get('/health', healthCheckLimiter, (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    botRunning: BotState.isRunning(),
  });
});

/**
 * Start Express server
 */
export function startAPIServer() {
  app.listen(PORT, () => {
    logger.info(`🌐 API Server running on http://localhost:${PORT}`);
    logger.info(`📊 Dashboard: Connect frontend to this server`);
    logger.info(`📝 Available endpoints:`);
    logger.info(`   POST /api/start-bot`);
    logger.info(`   POST /api/stop-bot`);
    logger.info(`   GET  /api/bot-status`);
    logger.info(`   GET  /api/trade-logs`);
    logger.info(`   GET  /api/memories`);
    logger.info(`   GET  /api/discover-tokens`);
    logger.info(`   GET  /api/trading-stats`);
    logger.info(`   GET  /health`);
  });
}

export { app };
