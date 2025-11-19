/**
 * Polymarket Service - Real API Integration
 * Connects to actual Polymarket Gamma API and CLOB
 */

import { logger } from '../utils/logger';

const GAMMA_API_URL = 'https://gamma-api.polymarket.com';
const CLOB_API_URL = 'https://clob.polymarket.com';

export interface PolymarketMarket {
  id: string;
  question: string;
  category: string;
  volume24h: number;
  liquidity: number;
  yesPrice: number;
  noPrice: number;
  endDate: number;
  active: boolean;
  outcomes: string[];
  outcomePrices: number[];
  tags?: string[];
  description?: string;
  image?: string;
}

export interface PolymarketPosition {
  marketId: string;
  market: string;
  side: 'yes' | 'no';
  shares: number;
  avgPrice: number;
  currentPrice: number;
  pnl: number;
  roi: number;
}

export interface PolymarketOrder {
  id: string;
  marketId: string;
  market: string;
  side: 'yes' | 'no';
  price: number;
  size: number;
  status: 'open' | 'filled' | 'cancelled';
  timestamp: number;
}

export class PolymarketService {
  private gammaApiUrl: string;
  private clobApiUrl: string;

  constructor() {
    this.gammaApiUrl = GAMMA_API_URL;
    this.clobApiUrl = CLOB_API_URL;
  }

