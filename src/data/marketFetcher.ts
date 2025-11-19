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
 * Get trending/boosted tokens on BNB Chain
 * Uses DexScreener's token boosts API to find popular tokens
 */
export async function getTrendingTokens(limit: number = 10): Promise<TokenData[]> {
  const boostedUrl = 'https://api.dexscreener.com/token-boosts/top/v1';

  try {
    logger.info('Fetching trending tokens from DexScreener boosts...');

    const response = await fetch(boostedUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch boosted tokens: ${response.statusText}`);
    }

    const data = await response.json();

    // The API might return a single object or an array
    const boosts = Array.isArray(data) ? data : [data];

    // Filter for BNB chain tokens and get their addresses
    const bnbTokens = boosts
      .filter((boost: any) => boost.chainId === 'bsc' && boost.tokenAddress)
      .map((boost: any) => boost.tokenAddress)
      .slice(0, limit);

    if (bnbTokens.length === 0) {
      logger.warn('No BNB tokens found in boosts, using fallback list');
      return getTrendingTokensFallback(limit);
    }

    logger.info(`Found ${bnbTokens.length} boosted BNB tokens`);

    // Fetch detailed data for each token
    const results: TokenData[] = [];

    for (const tokenAddress of bnbTokens) {
      try {
        const tokenData = await getTokenData(tokenAddress);
        if (tokenData) {
          results.push(tokenData);
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        logger.warn(`Could not fetch data for ${tokenAddress}`);
      }
    }

    logger.info(`Fetched ${results.length} trending tokens`);
    return results;

  } catch (error) {
    logError('getTrendingTokens', error as Error);
    logger.info('Falling back to curated token list');
    return getTrendingTokensFallback(limit);
  }
}

/**
 * Fallback: Get popular BNB Chain tokens (used when API fails)
 */
async function getTrendingTokensFallback(limit: number = 10): Promise<TokenData[]> {
  // Popular BNB Chain tokens as fallback
  const popularTokens = [
    '0x2170Ed0880ac9A755fd29B2688956BD959F933F8', // ETH
    '0x55d398326f99059fF775485246999027B3197955', // USDT
    '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', // USDC
    '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c', // BTCB
    '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', // BUSD
    '0x1D2F0da169ceB9fC7B3144628dB156f3F6c60dBE', // XRP
    '0xbA2aE424d960c26247Dd6c32edC70B295c744C43', // DOGE
    '0x3EE2200Efb3400fAbB9AacF31297cBdD1d435D47', // ADA
  ];

  logger.info('Fetching data for popular BNB Chain tokens...');

  const results: TokenData[] = [];

  for (const tokenAddress of popularTokens.slice(0, limit)) {
    try {
      const tokenData = await getTokenData(tokenAddress);
      if (tokenData) {
        results.push(tokenData);
      }

      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      logger.warn(`Could not fetch data for ${tokenAddress}`);
    }
  }

  logger.info(`Fetched ${results.length} popular tokens`);
  return results;
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
  private cacheHits = 0;
  private cacheMisses = 0;

  /**
   * Get token data with caching
   */
  async getTokenData(tokenAddress: string, useCache = true): Promise<TokenData | null> {
    // Check cache first
    if (useCache) {
      const cached = this.cache.get(tokenAddress);
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        this.cacheHits++;
        logger.debug(`📦 Using cached data for ${tokenAddress}`);
        return cached.data;
      }
    }

    this.cacheMisses++;
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
    try {
      logger.info(`📊 Fetching price history for ${tokenAddress} (${timeframe})`);
      
      // DexScreener doesn't provide historical price data directly
      // We'll use the pair data to get recent price changes
      const tokenData = await this.getTokenData(tokenAddress, false); // Don't use cache for fresh data
      
      if (!tokenData) {
        logger.warn(`Could not fetch token data for price history`);
        return [];
      }

      // For now, we'll construct a simple price history from available data
      // In production, you might want to use a dedicated price oracle or DEX aggregator
      const currentPrice = parseFloat(tokenData.priceUsd);
      
      // Estimate price history based on 24h change
      // This is a simplified approach - real implementation would fetch actual historical data
      const priceHistory: number[] = [];
      const hours = timeframe === '5m' ? 1 : timeframe === '1h' ? 24 : timeframe === '4h' ? 96 : 168;
      const changePerHour = tokenData.priceChange24h / 24;
      
      for (let i = hours; i >= 0; i--) {
        // Simulate price movement (simplified - real data would be better)
        const historicalPrice = currentPrice * (1 - (changePerHour * i) / 100);
        priceHistory.push(Math.max(0, historicalPrice)); // Ensure non-negative
      }
      
      logger.info(`✅ Generated ${priceHistory.length} price points for ${timeframe} timeframe`);
      return priceHistory;
      
    } catch (error) {
      logger.error(`❌ Failed to fetch price history: ${(error as Error).message}`);
      return [];
    }
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
  getCacheStats(): { size: number; hitRate: number; hits: number; misses: number } {
    const totalRequests = this.cacheHits + this.cacheMisses;
    const hitRate = totalRequests > 0 ? (this.cacheHits / totalRequests) * 100 : 0;
    
    return {
      size: this.cache.size,
      hitRate: Math.round(hitRate * 100) / 100, // Round to 2 decimal places
      hits: this.cacheHits,
      misses: this.cacheMisses
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

/**
 * Get current token price
 */
export async function getTokenPrice(tokenAddress: string): Promise<number> {
  try {
    const tokenData = await getTokenData(tokenAddress);
    return tokenData?.price || 0;
  } catch (error) {
    logger.error(`Failed to get price for token ${tokenAddress}:`, error);
    return 0;
  }
}

/**
 * Get detailed token analytics
 */
export async function getTokenAnalytics(tokenAddress: string): Promise<TokenData | null> {
  return await getTokenData(tokenAddress);
}

export default {
  getTokenData,
  getMultipleTokensData,
  getTrendingTokens,
  calculateBuySellPressure,
  hasSufficientLiquidity,
  getTokenPrice,
  getTokenAnalytics,
};
