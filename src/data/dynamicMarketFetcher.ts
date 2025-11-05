// src/data/dynamicMarketFetcher.ts
// Enhanced dynamic market data fetcher with real-time DexScreener integration
// Implements adaptive filtering, multi-strategy discovery, and market condition analysis

import fetch from 'node-fetch';
import { logger, logError } from '../utils/logger';
import type { DiscoveredToken } from '../blockchain/tokenDiscovery';

// Extended token interface with confidence scoring
export interface EnhancedDiscoveredToken extends DiscoveredToken {
  confidence?: number;
  strategy?: string;
}

export interface MarketSnapshot {
  totalVolume24h: number;
  averageVolume: number;
  medianVolume: number;
  averageLiquidity: number;
  medianLiquidity: number;
  volatilityIndex: number;
  activeTokenCount: number;
  timestamp: number;
}

export interface DynamicFilter {
  volumePercentile?: number; // 0-100, filter by volume percentile
  liquidityMultiplier?: number; // Multiplier of trade amount for liquidity
  volatilityThreshold?: number; // Max acceptable 24h change %
  ageFilter?: 'new' | 'established' | 'all'; // Age-based filtering
  trendDirection?: 'up' | 'down' | 'stable' | 'all'; // Price trend
  activityLevel?: 'high' | 'medium' | 'low' | 'all'; // Transaction activity
}

export interface DiscoveryStrategy {
  name: string;
  description: string;
  endpoint: string;
  params: Record<string, any>;
  filter: DynamicFilter;
  weight: number; // 0-1, confidence multiplier
}

/**
 * Dynamic Market Data Fetcher
 * Provides real-time market intelligence for automated trading decisions
 */
export class DynamicMarketFetcher {
  private baseUrl = 'https://api.dexscreener.com/latest/dex';
  private marketSnapshot: MarketSnapshot | null = null;
  private lastSnapshotUpdate = 0;
  private readonly SNAPSHOT_CACHE_MS = 300000; // 5 minutes

  /**
   * Get current market snapshot with dynamic metrics
   */
  async getMarketSnapshot(forceRefresh = false): Promise<MarketSnapshot> {
    const now = Date.now();
    
    if (!forceRefresh && this.marketSnapshot && 
        (now - this.lastSnapshotUpdate) < this.SNAPSHOT_CACHE_MS) {
      return this.marketSnapshot;
    }

    try {
      logger.info('📊 Updating market snapshot...');
      
      // Get top 100 pairs for comprehensive market analysis
      const topPairs = await this.fetchTopPairs(100);
      
      if (topPairs.length === 0) {
        throw new Error('Failed to fetch market data');
      }

      // Calculate market metrics
      const volumes = topPairs.map(p => p.volume.h24).filter(v => v > 0);
      const liquidities = topPairs.map(p => p.liquidity.usd).filter(l => l > 0);
      const priceChanges = topPairs.map(p => Math.abs(p.priceChange.h24 || 0));

      const totalVolume = volumes.reduce((sum, vol) => sum + vol, 0);
      const averageVolume = totalVolume / volumes.length;
      const medianVolume = this.calculateMedian(volumes);
      
      const averageLiquidity = liquidities.reduce((sum, liq) => sum + liq, 0) / liquidities.length;
      const medianLiquidity = this.calculateMedian(liquidities);
      
      const volatilityIndex = priceChanges.reduce((sum, change) => sum + change, 0) / priceChanges.length;

      this.marketSnapshot = {
        totalVolume24h: totalVolume,
        averageVolume,
        medianVolume,
        averageLiquidity,
        medianLiquidity,
        volatilityIndex,
        activeTokenCount: topPairs.length,
        timestamp: now
      };

      this.lastSnapshotUpdate = now;
      
      logger.info(`  📈 Market metrics updated:`);
      logger.info(`    Total Volume: $${(totalVolume / 1000000).toFixed(1)}M`);
      logger.info(`    Avg Liquidity: $${(averageLiquidity / 1000).toFixed(0)}k`);
      logger.info(`    Volatility Index: ${volatilityIndex.toFixed(1)}%`);
      
      return this.marketSnapshot;
    } catch (error) {
      logError('getMarketSnapshot', error as Error);
      
      // Return fallback snapshot
      return {
        totalVolume24h: 10000000,
        averageVolume: 100000,
        medianVolume: 50000,
        averageLiquidity: 500000,
        medianLiquidity: 250000,
        volatilityIndex: 20,
        activeTokenCount: 100,
        timestamp: now
      };
    }
  }

