// src/data/enhancedMarketFetcher.ts
// Enhanced market data fetcher using DexScreener API for real token discovery
// Uses official DexScreener endpoints for dynamic token discovery

import fetch from 'node-fetch';
import { logger, logError } from '../utils/logger';
import { withRetry, APIError } from '../utils/errorHandler';
import { CONFIG } from '../config';

// DexScreener API endpoints
const DEXSCREENER_BASE_URL = 'https://api.dexscreener.com';

export interface TokenProfile {
  url: string;
  chainId: string;
  tokenAddress: string;
  icon?: string;
  header?: string;
  description?: string;
  links?: Array<{
    type?: string;
    label?: string;
    url: string;
  }>;
}

export interface TokenBoost {
  url: string;
  chainId: string;
  tokenAddress: string;
  date: string;
  type: string;
  durationHours?: number;
  impressions?: number;
}

export interface EnhancedTokenData {
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
  chainId: string;
  // Enhanced data
  profile?: TokenProfile;
  boost?: TokenBoost;
  confidence: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  tradingSignal: 'BUY' | 'HOLD' | 'SELL' | 'AVOID';
  liquidityScore: number;
  volumeScore: number;
  buySellPressure: number;
}

/**
 * Get latest token profiles from DexScreener
 */
export async function getLatestTokenProfiles(): Promise<TokenProfile[]> {
  try {
    const url = `${DEXSCREENER_BASE_URL}/token-profiles/latest/v1`;
    
    const response = await withRetry(
      async () => {
        const res = await fetch(url);
        if (!res.ok) {
          throw new APIError(
            `DexScreener profiles API error: ${res.statusText}`,
            res.status,
            url
          );
        }
        return res;
      },
      3,
      2000,
      'DexScreener token profiles'
    );

    const profiles = await response.json() as TokenProfile[];
    logger.info(`Fetched ${profiles.length} latest token profiles`);
    
    return profiles;
  } catch (error) {
    logError('getLatestTokenProfiles', error as Error);
    return [];
  }
}

/**
 * Get latest token boosts from DexScreener
 */
export async function getLatestTokenBoosts(): Promise<TokenBoost[]> {
  try {
    const url = `${DEXSCREENER_BASE_URL}/token-boosts/latest/v1`;
    
    const response = await withRetry(
      async () => {
        const res = await fetch(url);
        if (!res.ok) {
          throw new APIError(
            `DexScreener boosts API error: ${res.statusText}`,
            res.status,
            url
          );
        }
        return res;
      },
      3,
      2000,
      'DexScreener token boosts'
    );

    const boosts = await response.json() as TokenBoost[];
    logger.info(`Fetched ${boosts.length} latest token boosts`);
    
    return boosts;
  } catch (error) {
    logError('getLatestTokenBoosts', error as Error);
    return [];
  }
}

/**
 * Get top token boosts from DexScreener
 */
export async function getTopTokenBoosts(): Promise<TokenBoost[]> {
  try {
    const url = `${DEXSCREENER_BASE_URL}/token-boosts/top/v1`;
    
    const response = await withRetry(
      async () => {
        const res = await fetch(url);
        if (!res.ok) {
          throw new APIError(
            `DexScreener top boosts API error: ${res.statusText}`,
            res.status,
            url
          );
        }
        return res;
      },
      3,
      2000,
      'DexScreener top boosts'
    );

    const boosts = await response.json() as TokenBoost[];
    logger.info(`Fetched ${boosts.length} top token boosts`);
    
    return boosts;
  } catch (error) {
    logError('getTopTokenBoosts', error as Error);
    return [];
  }
}

/**
 * Search for tokens using DexScreener search API
 */
export async function searchTokens(query: string): Promise<any[]> {
  try {
    const url = `${DEXSCREENER_BASE_URL}/latest/dex/search?q=${encodeURIComponent(query)}`;
    
    const response = await withRetry(
      async () => {
        const res = await fetch(url);
        if (!res.ok) {
          throw new APIError(
            `DexScreener search API error: ${res.statusText}`,
            res.status,
            url
          );
        }
        return res;
      },
      3,
      2000,
      'DexScreener search'
    );

    const data = await response.json() as any;
    logger.info(`Search for "${query}" returned ${data.pairs?.length || 0} results`);
    
    return data.pairs || [];
  } catch (error) {
    logError('searchTokens', error as Error);
    return [];
  }
}

/**
 * Get token pairs for a specific token
 */