  /**
   * Get trending markets from Polymarket Gamma API
   */
  async getMarkets(limit: number = 10): Promise<PolymarketMarket[]> {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        active: 'true',
        closed: 'false',
        offset: '0',
      });

      const response = await fetch(`${this.gammaApiUrl}/markets?${params}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Gamma API returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Transform Gamma API response to our format
      return data.map((market: any) => {
        const outcomePrices = typeof market.outcomePrices === 'string'
          ? JSON.parse(market.outcomePrices)
          : market.outcomePrices || [];

        return {
          id: market.id || market.condition_id || `market_${Date.now()}`,
          question: market.question || 'Unknown Market',
          category: market.category || 'Uncategorized',
          volume24h: parseFloat(market.volume || market.volume24hr || '0'),
          liquidity: parseFloat(market.liquidity || '0'),
          yesPrice: outcomePrices[0] || 0.5,
          noPrice: outcomePrices[1] || 0.5,
          endDate: market.end_date_iso
            ? new Date(market.end_date_iso).getTime()
            : Date.now() + 30 * 24 * 60 * 60 * 1000,
          active: market.active === true || market.closed === false,
          outcomes: market.outcomes || ['Yes', 'No'],
          outcomePrices,
          tags: market.tags || [],
          description: market.description || '',
          image: market.image || market.icon || '',
        };
      });
    } catch (error) {
      logger.error('Failed to fetch Polymarket markets from Gamma API:', error);
      throw new Error(`Polymarket API error: ${(error as Error).message}`);
    }
  }

  /**
   * Get market by ID from Gamma API
   */
  async getMarket(marketId: string): Promise<PolymarketMarket | null> {
    try {
      const response = await fetch(`${this.gammaApiUrl}/markets/${marketId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Gamma API returned ${response.status}`);
      }

      const market = await response.json();
      const outcomePrices = typeof market.outcomePrices === 'string'
        ? JSON.parse(market.outcomePrices)
        : market.outcomePrices || [];

      return {
        id: market.id || market.condition_id,
        question: market.question,
        category: market.category || 'Uncategorized',
        volume24h: parseFloat(market.volume || '0'),
        liquidity: parseFloat(market.liquidity || '0'),
        yesPrice: outcomePrices[0] || 0.5,
        noPrice: outcomePrices[1] || 0.5,
        endDate: market.end_date_iso
          ? new Date(market.end_date_iso).getTime()
          : Date.now() + 30 * 24 * 60 * 60 * 1000,
        active: market.active === true,
        outcomes: market.outcomes || ['Yes', 'No'],
        outcomePrices,
        tags: market.tags || [],
        description: market.description || '',
        image: market.image || market.icon || '',
      };
    } catch (error) {
      logger.error(`Failed to fetch market ${marketId}:`, error);
      return null;
    }
  }

  /**
   * Get wallet balance on Polygon (USDC)
   * Requires wallet address
   */
  async getBalance(walletAddress?: string): Promise<{
    usdc: number;
    usdcLocked: number;
    totalValue: number;
    address: string;
  }> {
    try {
      const address = walletAddress || process.env.POLYGON_WALLET_ADDRESS;

      if (!address) {
        logger.warn('No Polygon wallet address configured');
        return {
          usdc: 0,
          usdcLocked: 0,
          totalValue: 0,
          address: 'Not configured',
        };
      }

      // Query Polygon for USDC balance
      // USDC on Polygon: 0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174
      const USDC_ADDRESS = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174';
      const POLYGON_RPC = process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com';

      const response = await fetch(POLYGON_RPC, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_call',
          params: [
            {
              to: USDC_ADDRESS,
              data: `0x70a08231000000000000000000000000${address.substring(2)}`, // balanceOf(address)
            },
            'latest',
          ],
        }),
      });

      const data = await response.json();
      const balance = data.result ? parseInt(data.result, 16) / 1e6 : 0; // USDC has 6 decimals

      return {
        usdc: balance,
        usdcLocked: 0, // Would need to query CLOB for active orders
        totalValue: balance,
        address,
      };
    } catch (error) {
      logger.error('Failed to fetch Polymarket balance:', error);
      throw new Error(`Balance fetch error: ${(error as Error).message}`);
    }
  }

  /**
   * Get events from Gamma API
   */
  async getEvents(limit: number = 10): Promise<any[]> {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: '0',
      });

      const response = await fetch(`${this.gammaApiUrl}/events?${params}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Gamma API returned ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('Failed to fetch Polymarket events:', error);
      return [];
    }
  }

  /**
   * Search markets by query
   */
  async searchMarkets(query: string, limit: number = 10): Promise<PolymarketMarket[]> {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        active: 'true',
        closed: 'false',
        offset: '0',
      });

      const response = await fetch(`${this.gammaApiUrl}/markets?${params}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Gamma API returned ${response.status}`);
      }

      const data = await response.json();

      // Filter by query (case-insensitive search in question and description)
      const filtered = data.filter((market: any) =>
        market.question?.toLowerCase().includes(query.toLowerCase()) ||
        market.description?.toLowerCase().includes(query.toLowerCase())
      );

      return filtered.slice(0, limit).map((market: any) => {
        const outcomePrices = typeof market.outcomePrices === 'string'
          ? JSON.parse(market.outcomePrices)
          : market.outcomePrices || [];

        return {
          id: market.id || market.condition_id,
          question: market.question,
          category: market.category || 'Uncategorized',
          volume24h: parseFloat(market.volume || '0'),
          liquidity: parseFloat(market.liquidity || '0'),
          yesPrice: outcomePrices[0] || 0.5,
          noPrice: outcomePrices[1] || 0.5,
          endDate: market.end_date_iso
            ? new Date(market.end_date_iso).getTime()
            : Date.now() + 30 * 24 * 60 * 60 * 1000,
          active: market.active === true,
          outcomes: market.outcomes || ['Yes', 'No'],
          outcomePrices,
          tags: market.tags || [],
          description: market.description || '',
          image: market.image || '',
        };
      });
    } catch (error) {
      logger.error('Failed to search Polymarket markets:', error);
      return [];
    }
  }

  /**
   * Get markets by category
   */
  async getMarketsByCategory(category: string, limit: number = 10): Promise<PolymarketMarket[]> {
    try {
      const markets = await this.getMarkets(limit * 2); // Get more to filter
      return markets
        .filter(m => m.category.toLowerCase() === category.toLowerCase())
        .slice(0, limit);
    } catch (error) {
      logger.error(`Failed to fetch markets for category ${category}:`, error);
      return [];
    }
  }
}

// Export singleton instance
export const polymarketService = new PolymarketService();
