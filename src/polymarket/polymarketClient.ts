/**
 * Polymarket CLOB Client Wrapper
 *
 * Provides prediction market trading capabilities on Polygon network
 * Integrates with Polymarket's Central Limit Order Book
 * Supports both Proxy (email-based) and Safe (browser wallet) wallets
 */

import { ClobClient, Side, OrderType } from '@polymarket/clob-client';
import { Wallet } from '@ethersproject/wallet';
import { ethers } from 'ethers';
import { logger } from '../utils/logger';
import { CONFIG } from '../config';
import { UnifiedPolymarketWallet, WalletType } from './unifiedWalletManager';

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
  private ethersProjectWallet: Wallet;
  private provider: ethers.JsonRpcProvider;
  private unifiedWallet: UnifiedPolymarketWallet | null = null;
  private useUnifiedWallet: boolean = false;

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
    // ClobClient requires @ethersproject/wallet for compatibility
    this.ethersProjectWallet = new Wallet(this.config.privateKey);

    if (this.config.enabled) {
      this.initializeClient();
      // Initialize unified wallet if wallet type is configured
      if (CONFIG.POLYMARKET_WALLET_TYPE) {
        this.initializeUnifiedWallet();
      }
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

      // ClobClient constructor: (host, chainId, signer?, creds?, signatureType?, funderAddress?, ...)
      this.client = new ClobClient(
        this.config.host,
        this.config.chainId,
        this.ethersProjectWallet
      );

      logger.info(`Polymarket client initialized on chain ${this.config.chainId}`);
    } catch (error) {
      logger.error('Failed to initialize Polymarket client:', error);
      throw error;
    }
  }

  /**
   * Initialize Unified Wallet Manager (Proxy or Safe)
   */
  private async initializeUnifiedWallet(): Promise<void> {
    try {
      const walletType = CONFIG.POLYMARKET_WALLET_TYPE;
      this.unifiedWallet = new UnifiedPolymarketWallet(walletType);
      await this.unifiedWallet.initialize();
      this.useUnifiedWallet = true;
      logger.info(`✅ Unified Polymarket wallet initialized (${walletType})`);
    } catch (error) {
      logger.error('Failed to initialize unified wallet:', error);
      logger.info('Falling back to standard CLOB client');
      this.useUnifiedWallet = false;
    }
  }

  /**
   * Switch wallet type (proxy or safe)
   */
  async switchWalletType(newType: WalletType): Promise<void> {
    if (!this.unifiedWallet) {
      throw new Error('Unified wallet not initialized');
    }
    await this.unifiedWallet.switchWalletType(newType);
    logger.info(`✅ Switched to ${newType} wallet`);
  }

  /**
   * Get current wallet type
   */
  getCurrentWalletType(): WalletType | null {
    return this.unifiedWallet?.getWalletType() || null;
  }

  /**
   * Get wallet information
   */
  getWalletInfo(): any {
    if (this.useUnifiedWallet && this.unifiedWallet) {
      return this.unifiedWallet.getInfo();
    }
    return {
      walletType: 'standard',
      address: this.wallet.address,
      isInitialized: this.client !== null,
    };
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
      const usdcContract = new ethers.Contract(usdcAddress, usdcAbi, this.provider) as any;

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

    const client = this.client; // Type narrowing

    try {
      const marketsPayload = await client.getMarkets();
      const markets = marketsPayload.data || [];

      return markets.slice(0, limit).map((market: any) => ({
        id: market.condition_id || market.id,
        question: market.question || market.title,
        outcomes: market.outcomes || [],
        volume: parseFloat(market.volume || '0'),
        liquidity: parseFloat(market.liquidity || '0'),
        endDate: new Date(market.end_date_iso || market.endDate || Date.now()),
        active: market.active !== false,
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

    const client = this.client; // Type narrowing

    try {
      const market = await client.getMarket(marketId);

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

    const client = this.client; // Type narrowing

    try {
      const orderbook = await client.getOrderBook(marketId);

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

      const bestBid = orderbook.bids[0];
      const bestAsk = orderbook.asks[0];
      
      if (!bestBid || !bestAsk) {
        return null;
      }

      return (bestBid.price + bestAsk.price) / 2;
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

    const client = this.client; // Type narrowing

    try {
      logger.info(`Creating ${params.side} order for market ${params.marketId}: ${params.size} @ ${params.price}`);

      // Get market info to find tokenID
      const market = await client.getMarket(params.marketId);
      if (!market) {
        logger.error(`Market ${params.marketId} not found`);
        return null;
      }

      // Extract tokenID from market (could be in different formats)
      const tokenID = market.token_id || market.tokens?.[params.outcomeIndex || 0] || params.marketId;

      // Create order - ClobClient expects tokenID, not marketId
      const signedOrder = await client.createOrder({
        tokenID: tokenID,
        side: params.side === 'BUY' ? Side.BUY : Side.SELL,
        price: params.price,
        size: params.size,
      });

      // Submit order
      const result = await client.postOrder(signedOrder, OrderType.GTC);
      const orderId = result?.id || result?.hash || JSON.stringify(result);

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

    const client = this.client; // Type narrowing

    try {
      // cancelOrder expects OrderPayload (order hash), try using orderId as hash
      await client.cancelOrder({ hash: orderId } as any);
      logger.info(`Order ${orderId} cancelled successfully`);
      return true;
    } catch (error) {
      // If that fails, try cancelOrders with array
      try {
        await client.cancelOrders([orderId]);
        logger.info(`Order ${orderId} cancelled successfully`);
        return true;
      } catch (error2) {
        logger.error(`Error cancelling order ${orderId}:`, error2);
        return false;
      }
    }
  }

  /**
   * Cancel all orders for a market
   */
  async cancelAllOrders(marketId?: string): Promise<number> {
    if (!this.client) {
      throw new Error('Polymarket client not initialized');
    }

    const client = this.client; // Type narrowing

    try {
      // cancelAll() takes no arguments - cancels all orders
      // For market-specific cancellation, use cancelMarketOrders
      let result: any;
      if (marketId) {
        result = await client.cancelMarketOrders({ tokenID: marketId } as any);
      } else {
        result = await client.cancelAll();
      }
      const cancelledCount = result?.cancelled?.length || result?.length || 0;
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

    const client = this.client; // Type narrowing

    try {
      const params = marketId ? { market: marketId } : undefined;
      const ordersResponse = await client.getOpenOrders(params);
      // getOpenOrders returns OpenOrder[] (array directly)
      return Array.isArray(ordersResponse) ? ordersResponse : [];
    } catch (error) {
      logger.error('Error fetching open orders:', error);
      return [];
    }
  }

  /**
   * Get positions
   * Note: ClobClient doesn't have getPositions, using trades as alternative
   */
  async getPositions(): Promise<PositionInfo[]> {
    if (!this.client) {
      throw new Error('Polymarket client not initialized');
    }

    const client = this.client; // Type narrowing

    try {
      // ClobClient doesn't have getPositions, use getTrades to infer positions
      const trades = await client.getTrades();
      
      // Group trades by token to calculate positions
      const positionsMap = new Map<string, PositionInfo>();
      
      for (const trade of trades || []) {
        const tokenID = trade.asset_id || trade.market;
        if (!tokenID) continue;

        const existing = positionsMap.get(tokenID) || {
          marketId: tokenID,
          outcome: trade.side || 'UNKNOWN',
          size: 0,
          avgPrice: 0,
          unrealizedPnL: 0,
        };

        const tradeSize = parseFloat(trade.size || '0');
        const tradePrice = parseFloat(trade.price || '0');
        
        // Calculate weighted average price
        const totalValue = existing.size * existing.avgPrice + tradeSize * tradePrice;
        existing.size += tradeSize;
        existing.avgPrice = existing.size > 0 ? totalValue / existing.size : 0;

        positionsMap.set(tokenID, existing);
      }

      return Array.from(positionsMap.values());
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

      const bestAsk = orderbook.asks[0];
      if (!bestAsk) {
        logger.error('No asks available for market buy');
        return null;
      }

      // Create order slightly above best ask to ensure fill
      return await this.createOrder({
        marketId,
        side: 'BUY',
        price: bestAsk.price + 0.01,
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

      const bestBid = orderbook.bids[0];
      if (!bestBid) {
        logger.error('No bids available for market sell');
        return null;
      }

      // Create order slightly below best bid to ensure fill
      return await this.createOrder({
        marketId,
        side: 'SELL',
        price: bestBid.price - 0.01,
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

    const client = this.client; // Type narrowing

    try {
      // getServerTime() returns a number (Unix timestamp in seconds)
      const timestamp = await client.getServerTime();
      return new Date(timestamp * 1000);
    } catch (error) {
      logger.error('Error fetching server time:', error);
      return new Date();
    }
  }
}

// Singleton instance
export const polymarketService = new PolymarketService();