export async function getTokenPairs(chainId: string, tokenAddress: string): Promise<any[]> {
  try {
    const url = `${DEXSCREENER_BASE_URL}/token-pairs/v1/${chainId}/${tokenAddress}`;
    
    const response = await withRetry(
      async () => {
        const res = await fetch(url);
        if (!res.ok) {
          throw new APIError(
            `DexScreener token pairs API error: ${res.statusText}`,
            res.status,
            url
          );
        }
        return res;
      },
      3,
      2000,
      'DexScreener token pairs'
    );

    const data = await response.json() as any;
    logger.info(`Fetched ${data.pairs?.length || 0} pairs for token ${tokenAddress}`);
    
    return data.pairs || [];
  } catch (error) {
    logError('getTokenPairs', error as Error);
    return [];
  }
}

/**
 * Get multiple tokens data by addresses
 */
export async function getMultipleTokensFromDexScreener(
  chainId: string,
  tokenAddresses: string[]
): Promise<any[]> {
  try {
    const addressList = tokenAddresses.join(',');
    const url = `${DEXSCREENER_BASE_URL}/tokens/v1/${chainId}/${addressList}`;
    
    const response = await withRetry(
      async () => {
        const res = await fetch(url);
        if (!res.ok) {
          throw new APIError(
            `DexScreener tokens API error: ${res.statusText}`,
            res.status,
            url
          );
        }
        return res;
      },
      3,
      2000,
      'DexScreener multiple tokens'
    );

    const data = await response.json() as any;
    logger.info(`Fetched data for ${data.pairs?.length || 0} token pairs`);
    
    return data.pairs || [];
  } catch (error) {
    logError('getMultipleTokensFromDexScreener', error as Error);
    return [];
  }
}

/**
 * Discover trending tokens using multiple DexScreener APIs
 */
export async function discoverTrendingTokens(criteria: {
  minLiquidity?: number;
  minVolume?: number;
  maxRiskLevel?: 'LOW' | 'MEDIUM' | 'HIGH';
  limit?: number;
  chainId?: string;
} = {}): Promise<EnhancedTokenData[]> {
  try {
    logger.info('🔍 Discovering trending tokens from DexScreener APIs...');
    
    const chainId = criteria.chainId || getChainIdString();
    const limit = criteria.limit || 20;
    
    // Get data from multiple sources
    const [profiles, latestBoosts, topBoosts] = await Promise.all([
      getLatestTokenProfiles(),
      getLatestTokenBoosts(), 
      getTopTokenBoosts()
    ]);

    // Collect unique token addresses
    const tokenAddresses = new Set<string>();
    
    // Add tokens from profiles
    profiles.forEach(profile => {
      if (profile.chainId === chainId) {
        tokenAddresses.add(profile.tokenAddress);
      }
    });

    // Add tokens from boosts
    [...latestBoosts, ...topBoosts].forEach(boost => {
      if (boost.chainId === chainId) {
        tokenAddresses.add(boost.tokenAddress);
      }
    });

    if (tokenAddresses.size === 0) {
      logger.warn('No trending tokens found for the specified chain');
      return [];
    }

    logger.info(`Found ${tokenAddresses.size} unique trending tokens`);

    // Get detailed data for trending tokens
    const tokenArray = Array.from(tokenAddresses).slice(0, limit * 2); // Get extra for filtering
    const detailedData = await getMultipleTokensFromDexScreener(chainId, tokenArray);

    if (detailedData.length === 0) {
      logger.warn('No detailed data available for trending tokens');
      return [];
    }

    // Transform to enhanced token data
    const enhancedTokens: EnhancedTokenData[] = detailedData.map(pair => {
      const profile = profiles.find(p => p.tokenAddress === pair.baseToken.address);
      const boost = [...latestBoosts, ...topBoosts].find(b => b.tokenAddress === pair.baseToken.address);
      
      const tokenData: EnhancedTokenData = {
        address: pair.baseToken.address,
        symbol: pair.baseToken.symbol,
        name: pair.baseToken.name,
        price: parseFloat(pair.priceNative || '0'),
        priceChange24h: pair.priceChange?.h24 || 0,
        volume24h: pair.volume?.h24 || 0,
        liquidity: pair.liquidity?.usd || 0,
        marketCap: pair.marketCap || 0,
        fdv: pair.fdv || 0,
        priceUsd: pair.priceUsd || '0',
        txns24h: {
          buys: pair.txns?.h24?.buys || 0,
          sells: pair.txns?.h24?.sells || 0,
        },
        pairAddress: pair.pairAddress,
        dexId: pair.dexId,
        chainId: pair.chainId,
        profile,
        boost,
        confidence: 0, // Will be calculated
        riskLevel: 'MEDIUM', // Will be calculated
        tradingSignal: 'HOLD', // Will be calculated
        liquidityScore: 0, // Will be calculated
        volumeScore: 0, // Will be calculated
        buySellPressure: 0 // Will be calculated
      };

      // Calculate enhanced metrics
      enhanceTokenData(tokenData);
      
      return tokenData;
    });

    // Filter by criteria
    const filtered = enhancedTokens.filter(token => {
      if (criteria.minLiquidity && token.liquidity < criteria.minLiquidity) {
        return false;
      }
      if (criteria.minVolume && token.volume24h < criteria.minVolume) {
        return false;
      }
      if (criteria.maxRiskLevel) {
        const riskLevels = ['LOW', 'MEDIUM', 'HIGH'];
        const maxIndex = riskLevels.indexOf(criteria.maxRiskLevel);
        const tokenIndex = riskLevels.indexOf(token.riskLevel);
        if (tokenIndex > maxIndex) {
          return false;
        }
      }
      return true;
    });

    // Sort by confidence score
    filtered.sort((a, b) => b.confidence - a.confidence);
    
    const result = filtered.slice(0, limit);
    
    logger.info(`✅ Discovered ${result.length} trending tokens meeting criteria`);
    return result;

  } catch (error) {
    logError('discoverTrendingTokens', error as Error);
    return [];
  }
}

