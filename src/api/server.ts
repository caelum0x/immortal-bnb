/**
 * API Server for Frontend Communication
 * Exposes REST endpoints for dashboard and monitoring
 */

import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
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

const app = express();
const port = CONFIG.API_PORT;

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
  
  app.listen(port, () => {
    logger.info(`🌐 API Server running on http://localhost:${port}`);
    logger.info(`📡 Health check: http://localhost:${port}/api/health`);
  });
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
// END POLYMARKET ENDPOINTS
// =============================================================================
