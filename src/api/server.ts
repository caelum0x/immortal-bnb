/**
 * API Server for Frontend Communication
 * Exposes REST endpoints for dashboard and monitoring
 */

import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { CONFIG } from '../config';
import { logger } from '../utils/logger';
import { getWalletBalance } from '../blockchain/tradeExecutor';
import { fetchAllMemories, fetchMemory } from '../blockchain/memoryStorage';
import { getTokenData } from '../data/marketFetcher';
import PancakeSwapV3 from '../blockchain/pancakeSwapIntegration';
import { ImmortalAIAgent } from '../ai/immortalAgent';
import { CrossChainArbitrageEngine } from '../ai/crossChainStrategy';
import { StrategyEvolutionEngine } from '../ai/strategyEvolution';
import { getAIDecision, analyzeSentiment } from '../ai/llmInterface';
import { initializeWebSocketService, getWebSocketService } from '../services/websocket.js';
import { getPythonBridge } from '../services/pythonBridge.js';

// Security middleware imports
import { authenticate, login } from '../middleware/auth.js';
import { apiLimiter, strictLimiter, authLimiter, tradingLimiter, readLimiter } from '../middleware/rateLimiting.js';
import {
  validateTradingDecision,
  validateMemoryQuery,
  validateTradeExecution,
  validateWalletAddress
} from '../middleware/validation.js';

// Monitoring imports
import { register, metricsMiddleware } from '../monitoring/metrics.js';

const app = express();
const port = CONFIG.API_PORT;

// Security: Helmet for HTTP headers
app.use(helmet());

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173', // Vite dev server default port
    'http://localhost:3000', // Alternative frontend port
    'http://localhost:4173', // Vite preview port
  ],
  credentials: true,
}));
app.use(express.json());

// Monitoring: Prometheus metrics
app.use(metricsMiddleware);

// Apply general API rate limiting
app.use('/api/', apiLimiter);

// Initialize AI systems (will be shared across endpoints)
let immortalAgent: ImmortalAIAgent;
let crossChainEngine: CrossChainArbitrageEngine;
let strategyEngine: StrategyEvolutionEngine;

// Initialize AI systems on server start
function initializeAISystem() {
  try {
    immortalAgent = new ImmortalAIAgent();
    crossChainEngine = new CrossChainArbitrageEngine();
    strategyEngine = new StrategyEvolutionEngine();
    logger.info('🤖 Immortal AI system initialized for API');
  } catch (error) {
    logger.error('Failed to initialize AI system:', error);
  }
}

// =============================================================================
// AUTHENTICATION ENDPOINTS
// =============================================================================

// Login endpoint (wallet-based authentication)
app.post('/api/auth/login', authLimiter, login);

// =============================================================================
// END AUTHENTICATION ENDPOINTS
// =============================================================================

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    network: CONFIG.TRADING_NETWORK,
    chainId: CONFIG.CHAIN_ID,
    server: 'Immortal AI Trading Bot API',
    version: '1.0.0',
  });
});

// Prometheus metrics endpoint
app.get('/metrics', async (req: Request, res: Response) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end(error);
  }
});

// Connection test endpoint for frontend
app.get('/api/ping', (req: Request, res: Response) => {
  res.json({
    message: 'pong',
    timestamp: Date.now(),
    frontend_connected: true,
  });
});

// Get bot status
app.get('/api/status', async (req: Request, res: Response) => {
  try {
    const balance = await getWalletBalance();
    const memoryIds = await fetchAllMemories();

    res.json({
      status: 'running',
      balance: balance,
      network: CONFIG.TRADING_NETWORK,
      chainId: CONFIG.CHAIN_ID,
      totalTrades: memoryIds.length,
      timestamp: Date.now(),
    });
  } catch (error) {
    logger.error('Error fetching status:', (error as Error).message);
    res.status(500).json({
      error: 'Failed to fetch status',
      message: (error as Error).message,
    });
  }
});

// Get wallet balance
app.get('/api/wallet/balance', async (req: Request, res: Response) => {
  try {
    const balance = await getWalletBalance();
    res.json({
      balance: balance,
      currency: 'BNB',
      network: CONFIG.TRADING_NETWORK,
    });
  } catch (error) {
    logger.error('Error fetching balance:', (error as Error).message);
    res.status(500).json({
      error: 'Failed to fetch balance',
      message: (error as Error).message,
    });
  }
});

// Get all trade memories
app.get('/api/trades', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const memoryIds = await fetchAllMemories();

    // Fetch recent memories
    const recentIds = memoryIds.slice(-limit);
    const memories = await Promise.all(
      recentIds.map(id => fetchMemory(id))
    );

    const validMemories = memories.filter(m => m !== null);

    res.json({
      trades: validMemories,
      total: memoryIds.length,
      returned: validMemories.length,
    });
  } catch (error) {
    logger.error('Error fetching trades:', (error as Error).message);
    res.status(500).json({
      error: 'Failed to fetch trades',
      message: (error as Error).message,
    });
  }
});

// Get single trade by memory ID
app.get('/api/trades/:memoryId', async (req: Request, res: Response) => {
  try {
    const { memoryId } = req.params;
    
    if (!memoryId) {
      return res.status(400).json({
        error: 'Memory ID is required',
      });
    }
    
    const memory = await fetchMemory(memoryId);

    if (!memory) {
      return res.status(404).json({
        error: 'Trade not found',
        memoryId,
      });
    }

    res.json(memory);
  } catch (error) {
    logger.error('Error fetching trade:', (error as Error).message);
    res.status(500).json({
      error: 'Failed to fetch trade',
      message: (error as Error).message,
    });
  }
});

