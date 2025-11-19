/**
 * CLOB Client - TypeScript wrapper for Python CLOB Bridge
 * Provides authenticated access to Polymarket CLOB via Python client
 */

import { logger } from '../utils/logger';

const CLOB_BRIDGE_URL = process.env.CLOB_BRIDGE_URL || 'http://localhost:8001';

export interface ClobOrder {
  id: string;
  marketId: string;
  tokenId: string;
  side: 'BUY' | 'SELL';
  price: number;
  size: number;
  status: string;
  timestamp: number;
}

export interface ClobPosition {
  tokenId: string;
  market: string;
  side: string;
  size: number;
  value: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
}

export interface ClobBalance {
  usdcBalance: number;
  address: string;
}

export interface OrderBook {
  tokenId: string;
  bids: Array<[number, number]>; // [price, size]
  asks: Array<[number, number]>;
  spread: number;
}

export class ClobClient {
  private baseUrl: string;
  private bridgeAvailable: boolean = false;

  constructor() {
    this.baseUrl = CLOB_BRIDGE_URL;
    this.checkBridgeAvailability();
  }

  private async checkBridgeAvailability(): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(2000), // 2 second timeout
      });

      if (response.ok) {
        this.bridgeAvailable = true;
        logger.info('✅ CLOB Bridge is available');
      } else {
        this.bridgeAvailable = false;
        logger.warn('⚠️  CLOB Bridge returned non-OK status');
      }
    } catch (error) {
      this.bridgeAvailable = false;
      logger.warn('⚠️  CLOB Bridge not available. Run: python src/services/clobBridge.py');
    }
  }

  async getBalance(): Promise<ClobBalance | null> {
    if (!this.bridgeAvailable) {
      await this.checkBridgeAvailability();
      if (!this.bridgeAvailable) return null;
    }

    try {
      const response = await fetch(`${this.baseUrl}/balance`);

      if (!response.ok) {
        throw new Error(`CLOB Bridge error: ${response.status}`);
      }

      const data = await response.json();
      return {
        usdcBalance: data.usdc_balance,
        address: data.address,
      };
    } catch (error) {
      logger.error('Failed to fetch CLOB balance:', error);
      return null;
    }
  }

  async getOrders(): Promise<ClobOrder[]> {
    if (!this.bridgeAvailable) {
      await this.checkBridgeAvailability();
      if (!this.bridgeAvailable) return [];
    }

    try {
      const response = await fetch(`${this.baseUrl}/orders`);

      if (!response.ok) {
        throw new Error(`CLOB Bridge error: ${response.status}`);
      }

      const data = await response.json();
      return data.orders.map((order: any) => ({
        id: order.id,
        marketId: order.market_id,
        tokenId: order.token_id,
        side: order.side,
        price: order.price,
        size: order.size,
        status: order.status,
        timestamp: order.timestamp,
      }));
    } catch (error) {
      logger.error('Failed to fetch CLOB orders:', error);
      return [];
    }
  }

  async getPositions(): Promise<ClobPosition[]> {
    if (!this.bridgeAvailable) {
      await this.checkBridgeAvailability();
      if (!this.bridgeAvailable) return [];
    }

    try {
      const response = await fetch(`${this.baseUrl}/positions`);

      if (!response.ok) {
        throw new Error(`CLOB Bridge error: ${response.status}`);
      }

      const data = await response.json();
      return data.positions.map((pos: any) => ({
        tokenId: pos.token_id,
        market: pos.market,
        side: pos.side,
        size: pos.size,
        value: pos.value,
        entryPrice: pos.entry_price,
        currentPrice: pos.current_price,
        pnl: pos.pnl,
      }));
    } catch (error) {
      logger.error('Failed to fetch CLOB positions:', error);
      return [];
    }
  }

  async placeMarketOrder(tokenId: string, side: 'BUY' | 'SELL', amount: number): Promise<{ success: boolean; orderId?: string; error?: string }> {
    if (!this.bridgeAvailable) {
      await this.checkBridgeAvailability();
      if (!this.bridgeAvailable) {
        return { success: false, error: 'CLOB Bridge not available' };
      }
    }

    try {
      const response = await fetch(`${this.baseUrl}/order/market`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token_id: tokenId,
          side,
          amount,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Order placement failed');
      }

      const data = await response.json();
      return {
        success: data.success,
        orderId: data.order_id,
      };
    } catch (error) {
      logger.error('Failed to place market order:', error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  async placeLimitOrder(tokenId: string, side: 'BUY' | 'SELL', amount: number, price: number): Promise<{ success: boolean; orderId?: string; error?: string }> {
    if (!this.bridgeAvailable) {
      await this.checkBridgeAvailability();
      if (!this.bridgeAvailable) {
        return { success: false, error: 'CLOB Bridge not available' };
      }
    }

    try {
      const response = await fetch(`${this.baseUrl}/order/limit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token_id: tokenId,
          side,
          amount,
          price,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Order placement failed');
      }

      const data = await response.json();
      return {
        success: data.success,
        orderId: data.order_id,
      };
    } catch (error) {
      logger.error('Failed to place limit order:', error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  async cancelOrder(orderId: string): Promise<{ success: boolean; error?: string }> {
    if (!this.bridgeAvailable) {
      await this.checkBridgeAvailability();
      if (!this.bridgeAvailable) {
        return { success: false, error: 'CLOB Bridge not available' };
      }
    }

    try {
      const response = await fetch(`${this.baseUrl}/order/${orderId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Order cancellation failed');
      }

      const data = await response.json();
      return { success: data.success };
    } catch (error) {
      logger.error('Failed to cancel order:', error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  async getOrderBook(tokenId: string): Promise<OrderBook | null> {
    if (!this.bridgeAvailable) {
      await this.checkBridgeAvailability();
      if (!this.bridgeAvailable) return null;
    }

    try {
      const response = await fetch(`${this.baseUrl}/markets/${tokenId}/orderbook`);

      if (!response.ok) {
        throw new Error(`CLOB Bridge error: ${response.status}`);
      }

      const data = await response.json();
      return {
        tokenId: data.token_id,
        bids: data.bids,
        asks: data.asks,
        spread: data.spread,
      };
    } catch (error) {
      logger.error('Failed to fetch orderbook:', error);
      return null;
    }
  }

  isBridgeAvailable(): boolean {
    return this.bridgeAvailable;
  }
}

// Export singleton instance
export const clobClient = new ClobClient();
