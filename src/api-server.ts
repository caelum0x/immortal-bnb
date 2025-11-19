/**
 * Production API Server for Immortal AI Trading Bot Frontend
 * Express server with bot state management, validation, auth, and rate limiting
 */

import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import { logger } from './utils/logger';
import { structuredLogger, logWithContext, getCorrelationId, setCorrelationId, logErrorWithContext } from './monitoring/logging';
import { fetchAllMemories, fetchMemory } from './blockchain/memoryStorage';
import { getTrendingTokens } from './data/marketFetcher';
import { CONFIG } from './config';
import { BotState } from './bot-state';
import { metricsMiddleware, register } from './monitoring/metrics';
import { healthChecker } from './health/healthChecker';
import { initializeTracing, withSpan } from './monitoring/tracing';
import { cacheManager } from './cache/cacheManager';
import { tradeRepository } from './db/repositories/tradeRepository';
import { configRepository } from './db/repositories/configRepository';

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

// Initialize tracing in production
if (process.env.NODE_ENV === 'production' && process.env.ENABLE_TRACING !== 'false') {
  initializeTracing();
}

// Initialize Redis cache
if (process.env.REDIS_URL) {
  cacheManager.warmCache().catch((err) => {
    logger.warn('Cache warm-up failed:', err);
  });
}

// Correlation ID middleware
app.use((req, res, next) => {
  const correlationId = req.headers['x-correlation-id'] as string || getCorrelationId();
  setCorrelationId(correlationId);
  res.setHeader('X-Correlation-ID', correlationId);
  next();
});

// Metrics middleware (must be before routes)
app.use(metricsMiddleware);