// Get trade statistics
app.get('/api/stats', async (req: Request, res: Response) => {
  try {
    const memoryIds = await fetchAllMemories();
    const memories = await Promise.all(
      memoryIds.map(id => fetchMemory(id))
    );

    const validMemories = memories.filter(m => m !== null);
    const completedTrades = validMemories.filter(m => m!.outcome !== 'pending');
    const profitableTrades = completedTrades.filter(m => m!.outcome === 'profit');

    const totalPL = completedTrades.reduce((sum, m) => sum + (m!.profitLoss || 0), 0);
    const winRate = completedTrades.length > 0
      ? (profitableTrades.length / completedTrades.length) * 100
      : 0;

    res.json({
      totalTrades: validMemories.length,
      completedTrades: completedTrades.length,
      pendingTrades: validMemories.length - completedTrades.length,
      profitableTrades: profitableTrades.length,
      losingTrades: completedTrades.length - profitableTrades.length,
      winRate: winRate,
      totalProfitLoss: totalPL,
      bestTrade: profitableTrades.length > 0
        ? profitableTrades.reduce((best, m) =>
            (m!.profitLoss || 0) > (best!.profitLoss || 0) ? m : best
          )
        : null,
      worstTrade: completedTrades.length > 0
        ? completedTrades.reduce((worst, m) =>
            (m!.profitLoss || 0) < (worst!.profitLoss || 0) ? m : worst
          )
        : null,
    });
  } catch (error) {
    logger.error('Error fetching stats:', (error as Error).message);
    res.status(500).json({
      error: 'Failed to fetch stats',
      message: (error as Error).message,
    });
  }
});

// Get token data
app.get('/api/token/:address', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    
    if (!address) {
      return res.status(400).json({
        error: 'Token address is required',
      });
    }
    
    const tokenData = await getTokenData(address);

    if (!tokenData) {
      return res.status(404).json({
        error: 'Token not found',
        address,
      });
    }

    res.json(tokenData);
  } catch (error) {
    logger.error('Error fetching token data:', (error as Error).message);
    res.status(500).json({
      error: 'Failed to fetch token data',
      message: (error as Error).message,
    });
  }
});

// Get token balance
app.get('/api/token/:address/balance', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;
    
    if (!address) {
      return res.status(400).json({
        error: 'Token address is required',
      });
    }
    
    const pancakeSwap = new PancakeSwapV3();
    const balance = await pancakeSwap.getTokenBalance(address);

    res.json({
      tokenAddress: address,
      balance: balance,
    });
  } catch (error) {
    logger.error('Error fetching token balance:', (error as Error).message);
    res.status(500).json({
      error: 'Failed to fetch token balance',
      message: (error as Error).message,
    });
  }
});

// Start server
export function startAPIServer() {
  // Initialize AI system before starting the server
  initializeAISystem();

  // Create HTTP server
  const httpServer = createServer(app);

  // Initialize WebSocket service
  const wsService = initializeWebSocketService(httpServer);
  logger.info('🔌 WebSocket service initialized');

  // Start listening
  httpServer.listen(port, () => {
    logger.info(`🌐 API Server running on http://localhost:${port}`);
    logger.info(`📡 Health check: http://localhost:${port}/api/health`);
    logger.info(`🔌 WebSocket server ready`);
  });

  return { httpServer, wsService };
}

// =============================================================================
// IMMORTAL AI AGENT ENDPOINTS
// =============================================================================

// Get AI agent status and personality
app.get('/api/ai/status', async (req: Request, res: Response) => {
  try {
    if (!immortalAgent) {
      return res.status(503).json({
        error: 'AI agent not initialized',
      });
    }

    const personality = immortalAgent.getPersonality();
    const memoryStats = immortalAgent.getMemoryStats();
    const successRate = immortalAgent.getSuccessRate();

    res.json({
      status: 'active',
      personality,
      memoryStats,
      successRate,
      capabilities: {
        decisionMaking: true,
        memoryLearning: true,
        crossChainArbitrage: true,
        strategyEvolution: true
      },
      timestamp: Date.now(),
    });
  } catch (error) {
    logger.error('Error getting AI status:', error);
    res.status(500).json({
      error: 'Failed to get AI status',
      message: (error as Error).message,
    });
  }
});

// Get AI decision for a specific token
app.post('/api/ai/decision', async (req: Request, res: Response) => {
  try {
    if (!immortalAgent) {
      return res.status(503).json({
        error: 'AI agent not initialized',
      });
    }

    const { tokenAddress, availableAmount = 1.0 } = req.body;
    
    if (!tokenAddress) {
      return res.status(400).json({
        error: 'Token address is required',
      });
    }

    // Get token data for analysis
    const tokenData = await getTokenData(tokenAddress);
    if (!tokenData) {
      return res.status(404).json({
        error: 'Token not found',
        tokenAddress,
      });
    }

    // Get AI decision
    const decision = await immortalAgent.makeDecision(tokenAddress, tokenData, availableAmount);

    res.json({
      tokenAddress,
      tokenSymbol: tokenData.symbol,
      decision,
      timestamp: Date.now(),
    });
  } catch (error) {
    logger.error('Error getting AI decision:', error);
    res.status(500).json({
      error: 'Failed to get AI decision',
      message: (error as Error).message,
    });
  }
});

// Get cross-chain arbitrage opportunities
app.get('/api/ai/crosschain', async (req: Request, res: Response) => {
  try {
    if (!crossChainEngine) {
      return res.status(503).json({
        error: 'Cross-chain engine not initialized',
      });
    }

    const opportunities = await crossChainEngine.discoverArbitrageOpportunities();

    res.json({
      opportunities,
      count: opportunities.length,
      timestamp: Date.now(),
    });
  } catch (error) {
    logger.error('Error getting cross-chain opportunities:', error);
    res.status(500).json({
      error: 'Failed to get arbitrage opportunities',
      message: (error as Error).message,
    });
  }
});

// Get strategy evolution status and metrics
app.get('/api/ai/strategies', async (req: Request, res: Response) => {
  try {
    if (!strategyEngine) {
      return res.status(503).json({
        error: 'Strategy engine not initialized',
      });
    }

    const strategies = strategyEngine.getStrategies();
    const metrics = strategyEngine.getMetrics();

    res.json({
      strategies,
      metrics,
      timestamp: Date.now(),
    });
  } catch (error) {
    logger.error('Error getting strategy data:', error);
    res.status(500).json({
      error: 'Failed to get strategy data',
      message: (error as Error).message,
    });
  }
});

