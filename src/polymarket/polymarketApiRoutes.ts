/**
 * Polymarket API Routes
 * REST API endpoints for Polymarket integration
 */

import { Router, type Request, type Response } from 'express';
import { polymarketService } from './polymarketClient.js';
import { polymarketRealtimeService } from './realtimeDataService.js';
import { getWebSocketService } from '../services/websocket.js';
import { logger } from '../utils/logger.js';

const router = Router();

/**
 * GET /api/polymarket/status
 * Get Polymarket integration status
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const enabled = polymarketService.isEnabled();
    const realtimeConnected = polymarketRealtimeService.isConnected();
    const subscriptionCount = polymarketRealtimeService.getSubscriptionCount();

    res.json({
      enabled,
      realtime: {
        connected: realtimeConnected,
        subscriptions: subscriptionCount,
      },
      address: enabled ? polymarketService.getAddress() : null,
    });
  } catch (error) {
    logger.error('Error getting Polymarket status:', error);
    res.status(500).json({ error: 'Failed to get status' });
  }
});

/**
 * GET /api/polymarket/balance
 * Get Polymarket wallet balances (USDC and MATIC)
 */
router.get('/balance', async (req: Request, res: Response) => {
  try {
    if (!polymarketService.isEnabled()) {
      return res.status(503).json({ error: 'Polymarket not enabled' });
    }

    const [usdc, matic] = await Promise.all([
      polymarketService.getUSDCBalance(),
      polymarketService.getMATICBalance(),
    ]);

    res.json({
      usdc,
      matic,
      address: polymarketService.getAddress(),
    });
  } catch (error) {
    logger.error('Error getting Polymarket balance:', error);
    res.status(500).json({ error: 'Failed to get balance' });
  }
});

/**
 * GET /api/polymarket/markets
 * Get active prediction markets
 */
router.get('/markets', async (req: Request, res: Response) => {
  try {
    if (!polymarketService.isEnabled()) {
      return res.status(503).json({ error: 'Polymarket not enabled' });
    }

    const limit = parseInt(req.query.limit as string) || 20;
    const markets = await polymarketService.getActiveMarkets(limit);

    res.json({ markets });
  } catch (error) {
    logger.error('Error getting markets:', error);
    res.status(500).json({ error: 'Failed to get markets' });
  }
});

/**
 * GET /api/polymarket/market/:id
 * Get specific market details
 */
