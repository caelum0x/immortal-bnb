/**
 * API Server for Frontend Communication
 * Exposes REST endpoints for dashboard and monitoring
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import { CONFIG } from '../config';
import { logger } from '../utils/logger';
import { getWalletBalance } from '../blockchain/tradeExecutor';
import { fetchAllMemories, fetchMemory } from '../blockchain/memoryStorage';
import { getTokenData } from '../data/marketFetcher';
import PancakeSwapV3 from '../blockchain/pancakeSwapIntegration';

const app = express();
const port = process.env.API_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    network: CONFIG.TRADING_NETWORK,
    chainId: CONFIG.CHAIN_ID,
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
  app.listen(port, () => {
    logger.info(`🌐 API Server running on http://localhost:${port}`);
    logger.info(`📡 Health check: http://localhost:${port}/api/health`);
  });
}

export default app;