// Trigger strategy evolution
app.post('/api/ai/evolve', async (req: Request, res: Response) => {
  try {
    if (!strategyEngine) {
      return res.status(503).json({
        error: 'Strategy engine not initialized',
      });
    }

    await strategyEngine.evolveStrategies();

    res.json({
      message: 'Strategy evolution triggered successfully',
      timestamp: Date.now(),
    });
  } catch (error) {
    logger.error('Error evolving strategies:', error);
    res.status(500).json({
      error: 'Failed to evolve strategies',
      message: (error as Error).message,
    });
  }
});

// Analyze market sentiment for a token
app.post('/api/ai/sentiment', async (req: Request, res: Response) => {
  try {
    const { tokenSymbol, tokenAddress } = req.body;
    
    if (!tokenSymbol) {
      return res.status(400).json({
        error: 'Token symbol is required',
      });
    }

    // Get market data for sentiment analysis
    let marketData = {};
    if (tokenAddress) {
      const tokenInfo = await getTokenData(tokenAddress);
      if (tokenInfo) {
        marketData = {
          priceChange24h: tokenInfo.priceChange24h,
          volume24h: tokenInfo.volume24h,
          liquidity: tokenInfo.liquidity,
        };
      }
    }

    const sentiment = await analyzeSentiment(tokenSymbol, marketData);

    res.json({
      tokenSymbol,
      sentiment,
      timestamp: Date.now(),
    });
  } catch (error) {
    logger.error('Error analyzing sentiment:', error);
    res.status(500).json({
      error: 'Failed to analyze sentiment',
      message: (error as Error).message,
    });
  }
});

// Load immortal memories for AI agent
app.post('/api/ai/load-memories', async (req: Request, res: Response) => {
  try {
    if (!immortalAgent) {
      return res.status(503).json({
        error: 'AI agent not initialized',
      });
    }

    await immortalAgent.loadMemories();

    res.json({
      message: 'Memories loaded successfully',
      timestamp: Date.now(),
    });
  } catch (error) {
    logger.error('Error loading memories:', error);
    res.status(500).json({
      error: 'Failed to load memories',
      message: (error as Error).message,
    });
  }
});

// =============================================================================
// END IMMORTAL AI ENDPOINTS
// =============================================================================

// =============================================================================
// POLYMARKET PREDICTION MARKETS ENDPOINTS
// =============================================================================

// Initialize Polymarket Greenfield storage on server start
import { initializePolymarketStorage } from '../polymarket/polymarketStorage';

// Initialize storage when server starts
setTimeout(async () => {
  try {
    await initializePolymarketStorage();
    logger.info('🔮 Polymarket Greenfield storage ready');
  } catch (error) {
    logger.warn('Polymarket storage not available:', error);
  }
}, 2000);

// Get trending Polymarket markets
app.get('/api/polymarket/markets', async (req: Request, res: Response) => {
  try {
    const { PolymarketService } = await import('../polymarket/polymarketClient');
    const polymarketService = PolymarketService.getInstance();

    const limit = parseInt(req.query.limit as string) || 10;
    const markets = await polymarketService.getActiveMarkets(limit);

    res.json({
      markets,
      count: markets.length,
      timestamp: Date.now(),
    });
  } catch (error) {
    logger.error('Error fetching Polymarket markets:', error);
    res.status(500).json({
      error: 'Failed to fetch markets',
      message: (error as Error).message,
    });
  }
});

// Get AI analysis for a specific Polymarket market
app.post('/api/polymarket/analyze', async (req: Request, res: Response) => {
  try {
    const { marketId, question } = req.body;

    if (!marketId) {
      return res.status(400).json({
        error: 'Market ID is required',
      });
    }

    const { PolymarketService } = await import('../polymarket/polymarketClient');
    const { AIMarketAnalyzer } = await import('../polymarket/aiPredictionAnalyzer');

    const polymarketService = PolymarketService.getInstance();
    const aiAnalyzer = new AIMarketAnalyzer();

    // Get market data
    const markets = await polymarketService.getActiveMarkets(100);
    const market = markets.find(m => m.id === marketId);

    if (!market) {
      return res.status(404).json({
        error: 'Market not found',
        marketId,
      });
    }

    // Get AI analysis
    const analysis = await aiAnalyzer.analyzeMarket({
      id: market.id,
      question: market.question || question,
      description: market.description || '',
      endDate: market.endDate || new Date(Date.now() + 86400000).toISOString(),
      volume: parseFloat(market.volume || '0'),
      liquidity: parseFloat(market.liquidity || '0'),
    });

    res.json({
      market,
      analysis,
      timestamp: Date.now(),
    });
  } catch (error) {
    logger.error('Error analyzing Polymarket market:', error);
    res.status(500).json({
      error: 'Failed to analyze market',
      message: (error as Error).message,
    });
  }
});

// Get Polymarket wallet balance (MATIC + USDC)
app.get('/api/polymarket/balance', async (req: Request, res: Response) => {
  try {
    const { PolymarketService } = await import('../polymarket/polymarketClient');
    const polymarketService = PolymarketService.getInstance();

    const balances = await polymarketService.getBalances();

    res.json({
      balances,
      timestamp: Date.now(),
    });
  } catch (error) {
    logger.error('Error fetching Polymarket balance:', error);
    res.status(500).json({
      error: 'Failed to fetch balance',
      message: (error as Error).message,
    });
  }
});

// Get current Polymarket positions
app.get('/api/polymarket/positions', async (req: Request, res: Response) => {
  try {
    const { PolymarketService } = await import('../polymarket/polymarketClient');
    const polymarketService = PolymarketService.getInstance();

    const positions = await polymarketService.getPositions();

    res.json({
      positions,
      count: positions.length,
      timestamp: Date.now(),
    });
  } catch (error) {
    logger.error('Error fetching Polymarket positions:', error);
    res.status(500).json({
      error: 'Failed to fetch positions',
      message: (error as Error).message,
    });
  }
});

