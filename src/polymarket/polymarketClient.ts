/**
 * Polymarket CLOB Client Wrapper
 *
 * Provides prediction market trading capabilities on Polygon network
 * Integrates with Polymarket's Central Limit Order Book
 */

import { ClobClient, Side, OrderType } from '@polymarket/clob-client';
import { ethers } from 'ethers';
import { logger } from '../utils/logger';
import { CONFIG } from '../config';

export interface PolymarketConfig {
  host: string;
  chainId: number;
  privateKey: string;
  enabled: boolean;
}

export interface MarketInfo {
  id: string;
  question: string;
  outcomes: string[];
  volume: number;
  liquidity: number;
  endDate: Date;
  active: boolean;
}

export interface OrderBook {
  marketId: string;
  bids: { price: number; size: number }[];
  asks: { price: number; size: number }[];
}

export interface CreateOrderParams {
  marketId: string;
  side: 'BUY' | 'SELL';
  price: number; // Probability between 0 and 1
  size: number; // Amount in outcome tokens
  outcomeIndex?: number; // For multi-outcome markets
}

export interface PositionInfo {
  marketId: string;
  outcome: string;
  size: number;
  avgPrice: number;
  unrealizedPnL: number;
}

export class PolymarketService {
  private client: ClobClient | null = null;
  private config: PolymarketConfig;
  private wallet: ethers.Wallet;
  private provider: ethers.JsonRpcProvider;

  constructor() {
    this.config = {
      host: process.env.POLYMARKET_HOST || 'https://clob.polymarket.com',
      chainId: parseInt(process.env.POLYMARKET_CHAIN_ID || '137'), // Polygon mainnet
      privateKey: process.env.WALLET_PRIVATE_KEY || '',
      enabled: process.env.POLYMARKET_ENABLED === 'true',
    };

    // Initialize Polygon provider
    const polygonRPC = process.env.POLYGON_RPC || 'https://polygon-rpc.com';
    this.provider = new ethers.JsonRpcProvider(polygonRPC);
    this.wallet = new ethers.Wallet(this.config.privateKey, this.provider);

    if (this.config.enabled) {
      this.initializeClient();
    }
  }

  /**
   * Initialize Polymarket CLOB client
   */
  private initializeClient(): void {
    try {
      if (!this.config.privateKey) {
        logger.warn('Polymarket: No private key provided, client not initialized');
        return;
      }

      this.client = new ClobClient({
        host: this.config.host,
        chainId: this.config.chainId,
        privateKey: this.config.privateKey,
      });

      logger.info(`Polymarket client initialized on chain ${this.config.chainId}`);
    } catch (error) {
      logger.error('Failed to initialize Polymarket client:', error);
      throw error;
    }
  }

  /**
   * Check if Polymarket integration is enabled and ready
   */
  isEnabled(): boolean {
    return this.config.enabled && this.client !== null;
  }

  /**
   * Get wallet address
   */
  getAddress(): string {
    return this.wallet.address;
  }

  /**
   * Get USDC balance on Polygon
   */
  async getUSDCBalance(): Promise<number> {
    try {
      const usdcAddress = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174'; // USDC on Polygon
      const usdcAbi = ['function balanceOf(address) view returns (uint256)'];
      const usdcContract = new ethers.Contract(usdcAddress, usdcAbi, this.provider);

      const balance = await usdcContract.balanceOf(this.wallet.address);
      return parseFloat(ethers.formatUnits(balance, 6)); // USDC has 6 decimals
    } catch (error) {
      logger.error('Error fetching USDC balance:', error);
      return 0;
    }
  }

  /**
   * Get MATIC balance for gas
   */
  async getMATICBalance(): Promise<number> {
    try {
      const balance = await this.provider.getBalance(this.wallet.address);
      return parseFloat(ethers.formatEther(balance));
    } catch (error) {
      logger.error('Error fetching MATIC balance:', error);
      return 0;
    }
  }

  /**
   * Get active markets
   */
  async getActiveMarkets(limit: number = 20): Promise<MarketInfo[]> {
    if (!this.client) {
      throw new Error('Polymarket client not initialized');
    }

    try {
      const markets = await this.client.getMarkets();

      return markets.slice(0, limit).map((market: any) => ({
        id: market.condition_id,
        question: market.question,
        outcomes: market.outcomes || [],
        volume: parseFloat(market.volume || '0'),
        liquidity: parseFloat(market.liquidity || '0'),
        endDate: new Date(market.end_date_iso),
        active: market.active,
      }));
    } catch (error) {
      logger.error('Error fetching markets:', error);
      throw error;
    }
  }

  /**
   * Get specific market information
   */
  async getMarket(marketId: string): Promise<MarketInfo | null> {
    if (!this.client) {
      throw new Error('Polymarket client not initialized');
    }

    try {
      const market = await this.client.getMarket(marketId);

      if (!market) return null;

      return {
        id: market.condition_id,
        question: market.question,
        outcomes: market.outcomes || [],
        volume: parseFloat(market.volume || '0'),
        liquidity: parseFloat(market.liquidity || '0'),
        endDate: new Date(market.end_date_iso),
        active: market.active,
      };
    } catch (error) {
      logger.error(`Error fetching market ${marketId}:`, error);
      return null;
    }
  }

