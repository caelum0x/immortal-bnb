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

export default {
  getTokenData,
  getMultipleTokensData,
  getTrendingTokens,
  calculateBuySellPressure,
  hasSufficientLiquidity,
};