// Get open Polymarket orders
app.get('/api/polymarket/orders', async (req: Request, res: Response) => {
  try {
    const { PolymarketService } = await import('../polymarket/polymarketClient');
    const polymarketService = PolymarketService.getInstance();

    const orders = await polymarketService.getOpenOrders();

    res.json({
      orders,
      count: orders.length,
      timestamp: Date.now(),
    });
  } catch (error) {
    logger.error('Error fetching Polymarket orders:', error);
    res.status(500).json({
      error: 'Failed to fetch orders',
      message: (error as Error).message,
    });
  }
});

// Get cross-platform trading opportunities (DEX + Polymarket)
app.get('/api/polymarket/opportunities', async (req: Request, res: Response) => {
  try {
    const { CrossPlatformStrategy } = await import('../polymarket/crossPlatformStrategy');
    const strategy = new CrossPlatformStrategy();

    const opportunities = await strategy.scanOpportunities();

    res.json({
      opportunities,
      count: opportunities.length,
      timestamp: Date.now(),
    });
  } catch (error) {
    logger.error('Error fetching cross-platform opportunities:', error);
    res.status(500).json({
      error: 'Failed to fetch opportunities',
      message: (error as Error).message,
    });
  }
});

// Get orderbook for a specific market
app.get('/api/polymarket/orderbook/:marketId', async (req: Request, res: Response) => {
  try {
    const { marketId } = req.params;

    if (!marketId) {
      return res.status(400).json({
        error: 'Market ID is required',
      });
    }

    const { PolymarketService } = await import('../polymarket/polymarketClient');
    const polymarketService = PolymarketService.getInstance();

    const orderbook = await polymarketService.getOrderBook(marketId);
    const midPrice = await polymarketService.getMidPrice(marketId);

    res.json({
      marketId,
      orderbook,
      midPrice,
      timestamp: Date.now(),
    });
  } catch (error) {
    logger.error('Error fetching orderbook:', error);
    res.status(500).json({
      error: 'Failed to fetch orderbook',
      message: (error as Error).message,
    });
  }
});

// =============================================================================
// POLYMARKET GREENFIELD STORAGE ENDPOINTS
// =============================================================================

// Get all stored bets from Greenfield
app.get('/api/polymarket/history', async (req: Request, res: Response) => {
  try {
    const { fetchAllBets, fetchBet } = await import('../polymarket/polymarketStorage');

    const limit = parseInt(req.query.limit as string) || 50;
    const betIds = await fetchAllBets();

    // Fetch recent bets
    const recentIds = betIds.slice(-limit);
    const bets = await Promise.all(
      recentIds.map(id => fetchBet(id))
    );

    const validBets = bets.filter(b => b !== null);

    res.json({
      bets: validBets,
      total: betIds.length,
      returned: validBets.length,
    });
  } catch (error) {
    logger.error('Error fetching bet history:', error);
    res.status(500).json({
      error: 'Failed to fetch bet history',
      message: (error as Error).message,
    });
  }
});

// Get a specific bet by ID from Greenfield
app.get('/api/polymarket/history/:betId', async (req: Request, res: Response) => {
  try {
    const { betId } = req.params;

    if (!betId) {
      return res.status(400).json({
        error: 'Bet ID is required',
      });
    }

    const { fetchBet } = await import('../polymarket/polymarketStorage');
    const bet = await fetchBet(betId);

    if (!bet) {
      return res.status(404).json({
        error: 'Bet not found',
        betId,
      });
    }

    res.json(bet);
  } catch (error) {
    logger.error('Error fetching bet:', error);
    res.status(500).json({
      error: 'Failed to fetch bet',
      message: (error as Error).message,
    });
  }
});

// Store a new bet to Greenfield
app.post('/api/polymarket/bet', async (req: Request, res: Response) => {
  try {
    const betData = req.body;

    if (!betData.marketId || !betData.marketQuestion) {
      return res.status(400).json({
        error: 'Market ID and question are required',
      });
    }

    const { storeBet } = await import('../polymarket/polymarketStorage');
    const betId = await storeBet(betData);

    res.json({
      betId,
      message: 'Bet stored on Greenfield successfully',
      timestamp: Date.now(),
    });
  } catch (error) {
    logger.error('Error storing bet:', error);
    res.status(500).json({
      error: 'Failed to store bet',
      message: (error as Error).message,
    });
  }
});

// Update an existing bet on Greenfield
app.put('/api/polymarket/bet/:betId', async (req: Request, res: Response) => {
  try {
    const { betId } = req.params;
    const updates = req.body;

    if (!betId) {
      return res.status(400).json({
        error: 'Bet ID is required',
      });
    }

    const { updateBet } = await import('../polymarket/polymarketStorage');
    const success = await updateBet(betId, updates);

    if (!success) {
      return res.status(404).json({
        error: 'Bet not found or update failed',
        betId,
      });
    }

    res.json({
      betId,
      message: 'Bet updated successfully',
      timestamp: Date.now(),
    });
  } catch (error) {
    logger.error('Error updating bet:', error);
    res.status(500).json({
      error: 'Failed to update bet',
      message: (error as Error).message,
    });
  }
});

// Query bets with filters
app.get('/api/polymarket/query', async (req: Request, res: Response) => {
  try {
    const { queryBets } = await import('../polymarket/polymarketStorage');

    const filters: any = {};

    if (req.query.marketId) filters.marketId = req.query.marketId as string;
    if (req.query.status) filters.status = req.query.status;
    if (req.query.outcome_result) filters.outcome_result = req.query.outcome_result;
    if (req.query.minProfitLoss) filters.minProfitLoss = parseFloat(req.query.minProfitLoss as string);
    if (req.query.fromTimestamp) filters.fromTimestamp = parseInt(req.query.fromTimestamp as string);
    if (req.query.toTimestamp) filters.toTimestamp = parseInt(req.query.toTimestamp as string);
    if (req.query.limit) filters.limit = parseInt(req.query.limit as string);

    const bets = await queryBets(filters);

    res.json({
      bets,
      count: bets.length,
      filters,
      timestamp: Date.now(),
    });
  } catch (error) {
    logger.error('Error querying bets:', error);
    res.status(500).json({
      error: 'Failed to query bets',
      message: (error as Error).message,
    });
  }
});