router.get('/market/:id', async (req: Request, res: Response) => {
  try {
    if (!polymarketService.isEnabled()) {
      return res.status(503).json({ error: 'Polymarket not enabled' });
    }

    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'Market ID required' });
    }
    const market = await polymarketService.getMarket(id);

    if (!market) {
      return res.status(404).json({ error: 'Market not found' });
    }

    res.json({ market });
  } catch (error) {
    logger.error(`Error getting market ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to get market' });
  }
});

/**
 * GET /api/polymarket/orderbook/:marketId
 * Get orderbook for a market
 */
router.get('/orderbook/:marketId', async (req: Request, res: Response) => {
  try {
    if (!polymarketService.isEnabled()) {
      return res.status(503).json({ error: 'Polymarket not enabled' });
    }

    const { marketId } = req.params;
    if (!marketId) {
      return res.status(400).json({ error: 'Market ID required' });
    }
    const orderbook = await polymarketService.getOrderBook(marketId);

    if (!orderbook) {
      return res.status(404).json({ error: 'Orderbook not found' });
    }

    res.json({ orderbook });
  } catch (error) {
    logger.error(`Error getting orderbook for ${req.params.marketId}:`, error);
    res.status(500).json({ error: 'Failed to get orderbook' });
  }
});

/**
 * POST /api/polymarket/order
 * Create a new order
 */
router.post('/order', async (req: Request, res: Response) => {
  try {
    if (!polymarketService.isEnabled()) {
      return res.status(503).json({ error: 'Polymarket not enabled' });
    }

    const { marketId, side, price, size, outcomeIndex } = req.body;

    if (!marketId || !side || !price || !size) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const orderId = await polymarketService.createOrder({
      marketId,
      side,
      price: parseFloat(price),
      size: parseFloat(size),
      outcomeIndex: outcomeIndex ? parseInt(outcomeIndex) : undefined,
    });

    if (!orderId) {
      return res.status(500).json({ error: 'Failed to create order' });
    }

    res.json({ orderId, success: true });
  } catch (error) {
    logger.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

/**
 * DELETE /api/polymarket/order/:orderId
 * Cancel an order
 */
router.delete('/order/:orderId', async (req: Request, res: Response) => {
  try {
    if (!polymarketService.isEnabled()) {
      return res.status(503).json({ error: 'Polymarket not enabled' });
    }

    const { orderId } = req.params;
    if (!orderId) {
      return res.status(400).json({ error: 'Order ID required' });
    }
    const success = await polymarketService.cancelOrder(orderId);

    res.json({ success });
  } catch (error) {
    logger.error(`Error cancelling order ${req.params.orderId}:`, error);
    res.status(500).json({ error: 'Failed to cancel order' });
  }
});

/**
 * GET /api/polymarket/orders
 * Get open orders
 */
router.get('/orders', async (req: Request, res: Response) => {
  try {
    if (!polymarketService.isEnabled()) {
      return res.status(503).json({ error: 'Polymarket not enabled' });
    }

    const marketId = req.query.marketId as string | undefined;
    const orders = await polymarketService.getOpenOrders(marketId);

    res.json({ orders });
  } catch (error) {
    logger.error('Error getting orders:', error);
    res.status(500).json({ error: 'Failed to get orders' });
  }
});

/**
 * GET /api/polymarket/positions
 * Get current positions
 */
router.get('/positions', async (req: Request, res: Response) => {
  try {
    if (!polymarketService.isEnabled()) {
      return res.status(503).json({ error: 'Polymarket not enabled' });
    }

    const positions = await polymarketService.getPositions();

    res.json({ positions });
  } catch (error) {
    logger.error('Error getting positions:', error);
    res.status(500).json({ error: 'Failed to get positions' });
  }
});

/**
 * POST /api/polymarket/realtime/start
 * Start real-time data stream
 */
router.post('/realtime/start', (req: Request, res: Response) => {
  try {
    const { tokenIds, marketSlugs, cryptoSymbols, equitySymbols } = req.body;

    const wsService = getWebSocketService();
    if (!wsService) {
      return res.status(503).json({ error: 'WebSocket service not available' });
    }

    wsService.startPolymarketStream({
      tokenIds,
      marketSlugs,
      cryptoSymbols,
      equitySymbols,
    });

    res.json({
      success: true,
      message: 'Real-time data stream started',
      subscriptions: {
        tokenIds: tokenIds?.length || 0,
        marketSlugs: marketSlugs?.length || 0,
        cryptoSymbols: cryptoSymbols?.length || 0,
        equitySymbols: equitySymbols?.length || 0,
      },
    });
  } catch (error) {
    logger.error('Error starting real-time stream:', error);
    res.status(500).json({ error: 'Failed to start real-time stream' });
  }
});

/**
 * POST /api/polymarket/realtime/stop
 * Stop real-time data stream
 */
router.post('/realtime/stop', (req: Request, res: Response) => {
  try {
    const wsService = getWebSocketService();
    if (!wsService) {
      return res.status(503).json({ error: 'WebSocket service not available' });
    }

    wsService.stopPolymarketStream();

    res.json({
      success: true,
      message: 'Real-time data stream stopped',
    });
  } catch (error) {
    logger.error('Error stopping real-time stream:', error);
    res.status(500).json({ error: 'Failed to stop real-time stream' });
  }
});

/**
 * POST /api/polymarket/market-buy
 * Execute market buy order
 */
router.post('/market-buy', async (req: Request, res: Response) => {
  try {
    if (!polymarketService.isEnabled()) {
      return res.status(503).json({ error: 'Polymarket not enabled' });
    }

    const { marketId, amount } = req.body;

    if (!marketId || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const orderId = await polymarketService.marketBuy(marketId, parseFloat(amount));

    if (!orderId) {
      return res.status(500).json({ error: 'Failed to execute market buy' });
    }

    res.json({ orderId, success: true });
  } catch (error) {
    logger.error('Error executing market buy:', error);
    res.status(500).json({ error: 'Failed to execute market buy' });
  }
});

/**
 * POST /api/polymarket/market-sell
 * Execute market sell order
 */
router.post('/market-sell', async (req: Request, res: Response) => {
  try {
    if (!polymarketService.isEnabled()) {
      return res.status(503).json({ error: 'Polymarket not enabled' });
    }

    const { marketId, amount } = req.body;

    if (!marketId || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const orderId = await polymarketService.marketSell(marketId, parseFloat(amount));

    if (!orderId) {
      return res.status(500).json({ error: 'Failed to execute market sell' });
    }

    res.json({ orderId, success: true });
  } catch (error) {
    logger.error('Error executing market sell:', error);
    res.status(500).json({ error: 'Failed to execute market sell' });
  }
});

export default router;
