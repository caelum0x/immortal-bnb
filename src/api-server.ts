/**
 * Backend API Server for Immortal AI Trading Bot Frontend
 * Express server that exposes bot controls and data
 */

import express from 'express';
import cors from 'cors';
import { logger } from './utils/logger';
import { fetchAllMemories, fetchMemory } from './blockchain/memoryStorage';
import { getTrendingTokens } from './data/marketFetcher';
import { CONFIG } from './config';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Global state for bot control
let botRunning = false;
let currentWatchlist: string[] = [];
let riskLevel: number = 5;

/**
 * POST /api/start-bot
 * Start the trading bot with user parameters
 */
app.post('/api/start-bot', async (req, res) => {
  try {
    const { tokens, risk } = req.body;

    if (!tokens || !Array.isArray(tokens)) {
      return res.status(400).json({ error: 'tokens must be an array' });
    }

    if (!risk || risk < 1 || risk > 10) {
      return res.status(400).json({ error: 'risk must be between 1-10' });
    }

    currentWatchlist = tokens;
    riskLevel = risk;
    botRunning = true;

    logger.info(`Bot started via API - Tokens: ${tokens.length}, Risk: ${risk}`);

    res.json({
      status: 'started',
      message: 'Bot is now running',
      config: {
        tokens: currentWatchlist,
        riskLevel,
        interval: CONFIG.BOT_LOOP_INTERVAL_MS
      }
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
    botRunning = false;
    logger.info('Bot stopped via API');

    res.json({
      status: 'stopped',
      message: 'Bot has been stopped'
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
    res.json({
      running: botRunning,
      watchlist: currentWatchlist,
      riskLevel,
      config: {
        maxTradeAmount: CONFIG.MAX_TRADE_AMOUNT_BNB,
        stopLoss: CONFIG.STOP_LOSS_PERCENTAGE,
        network: CONFIG.NETWORK
      }
    });
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
 * GET /api/trading-stats
 * Get trading statistics
 */
app.get('/api/trading-stats', async (req, res) => {
  try {
    const memoryIds = await fetchAllMemories();
    const memories = await Promise.all(
      memoryIds.map(id => fetchMemory(id))
    );

    const completedTrades = memories.filter(m => m && m.outcome !== 'pending');
    const profitableTrades = completedTrades.filter(m => m!.outcome === 'profit');
    const totalPL = completedTrades.reduce((sum, m) => sum + (m!.profitLoss || 0), 0);

    res.json({
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
    });
  } catch (error) {
    logger.error(`API /trading-stats error: ${(error as Error).message}`);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * Health check
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

/**
 * Start Express server
 */
export function startAPIServer() {
  app.listen(PORT, () => {
    logger.info(`🌐 API Server running on http://localhost:${PORT}`);
    logger.info(`📊 Dashboard: Connect frontend to this server`);
  });
}

export { app, botRunning, currentWatchlist, riskLevel };