/**
 * Enhance token data with calculated metrics
 */
function enhanceTokenData(token: EnhancedTokenData): void {
  // Calculate buy/sell pressure
  const totalTxns = token.txns24h.buys + token.txns24h.sells;
  if (totalTxns > 0) {
    token.buySellPressure = (token.txns24h.buys - token.txns24h.sells) / totalTxns;
  }

  // Calculate liquidity score (0-100)
  token.liquidityScore = Math.min((token.liquidity / 1000000) * 100, 100);

  // Calculate volume score (0-100)
  token.volumeScore = Math.min((token.volume24h / 500000) * 100, 100);

  // Calculate confidence score
  let confidence = 0;
  
  // Liquidity factor (0-40 points)
  if (token.liquidity > 1000000) confidence += 40;
  else if (token.liquidity > 500000) confidence += 30;
  else if (token.liquidity > 100000) confidence += 20;
  else if (token.liquidity > 50000) confidence += 10;
  
  // Volume factor (0-30 points)
  if (token.volume24h > 500000) confidence += 30;
  else if (token.volume24h > 100000) confidence += 20;
  else if (token.volume24h > 50000) confidence += 15;
  else if (token.volume24h > 10000) confidence += 10;
  
  // Price stability factor (0-20 points)
  const priceChange = Math.abs(token.priceChange24h);
  if (priceChange < 5) confidence += 20;
  else if (priceChange < 10) confidence += 15;
  else if (priceChange < 20) confidence += 10;
  else if (priceChange < 50) confidence += 5;
  
  // Profile/boost factor (0-10 points)
  if (token.profile) confidence += 5;
  if (token.boost) confidence += 5;
  
  token.confidence = Math.min(confidence, 100);

  // Determine risk level
  const volatility = Math.abs(token.priceChange24h);
  if (volatility > 50 || token.liquidity < 50000) {
    token.riskLevel = 'HIGH';
  } else if (volatility > 20 || token.liquidity < 200000) {
    token.riskLevel = 'MEDIUM';
  } else {
    token.riskLevel = 'LOW';
  }

  // Determine trading signal
  if (token.confidence < 40) {
    token.tradingSignal = 'AVOID';
  } else if (token.confidence > 80 && token.priceChange24h > 5) {
    token.tradingSignal = 'BUY';
  } else if (token.confidence > 60 && token.priceChange24h > 0) {
    token.tradingSignal = 'HOLD';
  } else if (token.priceChange24h < -20) {
    token.tradingSignal = 'SELL';
  } else {
    token.tradingSignal = 'HOLD';
  }
}

/**
 * Get chain ID as string for DexScreener API
 */
function getChainIdString(): string {
  switch (CONFIG.CHAIN_ID) {
    case 56: return 'bsc'; // BSC Mainnet
    case 97: return 'bsc'; // BSC Testnet (use mainnet data)
    case 204: return 'opbnb'; // opBNB Mainnet
    case 5611: return 'bsc'; // opBNB Testnet (use BSC data)
    default: return 'bsc';
  }
}

