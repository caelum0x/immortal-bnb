/**
 * Production API Server for Immortal AI Trading Bot Frontend
 * Express server with bot state management, validation, auth, and rate limiting
 */

import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import http from 'http';
import path from 'path';
import { logger } from './utils/logger';
import { fetchAllMemories, fetchMemory } from './blockchain/memoryStorage';
import { getTrendingTokens } from './data/marketFetcher';
import { CONFIG } from './config';
import { BotState } from './bot-state';
import { wormholeService } from './crossChain/wormholeService';
import { ImmortalAIAgent } from './ai/immortalAgent';
import { saveConfig, loadConfig, appendToConfig, getConfigOrDefault } from './utils/configStorage';
import { WebSocketManager } from './services/webSocketManager';
import { PolymarketAgentOrchestrator } from './services/polymarketAgentOrchestrator';
import { polymarketService } from './services/polymarketService';
import { clobClient } from './services/clobClient';
import { initializeContractService, getContractService } from './services/contractService';
import { metricsService } from './services/metricsService';

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

// Initialize AI Agent singleton
let aiAgent: ImmortalAIAgent | null = null;
async function getAIAgent(): Promise<ImmortalAIAgent> {
  if (!aiAgent) {
    aiAgent = new ImmortalAIAgent();
    await aiAgent.loadMemories();
  }
  return aiAgent;
}

// Initialize WebSocket Manager (global singleton)
export const webSocketManager = new WebSocketManager();

// Initialize Polymarket Agent Orchestrator (global singleton)
const agentsPath = path.join(process.cwd(), 'agents');
export const polymarketOrchestrator = new PolymarketAgentOrchestrator({
  agentsPath,
  maxTradeAmount: CONFIG.MAX_TRADE_AMOUNT_BNB || 1.0,
  minConfidence: 0.7,
});

// Wire Polymarket agent events to WebSocket notifications
polymarketOrchestrator.on('decision', (decision) => {
  logger.info(`🤖 Polymarket AI Decision: ${decision.action} ${decision.market}`);
  webSocketManager.sendAIDecisionNotification({
    id: decision.id,
    timestamp: decision.timestamp,
    action: decision.action,
    market: decision.market,
    confidence: decision.confidence,
    reasoning: decision.reasoning,
  });
});