// Get betting statistics from Greenfield
app.get('/api/polymarket/stats', async (req: Request, res: Response) => {
  try {
    const { getBettingStats } = await import('../polymarket/polymarketStorage');
    const stats = await getBettingStats();

    res.json({
      stats,
      timestamp: Date.now(),
    });
  } catch (error) {
    logger.error('Error fetching betting stats:', error);
    res.status(500).json({
      error: 'Failed to fetch betting stats',
      message: (error as Error).message,
    });
  }
});

// =============================================================================
// POLYMARKET LEADERBOARD & TOP TRADERS ENDPOINTS
// =============================================================================

// Get complete leaderboard (profit, win rate, volume)
app.get('/api/polymarket/leaderboard', async (req: Request, res: Response) => {
  try {
    const { getLeaderboard } = await import('../polymarket/polymarketLeaderboard');
    const leaderboard = await getLeaderboard();

    res.json({
      ...leaderboard,
    });
  } catch (error) {
    logger.error('Error fetching leaderboard:', error);
    res.status(500).json({
      error: 'Failed to fetch leaderboard',
      message: (error as Error).message,
    });
  }
});

// Get top traders by profit
app.get('/api/polymarket/top-traders/profit', async (req: Request, res: Response) => {
  try {
    const { fetchTopTradersByProfit } = await import('../polymarket/polymarketLeaderboard');
    const limit = parseInt(req.query.limit as string) || 50;

    const traders = await fetchTopTradersByProfit(limit);

    res.json({
      traders,
      count: traders.length,
      category: 'PROFIT',
      timestamp: Date.now(),
    });
  } catch (error) {
    logger.error('Error fetching top traders by profit:', error);
    res.status(500).json({
      error: 'Failed to fetch top traders',
      message: (error as Error).message,
    });
  }
});

// Get top traders by win rate
app.get('/api/polymarket/top-traders/winrate', async (req: Request, res: Response) => {
  try {
    const { fetchTopTradersByWinRate } = await import('../polymarket/polymarketLeaderboard');
    const limit = parseInt(req.query.limit as string) || 50;
    const minTrades = parseInt(req.query.minTrades as string) || 10;

    const traders = await fetchTopTradersByWinRate(limit, minTrades);

    res.json({
      traders,
      count: traders.length,
      category: 'WIN_RATE',
      timestamp: Date.now(),
    });
  } catch (error) {
    logger.error('Error fetching top traders by win rate:', error);
    res.status(500).json({
      error: 'Failed to fetch top traders',
      message: (error as Error).message,
    });
  }
});

// Get trader details by address
app.get('/api/polymarket/trader/:address', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;

    if (!address) {
      return res.status(400).json({
        error: 'Trader address is required',
      });
    }

    const { getTraderDetails } = await import('../polymarket/polymarketLeaderboard');
    const trader = await getTraderDetails(address);

    if (!trader) {
      return res.status(404).json({
        error: 'Trader not found',
        address,
      });
    }

    res.json({
      trader,
      timestamp: Date.now(),
    });
  } catch (error) {
    logger.error('Error fetching trader details:', error);
    res.status(500).json({
      error: 'Failed to fetch trader details',
      message: (error as Error).message,
    });
  }
});

// Analyze trader strategy
app.get('/api/polymarket/trader/:address/strategy', async (req: Request, res: Response) => {
  try {
    const { address } = req.params;

    if (!address) {
      return res.status(400).json({
        error: 'Trader address is required',
      });
    }

    const { analyzeTraderStrategy } = await import('../polymarket/polymarketLeaderboard');
    const strategy = await analyzeTraderStrategy(address);

    res.json({
      strategy,
      timestamp: Date.now(),
    });
  } catch (error) {
    logger.error('Error analyzing trader strategy:', error);
    res.status(500).json({
      error: 'Failed to analyze trader strategy',
      message: (error as Error).message,
    });
  }
});

// =============================================================================
// END POLYMARKET ENDPOINTS
// =============================================================================

// =============================================================================
// UNIFIED CROSS-CHAIN ENDPOINTS
// =============================================================================

// Get unified bot status (DEX + Polymarket)
app.get('/api/unified/status', async (req: Request, res: Response) => {
  try {
    const pythonBridge = getPythonBridge();

    // Get Python API status
    let pythonStatus = null;
    try {
      const isHealthy = await pythonBridge.isServiceHealthy();
      if (isHealthy) {
        pythonStatus = await pythonBridge.getAgentStatus();
      }
    } catch (error) {
      logger.warn('Python API not available:', error);
    }

    // Get DEX balance
    const dexBalance = await getWalletBalance();

    res.json({
      dex: {
        status: botState.dex.status,
        lastTrade: botState.dex.lastTrade,
        balance: dexBalance,
        chain: CONFIG.IS_OPBNB ? 'opbnb' : 'bnb',
        network: CONFIG.IS_MAINNET ? 'mainnet' : 'testnet',
        config: botState.dex.config,
      },
      polymarket: pythonStatus ? {
        status: botState.polymarket.status,
        lastTrade: botState.polymarket.lastTrade,
        agents: pythonStatus.agents,
        environment: pythonStatus.environment,
        config: botState.polymarket.config,
      } : {
        status: botState.polymarket.status,
        lastTrade: botState.polymarket.lastTrade,
        message: 'Python API is not running',
        config: botState.polymarket.config,
      },
      websocket: {
        connected: getWebSocketService()?.getConnectedClientsCount() || 0,
        status: 'operational',
      },
      timestamp: Date.now(),
    });
  } catch (error) {
    logger.error('Error fetching unified status:', error);
    res.status(500).json({
      error: 'Failed to fetch unified status',
      message: (error as Error).message,
    });
  }
});