  /**
   * Get orderbook for a market
   */
  async getOrderBook(marketId: string): Promise<OrderBook | null> {
    if (!this.client) {
      throw new Error('Polymarket client not initialized');
    }

    try {
      const orderbook = await this.client.getOrderBook(marketId);

      return {
        marketId,
        bids: orderbook.bids.map((bid: any) => ({
          price: parseFloat(bid.price),
          size: parseFloat(bid.size),
        })),
        asks: orderbook.asks.map((ask: any) => ({
          price: parseFloat(ask.price),
          size: parseFloat(ask.size),
        })),
      };
    } catch (error) {
      logger.error(`Error fetching orderbook for ${marketId}:`, error);
      return null;
    }
  }

  /**
   * Get mid price for a market (between best bid and best ask)
   */
  async getMidPrice(marketId: string): Promise<number | null> {
    try {
      const orderbook = await this.getOrderBook(marketId);
      if (!orderbook || orderbook.bids.length === 0 || orderbook.asks.length === 0) {
        return null;
      }

      const bestBid = orderbook.bids[0].price;
      const bestAsk = orderbook.asks[0].price;

      return (bestBid + bestAsk) / 2;
    } catch (error) {
      logger.error(`Error calculating mid price for ${marketId}:`, error);
      return null;
    }
  }

  /**
   * Create and submit a limit order
   */
  async createOrder(params: CreateOrderParams): Promise<string | null> {
    if (!this.client) {
      throw new Error('Polymarket client not initialized');
    }

    try {
      logger.info(`Creating ${params.side} order for market ${params.marketId}: ${params.size} @ ${params.price}`);

      // Create order
      const order = {
        marketId: params.marketId,
        side: params.side as Side,
        price: params.price,
        size: params.size,
        orderType: OrderType.GTC, // Good Till Cancelled
        outcomeIndex: params.outcomeIndex || 0,
      };

      // Sign and submit order
      const signedOrder = await this.client.createOrder(order);
      const orderId = await this.client.postOrder(signedOrder);

      logger.info(`Order created successfully: ${orderId}`);
      return orderId;

    } catch (error) {
      logger.error('Error creating order:', error);
      return null;
    }
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: string): Promise<boolean> {
    if (!this.client) {
      throw new Error('Polymarket client not initialized');
    }

    try {
      await this.client.cancelOrder(orderId);
      logger.info(`Order ${orderId} cancelled successfully`);
      return true;
    } catch (error) {
      logger.error(`Error cancelling order ${orderId}:`, error);
      return false;
    }
  }

  /**
   * Cancel all orders for a market
   */
  async cancelAllOrders(marketId?: string): Promise<number> {
    if (!this.client) {
      throw new Error('Polymarket client not initialized');
    }

    try {
      const result = await this.client.cancelAll(marketId);
      const cancelledCount = result.cancelled?.length || 0;
      logger.info(`Cancelled ${cancelledCount} orders`);
      return cancelledCount;
    } catch (error) {
      logger.error('Error cancelling all orders:', error);
      return 0;
    }
  }

  /**
   * Get open orders
   */
  async getOpenOrders(marketId?: string): Promise<any[]> {
    if (!this.client) {
      throw new Error('Polymarket client not initialized');
    }

    try {
      const orders = await this.client.getOrders({ market: marketId });
      return orders || [];
    } catch (error) {
      logger.error('Error fetching open orders:', error);
      return [];
    }
  }

  /**
   * Get positions
   */
  async getPositions(): Promise<PositionInfo[]> {
    if (!this.client) {
      throw new Error('Polymarket client not initialized');
    }

    try {
      const positions = await this.client.getPositions();

      return positions.map((pos: any) => ({
        marketId: pos.market,
        outcome: pos.outcome,
        size: parseFloat(pos.size),
        avgPrice: parseFloat(pos.avgPrice),
        unrealizedPnL: parseFloat(pos.unrealizedPnL || '0'),
      }));
    } catch (error) {
      logger.error('Error fetching positions:', error);
      return [];
    }
  }

  /**
   * Execute market buy order (buy at best ask)
   */
  async marketBuy(marketId: string, amount: number): Promise<string | null> {
    try {
      const orderbook = await this.getOrderBook(marketId);
      if (!orderbook || orderbook.asks.length === 0) {
        logger.error('No asks available for market buy');
        return null;
      }

      const bestAsk = orderbook.asks[0].price;

      // Create order slightly above best ask to ensure fill
      return await this.createOrder({
        marketId,
        side: 'BUY',
        price: bestAsk + 0.01,
        size: amount,
      });
    } catch (error) {
      logger.error('Error executing market buy:', error);
      return null;
    }
  }

  /**
   * Execute market sell order (sell at best bid)
   */
  async marketSell(marketId: string, amount: number): Promise<string | null> {
    try {
      const orderbook = await this.getOrderBook(marketId);
      if (!orderbook || orderbook.bids.length === 0) {
        logger.error('No bids available for market sell');
        return null;
      }

      const bestBid = orderbook.bids[0].price;

      // Create order slightly below best bid to ensure fill
      return await this.createOrder({
        marketId,
        side: 'SELL',
        price: bestBid - 0.01,
        size: amount,
      });
    } catch (error) {
      logger.error('Error executing market sell:', error);
      return null;
    }
  }

  /**
   * Get server time for synchronization
   */
  async getServerTime(): Promise<Date> {
    if (!this.client) {
      throw new Error('Polymarket client not initialized');
    }

    try {
      const time = await this.client.getServerTime();
      return new Date(time.timestamp * 1000);
    } catch (error) {
      logger.error('Error fetching server time:', error);
      return new Date();
    }
  }
}

// Singleton instance
export const polymarketService = new PolymarketService();
