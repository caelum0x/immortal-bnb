/**
 * Polymarket Market Data Fetcher
 *
 * Fetches and analyzes prediction market data from Polymarket
 * Provides structured data for AI decision-making
 */

import { polymarketService } from './polymarketClient';
import type { MarketInfo, OrderBook } from './polymarketClient';
import { logger } from '../utils/logger';

export interface MarketOpportunity {
  marketId: string;
  question: string;
  signal: 'BUY' | 'SELL' | 'NEUTRAL';
  confidence: number;
  currentPrice: number;
  volume: number;
  liquidity: number;
  spread: number;
  timeUntilClose: number; // hours
  reasoning: string;
}

export interface MarketStats {
  totalMarkets: number;
  totalVolume: number;
  totalLiquidity: number;
  avgSpread: number;
  topMarkets: MarketInfo[];
}

export class PolymarketDataFetcher {
  /**
   * Get trending/high volume markets
   */
  async getTrendingMarkets(limit: number = 10): Promise<MarketInfo[]> {
    try {
      logger.info(`Fetching top ${limit} trending markets from Polymarket...`);

      const markets = await polymarketService.getActiveMarkets(100);

      // Sort by volume (highest first)
      const sortedByVolume = markets.sort((a, b) => b.volume - a.volume);

      return sortedByVolume.slice(0, limit);
    } catch (error) {
      logger.error('Error fetching trending markets:', error);
      return [];
    }
  }

  /**
   * Get markets with high liquidity
   */
  async getLiquidMarkets(minLiquidity: number = 1000, limit: number = 10): Promise<MarketInfo[]> {
    try {
      logger.info(`Fetching markets with liquidity > $${minLiquidity}...`);

      const markets = await polymarketService.getActiveMarkets(100);

      // Filter by liquidity and sort
      const liquidMarkets = markets
        .filter(m => m.liquidity >= minLiquidity)
        .sort((a, b) => b.liquidity - a.liquidity);

      return liquidMarkets.slice(0, limit);
    } catch (error) {
      logger.error('Error fetching liquid markets:', error);
      return [];
    }
  }

  /**
   * Get markets closing soon (within X hours)
   */
  async getExpiringMarkets(hoursUntilClose: number = 24, limit: number = 10): Promise<MarketInfo[]> {
    try {
      logger.info(`Fetching markets closing within ${hoursUntilClose} hours...`);

      const markets = await polymarketService.getActiveMarkets(100);
      const now = new Date();
      const cutoff = new Date(now.getTime() + hoursUntilClose * 60 * 60 * 1000);

      // Filter markets closing soon
      const expiringMarkets = markets
        .filter(m => m.endDate <= cutoff && m.endDate > now)
        .sort((a, b) => a.endDate.getTime() - b.endDate.getTime());

      return expiringMarkets.slice(0, limit);
    } catch (error) {
      logger.error('Error fetching expiring markets:', error);
      return [];
    }
  }

  /**
   * Analyze a specific market for trading opportunities
   */
  async analyzeMarket(marketId: string): Promise<MarketOpportunity | null> {
    try {
      // Get market info
      const market = await polymarketService.getMarket(marketId);
      if (!market) {
        logger.warn(`Market ${marketId} not found`);
        return null;
      }

      // Get orderbook
      const orderbook = await polymarketService.getOrderBook(marketId);
      if (!orderbook || orderbook.bids.length === 0 || orderbook.asks.length === 0) {
        logger.warn(`Insufficient orderbook data for market ${marketId}`);
        return null;
      }

      // Calculate metrics
      const bestBid = orderbook.bids?.[0]?.price;
      const bestAsk = orderbook.asks?.[0]?.price;
      
      if (!bestBid || !bestAsk) {
        throw new Error('Invalid orderbook data');
      }
      const midPrice = (bestBid + bestAsk) / 2;
      const spread = bestAsk - bestBid;
      const spreadPercent = (spread / midPrice) * 100;

      // Time until close (in hours)
      const now = new Date();
      const timeUntilClose = (market.endDate.getTime() - now.getTime()) / (1000 * 60 * 60);

      // Determine signal based on simple heuristics
      let signal: 'BUY' | 'SELL' | 'NEUTRAL' = 'NEUTRAL';
      let confidence = 0;
      let reasoning = '';

      // Simple strategy: look for mispricing opportunities
      if (midPrice < 0.30 && spread < 0.05) {
        signal = 'BUY';
        confidence = 0.7;
        reasoning = 'Low probability with tight spread - potential undervalued opportunity';
      } else if (midPrice > 0.70 && spread < 0.05) {
        signal = 'SELL';
        confidence = 0.7;
        reasoning = 'High probability with tight spread - potential overvalued opportunity';
      } else if (spreadPercent > 10) {
        signal = 'NEUTRAL';
        confidence = 0.3;
        reasoning = 'Wide spread indicates low liquidity or uncertainty';
      } else {
        signal = 'NEUTRAL';
        confidence = 0.5;
        reasoning = 'No clear mispricing signal detected';
      }

      return {
        marketId: market.id,
        question: market.question,
        signal,
        confidence,
        currentPrice: midPrice,
        volume: market.volume,
        liquidity: market.liquidity,
        spread,
        timeUntilClose,
        reasoning,
      };
    } catch (error) {
      logger.error(`Error analyzing market ${marketId}:`, error);
      return null;
    }
  }