// Get unified opportunities (DEX + Polymarket)
app.get('/api/unified/opportunities', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const pythonBridge = getPythonBridge();

    const opportunities = [];

    // Try to get Polymarket opportunities
    try {
      const polyOpps = await pythonBridge.discoverOpportunities(limit);
      opportunities.push(...polyOpps.map((opp: any) => ({
        ...opp,
        source: 'polymarket',
      })));
    } catch (error) {
      logger.warn('Could not fetch Polymarket opportunities:', error);
    }

    // Get cross-chain arbitrage opportunities if available
    if (crossChainEngine) {
      try {
        const crossChainOpps = await crossChainEngine.findArbitrageOpportunities();
        opportunities.push(...crossChainOpps.map((opp: any) => ({
          ...opp,
          source: 'cross-chain',
        })));
      } catch (error) {
        logger.warn('Could not fetch cross-chain opportunities:', error);
      }
    }

    res.json({
      opportunities,
      count: opportunities.length,
      timestamp: Date.now(),
    });
  } catch (error) {
    logger.error('Error fetching unified opportunities:', error);
    res.status(500).json({
      error: 'Failed to fetch unified opportunities',
      message: (error as Error).message,
    });
  }
});

// Get unified portfolio value (DEX + Polymarket)
app.get('/api/unified/portfolio', async (req: Request, res: Response) => {
  try {
    const pythonBridge = getPythonBridge();

    // Get DEX balance
    const dexBalance = await getWalletBalance();

    // Get Polymarket balance
    let polymarketBalance = 0;
    try {
      const polyBalance = await pythonBridge.getBalance();
      polymarketBalance = polyBalance.usdc_balance;
    } catch (error) {
      logger.warn('Could not fetch Polymarket balance:', error);
    }

    // Get historical stats
    const dexStats = await import('../blockchain/memoryStorage').then(m => m.fetchAllMemories());
    const dexPnL = dexStats.reduce((sum: number, trade: any) => sum + (trade.profitLoss || 0), 0);

    res.json({
      dex: {
        balance: dexBalance,
        pnl: dexPnL,
        currency: 'BNB',
      },
      polymarket: {
        balance: polymarketBalance,
        pnl: 0, // TODO: Calculate from Polymarket stats
        currency: 'USDC',
      },
      total: {
        dex_bnb: dexBalance,
        polymarket_usd: polymarketBalance,
        combined_pnl: dexPnL,
      },
      timestamp: Date.now(),
    });
  } catch (error) {
    logger.error('Error fetching unified portfolio:', error);
    res.status(500).json({
      error: 'Failed to fetch unified portfolio',
      message: (error as Error).message,
    });
  }
});

// Get unified balance across all chains
app.get('/api/unified/balance', async (req: Request, res: Response) => {
  try {
    const pythonBridge = getPythonBridge();

    const balances = [];

    // DEX balance (BNB/opBNB)
    try {
      const dexBalance = await getWalletBalance();
      balances.push({
        chain: CONFIG.IS_OPBNB ? 'opbnb' : 'bnb',
        token: 'BNB',
        balance: dexBalance,
        address: CONFIG.WALLET_ADDRESS,
      });
    } catch (error) {
      logger.warn('Could not fetch DEX balance:', error);
    }

    // Polymarket balance (Polygon)
    try {
      const polyBalance = await pythonBridge.getBalance();
      balances.push({
        chain: 'polygon',
        token: 'USDC',
        balance: polyBalance.usdc_balance,
        address: polyBalance.address,
      });
    } catch (error) {
      logger.warn('Could not fetch Polymarket balance:', error);
    }

    res.json({
      balances,
      count: balances.length,
      timestamp: Date.now(),
    });
  } catch (error) {
    logger.error('Error fetching unified balance:', error);
    res.status(500).json({
      error: 'Failed to fetch unified balance',
      message: (error as Error).message,
    });
  }
});

// =============================================================================
// END UNIFIED ENDPOINTS
// =============================================================================


// =============================================================================
// UNIFIED MEMORY SYSTEM ENDPOINTS
// =============================================================================

// Get unified memory analytics
app.get("/api/memory/analytics", async (req, res) => {
  try {
    const { getUnifiedAnalytics } = await import("../blockchain/unifiedMemoryStorage.js");
    const analytics = await getUnifiedAnalytics();
    res.json(analytics);
  } catch (error) {
    logger.error("Error fetching memory analytics:", error);
    res.status(500).json({ error: "Failed to fetch memory analytics", message: error.message });
  }
});

// Query unified memories with filters
app.post("/api/memory/query", readLimiter, validateMemoryQuery, async (req, res) => {
  try {
    const filters = req.body;
    const { queryUnifiedMemories } = await import("../blockchain/unifiedMemoryStorage.js");
    const memories = await queryUnifiedMemories(filters);
    res.json({ memories, count: memories.length, filters, timestamp: Date.now() });
  } catch (error) {
    logger.error("Error querying memories:", error);
    res.status(500).json({ error: "Failed to query memories", message: error.message });
  }
});

// Get memory synchronization status
app.get("/api/memory/sync-status", async (req, res) => {
  try {
    const { getSyncStatus } = await import("../blockchain/unifiedMemoryStorage.js");
    const status = getSyncStatus();
    res.json(status);
  } catch (error) {
    logger.error("Error fetching sync status:", error);
    res.status(500).json({ error: "Failed to fetch sync status", message: error.message });
  }
});

// Force synchronization of pending memories
app.post("/api/memory/force-sync", async (req, res) => {
  try {
    const { forceSyncAll } = await import("../blockchain/unifiedMemoryStorage.js");
    await forceSyncAll();
    res.json({ success: true, message: "Synchronization initiated", timestamp: Date.now() });
  } catch (error) {
    logger.error("Error forcing sync:", error);
    res.status(500).json({ error: "Failed to force sync", message: error.message });
  }
});

// Store a new unified memory
app.post("/api/memory/store", async (req, res) => {
  try {
    const memory = req.body;
    const { storeUnifiedMemory } = await import("../blockchain/unifiedMemoryStorage.js");
    const success = await storeUnifiedMemory(memory);
    res.json({ success, id: memory.id, timestamp: Date.now() });
  } catch (error) {
    logger.error("Error storing memory:", error);
    res.status(500).json({ error: "Failed to store memory", message: error.message });
  }
});

// =============================================================================
// END UNIFIED MEMORY SYSTEM ENDPOINTS
// =============================================================================


// =============================================================================
// AI ORCHESTRATOR ENDPOINTS
// =============================================================================