  /**
   * Discover tokens using multiple dynamic strategies
   */
  async discoverWithStrategies(
    strategies: DiscoveryStrategy[],
    tradeAmount: number,
    maxResults = 20
  ): Promise<EnhancedDiscoveredToken[]> {
    try {
      logger.info(`🔍 Running ${strategies.length} discovery strategies...`);
      
      const allResults: EnhancedDiscoveredToken[] = [];
      const marketSnapshot = await this.getMarketSnapshot();

      for (const strategy of strategies) {
        try {
          logger.info(`  🎯 ${strategy.name}: ${strategy.description}`);
          
          const tokens = await this.executeStrategy(strategy, tradeAmount, marketSnapshot);
          const filteredTokens = this.applyDynamicFilter(tokens, strategy.filter, tradeAmount, marketSnapshot);
          
          // Apply strategy weight to confidence scores
          const weightedTokens = filteredTokens.map(token => ({
            ...token,
            confidence: (token.confidence || 50) * strategy.weight
          }));

          allResults.push(...weightedTokens);
          logger.info(`    Found ${filteredTokens.length} candidates`);
        } catch (error) {
          logger.warn(`    Strategy ${strategy.name} failed: ${error}`);
        }
      }

      // Remove duplicates and sort by confidence
      const uniqueTokens = this.removeDuplicates(allResults);
      const sortedTokens = uniqueTokens
        .sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
        .slice(0, maxResults);

      logger.info(`🚀 Discovery complete: ${sortedTokens.length} top opportunities`);
      return sortedTokens;
    } catch (error) {
      logError('discoverWithStrategies', error as Error);
      return [];
    }
  }