  /**
   * Get market statistics
   */
  async getMarketStats(): Promise<MarketStats> {
    try {
      const markets = await polymarketService.getActiveMarkets(100);

      const totalVolume = markets.reduce((sum, m) => sum + m.volume, 0);
      const totalLiquidity = markets.reduce((sum, m) => sum + m.liquidity, 0);

      // Calculate average spread (would need orderbook data for all markets)
      // For now, use a placeholder
      const avgSpread = 0.02;

      // Get top markets by volume
      const topMarkets = markets
        .sort((a, b) => b.volume - a.volume)
        .slice(0, 10);

      return {
        totalMarkets: markets.length,
        totalVolume,
        totalLiquidity,
        avgSpread,
        topMarkets,
      };
    } catch (error) {
      logger.error('Error calculating market stats:', error);
      return {
        totalMarkets: 0,
        totalVolume: 0,
        totalLiquidity: 0,
        avgSpread: 0,
        topMarkets: [],
      };
    }
  }

  /**
   * Find arbitrage opportunities (same event, different probabilities)
   */
  async findArbitrageOpportunities(): Promise<MarketOpportunity[]> {
    try {
      logger.info('Scanning for arbitrage opportunities...');

      const markets = await polymarketService.getActiveMarkets(50);
      const opportunities: MarketOpportunity[] = [];

      // Group markets by keywords in questions
      const marketGroups = this.groupSimilarMarkets(markets);

      // Check for arbitrage within each group
      for (const [keyword, groupMarkets] of marketGroups) {
        if (groupMarkets.length < 2) continue;

        // Get prices for all markets in group
        const pricesPromises = groupMarkets.map(m =>
          polymarketService.getMidPrice(m.id).then(price => ({
            market: m,
            price,
          }))
        );

        const prices = await Promise.all(pricesPromises);
        const validPrices = prices.filter(p => p.price !== null);

        if (validPrices.length < 2) continue;

        // Check for significant price differences
        const maxPrice = Math.max(...validPrices.map(p => p.price!));
        const minPrice = Math.min(...validPrices.map(p => p.price!));

        if (maxPrice - minPrice > 0.1) {
          // Potential arbitrage opportunity
          const firstMarket = validPrices[0]?.market;
          if (firstMarket) {
            opportunities.push({
              marketId: firstMarket.id,
              question: `Arbitrage: ${keyword}`,
              signal: 'BUY',
              confidence: 0.8,
              currentPrice: minPrice,
              volume: firstMarket.volume || 0,
              liquidity: firstMarket.liquidity || 0,
              spread: maxPrice - minPrice,
              timeUntilClose: (firstMarket.endDate?.getTime() || Date.now() - Date.now()) / (1000 * 60 * 60),
              reasoning: `Price discrepancy detected: ${(maxPrice - minPrice).toFixed(2)} between similar markets`,
            });
          }
        }
      }

      logger.info(`Found ${opportunities.length} potential arbitrage opportunities`);
      return opportunities;
    } catch (error) {
      logger.error('Error finding arbitrage opportunities:', error);
      return [];
    }
  }

  /**
   * Group markets by similar keywords
   */
  private groupSimilarMarkets(markets: MarketInfo[]): Map<string, MarketInfo[]> {
    const groups = new Map<string, MarketInfo[]>();

    for (const market of markets) {
      // Extract key words from question (simple approach)
      const words = market.question.toLowerCase().split(' ');
      const keywords = words.filter(w => w.length > 5); // Only significant words

      for (const keyword of keywords.slice(0, 3)) {
        // Take first 3 significant words
        if (!groups.has(keyword)) {
          groups.set(keyword, []);
        }
        groups.get(keyword)!.push(market);
      }
    }

    return groups;
  }

  /**
   * Get market sentiment (based on price movement and volume)
   */
  async getMarketSentiment(marketId: string): Promise<'BULLISH' | 'BEARISH' | 'NEUTRAL'> {
    try {
      const market = await polymarketService.getMarket(marketId);
      if (!market) return 'NEUTRAL';

      const price = await polymarketService.getMidPrice(marketId);
      if (!price) return 'NEUTRAL';

      // Simple heuristic: high price = bullish, low price = bearish
      if (price > 0.6) return 'BULLISH';
      if (price < 0.4) return 'BEARISH';
      return 'NEUTRAL';
    } catch (error) {
      logger.error(`Error getting sentiment for market ${marketId}:`, error);
      return 'NEUTRAL';
    }
  }
}

// Singleton instance
export const polymarketDataFetcher = new PolymarketDataFetcher();