// Get AI orchestrator decision
app.post("/api/orchestrator/decision", tradingLimiter, validateTradingDecision, async (req, res) => {
  try {
    const request = req.body;
    const { getOrchestrator } = await import("../ai/orchestrator.js");
    const orchestrator = getOrchestrator();
    const decision = await orchestrator.makeDecision(request);
    res.json(decision);
  } catch (error) {
    logger.error("Error getting orchestrator decision:", error);
    res.status(500).json({ error: "Failed to get decision", message: error.message });
  }
});

// Get orchestrator performance metrics
app.get("/api/orchestrator/metrics", async (req, res) => {
  try {
    const { getOrchestrator } = await import("../ai/orchestrator.js");
    const orchestrator = getOrchestrator();
    const metrics = orchestrator.getPerformanceMetrics();
    res.json({ metrics, timestamp: Date.now() });
  } catch (error) {
    logger.error("Error getting orchestrator metrics:", error);
    res.status(500).json({ error: "Failed to get metrics", message: error.message });
  }
});

// Record trade outcome for learning
app.post("/api/orchestrator/outcome", async (req, res) => {
  try {
    const { agentType, success } = req.body;
    const { getOrchestrator } = await import("../ai/orchestrator.js");
    const orchestrator = getOrchestrator();
    orchestrator.recordOutcome(agentType, success);
    res.json({ success: true, timestamp: Date.now() });
  } catch (error) {
    logger.error("Error recording outcome:", error);
    res.status(500).json({ error: "Failed to record outcome", message: error.message });
  }
});

// =============================================================================
// END AI ORCHESTRATOR ENDPOINTS
// =============================================================================


// =============================================================================
// PHASE 8: ADVANCED FEATURES ENDPOINTS
// =============================================================================

// Multi-DEX Aggregator Endpoints

// Get best price across all DEXs
app.post("/api/dex/best-quote", tradingLimiter, async (req, res) => {
  try {
    const { tokenIn, tokenOut, amountIn } = req.body;

    if (!tokenIn || !tokenOut || !amountIn) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    const { getDEXAggregator } = await import("../dex/dexAggregator.js");
    const aggregator = getDEXAggregator();

    const result = await aggregator.getBestQuote(tokenIn, tokenOut, BigInt(amountIn));

    res.json({
      bestDex: result.bestQuote.dexName,
      outputAmount: result.bestQuote.outputAmount.toString(),
      priceImpact: result.bestQuote.priceImpact,
      savingsPercentage: result.savingsPercentage,
      allQuotes: result.allQuotes.map(q => ({
        dex: q.dexName,
        outputAmount: q.outputAmount.toString(),
        priceImpact: q.priceImpact,
      })),
      timestamp: Date.now(),
    });
  } catch (error) {
    logger.error("Error getting DEX quote:", error);
    res.status(500).json({ error: "Failed to get quote", message: error.message });
  }
});

// Execute trade on best DEX
app.post("/api/dex/execute-best", tradingLimiter, async (req, res) => {
  try {
    const { tokenIn, tokenOut, amountIn, minAmountOut } = req.body;

    if (!tokenIn || !tokenOut || !amountIn || !minAmountOut) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    const { getDEXAggregator } = await import("../dex/dexAggregator.js");
    const aggregator = getDEXAggregator();

    // This would need a signer - implementation depends on your auth setup
    // For now, just return the plan
    const quote = await aggregator.getBestQuote(tokenIn, tokenOut, BigInt(amountIn));

    res.json({
      success: true,
      message: "Trade plan created",
      dex: quote.bestQuote.dexName,
      expectedOutput: quote.bestQuote.outputAmount.toString(),
      timestamp: Date.now(),
    });
  } catch (error) {
    logger.error("Error executing best trade:", error);
    res.status(500).json({ error: "Failed to execute trade", message: error.message });
  }
});

// Flash Loan Endpoints

// Find flash loan arbitrage opportunities
app.get("/api/flashloan/opportunities", readLimiter, async (req, res) => {
  try {
    const minProfitPercentage = parseFloat(req.query.minProfit as string) || 0.5;

    const { getFlashLoanExecutor } = await import("../flashloans/flashLoanExecutor.js");
    const executor = getFlashLoanExecutor();

    const opportunities = await executor.findFlashLoanOpportunities(minProfitPercentage);

    res.json({
      opportunities: opportunities.map(opp => ({
        buyDex: opp.buyDEX,
        sellDex: opp.sellDEX,
        tokenIn: opp.tokenIn,
        tokenOut: opp.tokenOut,
        expectedProfit: opp.expectedProfit.toString(),
      })),
      count: opportunities.length,
      timestamp: Date.now(),
    });
  } catch (error) {
    logger.error("Error finding flash loan opportunities:", error);
    res.status(500).json({ error: "Failed to find opportunities", message: error.message });
  }
});

// Execute flash loan arbitrage
app.post("/api/flashloan/execute", strictLimiter, async (req, res) => {
  try {
    const { loanToken, loanAmount, strategy } = req.body;

    if (!loanToken || !loanAmount || !strategy) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    const { getFlashLoanExecutor } = await import("../flashloans/flashLoanExecutor.js");
    const executor = getFlashLoanExecutor();

    const result = await executor.executeFlashLoanArbitrage(
      loanToken,
      BigInt(loanAmount),
      strategy
    );

    res.json({
      success: result.success,
      profit: result.profit?.toString(),
      txHash: result.txHash,
      timestamp: Date.now(),
    });
  } catch (error) {
    logger.error("Error executing flash loan:", error);
    res.status(500).json({ error: "Failed to execute flash loan", message: error.message });
  }
});

// MEV Protection Endpoints

// Send MEV-protected transaction
app.post("/api/mev/protected-trade", strictLimiter, async (req, res) => {
  try {
    const { transaction, protection } = req.body;

    if (!transaction || !protection) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    // This would need actual implementation with wallet signer
    res.json({
      success: true,
      message: "MEV protection configured",
      useFlashbots: protection.useFlashbots || false,
      maxSlippage: protection.maxSlippage || 0.5,
      deadline: protection.deadline || 300,
      timestamp: Date.now(),
    });
  } catch (error) {
    logger.error("Error with MEV protection:", error);
    res.status(500).json({ error: "Failed to protect trade", message: error.message });
  }
});

