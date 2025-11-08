/**
 * Production API Server for Immortal AI Trading Bot Frontend
 * Express server with bot state management integration
 */

import express from 'express';
import cors from 'cors';
import { logger } from './utils/logger';
import { fetchAllMemories, fetchMemory } from './blockchain/memoryStorage';
import { getTrendingTokens } from './data/marketFetcher';
import { CONFIG } from './config';
import { BotState } from './bot-state';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

/**
 * POST /api/start-bot
 * Start the trading bot with user parameters
 */
app.post('/api/start-bot', async (req, res) => {
  try {
    const { tokens, risk } = req.body;

    // Validation
    if (!Array.isArray(tokens)) {
      return res.status(400).json({ error: 'tokens must be an array' });
    }

    if (typeof risk !== 'number' || risk < 1 || risk > 10) {
      return res.status(400).json({ error: 'risk must be a number between 1-10' });
    }

    // Check if already running
    if (BotState.isRunning()) {
      return res.status(400).json({ error: 'Bot is already running' });
    }

    // Start bot with BotState
    BotState.start({
      tokens,
      riskLevel: risk,
      maxTradeAmount: parseFloat(CONFIG.MAX_TRADE_AMOUNT_BNB),
      stopLoss: parseFloat(CONFIG.STOP_LOSS_PERCENTAGE),
      interval: parseInt(CONFIG.BOT_LOOP_INTERVAL_MS),
      network: CONFIG.NETWORK as 'testnet' | 'mainnet',
    });

    logger.info(`✅ Bot started via API - Tokens: ${tokens.length}, Risk: ${risk}`);

    res.json({
      status: 'started',
      message: 'Bot is now running',
      config: {
        tokens,
        riskLevel: risk,
        interval: parseInt(CONFIG.BOT_LOOP_INTERVAL_MS),
      },
    });
  } catch (error) {
    logger.error(`API /start-bot error: ${(error as Error).message}`);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * POST /api/stop-bot
 * Stop the trading bot
 */
app.post('/api/stop-bot', async (req, res) => {
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
 */
app.get('/api/bot-status', async (req, res) => {
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
 */
app.get('/api/memories', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const memoryIds = await fetchAllMemories();

    const memories = await Promise.all(
      memoryIds.slice(-limit).map(async (id) => {
        const memory = await fetchMemory(id);
        return memory;
      })
    );

    const validMemories = memories.filter(m => m !== null);

    res.json({
      total: memoryIds.length,
      memories: validMemories,
      message: validMemories.length === 0 ? 'No memories yet - start trading!' : undefined
    });
  } catch (error) {
    logger.error(`API /memories error: ${(error as Error).message}`);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * GET /api/discover-tokens
 * Get trending tokens from DexScreener
 */
app.get('/api/discover-tokens', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const trending = await getTrendingTokens(limit);

    res.json({
      tokens: trending,
      timestamp: Date.now(),
      source: 'DexScreener'
    });
  } catch (error) {
    logger.error(`API /discover-tokens error: ${(error as Error).message}`);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * GET /api/trade-logs
 * Get recent trade logs
 */
app.get('/api/trade-logs', async (req, res) => {
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
});

/**
 * GET /api/trading-stats
 * Get trading statistics
 */
app.get('/api/trading-stats', async (req, res) => {
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
 */
app.get('/health', (req, res) => {
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
