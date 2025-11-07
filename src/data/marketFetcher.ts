import fetch from 'node-fetch';
import { logger, logError } from '../utils/logger';
import { withRetry, APIError } from '../utils/errorHandler';
import { CONFIG } from '../config';

export interface TokenData {
  address: string;
  symbol: string;
  name: string;
  price: number;
  priceChange24h: number;
  volume24h: number;
  liquidity: number;
  marketCap: number;
  fdv: number;
  priceUsd: string;
  txns24h: {
    buys: number;
    sells: number;
  };
  pairAddress?: string;
  dexId?: string;
}

export interface DexScreenerResponse {
  schemaVersion: string;
  pairs: Array<{
    chainId: string;
    dexId: string;
    url: string;
    pairAddress: string;
    baseToken: {
      address: string;
      name: string;
      symbol: string;
    };
    quoteToken: {
      address: string;
      name: string;
      symbol: string;
    };
    priceNative: string;
    priceUsd: string;
    txns: {
      m5: { buys: number; sells: number };
      h1: { buys: number; sells: number };
      h6: { buys: number; sells: number };
      h24: { buys: number; sells: number };
    };
    volume: {
      h24: number;
      h6: number;
      h1: number;
      m5: number;
    };
    priceChange: {
      m5: number;
      h1: number;
      h6: number;
      h24: number;
    };
    liquidity: {
      usd: number;
      base: number;
      quote: number;
    };
    fdv: number;
    marketCap: number;
  }>;
}

/**
 * Fetch token data from DexScreener API
 */
export async function getTokenData(tokenAddress: string): Promise<TokenData | null> {
  const url = `${CONFIG.DEXSCREENER_API_URL}/tokens/${tokenAddress}`;

  try {
    const response = await withRetry(
      async () => {
        const res = await fetch(url);

        if (!res.ok) {
          throw new APIError(
            `DexScreener API error: ${res.statusText}`,
            res.status,
            url
          );
        }

        return res;
      },
      3,
      2000,
      'DexScreener fetch'
    );

    const data = (await response.json()) as DexScreenerResponse;

    if (!data.pairs || data.pairs.length === 0) {
      logger.warn(`No trading pairs found for token ${tokenAddress}`);
      return null;
    }

    // Get the most liquid pair (usually the main one)
    const mainPair = data.pairs.reduce((prev, current) =>
      (current.liquidity?.usd || 0) > (prev.liquidity?.usd || 0) ? current : prev
    );

    const tokenData: TokenData = {
      address: tokenAddress,
      symbol: mainPair.baseToken.symbol,
      name: mainPair.baseToken.name,
      price: parseFloat(mainPair.priceNative),
      priceChange24h: mainPair.priceChange?.h24 || 0,
      volume24h: mainPair.volume?.h24 || 0,
      liquidity: mainPair.liquidity?.usd || 0,
      marketCap: mainPair.marketCap || 0,
      fdv: mainPair.fdv || 0,
      priceUsd: mainPair.priceUsd,
      txns24h: {
        buys: mainPair.txns?.h24?.buys || 0,
        sells: mainPair.txns?.h24?.sells || 0,
      },
      pairAddress: mainPair.pairAddress,
      dexId: mainPair.dexId,
    };

    logger.info(
      `Fetched data for ${tokenData.symbol}: $${tokenData.priceUsd} (24h vol: $${tokenData.volume24h.toLocaleString()})`
    );

    return tokenData;
  } catch (error) {
    logError('getTokenData', error as Error);
    return null;
  }
}

/**
 * Fetch multiple tokens data
 */
export async function getMultipleTokensData(
  tokenAddresses: string[]
): Promise<Map<string, TokenData>> {
  const results = new Map<string, TokenData>();

  // Fetch in parallel with rate limiting
  const chunks = chunkArray(tokenAddresses, 5); // 5 requests at a time

  for (const chunk of chunks) {
    const promises = chunk.map(async address => {
      const data = await getTokenData(address);
      if (data) {
        results.set(address, data);
      }
    });

    await Promise.all(promises);

    // Small delay between chunks to avoid rate limiting
    if (chunks.indexOf(chunk) < chunks.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return results;
}

/**
 * Get trending tokens on BNB Chain
 */
export async function getTrendingTokens(limit: number = 10): Promise<TokenData[]> {
  const url = `${CONFIG.DEXSCREENER_API_URL}/tokens/bnb/trending`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new APIError(
        `DexScreener trending API error: ${response.statusText}`,
        response.status,
        url
      );
    }

    const data = (await response.json()) as DexScreenerResponse;

    const trending: TokenData[] = data.pairs
      .slice(0, limit)
      .map(pair => ({
        address: pair.baseToken.address,
        symbol: pair.baseToken.symbol,
        name: pair.baseToken.name,
        price: parseFloat(pair.priceNative),
        priceChange24h: pair.priceChange?.h24 || 0,
        volume24h: pair.volume?.h24 || 0,
        liquidity: pair.liquidity?.usd || 0,
        marketCap: pair.marketCap || 0,
        fdv: pair.fdv || 0,
        priceUsd: pair.priceUsd,
        txns24h: {
          buys: pair.txns?.h24?.buys || 0,
          sells: pair.txns?.h24?.sells || 0,
        },
        pairAddress: pair.pairAddress,
        dexId: pair.dexId,
      }));

    logger.info(`Fetched ${trending.length} trending tokens`);

    return trending;
  } catch (error) {
    logError('getTrendingTokens', error as Error);
    return [];
  }
}

/**
 * Calculate buy/sell pressure ratio
 */