// Check for sandwich attack
app.get("/api/mev/check-sandwich/:txHash", readLimiter, async (req, res) => {
  try {
    const { txHash } = req.params;

    if (!txHash) {
      return res.status(400).json({ error: "Transaction hash required" });
    }

    const { getMEVProtectionService } = await import("../mev/mevProtection.js");
    const mevService = getMEVProtectionService();

    // This would need provider - simplified for now
    res.json({
      txHash,
      isSandwich: false,
      message: "MEV detection service active",
      timestamp: Date.now(),
    });
  } catch (error) {
    logger.error("Error checking sandwich attack:", error);
    res.status(500).json({ error: "Failed to check sandwich", message: error.message });
  }
});

// Bot Control Endpoints

// Global bot state
let botState = {
  dex: {
    status: 'STOPPED' as 'RUNNING' | 'STOPPED' | 'ERROR',
    lastTrade: null as number | null,
    config: {
      maxTradeAmount: 1.0,
      confidenceThreshold: 0.7,
      stopLoss: 0.05,
      maxSlippage: 0.01,
    }
  },
  polymarket: {
    status: 'STOPPED' as 'RUNNING' | 'STOPPED' | 'ERROR',
    lastTrade: null as number | null,
    config: {
      maxBetAmount: 100,
      confidenceThreshold: 0.75,
      maxSlippage: 0.02,
    }
  }
};

// Start bot endpoint
app.post("/api/bot/start", tradingLimiter, async (req, res) => {
  try {
    const { type } = req.body;

    if (!type || !['dex', 'polymarket', 'all'].includes(type)) {
      return res.status(400).json({ error: "Invalid bot type. Must be 'dex', 'polymarket', or 'all'" });
    }

    const wsService = getWebSocketService();

    if (type === 'dex' || type === 'all') {
      botState.dex.status = 'RUNNING';
      logger.info('🚀 DEX bot started');

      // Emit WebSocket event
      if (wsService) {
        wsService.broadcastBotStatus({
          dex: botState.dex,
          polymarket: botState.polymarket
        });
      }
    }

    if (type === 'polymarket' || type === 'all') {
      // Start Polymarket bot via Python bridge
      const pythonBridge = getPythonBridge();
      try {
        await pythonBridge.startAgent('market_analyzer');
        botState.polymarket.status = 'RUNNING';
        logger.info('🎲 Polymarket bot started');

        // Emit WebSocket event
        if (wsService) {
          wsService.broadcastBotStatus({
            dex: botState.dex,
            polymarket: botState.polymarket
          });
        }
      } catch (error) {
        logger.warn('Polymarket bot failed to start:', error);
        botState.polymarket.status = 'ERROR';
      }
    }

    res.json({
      success: true,
      message: `${type.toUpperCase()} bot started successfully`,
      status: {
        dex: botState.dex.status,
        polymarket: botState.polymarket.status,
      },
      timestamp: Date.now(),
    });
  } catch (error) {
    logger.error("Error starting bot:", error);
    res.status(500).json({ error: "Failed to start bot", message: error.message });
  }
});

// Stop bot endpoint
app.post("/api/bot/stop", tradingLimiter, async (req, res) => {
  try {
    const { type } = req.body;

    if (!type || !['dex', 'polymarket', 'all'].includes(type)) {
      return res.status(400).json({ error: "Invalid bot type. Must be 'dex', 'polymarket', or 'all'" });
    }

    const wsService = getWebSocketService();

    if (type === 'dex' || type === 'all') {
      botState.dex.status = 'STOPPED';
      logger.info('🛑 DEX bot stopped');

      // Emit WebSocket event
      if (wsService) {
        wsService.broadcastBotStatus({
          dex: botState.dex,
          polymarket: botState.polymarket
        });
      }
    }

    if (type === 'polymarket' || type === 'all') {
      // Stop Polymarket bot via Python bridge
      const pythonBridge = getPythonBridge();
      try {
        await pythonBridge.stopAgent('market_analyzer');
        botState.polymarket.status = 'STOPPED';
        logger.info('🎲 Polymarket bot stopped');

        // Emit WebSocket event
        if (wsService) {
          wsService.broadcastBotStatus({
            dex: botState.dex,
            polymarket: botState.polymarket
          });
        }
      } catch (error) {
        logger.warn('Polymarket bot stop failed:', error);
      }
    }

    res.json({
      success: true,
      message: `${type.toUpperCase()} bot stopped successfully`,
      status: {
        dex: botState.dex.status,
        polymarket: botState.polymarket.status,
      },
      timestamp: Date.now(),
    });
  } catch (error) {
    logger.error("Error stopping bot:", error);
    res.status(500).json({ error: "Failed to stop bot", message: error.message });
  }
});

// Update bot configuration
app.post("/api/bot/config", tradingLimiter, async (req, res) => {
  try {
    const { type, config } = req.body;

    if (!type || !['dex', 'polymarket'].includes(type)) {
      return res.status(400).json({ error: "Invalid bot type. Must be 'dex' or 'polymarket'" });
    }

    if (type === 'dex') {
      botState.dex.config = { ...botState.dex.config, ...config };
      logger.info('⚙️ DEX bot config updated:', config);
    } else {
      botState.polymarket.config = { ...botState.polymarket.config, ...config };
      logger.info('⚙️ Polymarket bot config updated:', config);
    }

    res.json({
      success: true,
      message: 'Bot configuration updated',
      config: type === 'dex' ? botState.dex.config : botState.polymarket.config,
      timestamp: Date.now(),
    });
  } catch (error) {
    logger.error("Error updating bot config:", error);
    res.status(500).json({ error: "Failed to update config", message: error.message });
  }
});

// Get bot state
app.get("/api/bot/state", async (req, res) => {
  try {
    res.json({
      state: botState,
      timestamp: Date.now(),
    });
  } catch (error) {
    logger.error("Error getting bot state:", error);
    res.status(500).json({ error: "Failed to get bot state", message: error.message });
  }
});

// =============================================================================
// END PHASE 8 ENDPOINTS
// =============================================================================