// Structured request logging
app.use((req, res, next) => {
  logWithContext('info', `${req.method} ${req.path}`, {
    method: req.method,
    path: req.path,
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

      // Store bot state in database
      try {
        await configRepository.update({
          isRunning: true,
          riskLevel: risk,
          maxTradeAmount: CONFIG.MAX_TRADE_AMOUNT_BNB,
          stopLoss: CONFIG.STOP_LOSS_PERCENTAGE,
          interval: CONFIG.BOT_LOOP_INTERVAL_MS,
          network: CONFIG.NETWORK,
          watchlist: validTokens,
        });
      } catch (dbError) {
        logger.warn('Failed to store bot state in database:', dbError);
        // Continue - database is not critical for bot operation
      }

      logWithContext('info', 'Bot started via API', {
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
    
    // Update database
    try {
      await configRepository.setRunning(false);
    } catch (dbError) {
      logger.warn('Failed to update bot state in database:', dbError);
    }
    
    logWithContext('info', 'Bot stopped via API', {});

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
      
      // Try database first, fallback to BotState
      let logs;
      try {
        logs = await tradeRepository.query({
          limit,
          offset: parseInt(req.query.offset as string) || 0,
          tokenAddress: req.query.tokenAddress as string,
        });
      } catch (dbError) {
        // Fallback to BotState if database unavailable
        logger.warn('Database unavailable, using BotState:', dbError);
        logs = BotState.getTradeLogs(limit);
      }

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
 * GET /api/analytics
 * Get performance analytics with metrics
 * Protected with: read rate limiting
 */
app.get('/api/analytics', readLimiter, async (req: Request, res: Response) => {
  try {
    const timeframe = (req.query.timeframe as string) || '30d';

    // Calculate time filter
    const now = Date.now();
    let startTime = 0;

    switch (timeframe) {
      case '7d':
        startTime = now - (7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startTime = now - (30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startTime = now - (90 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
      default:
        startTime = 0;
    }

    // Fetch memories from Greenfield
    const memoryIds = await fetchAllMemories();
    const allMemories = await Promise.all(
      memoryIds.map(id => fetchMemory(id))
    );

    // Filter by timeframe and remove nulls
    const memories = allMemories.filter(m =>
      m !== null && m.timestamp >= startTime
    ) as any[];

    // Calculate analytics
    const completedTrades = memories.filter(m => m.outcome !== 'pending');
    const winningTrades = completedTrades.filter(m => m.outcome === 'profit');
    const losingTrades = completedTrades.filter(m => m.outcome === 'loss');
    const breakEvenTrades = completedTrades.filter(m =>
      m.profitLoss !== undefined && Math.abs(m.profitLoss) < 0.01
    );

    // Profit timeline
    const profitTimeline: { date: string; profit: number }[] = [];
    let cumulativeProfit = 0;

    completedTrades
      .sort((a, b) => a.timestamp - b.timestamp)
      .forEach(trade => {
        cumulativeProfit += (trade.profitLoss || 0);
        const dateStr = new Date(trade.timestamp).toISOString().split('T')[0];
        if (dateStr) {
          profitTimeline.push({ date: dateStr, profit: cumulativeProfit });
        }
      });

    // Trade distribution
    const tradeDistribution = {
      win: winningTrades.length,
      loss: losingTrades.length,
      breakeven: breakEvenTrades.length,
    };

    // Top performing tokens
    const tokenProfits = new Map<string, { profit: number; trades: number }>();
    completedTrades.forEach(trade => {
      const existing = tokenProfits.get(trade.tokenSymbol) || { profit: 0, trades: 0 };
      tokenProfits.set(trade.tokenSymbol, {
        profit: existing.profit + (trade.profitLoss || 0),
        trades: existing.trades + 1,
      });
    });

    const topTokens = Array.from(tokenProfits.entries())
      .map(([symbol, data]) => ({ symbol, ...data }))
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 10);

    // Performance metrics
    const totalPL = completedTrades.reduce((sum, t) => sum + (t.profitLoss || 0), 0);
    const wins = winningTrades.map(t => t.profitLoss || 0);
    const losses = losingTrades.map(t => Math.abs(t.profitLoss || 0));

    const avgWin = wins.length > 0 ? wins.reduce((a, b) => a + b, 0) / wins.length : 0;
    const avgLoss = losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / losses.length : 0;
    const winRate = completedTrades.length > 0
      ? (winningTrades.length / completedTrades.length) * 100
      : 0;

    const profitFactor = avgLoss > 0 ? avgWin / avgLoss : 0;

    // Calculate Sharpe Ratio (simplified)
    const returns = completedTrades.map(t => (t.profitLoss || 0));
    const avgReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0;
    const variance = returns.length > 0
      ? returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
      : 0;
    const stdDev = Math.sqrt(variance);
    const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) : 0;

    // Max drawdown
    let maxDrawdown = 0;
    let peak = 0;
    let runningPL = 0;

    completedTrades
      .sort((a, b) => a.timestamp - b.timestamp)
      .forEach(trade => {
        runningPL += trade.profitLoss || 0;
        if (runningPL > peak) peak = runningPL;
        const drawdown = ((peak - runningPL) / Math.max(peak, 1)) * 100;
        if (drawdown > maxDrawdown) maxDrawdown = drawdown;
      });

    const performanceMetrics = {
      totalReturn: totalPL,
      sharpeRatio,
      maxDrawdown,
      winRate,
      avgWin,
      avgLoss,
      profitFactor,
    };

    res.json({
      profitTimeline,
      tradeDistribution,
      topTokens,
      performanceMetrics,
    });

  } catch (error) {
    logger.error(`API /analytics error: ${(error as Error).message}`);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * GET /api/positions
 * Get active trading positions
 * Protected with: read rate limiting
 */
app.get('/api/positions', readLimiter, async (req: Request, res: Response) => {
  try {
    // Get positions from BotState
    const positions = BotState.getPositions();

    res.json({
      positions,
      total: positions.length,
      totalValue: positions.reduce((sum, p) => sum + p.value, 0),
      totalPnL: positions.reduce((sum, p) => sum + p.pnl, 0),
    });

  } catch (error) {
    logger.error(`API /positions error: ${(error as Error).message}`);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * POST /api/positions/:id/close
 * Close a specific position
 * Protected with: bot control rate limiting
 */
app.post('/api/positions/:id/close', botControlLimiter, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Close position via BotState
    const positionId = id || '';
    if (!positionId) {
      return res.status(400).json({ error: 'Position ID is required' });
    }
    const result = await BotState.closePosition(positionId);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    logger.info(`✅ Position ${id} closed via API`);

    res.json({
      success: true,
      message: 'Position closed successfully',
      positionId: id,
      trade: result.trade,
    });

  } catch (error) {
    logger.error(`API /positions/:id/close error: ${(error as Error).message}`);
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
    logger.info(`   GET  /api/analytics`);
    logger.info(`   GET  /api/positions`);
    logger.info(`   POST /api/positions/:id/close`);
    logger.info(`   GET  /health`);
  });
}

export { app };
