/**
 * Cross-Chain Arbitrage API Routes
 * Wormhole bridge and arbitrage endpoints
 */

import express from 'express';
import { wormholeService } from '../crossChain/wormholeService';
import { logger } from '../utils/logger';

const router = express.Router();

/**
 * GET /api/cross-chain/status
 * Get Wormhole bridge status
 */
router.get('/status', (req, res) => {
  try {
    const stats = wormholeService.getStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Error getting cross-chain status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get cross-chain status',
    });
  }
});

/**
 * GET /api/cross-chain/supported-tokens
 * Get list of tokens supported for bridging
 */
router.get('/supported-tokens', (req, res) => {
  try {
    const tokens = wormholeService.getSupportedTokens();

    res.json({
      success: true,
      data: {
        tokens,
        count: tokens.length,
      },
    });
  } catch (error) {
    logger.error('Error getting supported tokens:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get supported tokens',
    });
  }
});

/**
 * POST /api/cross-chain/quote
 * Get quote for cross-chain transfer
 */
router.post('/quote', async (req, res) => {
  try {
    const { sourceChain, targetChain, token, amount, recipient } = req.body;

    if (!sourceChain || !targetChain || !token || !amount || !recipient) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters',
      });
    }

    const quote = await wormholeService.getQuote({
      sourceChain,
      targetChain,
      token,
      amount,
      recipient,
    });

    res.json({
      success: true,
      data: quote,
    });
  } catch (error) {
    logger.error('Error getting quote:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get quote',
    });
  }
});

/**
 * POST /api/cross-chain/transfer
 * Execute cross-chain transfer
 */
router.post('/transfer', async (req, res) => {
  try {
    const { sourceChain, targetChain, token, amount, recipient } = req.body;

    if (!sourceChain || !targetChain || !token || !amount || !recipient) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters',
      });
    }

    logger.info(`🌉 Initiating cross-chain transfer: ${amount} ${token} from ${sourceChain} to ${targetChain}`);

    const status = await wormholeService.transferTokens({
      sourceChain,
      targetChain,
      token,
      amount,
      recipient,
    });

    res.json({
      success: status.status !== 'failed',
      data: status,
    });
  } catch (error) {
    logger.error('Error executing transfer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to execute transfer',
    });
  }
});

/**
 * GET /api/cross-chain/transfer/:txHash
 * Check status of cross-chain transfer
 */
router.get('/transfer/:txHash', async (req, res) => {
  try {
    const { txHash } = req.params;

    if (!txHash) {
      return res.status(400).json({
        success: false,
        error: 'Transaction hash is required',
      });
    }

    const status = await wormholeService.checkTransferStatus(txHash);

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    logger.error('Error checking transfer status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check transfer status',
    });
  }
});

/**
 * POST /api/cross-chain/arbitrage/opportunity
 * Calculate arbitrage opportunity for a token
 */
router.post('/arbitrage/opportunity', async (req, res) => {
  try {
    const { token, amount } = req.body;

    if (!token || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Token and amount are required',
      });
    }

    const opportunity = await wormholeService.calculateArbitrageOpportunity(token, amount);

    res.json({
      success: true,
      data: opportunity,
    });
  } catch (error) {
    logger.error('Error calculating arbitrage opportunity:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate arbitrage opportunity',
    });
  }
});

/**
 * POST /api/cross-chain/arbitrage/execute
 * Execute arbitrage trade
 */
router.post('/arbitrage/execute', async (req, res) => {
  try {
    const { token, amount } = req.body;

    if (!token || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Token and amount are required',
      });
    }

    logger.info(`🔄 Executing arbitrage: ${amount} ${token}`);

    const result = await wormholeService.executeArbitrage(token, amount);

    res.json({
      success: result.success,
      data: result,
    });
  } catch (error) {
    logger.error('Error executing arbitrage:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to execute arbitrage',
    });
  }
});

/**
 * GET /api/cross-chain/arbitrage/opportunities
 * Get current arbitrage opportunities (SSE stream)
 */
router.get('/arbitrage/opportunities', async (req, res) => {
  try {
    // Set headers for Server-Sent Events
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Get tokens to monitor from query params
    const tokens = req.query.tokens
      ? (req.query.tokens as string).split(',')
      : ['USDC', 'USDT', 'ETH'];

    const minProfit = req.query.minProfit
      ? parseFloat(req.query.minProfit as string)
      : 0.5;

    logger.info(`📡 Starting arbitrage opportunity stream for: ${tokens.join(', ')}`);

    // Stream opportunities
    const opportunityGenerator = wormholeService.monitorArbitrageOpportunities(
      tokens,
      minProfit
    );

    // Send initial connection success
    res.write(`data: ${JSON.stringify({ type: 'connected', message: 'Monitoring started' })}\n\n`);

    // Iterate through opportunities
    for await (const opportunity of opportunityGenerator) {
      res.write(`data: ${JSON.stringify({
        type: 'opportunity',
        data: opportunity,
        timestamp: Date.now(),
      })}\n\n`);
    }
  } catch (error) {
    logger.error('Error streaming opportunities:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to stream opportunities',
    });
  }
});

export default router;