/**
 * Find trading opportunities from discovered tokens
 */
export async function findTradingOpportunitiesFromAPI(
  amountBNB: number,
  preferences: {
    riskTolerance?: 'LOW' | 'MEDIUM' | 'HIGH';
    expectedReturn?: number;
    maxPriceImpact?: number;
    chainId?: string;
  } = {}
): Promise<Array<{
  token: EnhancedTokenData;
  expectedReturn: number;
  priceImpact: number;
  liquidityScore: number;
  volumeScore: number;
  overallScore: number;
  reason: string;
  recommendation: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'AVOID';
}>> {
  try {
    logger.info(`🎯 Finding trading opportunities for ${amountBNB} BNB from DexScreener...`);
    
    const riskTolerance = preferences.riskTolerance || 'MEDIUM';
    const maxPriceImpact = preferences.maxPriceImpact || 3.0;
    
    // Get criteria based on risk tolerance
    const criteria = {
      minLiquidity: riskTolerance === 'LOW' ? 500000 : riskTolerance === 'MEDIUM' ? 200000 : 50000,
      minVolume: riskTolerance === 'LOW' ? 100000 : riskTolerance === 'MEDIUM' ? 50000 : 10000,
      maxRiskLevel: riskTolerance,
      limit: 30,
      chainId: preferences.chainId
    };
    
    const tokens = await discoverTrendingTokens(criteria);
    const opportunities = [];

    for (const token of tokens) {
      try {
        // Calculate price impact
        const tradeValue = amountBNB * 400; // Approximate USD value
        const priceImpact = Math.min((tradeValue / token.liquidity) * 100, 100);
        
        if (priceImpact <= maxPriceImpact) {
          // Calculate expected return
          let expectedReturn = token.confidence * 0.1; // Base on confidence
          if (token.priceChange24h > 0) {
            expectedReturn += token.priceChange24h * 0.1;
          }
          expectedReturn -= priceImpact * 2; // Penalty for high impact
          expectedReturn = Math.max(0, expectedReturn);
          
          // Calculate overall score
          const overallScore = (token.liquidityScore * 0.3 + 
                              token.volumeScore * 0.3 + 
                              token.confidence * 0.4) - (priceImpact * 10);
          
          // Generate recommendation
          let recommendation: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'AVOID' = 'AVOID';
          if (priceImpact > 5) {
            recommendation = 'AVOID';
          } else if (token.confidence > 85 && priceImpact < 1 && token.priceChange24h > 5) {
            recommendation = 'STRONG_BUY';
          } else if (token.confidence > 70 && priceImpact < 2) {
            recommendation = 'BUY';
          } else if (token.confidence > 50) {
            recommendation = 'HOLD';
          }
          
          // Generate reason
          const reasons = [];
          if (token.confidence > 80) reasons.push('High confidence');
          if (token.liquidity > 500000) reasons.push('Good liquidity');
          if (priceImpact < 1) reasons.push('Low price impact');
          if (token.volume24h > 100000) reasons.push('High volume');
          if (token.priceChange24h > 5) reasons.push('Positive momentum');
          if (token.profile) reasons.push('Featured token');
          if (token.boost) reasons.push('Promoted token');
          
          const opportunity = {
            token,
            expectedReturn,
            priceImpact,
            liquidityScore: token.liquidityScore,
            volumeScore: token.volumeScore,
            overallScore: Math.max(0, overallScore),
            reason: reasons.length > 0 ? reasons.join(', ') : 'Standard trading criteria',
            recommendation
          };
          
          if (overallScore > 30) { // Minimum threshold
            opportunities.push(opportunity);
          }
        }
      } catch (error) {
        continue;
      }
    }

    // Sort by overall score
    opportunities.sort((a, b) => b.overallScore - a.overallScore);
    
    logger.info(`💡 Found ${opportunities.length} trading opportunities from DexScreener`);
    return opportunities.slice(0, 10);

  } catch (error) {
    logError('findTradingOpportunitiesFromAPI', error as Error);
    return [];
  }
}

export default {
  getLatestTokenProfiles,
  getLatestTokenBoosts,
  getTopTokenBoosts,
  searchTokens,
  getTokenPairs,
  getMultipleTokensFromDexScreener,
  discoverTrendingTokens,
  findTradingOpportunitiesFromAPI
};