  /**
   * Execute a specific discovery strategy
   */
  private async executeStrategy(
    strategy: DiscoveryStrategy,
    tradeAmount: number,
    marketSnapshot: MarketSnapshot
  ): Promise<EnhancedDiscoveredToken[]> {
    let endpoint = strategy.endpoint;
    let params = { ...strategy.params };

    // Dynamic parameter adjustment based on market conditions
    if (marketSnapshot.volatilityIndex > 30) {
      // High volatility - be more conservative
      params.minLiquidity = (params.minLiquidity || 0) * 1.5;
      params.maxPriceChange = Math.min(params.maxPriceChange || 200, 100);
    } else if (marketSnapshot.volatilityIndex < 10) {
      // Low volatility - can be more aggressive
      params.minVolume = (params.minVolume || 0) * 0.7;
    }

    // Build query string
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const url = `${this.baseUrl}${endpoint}?${queryParams.toString()}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Immortal-BNB-Bot/1.0',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json() as any;
    return this.parseApiResponse(data, strategy.name);
  }

  /**
   * Parse API response and convert to DiscoveredToken format
   */
  private parseApiResponse(data: any, strategyName: string): EnhancedDiscoveredToken[] {
    try {
      const pairs = data.pairs || data.data || [];
      
      return pairs
        .filter((pair: any) => pair && pair.baseToken && pair.quoteToken)
        .map((pair: any): EnhancedDiscoveredToken => ({
          tokenAddress: pair.baseToken.address,
          symbol: pair.baseToken.symbol,
          name: pair.baseToken.name || pair.baseToken.symbol,
          chainId: pair.chainId || 'bsc',
          volume24h: pair.volume?.h24 || 0,
          liquidityUsd: pair.liquidity?.usd || 0,
          priceUsd: parseFloat(pair.priceUsd || '0'),
          priceChange24h: pair.priceChange?.h24 || 0,
          createdAt: pair.pairCreatedAt || Date.now(),
          poolAddress: pair.pairAddress,
          pairAddress: pair.pairAddress,
          fdv: pair.fdv,
          marketCap: pair.marketCap,
          volumeChange24h: pair.volumeChange?.h24,
          liquidity: {
            usd: pair.liquidity?.usd || 0,
            base: pair.liquidity?.base || 0,
            quote: pair.liquidity?.quote || 0
          },
          txCount: {
            m5: pair.txns?.m5?.buys + pair.txns?.m5?.sells || 0,
            h1: pair.txns?.h1?.buys + pair.txns?.h1?.sells || 0,
            h24: pair.txns?.h24?.buys + pair.txns?.h24?.sells || 0
          },
          confidence: 50, // Base confidence, will be adjusted by filters
          strategy: strategyName
        }))
        .filter((token: EnhancedDiscoveredToken) => token.tokenAddress && token.symbol);
    } catch (error) {
      logError('parseApiResponse', error as Error);
      return [];
    }
  }

  /**
   * Apply dynamic filtering based on market conditions
   */
  private applyDynamicFilter(
    tokens: EnhancedDiscoveredToken[],
    filter: DynamicFilter,
    tradeAmount: number,
    marketSnapshot: MarketSnapshot
  ): EnhancedDiscoveredToken[] {
    return tokens.filter(token => {
      let score = 50; // Base score

      // Volume percentile filter
      if (filter.volumePercentile) {
        const volumeThreshold = marketSnapshot.averageVolume * (filter.volumePercentile / 100);
        if (token.volume24h >= volumeThreshold) {
          score += 15;
        } else {
          return false;
        }
      }

      // Liquidity multiplier filter
      if (filter.liquidityMultiplier) {
        const requiredLiquidity = tradeAmount * 1000 * filter.liquidityMultiplier; // Convert BNB to USD
        if (token.liquidityUsd >= requiredLiquidity) {
          score += 20;
        } else {
          return false;
        }
      }

      // Volatility threshold
      if (filter.volatilityThreshold) {
        const absChange = Math.abs(token.priceChange24h);
        if (absChange <= filter.volatilityThreshold) {
          score += 10;
        } else {
          return false;
        }
      }

      // Age filter
      if (filter.ageFilter && filter.ageFilter !== 'all') {
        const ageHours = (Date.now() - (token.createdAt || 0)) / (1000 * 60 * 60);
        if (filter.ageFilter === 'new' && ageHours > 24) return false;
        if (filter.ageFilter === 'established' && ageHours < 168) return false; // 1 week
      }

      // Trend direction filter
      if (filter.trendDirection && filter.trendDirection !== 'all') {
        if (filter.trendDirection === 'up' && token.priceChange24h <= 0) return false;
        if (filter.trendDirection === 'down' && token.priceChange24h >= 0) return false;
        if (filter.trendDirection === 'stable' && Math.abs(token.priceChange24h) > 5) return false;
      }

      // Activity level filter
      if (filter.activityLevel && filter.activityLevel !== 'all') {
        const txCount = token.txCount?.h24 || 0;
        if (filter.activityLevel === 'high' && txCount < 100) return false;
        if (filter.activityLevel === 'medium' && (txCount < 20 || txCount > 100)) return false;
        if (filter.activityLevel === 'low' && txCount > 20) return false;
      }

      // Update confidence score
      token.confidence = Math.min(95, score);
      return true;
    });
  }

  /**
   * Get predefined discovery strategies
   */
  getDefaultStrategies(): DiscoveryStrategy[] {
    return [
      {
        name: 'Trending Volume',
        description: 'High volume tokens with momentum',
        endpoint: '/pairs/bsc',
        params: {
          q: 'meme',
          sort: 'volume24h',
          order: 'desc',
          limit: 50
        },
        filter: {
          volumePercentile: 75,
          liquidityMultiplier: 15,
          volatilityThreshold: 300,
          trendDirection: 'up'
        },
        weight: 0.9
      },
      {
        name: 'New Launches',
        description: 'Recently launched tokens with potential',
        endpoint: '/pairs/bsc',
        params: {
          sort: 'pairCreatedAt',
          order: 'desc',
          limit: 30
        },
        filter: {
          ageFilter: 'new',
          liquidityMultiplier: 20,
          volatilityThreshold: 500,
          activityLevel: 'medium'
        },
        weight: 0.8
      },
      {
        name: 'Liquidity Leaders',
        description: 'High liquidity, stable tokens',
        endpoint: '/pairs/bsc',
        params: {
          sort: 'liquidity',
          order: 'desc',
          limit: 25
        },
        filter: {
          liquidityMultiplier: 25,
          volatilityThreshold: 100,
          trendDirection: 'stable',
          ageFilter: 'established'
        },
        weight: 0.7
      },
      {
        name: 'Volume Breakouts',
        description: 'Tokens with volume spikes',
        endpoint: '/pairs/bsc',
        params: {
          sort: 'volumeChange24h',
          order: 'desc',
          limit: 20
        },
        filter: {
          volumePercentile: 60,
          liquidityMultiplier: 12,
          activityLevel: 'high'
        },
        weight: 0.85
      }
    ];
  }

  /**
   * Fetch top pairs from DexScreener
   */
  private async fetchTopPairs(limit: number): Promise<any[]> {
    const response = await fetch(`${this.baseUrl}/pairs/bsc?sort=volume24h&order=desc&limit=${limit}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch top pairs: ${response.status}`);
    }

    const data = await response.json() as any;
    return data.pairs || [];
  }

  /**
   * Calculate median value from array
   */
  private calculateMedian(values: number[]): number {
    if (values.length === 0) return 0;
    
    const sorted = values.slice().sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    
    if (sorted.length % 2 === 0) {
      return (sorted[mid - 1]! + sorted[mid]!) / 2;
    } else {
      return sorted[mid]!;
    }
  }

  /**
   * Remove duplicate tokens based on address
   */
  private removeDuplicates(tokens: EnhancedDiscoveredToken[]): EnhancedDiscoveredToken[] {
    const seen = new Set<string>();
    const unique: EnhancedDiscoveredToken[] = [];

    for (const token of tokens) {
      const key = token.tokenAddress.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(token);
      }
    }

    return unique;
  }
}

export default DynamicMarketFetcher;