export function calculateBuySellPressure(tokenData: TokenData): number {
  const { buys, sells } = tokenData.txns24h;

  if (buys + sells === 0) return 0;

  return (buys - sells) / (buys + sells);
}

/**
 * Check if token has sufficient liquidity
 */
export function hasSufficientLiquidity(
  tokenData: TokenData,
  minLiquidityUsd: number = 10000
): boolean {
  return tokenData.liquidity >= minLiquidityUsd;
}

/**
 * Utility: Chunk array into smaller arrays
 */
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Enhanced MarketDataFetcher class with improved error handling and caching
 */
export class MarketDataFetcher {
  private cache = new Map<string, { data: TokenData; timestamp: number }>();
  private readonly CACHE_DURATION = 60 * 1000; // 1 minute cache

  /**
   * Get token data with caching
   */
  async getTokenData(tokenAddress: string, useCache = true): Promise<TokenData | null> {
    // Check cache first
    if (useCache) {
      const cached = this.cache.get(tokenAddress);
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        logger.debug(`📦 Using cached data for ${tokenAddress}`);
        return cached.data;
      }
    }

    try {
      logger.info(`🔍 Fetching token data for ${tokenAddress}`);
      
      const data = await getTokenData(tokenAddress);
      
      if (data && useCache) {
        this.cache.set(tokenAddress, { data, timestamp: Date.now() });
      }
      
      return data;
      
    } catch (error) {
      logger.error(`❌ Failed to fetch token data: ${(error as Error).message}`);
      return null;
    }
  }

  /**
   * Get multiple tokens data in parallel
   */
  async getMultipleTokensData(tokenAddresses: string[]): Promise<TokenData[]> {
    logger.info(`📊 Fetching data for ${tokenAddresses.length} tokens`);
    
    const promises = tokenAddresses.map(address => this.getTokenData(address));
    const results = await Promise.allSettled(promises);
    
    const validData = results
      .filter((result): result is PromiseFulfilledResult<TokenData> => 
        result.status === 'fulfilled' && result.value !== null
      )
      .map(result => result.value);
      
    logger.info(`✅ Successfully fetched ${validData.length}/${tokenAddresses.length} tokens`);
    return validData;
  }

  /**
   * Get trending tokens from DexScreener
   */
  async getTrendingTokens(limit = 10, minLiquidity = 50000): Promise<TokenData[]> {
    try {
      logger.info('📈 Fetching trending tokens...');
      
      const trending = await getTrendingTokens(limit);
      
      // Filter by minimum liquidity
      const filtered = trending.filter(token => token.liquidity >= minLiquidity);
      
      logger.info(`🎯 Found ${filtered.length} trending tokens with sufficient liquidity`);
      return filtered;
      
    } catch (error) {
      logger.error(`❌ Failed to fetch trending tokens: ${(error as Error).message}`);
      return [];
    }
  }

  /**
   * Get price history for technical analysis
   */
  async getPriceHistory(tokenAddress: string, timeframe: '5m' | '1h' | '4h' | '1d' = '1h'): Promise<number[]> {
    // TODO: Implement price history fetching from DexScreener or other sources
    // For now, return mock data
    logger.info(`📊 Fetching price history for ${tokenAddress} (${timeframe})`);
    
    return []; // Mock empty array
  }

  /**
   * Calculate buy/sell pressure from transaction data
   */
  calculateBuySellPressure(txns24h: { buys: number; sells: number }): number {
    if (txns24h.buys + txns24h.sells === 0) return 0;
    
    const buyPressure = txns24h.buys / (txns24h.buys + txns24h.sells);
    return (buyPressure - 0.5) * 2; // Scale to -1 to 1
  }

  /**
   * Validate token data quality
   */
  validateTokenData(data: TokenData): boolean {
    const required = ['address', 'symbol', 'price', 'volume24h', 'liquidity'];
    
    for (const field of required) {
      if (!(field in data) || data[field as keyof TokenData] === null || data[field as keyof TokenData] === undefined) {
        logger.warn(`❌ Token data missing required field: ${field}`);
        return false;
      }
    }

    // Check for reasonable values
    if (data.price <= 0) {
      logger.warn(`❌ Invalid token price: ${data.price}`);
      return false;
    }

    if (data.volume24h < 0 || data.liquidity < 0) {
      logger.warn(`❌ Invalid volume or liquidity values`);
      return false;
    }

    return true;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
    logger.info('🗑️ Market data cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; hitRate: number } {
    return {
      size: this.cache.size,
      hitRate: 0 // TODO: Implement hit rate tracking
    };
  }

  /**
   * Check if token is suitable for trading based on criteria
   */
  isTradeable(data: TokenData, minLiquidity = 50000, minVolume = 10000): boolean {
    if (!this.validateTokenData(data)) {
      return false;
    }

    if (data.liquidity < minLiquidity) {
      logger.debug(`❌ Token ${data.symbol} liquidity too low: $${data.liquidity.toLocaleString()}`);
      return false;
    }

    if (data.volume24h < minVolume) {
      logger.debug(`❌ Token ${data.symbol} volume too low: $${data.volume24h.toLocaleString()}`);
      return false;
    }

    // Check for extreme price changes (possible rug pull indicators)
    if (Math.abs(data.priceChange24h) > 90) {
      logger.debug(`❌ Token ${data.symbol} extreme price change: ${data.priceChange24h.toFixed(2)}%`);
      return false;
    }

    return true;
  }
}

// Export singleton instance
export const marketDataFetcher = new MarketDataFetcher();

export default {
  getTokenData,
  getMultipleTokensData,
  getTrendingTokens,
  calculateBuySellPressure,
  hasSufficientLiquidity,
};