polymarketOrchestrator.on('trade', async (trade) => {
  logger.info(`💰 Polymarket Trade Executed: ${trade.action} ${trade.market} - P/L: ${trade.profitLoss}`);

  // Send WebSocket notification
  webSocketManager.sendTradeNotification({
    id: trade.id,
    timestamp: trade.timestamp,
    type: 'polymarket',
    token: trade.market,
    action: trade.action,
    amount: trade.amount,
    profit: trade.profitLoss,
    txHash: trade.transactionHash,
  });

  // Send Telegram notification if enabled
  try {
    const telegramConfig = await loadConfig<any>('telegram');
    if (telegramConfig?.enabled && telegramConfig.notifications?.trades) {
      const profitEmoji = trade.profitLoss > 0 ? '💚' : '❌';
      const message = `${profitEmoji} *Polymarket Trade*\n\n` +
        `Market: ${trade.market}\n` +
        `Action: ${trade.action.toUpperCase()}\n` +
        `Amount: ${trade.amount} USDC\n` +
        `P/L: ${trade.profitLoss > 0 ? '+' : ''}${trade.profitLoss.toFixed(2)} USDC\n` +
        `Time: ${new Date(trade.timestamp).toLocaleString()}`;

      await fetch(`https://api.telegram.org/bot${telegramConfig.botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: telegramConfig.chatId,
          text: message,
          parse_mode: 'Markdown',
        }),
      });

      await appendToConfig('telegram_messages', {
        id: `msg_${Date.now()}`,
        timestamp: Date.now(),
        type: 'trade',
        message,
        status: 'sent',
      });

      webSocketManager.sendTelegramNotification({
        id: `tg_${Date.now()}`,
        timestamp: Date.now(),
        type: 'trade',
        message,
        status: 'sent',
      });
    }
  } catch (error) {
    logger.warn('Failed to send Telegram notification:', error);
  }
});

polymarketOrchestrator.on('started', () => {
  logger.info('🚀 Polymarket Agent Started');
  webSocketManager.sendNotification({
    type: 'info',
    title: 'Agent Started',
    message: 'Polymarket trading agent is now running',
    timestamp: Date.now(),
  });
});

polymarketOrchestrator.on('stopped', () => {
  logger.info('🛑 Polymarket Agent Stopped');
  webSocketManager.sendNotification({
    type: 'info',
    title: 'Agent Stopped',
    message: 'Polymarket trading agent has been stopped',
    timestamp: Date.now(),
  });
});

// ============================================================================
// Initialize Smart Contract Service
// ============================================================================
let contractService: ReturnType<typeof getContractService> | null = null;

try {
  const rpcUrl = process.env.OPBNB_RPC || process.env.BNB_MAINNET_RPC || 'https://bsc-dataseed.bnbchain.org';
  const network = process.env.CONTRACT_NETWORK || 'bsc';

  contractService = initializeContractService({
    tokenAddress: process.env.IMMBOT_TOKEN_CONTRACT,
    stakingAddress: process.env.STAKING_CONTRACT,
    arbitrageAddress: process.env.FLASH_LOAN_ARBITRAGE_CONTRACT,
    rpcUrl,
    network,
    privateKey: process.env.WALLET_PRIVATE_KEY, // Optional - only needed for transactions
  });

  logger.info('✅ Smart Contract Service initialized', {
    network,
    hasWallet: !!process.env.WALLET_PRIVATE_KEY,
    tokenContract: process.env.IMMBOT_TOKEN_CONTRACT || 'not configured',
    stakingContract: process.env.STAKING_CONTRACT || 'not configured',
    arbitrageContract: process.env.FLASH_LOAN_ARBITRAGE_CONTRACT || 'not configured',
  });
} catch (error) {
  logger.warn('⚠️  Smart Contract Service not initialized:', (error as Error).message);
  logger.warn('   Contract endpoints will return 503. Configure contracts in .env to enable.');
}

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

// Prometheus metrics tracking
app.use(metricsService.trackHttp);

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
      const { tokens, risk, botType = 'all', maxTradeAmount } = req.body;

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
        maxTradeAmount: maxTradeAmount || CONFIG.MAX_TRADE_AMOUNT_BNB,
        stopLoss: CONFIG.STOP_LOSS_PERCENTAGE,
        interval: CONFIG.BOT_LOOP_INTERVAL_MS,
        network: CONFIG.NETWORK as 'testnet' | 'mainnet',
      });

      logger.info(`✅ Bot started via API`, {
        botType,
        tokenCount: validTokens.length,
        risk,
        network: CONFIG.NETWORK,
      });

      res.json({
        status: 'started',
        message: `${botType === 'all' ? 'Trading bot' : botType.toUpperCase() + ' bot'} is now running`,
        config: {
          botType,
          tokens: validTokens,
          riskLevel: risk,
          interval: CONFIG.BOT_LOOP_INTERVAL_MS,
          maxTradeAmount: maxTradeAmount || CONFIG.MAX_TRADE_AMOUNT_BNB,
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
 * Stop the trading bot (supports botType: 'dex' | 'polymarket' | 'all')
 * Protected with: rate limiting
 */
app.post('/api/stop-bot', botControlLimiter, async (req: Request, res: Response) => {
  try {
    const { botType = 'all' } = req.body;

    if (!BotState.isRunning()) {
      return res.status(400).json({ error: 'Bot is not running' });
    }

    BotState.stop();
    logger.info(`🛑 Bot stopped via API (type: ${botType})`);

    res.json({
      status: 'stopped',
      message: `${botType === 'all' ? 'All bots have' : botType.toUpperCase() + ' bot has'} been stopped`,
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
        cumulativeProfit += trade.profitLoss || 0;
        const date = new Date(trade.timestamp).toISOString().split('T')[0];
        profitTimeline.push({ date, profit: cumulativeProfit });
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
    const result = await BotState.closePosition(id);

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
 * GET /api/wallet/balance
 * Get wallet balance across all chains
 * Protected with: read rate limiting
 */
app.get('/api/wallet/balance', readLimiter, async (req: Request, res: Response) => {
  try {
    const { MultiChainWalletManager } = await import('./blockchain/multiChainWalletManager');
    const walletManager = new MultiChainWalletManager();

    // Get all balances
    const balances = await walletManager.getAllBalances();

    // Get primary BNB balance
    const bnbBalance = balances.find(b => b.chain === 'BSC');

    res.json({
      balance: bnbBalance?.balance.toFixed(4) || '0.0000',
      usdValue: ((bnbBalance?.balance || 0) * 600).toFixed(2), // Approximate BNB price
      network: CONFIG.NETWORK,
      address: walletManager.getAddress(),
      allChains: balances,
    });
  } catch (error) {
    logger.error(`API /wallet/balance error: ${(error as Error).message}`);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * GET /api/token/:address
 * Get token data for a specific address
 * Protected with: read rate limiting
 */
app.get('/api/token/:address', readLimiter, async (req: Request, res: Response) => {
  try {
    const { address } = req.params;

    // Validate address format
    if (!address || !address.match(/^0x[a-fA-F0-9]{40}$/)) {
      return res.status(400).json({ error: 'Invalid token address' });
    }

    // Fetch token data from DexScreener or use multicall
    const { multicall } = await import('./utils/multicall');
    const tokenMetadata = await multicall.getTokenMetadata([address]);

    if (!tokenMetadata[0] || !tokenMetadata[0].success) {
      return res.status(404).json({ error: 'Token not found or invalid' });
    }

    const token = tokenMetadata[0];

    // TODO: Get price data from DexScreener
    res.json({
      address,
      symbol: token.symbol || 'UNKNOWN',
      name: token.name || 'Unknown Token',
      decimals: token.decimals || 18,
      price: 0, // Placeholder - integrate with price oracle
      priceChange24h: 0,
      volume24h: 0,
      liquidity: 0,
      marketCap: 0,
    });
  } catch (error) {
    logger.error(`API /token/:address error: ${(error as Error).message}`);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * GET /api/crosschain/opportunities
 * Get cross-chain arbitrage opportunities via Wormhole
 * Protected with: read rate limiting
 */
app.get('/api/crosschain/opportunities', readLimiter, async (req: Request, res: Response) => {
  try {
    const minProfit = parseFloat(req.query.minProfit as string) || 0.5;
    const filter = (req.query.filter as string) || 'all';

    // Initialize Wormhole service if needed
    await wormholeService.initialize();

    // Get supported tokens
    const supportedTokens = wormholeService.getSupportedTokens();

    // Calculate arbitrage opportunities for each token
    const opportunities = await Promise.all(
      supportedTokens.map(async (token, index) => {
        try {
          const opportunity = await wormholeService.calculateArbitrageOpportunity(token.symbol, '1000');

          if (!opportunity.profitable || opportunity.profitPercent < minProfit) {
            return null;
          }

          // Get quote for more details
          const quote = await wormholeService.getQuote({
            sourceChain: opportunity.priceOnBSC < opportunity.priceOnPolygon ? 'BSC' : 'Polygon',
            targetChain: opportunity.priceOnBSC < opportunity.priceOnPolygon ? 'Polygon' : 'BSC',
            token: token.symbol,
            amount: '1000',
            recipient: '0x0000000000000000000000000000000000000000',
          });

          return {
            id: `arb_${Date.now()}_${index}`,
            tokenSymbol: token.symbol,
            tokenAddress: token.bscAddress,
            sourceChain: opportunity.priceOnBSC < opportunity.priceOnPolygon ? 'BNB Chain' : 'Polygon',
            targetChain: opportunity.priceOnBSC < opportunity.priceOnPolygon ? 'Polygon' : 'BNB Chain',
            sourceDEX: opportunity.priceOnBSC < opportunity.priceOnPolygon ? 'PancakeSwap' : 'QuickSwap',
            targetDEX: opportunity.priceOnBSC < opportunity.priceOnPolygon ? 'QuickSwap' : 'PancakeSwap',
            sourcePrice: opportunity.priceOnBSC < opportunity.priceOnPolygon ? opportunity.priceOnBSC : opportunity.priceOnPolygon,
            targetPrice: opportunity.priceOnBSC < opportunity.priceOnPolygon ? opportunity.priceOnPolygon : opportunity.priceOnBSC,
            profitPercent: opportunity.profitPercent,
            netProfit: parseFloat(opportunity.netProfit),
            bridgeFee: parseFloat(quote.fee),
            gasEstimate: parseFloat(opportunity.gasEstimate),
            confidence: opportunity.profitPercent > 2 ? 0.9 : 0.7,
            estimatedTime: quote.estimatedTime,
          };
        } catch (error) {
          logger.warn(`Failed to calculate opportunity for ${token.symbol}:`, error);
          return null;
        }
      })
    );

    const validOpportunities = opportunities.filter(o => o !== null);

    res.json({
      opportunities: validOpportunities,
      total: validOpportunities.length,
      timestamp: Date.now(),
    });
  } catch (error) {
    logger.error(`API /crosschain/opportunities error: ${(error as Error).message}`);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * POST /api/crosschain/execute
 * Execute a cross-chain arbitrage trade
 * Protected with: bot control rate limiting
 */
app.post('/api/crosschain/execute', botControlLimiter, async (req: Request, res: Response) => {
  try {
    const { opportunityId, token, amount } = req.body;

    if (!token || !amount) {
      return res.status(400).json({ error: 'Token and amount are required' });
    }

    logger.info(`🔄 Executing cross-chain arbitrage: ${amount} ${token}`);

    // Execute arbitrage via Wormhole service
    const result = await wormholeService.executeArbitrage(token, amount);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: 'Arbitrage execution failed',
        steps: result.steps,
      });
    }

    res.json({
      success: true,
      message: 'Arbitrage executed successfully',
      profit: result.profit,
      transactions: result.transactions,
      steps: result.steps,
    });
  } catch (error) {
    logger.error(`API /crosschain/execute error: ${(error as Error).message}`);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * GET /api/ai/metrics
 * Get AI agent performance metrics
 * Protected with: read rate limiting
 */
app.get('/api/ai/metrics', readLimiter, async (req: Request, res: Response) => {
  try {
    const agent = await getAIAgent();
    const memoryStats = agent.getMemoryStats();
    const personality = agent.getPersonality();
    const currentStrategy = agent.getCurrentStrategy();

    res.json({
      totalDecisions: memoryStats.totalTrades,
      successfulDecisions: Math.round((memoryStats.successRate / 100) * memoryStats.totalTrades),
      failedDecisions: memoryStats.totalTrades - Math.round((memoryStats.successRate / 100) * memoryStats.totalTrades),
      averageConfidence: personality.confidenceThreshold,
      learningRate: personality.learningRate,
      memoryCount: memoryStats.totalMemories,
      lastUpdate: Date.now(),
      winRate: memoryStats.successRate,
      avgReturn: memoryStats.avgReturn,
      riskTolerance: personality.riskTolerance,
      aggressiveness: personality.aggressiveness,
      strategies: currentStrategy.totalStrategies,
    });
  } catch (error) {
    logger.error(`API /ai/metrics error: ${(error as Error).message}`);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * GET /api/ai/decisions
 * Get recent AI agent decisions from memory
 * Protected with: read rate limiting
 */
app.get('/api/ai/decisions', readLimiter, async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const agent = await getAIAgent();

    // Fetch memories from Greenfield
    const memoryIds = await fetchAllMemories();
    const memories = await Promise.all(
      memoryIds.slice(-limit).map(async (id) => {
        const memory = await fetchMemory(id);
        return memory;
      })
    );

    const validMemories = memories.filter((m) => m !== null);

    // Map to decision format
    const decisions = validMemories.map((memory: any) => ({
      id: memory.id,
      timestamp: memory.timestamp,
      action: memory.action.toUpperCase(),
      token: memory.tokenSymbol,
      amount: memory.amount,
      confidence: 0.75, // Could be enhanced with actual confidence from memory
      outcome: memory.outcome,
      profitLoss: memory.profitLoss || 0,
      reasoning: memory.aiReasoning || 'AI decision based on market conditions',
      marketConditions: memory.marketConditions,
    }));

    res.json({
      decisions: decisions.reverse(), // Newest first
      total: decisions.length,
    });
  } catch (error) {
    logger.error(`API /ai/decisions error: ${(error as Error).message}`);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * GET /api/ai/thresholds
 * Get current dynamic thresholds computed from Greenfield data
 * Protected with: read rate limiting
 */
app.get('/api/ai/thresholds', readLimiter, async (req: Request, res: Response) => {
  try {
    const agent = await getAIAgent();
    const thresholds = await agent.computeDynamicThresholds();

    res.json({
      minProfitability: thresholds.minProfitability,
      optimalConfidence: thresholds.optimalConfidence,
      maxRiskLevel: thresholds.maxRiskLevel,
      suggestedTradeAmount: thresholds.suggestedTradeAmount,
      computedAt: Date.now(),
    });
  } catch (error) {
    logger.error(`API /ai/thresholds error: ${(error as Error).message}`);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * POST /api/ai/thresholds/recompute
 * Recompute dynamic thresholds from latest Greenfield data
 * Protected with: bot control rate limiting
 */
app.post('/api/ai/thresholds/recompute', botControlLimiter, async (req: Request, res: Response) => {
  try {
    const agent = await getAIAgent();

    // Reload memories to get latest data
    await agent.loadMemories();

    // Recompute thresholds
    const thresholds = await agent.computeDynamicThresholds();

    logger.info('🔄 Dynamic thresholds recomputed');

    res.json({
      success: true,
      message: 'Thresholds recomputed successfully',
      thresholds: {
        minProfitability: thresholds.minProfitability,
        optimalConfidence: thresholds.optimalConfidence,
        maxRiskLevel: thresholds.maxRiskLevel,
        suggestedTradeAmount: thresholds.suggestedTradeAmount,
        computedAt: Date.now(),
      },
    });
  } catch (error) {
    logger.error(`API /ai/thresholds/recompute error: ${(error as Error).message}`);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * GET /api/telegram/config
 * Get Telegram bot configuration
 * Protected with: read rate limiting
 */
app.get('/api/telegram/config', readLimiter, async (req: Request, res: Response) => {
  try {
    const config = await getConfigOrDefault('telegram', {
      enabled: false,
      botToken: '',
      chatId: '',
      notifications: {
        trades: true,
        opportunities: true,
        errors: true,
        dailySummary: true,
      },
      filters: {
        minProfitPercent: 1.0,
        minConfidence: 0.7,
      },
    });

    // Don't expose sensitive bot token in response (only show if it exists)
    res.json({
      ...config,
      botToken: config.botToken ? '***' + config.botToken.slice(-8) : '',
      hasToken: !!config.botToken,
    });
  } catch (error) {
    logger.error(`API /telegram/config error: ${(error as Error).message}`);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * POST /api/telegram/config
 * Save Telegram bot configuration
 * Protected with: bot control rate limiting
 */
app.post('/api/telegram/config', botControlLimiter, async (req: Request, res: Response) => {
  try {
    const { enabled, botToken, chatId, notifications, filters } = req.body;

    // Validate required fields if enabled
    if (enabled && (!botToken || !chatId)) {
      return res.status(400).json({
        error: 'Bot token and chat ID are required when Telegram is enabled',
      });
    }

    const config = {
      enabled: !!enabled,
      botToken: botToken || '',
      chatId: chatId || '',
      notifications: notifications || {
        trades: true,
        opportunities: true,
        errors: true,
        dailySummary: true,
      },
      filters: filters || {
        minProfitPercent: 1.0,
        minConfidence: 0.7,
      },
      updatedAt: Date.now(),
    };

    await saveConfig('telegram', config);

    logger.info('✅ Telegram configuration saved');

    res.json({
      success: true,
      message: 'Telegram configuration saved successfully',
    });
  } catch (error) {
    logger.error(`API /telegram/config POST error: ${(error as Error).message}`);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * GET /api/telegram/messages
 * Get recent Telegram messages sent
 * Protected with: read rate limiting
 */
app.get('/api/telegram/messages', readLimiter, async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const messages = await getConfigOrDefault<any[]>('telegram_messages', []);

    res.json({
      messages: messages.slice(-limit).reverse(), // Most recent first
      total: messages.length,
    });
  } catch (error) {
    logger.error(`API /telegram/messages error: ${(error as Error).message}`);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * POST /api/telegram/send
 * Send a message via Telegram (for testing or manual notifications)
 * Protected with: bot control rate limiting
 */
app.post('/api/telegram/send', botControlLimiter, async (req: Request, res: Response) => {
  try {
    const { message, type = 'manual' } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Load Telegram config
    const config = await loadConfig<any>('telegram');

    if (!config || !config.enabled || !config.botToken || !config.chatId) {
      return res.status(400).json({
        error: 'Telegram bot is not configured. Please configure in settings.',
      });
    }

    // Send message via Telegram API
    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${config.botToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: config.chatId,
          text: message,
          parse_mode: 'Markdown',
        }),
      }
    );

    const telegramData = await telegramResponse.json();

    if (!telegramData.ok) {
      throw new Error(telegramData.description || 'Failed to send Telegram message');
    }

    // Log message to history
    const messageRecord = {
      id: `msg_${Date.now()}`,
      timestamp: Date.now(),
      type,
      message,
      status: 'sent',
    };

    await appendToConfig('telegram_messages', messageRecord);

    logger.info(`📤 Telegram message sent: ${type}`);

    res.json({
      success: true,
      message: 'Message sent successfully',
      telegramResponse: telegramData,
    });
  } catch (error) {
    logger.error(`API /telegram/send error: ${(error as Error).message}`);

    // Log failed message
    try {
      await appendToConfig('telegram_messages', {
        id: `msg_${Date.now()}`,
        timestamp: Date.now(),
        type: req.body.type || 'manual',
        message: req.body.message,
        status: 'failed',
        error: (error as Error).message,
      });
    } catch (logError) {
      // Ignore logging errors
    }

    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * GET /api/settings
 * Get user settings
 * Protected with: read rate limiting
 */
app.get('/api/settings', readLimiter, async (req: Request, res: Response) => {
  try {
    const settings = await getConfigOrDefault('user_settings', {
      theme: 'dark',
      defaultRiskLevel: 'MEDIUM',
      autoTrading: false,
      notifications: {
        desktop: true,
        sound: true,
      },
      trading: {
        defaultSlippage: 0.5,
        maxTradeAmount: 1.0,
        stopLoss: 10,
        takeProfit: 20,
      },
      display: {
        currency: 'USD',
        decimals: 4,
        chartType: 'candlestick',
      },
    });

    res.json(settings);
  } catch (error) {
    logger.error(`API /settings error: ${(error as Error).message}`);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * POST /api/settings
 * Save user settings
 * Protected with: bot control rate limiting
 */
app.post('/api/settings', botControlLimiter, async (req: Request, res: Response) => {
  try {
    const settings = {
      ...req.body,
      updatedAt: Date.now(),
    };

    await saveConfig('user_settings', settings);

    logger.info('✅ User settings saved');

    res.json({
      success: true,
      message: 'Settings saved successfully',
      settings,
    });
  } catch (error) {
    logger.error(`API /settings POST error: ${(error as Error).message}`);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * GET /api/polymarket/markets
 * Get trending Polymarket prediction markets from Gamma API
 * Protected with: read rate limiting
 */
app.get('/api/polymarket/markets', readLimiter, async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const category = req.query.category as string;
    const search = req.query.search as string;

    let markets;

    if (search) {
      markets = await polymarketService.searchMarkets(search, limit);
    } else if (category) {
      markets = await polymarketService.getMarketsByCategory(category, limit);
    } else {
      markets = await polymarketService.getMarkets(limit);
    }

    res.json({ markets, total: markets.length });
  } catch (error) {
    logger.error(`API /polymarket/markets error: ${(error as Error).message}`);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * GET /api/polymarket/balance
 * Get Polymarket wallet USDC balance on Polygon
 * Protected with: read rate limiting
 */
app.get('/api/polymarket/balance', readLimiter, async (req: Request, res: Response) => {
  try {
    const walletAddress = req.query.address as string;
    const balance = await polymarketService.getBalance(walletAddress);
    res.json(balance);
  } catch (error) {
    logger.error(`API /polymarket/balance error: ${(error as Error).message}`);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * GET /api/polymarket/positions
 * Get active Polymarket positions via Python bridge
 * Protected with: read rate limiting
 */
app.get('/api/polymarket/positions', readLimiter, async (req: Request, res: Response) => {
  try {
    const walletAddress = process.env.POLYGON_WALLET_ADDRESS;
    const privateKey = process.env.POLYGON_WALLET_PRIVATE_KEY;

    if (!walletAddress || !privateKey) {
      // Fallback to calculating from agent trades if CLOB not available
      const agentTrades = polymarketOrchestrator.getTrades(100);
      const positionMap = new Map<string, any>();

      agentTrades.forEach(trade => {
        if (!positionMap.has(trade.market)) {
          positionMap.set(trade.market, {
            marketId: trade.market.replace(/\s+/g, '_').toLowerCase(),
            market: trade.market,
            side: trade.action,
            shares: 0,
            avgPrice: 0,
            currentPrice: 0.5,
            pnl: 0,
            roi: 0,
          });
        }

        const position = positionMap.get(trade.market)!;
        if (trade.action === 'buy') {
          position.shares += trade.amount;
        } else {
          position.shares -= trade.amount;
        }
        position.pnl += trade.profitLoss;
      });

      const positions = Array.from(positionMap.values()).filter(p => p.shares > 0);
      return res.json({
        positions,
        total: positions.length,
        source: 'calculated_from_trades',
        note: 'Configure wallet for real CLOB positions',
      });
    }

    // Try to get real positions from CLOB bridge
    if (clobClient.isBridgeAvailable()) {
      const clobPositions = await clobClient.getPositions();

      const formattedPositions = clobPositions.map(pos => ({
        marketId: pos.tokenId,
        market: pos.market,
        side: pos.side,
        shares: pos.size,
        avgPrice: pos.entryPrice,
        currentPrice: pos.currentPrice,
        pnl: pos.pnl,
        roi: pos.entryPrice > 0 ? ((pos.currentPrice - pos.entryPrice) / pos.entryPrice) * 100 : 0,
      }));

      return res.json({
        positions: formattedPositions,
        total: formattedPositions.length,
        source: 'clob_bridge',
        bridgeAvailable: true,
      });
    }

    // Fallback to calculated positions if bridge not available
    const agentTrades = polymarketOrchestrator.getTrades(100);
    const positionMap = new Map<string, any>();

    agentTrades.forEach(trade => {
      if (!positionMap.has(trade.market)) {
        positionMap.set(trade.market, {
          marketId: trade.market.replace(/\s+/g, '_').toLowerCase(),
          market: trade.market,
          side: trade.action,
          shares: 0,
          avgPrice: 0,
          currentPrice: 0.5,
          pnl: 0,
          roi: 0,
        });
      }

      const position = positionMap.get(trade.market)!;
      if (trade.action === 'buy') {
        position.shares += trade.amount;
      } else {
        position.shares -= trade.amount;
      }
      position.pnl += trade.profitLoss;
    });

    const positions = Array.from(positionMap.values()).filter(p => p.shares > 0);

    res.json({
      positions,
      total: positions.length,
      source: 'calculated_from_trades',
      note: 'CLOB Bridge not running. Start it with: python src/services/clobBridge.py',
      bridgeAvailable: false,
    });
  } catch (error) {
    logger.error(`API /polymarket/positions error: ${(error as Error).message}`);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * GET /api/polymarket/orders
 * Get active Polymarket CLOB orders via Python bridge
 * Protected with: read rate limiting
 */
app.get('/api/polymarket/orders', readLimiter, async (req: Request, res: Response) => {
  try {
    const walletAddress = process.env.POLYGON_WALLET_ADDRESS;
    const privateKey = process.env.POLYGON_WALLET_PRIVATE_KEY;

    if (!walletAddress || !privateKey) {
      return res.json({
        orders: [],
        total: 0,
        note: 'Wallet not configured. Set POLYGON_WALLET_ADDRESS and POLYGON_WALLET_PRIVATE_KEY to view orders.',
        bridgeAvailable: clobClient.isBridgeAvailable(),
      });
    }

    // Check if Python CLOB bridge is running
    if (!clobClient.isBridgeAvailable()) {
      return res.json({
        orders: [],
        total: 0,
        note: 'CLOB Bridge not running. Start it with: python src/services/clobBridge.py',
        bridgeAvailable: false,
      });
    }

    // Fetch orders from Python CLOB client via bridge
    const orders = await clobClient.getOrders();

    // Transform to frontend format
    const formattedOrders = orders.map(order => ({
      id: order.id,
      marketId: order.marketId,
      market: 'Market name from Gamma API', // Would lookup from Gamma
      side: order.side.toLowerCase(),
      price: order.price,
      size: order.size,
      status: order.status,
      timestamp: order.timestamp,
    }));

    res.json({
      orders: formattedOrders,
      total: formattedOrders.length,
      bridgeAvailable: true,
    });
  } catch (error) {
    logger.error(`API /polymarket/orders error: ${(error as Error).message}`);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * GET /api/polymarket/opportunities
 * Get cross-platform arbitrage opportunities
 * (Requires integration with other prediction markets like Kalshi, PredictIt, etc.)
 * Protected with: read rate limiting
 */
app.get('/api/polymarket/opportunities', readLimiter, async (req: Request, res: Response) => {
  try {
    // Cross-platform arbitrage requires comparing odds across multiple platforms
    // TODO: Integrate with Kalshi, PredictIt, Augur, etc.
    // For now, identify markets with unusual odds that might indicate opportunities
    const markets = await polymarketService.getMarkets(50);

    const opportunities = markets
      .filter(m => {
        // Look for markets with extreme odds (potential value)
        const yesPrice = m.yesPrice;
        const noPrice = m.noPrice;
        const hasValue = (yesPrice < 0.2 || yesPrice > 0.8) && m.volume24h > 50000;
        return hasValue;
      })
      .map(m => ({
        platform: 'Polymarket',
        marketId: m.id,
        market: m.question,
        yesPrice: m.yesPrice,
        noPrice: m.noPrice,
        volume24h: m.volume24h,
        liquidity: m.liquidity,
        opportunity: m.yesPrice < 0.2 ? 'Undervalued YES' : 'Undervalued NO',
        potentialProfit: Math.abs(m.yesPrice - 0.5) * 100, // Simplified
      }))
      .slice(0, 10);

    res.json({
      opportunities,
      total: opportunities.length,
      note: 'Cross-platform arbitrage requires integration with other prediction markets'
    });
  } catch (error) {
    logger.error(`API /polymarket/opportunities error: ${(error as Error).message}`);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * POST /api/polymarket/analyze
 * Analyze a Polymarket market with AI using Python agents (RAG/LLM)
 * Protected with: bot control rate limiting
 */
app.post('/api/polymarket/analyze', botControlLimiter, async (req: Request, res: Response) => {
  try {
    const { marketId, question } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Market question is required' });
    }

    logger.info(`🔍 Analyzing Polymarket market: ${question}`);

    // Get market data from Polymarket first
    let marketData = null;
    if (marketId) {
      marketData = await polymarketService.getMarket(marketId);
    }

    // TODO: Call Python agent's RAG/LLM system for real analysis
    // For now, provide analysis based on market data
    const yesPrice = marketData?.yesPrice || 0.5;
    const volume = marketData?.volume24h || 0;
    const liquidity = marketData?.liquidity || 0;

    // Simple heuristic-based recommendation until Python RAG is integrated
    let recommendation = 'HOLD';
    if (yesPrice < 0.4 && volume > 100000) recommendation = 'BUY';
    else if (yesPrice < 0.3 && volume > 50000) recommendation = 'STRONG_BUY';
    else if (yesPrice > 0.7 && volume > 100000) recommendation = 'SELL';
    else if (yesPrice > 0.8) recommendation = 'STRONG_SELL';

    const confidence = liquidity > 100000 ? 0.8 : liquidity > 50000 ? 0.7 : 0.6;
    const riskLevel = liquidity > 200000 ? 'LOW' : liquidity > 100000 ? 'MEDIUM' : 'HIGH';

    const analysis = {
      recommendation,
      confidence,
      reasoning: `Market analysis for "${question}": Current Yes price is ${(yesPrice * 100).toFixed(1)}% with $${volume.toLocaleString()} 24h volume. ${
        liquidity > 100000 ? 'High liquidity provides good trading conditions.' : 'Lower liquidity increases risk.'
      }`,
      riskLevel,
      suggestedAmount: liquidity > 100000 ? 100 : 50,
      keyFactors: [
        `24h Volume: $${volume.toLocaleString()}`,
        `Liquidity: $${liquidity.toLocaleString()}`,
        `Current Yes Price: ${(yesPrice * 100).toFixed(1)}%`,
        marketData?.category ? `Category: ${marketData.category}` : 'Market active',
      ],
      timestamp: Date.now(),
      marketData,
    };

    res.json({ success: true, analysis });
  } catch (error) {
    logger.error(`API /polymarket/analyze error: ${(error as Error).message}`);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * GET /api/polymarket/history
 * Get Polymarket betting history
 * Protected with: read rate limiting
 */
app.get('/api/polymarket/history', readLimiter, async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;

    // Get trades from orchestrator
    const trades = polymarketOrchestrator.getTrades(limit);

    const history = trades.map(trade => ({
      id: trade.id,
      timestamp: trade.timestamp,
      market: trade.market,
      side: trade.action,
      amount: trade.amount,
      price: 0.5, // Would come from actual trade data
      outcome: trade.profitLoss > 0 ? 'win' : trade.profitLoss < 0 ? 'loss' : 'pending',
      pnl: trade.profitLoss,
      txHash: trade.transactionHash,
    }));

    res.json({ history, total: history.length });
  } catch (error) {
    logger.error(`API /polymarket/history error: ${(error as Error).message}`);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * GET /api/polymarket/stats
 * Get Polymarket betting statistics
 * Protected with: read rate limiting
 */
app.get('/api/polymarket/stats', readLimiter, async (req: Request, res: Response) => {
  try {
    const trades = polymarketOrchestrator.getTrades(1000);

    const winningTrades = trades.filter(t => t.profitLoss > 0);
    const losingTrades = trades.filter(t => t.profitLoss < 0);
    const totalPnL = trades.reduce((sum, t) => sum + t.profitLoss, 0);

    const stats = {
      totalBets: trades.length,
      winningBets: winningTrades.length,
      losingBets: losingTrades.length,
      winRate: trades.length > 0 ? (winningTrades.length / trades.length) * 100 : 0,
      totalProfit: totalPnL,
      avgBetSize: trades.length > 0 ? trades.reduce((sum, t) => sum + t.amount, 0) / trades.length : 0,
      bestBet: trades.length > 0 ? Math.max(...trades.map(t => t.profitLoss)) : 0,
      worstBet: trades.length > 0 ? Math.min(...trades.map(t => t.profitLoss)) : 0,
    };

    res.json(stats);
  } catch (error) {
    logger.error(`API /polymarket/stats error: ${(error as Error).message}`);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * GET /api/polymarket/leaderboard
 * Get platform leaderboard (Note: Polymarket doesn't provide public leaderboard API)
 * This returns our own bot's performance stats
 * Protected with: read rate limiting
 */
app.get('/api/polymarket/leaderboard', readLimiter, async (req: Request, res: Response) => {
  try {
    // Polymarket doesn't provide a public leaderboard API
    // So we return stats from our own agent trades
    const trades = polymarketOrchestrator.getTrades(1000);

    const winningTrades = trades.filter(t => t.profitLoss > 0);
    const totalPnL = trades.reduce((sum, t) => sum + t.profitLoss, 0);
    const totalVolume = trades.reduce((sum, t) => sum + t.amount, 0);
    const winRate = trades.length > 0 ? (winningTrades.length / trades.length) * 100 : 0;

    // Count unique markets traded
    const uniqueMarkets = new Set(trades.map(t => t.market)).size;

    const ourStats = {
      rank: 1,
      address: process.env.POLYGON_WALLET_ADDRESS || 'Bot Address',
      displayName: 'Immortal AI Bot',
      totalVolume,
      totalProfit: totalPnL,
      winRate,
      marketsTraded: uniqueMarkets,
    };

    res.json({
      topTraders: [ourStats],
      userRank: 1,
      note: 'Polymarket does not provide a public leaderboard API. Showing bot performance only.',
    });
  } catch (error) {
    logger.error(`API /polymarket/leaderboard error: ${(error as Error).message}`);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * POST /api/polymarket-agent/start
 * Start the Polymarket autonomous trading agent
 * Protected with: bot control rate limiting
 */
app.post('/api/polymarket-agent/start', botControlLimiter, async (req: Request, res: Response) => {
  try {
    const { maxTradeAmount, minConfidence } = req.body;

    const status = polymarketOrchestrator.getStatus();
    if (status.isRunning) {
      return res.status(400).json({ error: 'Polymarket agent is already running' });
    }

    // Update config if provided
    if (maxTradeAmount !== undefined) {
      polymarketOrchestrator['config'].maxTradeAmount = maxTradeAmount;
    }
    if (minConfidence !== undefined) {
      polymarketOrchestrator['config'].minConfidence = minConfidence;
    }

    await polymarketOrchestrator.start();

    logger.info('✅ Polymarket agent started via API');

    res.json({
      success: true,
      message: 'Polymarket trading agent started successfully',
      config: {
        maxTradeAmount: polymarketOrchestrator['config'].maxTradeAmount,
        minConfidence: polymarketOrchestrator['config'].minConfidence,
      },
    });
  } catch (error) {
    logger.error(`API /polymarket-agent/start error: ${(error as Error).message}`);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * POST /api/polymarket-agent/stop
 * Stop the Polymarket autonomous trading agent
 * Protected with: bot control rate limiting
 */
app.post('/api/polymarket-agent/stop', botControlLimiter, async (req: Request, res: Response) => {
  try {
    const status = polymarketOrchestrator.getStatus();
    if (!status.isRunning) {
      return res.status(400).json({ error: 'Polymarket agent is not running' });
    }

    polymarketOrchestrator.stop();

    logger.info('🛑 Polymarket agent stopped via API');

    res.json({
      success: true,
      message: 'Polymarket trading agent stopped successfully',
    });
  } catch (error) {
    logger.error(`API /polymarket-agent/stop error: ${(error as Error).message}`);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * GET /api/polymarket-agent/status
 * Get Polymarket agent status and statistics
 * Protected with: read rate limiting
 */
app.get('/api/polymarket-agent/status', readLimiter, async (req: Request, res: Response) => {
  try {
    const status = polymarketOrchestrator.getStatus();

    res.json({
      isRunning: status.isRunning,
      startedAt: status.startedAt,
      uptime: status.uptime,
      totalDecisions: status.totalDecisions,
      totalTrades: status.totalTrades,
      totalProfit: status.totalProfit,
      config: {
        maxTradeAmount: polymarketOrchestrator['config'].maxTradeAmount,
        minConfidence: polymarketOrchestrator['config'].minConfidence,
      },
    });
  } catch (error) {
    logger.error(`API /polymarket-agent/status error: ${(error as Error).message}`);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * GET /api/polymarket-agent/decisions
 * Get recent Polymarket agent decisions
 * Protected with: read rate limiting
 */
app.get('/api/polymarket-agent/decisions', readLimiter, async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const decisions = polymarketOrchestrator.getDecisions(limit);

    res.json({
      decisions: decisions.reverse(), // Newest first
      total: decisions.length,
    });
  } catch (error) {
    logger.error(`API /polymarket-agent/decisions error: ${(error as Error).message}`);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * GET /api/polymarket-agent/trades
 * Get recent Polymarket agent trades
 * Protected with: read rate limiting
 */
app.get('/api/polymarket-agent/trades', readLimiter, async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const trades = polymarketOrchestrator.getTrades(limit);

    res.json({
      trades: trades.reverse(), // Newest first
      total: trades.length,
      totalProfit: trades.reduce((sum, t) => sum + t.profitLoss, 0),
    });
  } catch (error) {
    logger.error(`API /polymarket-agent/trades error: ${(error as Error).message}`);
    res.status(500).json({ error: (error as Error).message });
  }
});

// ============================================================================
// TOKEN ENDPOINTS
// ============================================================================

/**
 * GET /api/token/info
 * Get IMMBOT token information (name, symbol, supply, tax config)
 * Protected with: read rate limiting
 */
app.get('/api/token/info', readLimiter, async (req: Request, res: Response) => {
  try {
    if (!contractService || !contractService.isContractInitialized('token')) {
      return res.status(503).json({
        error: 'Token contract not configured',
        message: 'Set IMMBOT_TOKEN_CONTRACT in .env to enable token features',
      });
    }

    const tokenInfo = await contractService.getTokenInfo();

    res.json({
      ...tokenInfo,
      contractAddress: process.env.IMMBOT_TOKEN_CONTRACT,
      network: process.env.CONTRACT_NETWORK || 'bsc',
    });
  } catch (error) {
    logger.error(`API /token/info error: ${(error as Error).message}`);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * GET /api/token/balance/:address
 * Get token balance for a specific address
 * Protected with: read rate limiting
 */
app.get('/api/token/balance/:address', readLimiter, async (req: Request, res: Response) => {
  try {
    if (!contractService || !contractService.isContractInitialized('token')) {
      return res.status(503).json({
        error: 'Token contract not configured',
      });
    }

    const { address } = req.params;

    // Basic address validation
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return res.status(400).json({ error: 'Invalid Ethereum address' });
    }

    const balance = await contractService.getTokenBalance(address);
    const nativeBalance = await contractService.getNativeBalance(address);

    res.json({
      ...balance,
      nativeBalance,
      network: process.env.CONTRACT_NETWORK || 'bsc',
    });
  } catch (error) {
    logger.error(`API /token/balance error: ${(error as Error).message}`);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * GET /api/token/stats
 * Get token statistics (supply, holders, volume)
 * Protected with: read rate limiting
 */
app.get('/api/token/stats', readLimiter, async (req: Request, res: Response) => {
  try {
    if (!contractService || !contractService.isContractInitialized('token')) {
      return res.status(503).json({
        error: 'Token contract not configured',
      });
    }

    const [tokenInfo, gasPrice] = await Promise.all([
      contractService.getTokenInfo(),
      contractService.getGasPrice(),
    ]);

    // Calculate burned amount (assuming initial supply - current supply)
    const burned = 0; // This would need to be calculated from blockchain events

    res.json({
      totalSupply: tokenInfo.totalSupply,
      decimals: tokenInfo.decimals,
      taxPercentage: tokenInfo.taxPercentage,
      burnPercentage: tokenInfo.burnPercentage,
      liquidityPercentage: tokenInfo.liquidityPercentage,
      totalBurned: burned,
      circulatingSupply: tokenInfo.totalSupply,
      gasPrice: gasPrice + ' gwei',
      network: process.env.CONTRACT_NETWORK || 'bsc',
    });
  } catch (error) {
    logger.error(`API /token/stats error: ${(error as Error).message}`);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * POST /api/token/transfer
 * Transfer tokens to another address
 * Protected with: bot control rate limiting (write operation)
 */
app.post('/api/token/transfer', botControlLimiter, async (req: Request, res: Response) => {
  try {
    if (!contractService || !contractService.isContractInitialized('token')) {
      return res.status(503).json({
        error: 'Token contract not configured',
      });
    }

    if (!contractService.isWalletConnected()) {
      return res.status(400).json({
        error: 'Wallet not connected',
        message: 'Set WALLET_PRIVATE_KEY in .env to enable transactions',
      });
    }

    const { recipient, amount } = req.body;

    if (!recipient || !amount) {
      return res.status(400).json({ error: 'Missing recipient or amount' });
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(recipient)) {
      return res.status(400).json({ error: 'Invalid recipient address' });
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    logger.info(`Token transfer initiated: ${amount} IMMBOT to ${recipient}`);

    const txHash = await contractService.transferToken(recipient, amount);

    res.json({
      success: true,
      txHash,
      recipient,
      amount,
      network: process.env.CONTRACT_NETWORK || 'bsc',
    });
  } catch (error) {
    logger.error(`API /token/transfer error: ${(error as Error).message}`);
    res.status(500).json({ error: (error as Error).message });
  }
});

// ============================================================================
// STAKING ENDPOINTS
// ============================================================================

/**
 * GET /api/staking/pools
 * Get all staking pools with APY information
 * Protected with: read rate limiting
 */
app.get('/api/staking/pools', readLimiter, async (req: Request, res: Response) => {
  try {
    if (!contractService || !contractService.isContractInitialized('staking')) {
      return res.status(503).json({
        error: 'Staking contract not configured',
        message: 'Set STAKING_CONTRACT in .env to enable staking features',
      });
    }

    const pools = await contractService.getStakingPools();

    res.json({
      pools,
      total: pools.length,
      contractAddress: process.env.STAKING_CONTRACT,
      network: process.env.CONTRACT_NETWORK || 'bsc',
    });
  } catch (error) {
    logger.error(`API /staking/pools error: ${(error as Error).message}`);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * GET /api/staking/stats
 * Get global staking statistics
 * Protected with: read rate limiting
 */
app.get('/api/staking/stats', readLimiter, async (req: Request, res: Response) => {
  try {
    if (!contractService || !contractService.isContractInitialized('staking')) {
      return res.status(503).json({
        error: 'Staking contract not configured',
      });
    }

    const userAddress = req.query.address as string | undefined;
    const stats = await contractService.getStakingStats(userAddress);

    res.json({
      ...stats,
      network: process.env.CONTRACT_NETWORK || 'bsc',
    });
  } catch (error) {
    logger.error(`API /staking/stats error: ${(error as Error).message}`);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * GET /api/staking/user/:address
 * Get user's staking positions
 * Protected with: read rate limiting
 */
app.get('/api/staking/user/:address', readLimiter, async (req: Request, res: Response) => {
  try {
    if (!contractService || !contractService.isContractInitialized('staking')) {
      return res.status(503).json({
        error: 'Staking contract not configured',
      });
    }

    const { address } = req.params;

    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return res.status(400).json({ error: 'Invalid Ethereum address' });
    }

    const stakes = await contractService.getUserStakes(address);

    res.json({
      stakes,
      total: stakes.length,
      address,
      network: process.env.CONTRACT_NETWORK || 'bsc',
    });
  } catch (error) {
    logger.error(`API /staking/user error: ${(error as Error).message}`);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * POST /api/staking/stake
 * Create a new stake
 * Protected with: bot control rate limiting (write operation)
 */
app.post('/api/staking/stake', botControlLimiter, async (req: Request, res: Response) => {
  try {
    if (!contractService || !contractService.isContractInitialized('staking')) {
      return res.status(503).json({
        error: 'Staking contract not configured',
      });
    }

    if (!contractService.isWalletConnected()) {
      return res.status(400).json({
        error: 'Wallet not connected',
        message: 'Set WALLET_PRIVATE_KEY in .env to enable transactions',
      });
    }

    const { amount, lockPeriodId } = req.body;

    if (amount === undefined || lockPeriodId === undefined) {
      return res.status(400).json({ error: 'Missing amount or lockPeriodId' });
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const lockId = parseInt(lockPeriodId);
    if (isNaN(lockId) || lockId < 0) {
      return res.status(400).json({ error: 'Invalid lockPeriodId' });
    }

    logger.info(`Staking initiated: ${amount} IMMBOT with lock period ${lockId}`);

    const txHash = await contractService.stake(amount, lockId);

    res.json({
      success: true,
      txHash,
      amount,
      lockPeriodId: lockId,
      network: process.env.CONTRACT_NETWORK || 'bsc',
    });
  } catch (error) {
    logger.error(`API /staking/stake error: ${(error as Error).message}`);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * POST /api/staking/withdraw
 * Withdraw a stake
 * Protected with: bot control rate limiting (write operation)
 */
app.post('/api/staking/withdraw', botControlLimiter, async (req: Request, res: Response) => {
  try {
    if (!contractService || !contractService.isContractInitialized('staking')) {
      return res.status(503).json({
        error: 'Staking contract not configured',
      });
    }

    if (!contractService.isWalletConnected()) {
      return res.status(400).json({
        error: 'Wallet not connected',
      });
    }

    const { stakeIndex } = req.body;

    if (stakeIndex === undefined) {
      return res.status(400).json({ error: 'Missing stakeIndex' });
    }

    const index = parseInt(stakeIndex);
    if (isNaN(index) || index < 0) {
      return res.status(400).json({ error: 'Invalid stakeIndex' });
    }

    logger.info(`Withdrawing stake index: ${index}`);

    const txHash = await contractService.withdraw(index);

    res.json({
      success: true,
      txHash,
      stakeIndex: index,
      network: process.env.CONTRACT_NETWORK || 'bsc',
    });
  } catch (error) {
    logger.error(`API /staking/withdraw error: ${(error as Error).message}`);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * POST /api/staking/claim
 * Claim rewards from a stake
 * Protected with: bot control rate limiting (write operation)
 */
app.post('/api/staking/claim', botControlLimiter, async (req: Request, res: Response) => {
  try {
    if (!contractService || !contractService.isContractInitialized('staking')) {
      return res.status(503).json({
        error: 'Staking contract not configured',
      });
    }

    if (!contractService.isWalletConnected()) {
      return res.status(400).json({
        error: 'Wallet not connected',
      });
    }

    const { stakeIndex } = req.body;

    if (stakeIndex === undefined) {
      return res.status(400).json({ error: 'Missing stakeIndex' });
    }

    const index = parseInt(stakeIndex);
    if (isNaN(index) || index < 0) {
      return res.status(400).json({ error: 'Invalid stakeIndex' });
    }

    logger.info(`Claiming rewards from stake index: ${index}`);

    const txHash = await contractService.claimRewards(index);

    res.json({
      success: true,
      txHash,
      stakeIndex: index,
      network: process.env.CONTRACT_NETWORK || 'bsc',
    });
  } catch (error) {
    logger.error(`API /staking/claim error: ${(error as Error).message}`);
    res.status(500).json({ error: (error as Error).message });
  }
});

// ============================================================================
// ARBITRAGE ENDPOINTS
// ============================================================================

/**
 * POST /api/arbitrage/simulate
 * Simulate a flash loan arbitrage opportunity
 * Protected with: read rate limiting
 */
app.post('/api/arbitrage/simulate', readLimiter, async (req: Request, res: Response) => {
  try {
    if (!contractService || !contractService.isContractInitialized('arbitrage')) {
      return res.status(503).json({
        error: 'Arbitrage contract not configured',
        message: 'Set FLASH_LOAN_ARBITRAGE_CONTRACT in .env to enable arbitrage features',
      });
    }

    const { loanAmount, buyRouter, sellRouter, buyPath, sellPath, minProfit } = req.body;

    if (!loanAmount || !buyRouter || !sellRouter || !buyPath || !sellPath || !minProfit) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const simulation = await contractService.simulateArbitrage(
      loanAmount,
      buyRouter,
      sellRouter,
      buyPath,
      sellPath,
      minProfit
    );

    res.json({
      ...simulation,
      network: process.env.CONTRACT_NETWORK || 'bsc',
    });
  } catch (error) {
    logger.error(`API /arbitrage/simulate error: ${(error as Error).message}`);
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
    polymarketAgentRunning: polymarketOrchestrator.getStatus().isRunning,
  });
});

/**
 * GET /metrics
 * Prometheus metrics endpoint
 * No rate limiting - Prometheus needs frequent scrapes
 */
app.get('/metrics', async (req: Request, res: Response) => {
  try {
    const metrics = await metricsService.getMetrics();
    res.setHeader('Content-Type', metricsService.getContentType());
    res.send(metrics);
  } catch (error) {
    logger.error(`Metrics endpoint error: ${(error as Error).message}`);
    res.status(500).send('Error generating metrics');
  }
});

/**
 * Start Express server with WebSocket support
 */
export function startAPIServer() {
  // Create HTTP server from Express app
  const httpServer = http.createServer(app);

  // Initialize WebSocket manager with HTTP server
  webSocketManager.initialize(httpServer);
  logger.info('🔌 WebSocket server initialized on path: /ws');

  // Start listening
  httpServer.listen(PORT, () => {
    logger.info(`🌐 API Server running on http://localhost:${PORT}`);
    logger.info(`📊 Dashboard: Connect frontend to this server`);
    logger.info(`🔌 WebSocket: ws://localhost:${PORT}/ws`);
    logger.info(`📝 Available endpoints (${51} total):`);
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
    logger.info(`   GET  /api/wallet/balance`);
    logger.info(`   GET  /api/token/:address`);
    logger.info(`   GET  /api/crosschain/opportunities`);
    logger.info(`   POST /api/crosschain/execute`);
    logger.info(`   GET  /api/ai/metrics`);
    logger.info(`   GET  /api/ai/decisions`);
    logger.info(`   GET  /api/ai/thresholds`);
    logger.info(`   POST /api/ai/thresholds/recompute`);
    logger.info(`   GET  /api/telegram/config`);
    logger.info(`   POST /api/telegram/config`);
    logger.info(`   GET  /api/telegram/messages`);
    logger.info(`   POST /api/telegram/send`);
    logger.info(`   GET  /api/settings`);
    logger.info(`   POST /api/settings`);
    logger.info(`   GET  /api/polymarket/markets`);
    logger.info(`   GET  /api/polymarket/balance`);
    logger.info(`   GET  /api/polymarket/positions`);
    logger.info(`   GET  /api/polymarket/orders`);
    logger.info(`   GET  /api/polymarket/opportunities`);
    logger.info(`   POST /api/polymarket/analyze`);
    logger.info(`   GET  /api/polymarket/history`);
    logger.info(`   GET  /api/polymarket/stats`);
    logger.info(`   GET  /api/polymarket/leaderboard`);
    logger.info(`   POST /api/polymarket-agent/start`);
    logger.info(`   POST /api/polymarket-agent/stop`);
    logger.info(`   GET  /api/polymarket-agent/status`);
    logger.info(`   GET  /api/polymarket-agent/decisions`);
    logger.info(`   GET  /api/polymarket-agent/trades`);
    logger.info(`   GET  /api/token/info`);
    logger.info(`   GET  /api/token/balance/:address`);
    logger.info(`   GET  /api/token/stats`);
    logger.info(`   POST /api/token/transfer`);
    logger.info(`   GET  /api/staking/pools`);
    logger.info(`   GET  /api/staking/stats`);
    logger.info(`   GET  /api/staking/user/:address`);
    logger.info(`   POST /api/staking/stake`);
    logger.info(`   POST /api/staking/withdraw`);
    logger.info(`   POST /api/staking/claim`);
    logger.info(`   POST /api/arbitrage/simulate`);
    logger.info(`   GET  /health`);
    logger.info(`   GET  /metrics`);
  });

  return httpServer;
}

export { app };
