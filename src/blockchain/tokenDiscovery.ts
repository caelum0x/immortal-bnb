// src/blockchain/tokenDiscovery.ts
// Dynamic token discovery using DexScreener API and on-chain events
// Implements real-time token scanning for trending memes and new listings

import fetch from 'node-fetch';
import { ethers } from 'ethers';
import { logger, logError } from '../utils/logger';
import { CONFIG } from '../config';

export interface DiscoveredToken {
  tokenAddress: string;
  symbol: string;
  name: string;
  chainId: string;
  volume24h: number;
  liquidityUsd: number;
  priceUsd: number;
  priceChange24h: number;
  createdAt?: number;
  poolAddress?: string;
  pairAddress?: string;
  fdv?: number; // Fully diluted valuation
  marketCap?: number;
  volumeChange24h?: number;
  liquidity?: {
    usd: number;
    base: number;
    quote: number;
  };
  txCount?: {
    m5: number;
    h1: number;
    h24: number;
  };
}

export interface TokenFilter {
  minVolume24h?: number;
  minLiquidityUsd?: number;
  maxPriceChange24h?: number;
  minPriceChange24h?: number;
  minMarketCap?: number;
  maxMarketCap?: number;
  minAge?: number; // Minimum age in minutes
  maxAge?: number; // Maximum age in minutes
  excludeTokens?: string[]; // Token addresses to exclude
}

export interface DiscoveryParams {
  query?: string;
  chainId?: string;
  limit?: number;
  sortBy?: 'volume24h' | 'liquidity' | 'created' | 'priceChange24h' | 'txCount';
  sortOrder?: 'desc' | 'asc';
  filter?: TokenFilter;
}

/**
 * Token Discovery Service
 * Dynamically discovers tokens using DexScreener API and on-chain monitoring
 */
export class TokenDiscovery {
  private provider: ethers.Provider;
  private factoryAddress: string;
  private chainId: string;
  private baseUrl = 'https://api.dexscreener.com/latest/dex';
  
  constructor() {
    this.provider = new ethers.JsonRpcProvider(CONFIG.RPC_URL);
    this.factoryAddress = CONFIG.PANCAKE_FACTORY;
    
    // DexScreener uses different chain identifiers
    // For testing purposes, use BSC even if we're on opBNB testnet
    this.chainId = CONFIG.CHAIN_ID === 56 ? 'bsc' : 'bsc'; // Force BSC for DexScreener compatibility
    
    logger.info('🔍 Token Discovery initialized');
    logger.info(`  Chain: ${this.chainId}`);
    logger.info(`  Factory: ${this.factoryAddress}`);
  }

  /**
   * Discover trending tokens using DexScreener API
   */
  async discoverTrendingTokens(params: DiscoveryParams = {}): Promise<DiscoveredToken[]> {
    try {
      const {
        query = '',
        chainId = this.chainId,
        limit = 50,
        sortBy = 'volume24h',
        sortOrder = 'desc',
        filter = {}
      } = params;

      logger.info(`🔥 Discovering trending tokens...`);
      logger.info(`  Query: "${query || 'BNB pairs'}"`);
      logger.info(`  Chain: ${chainId}`);
      logger.info(`  Limit: ${limit}`);
      logger.info(`  Sort: ${sortBy} ${sortOrder}`);

      let url: string;
      
      if (query) {
        // Search for specific tokens/keywords using search endpoint
        url = `${this.baseUrl}/search?q=${encodeURIComponent(query)}`;
      } else {
        // For trending tokens, search for BNB pairs which will give us popular tokens
        url = `${this.baseUrl}/search?q=BNB`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`DexScreener API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as any;
      const pairs = data.pairs || [];

      if (pairs.length === 0) {
        logger.warn('No pairs found from DexScreener');
        return [];
      }

      // Filter for BSC chain and convert to our token format
      let tokens: DiscoveredToken[] = pairs
        .filter((pair: any) => pair.chainId === chainId)
        .map((pair: any) => this.formatToken(pair))
        .filter((token: DiscoveredToken | null) => token !== null);

      // Apply filters
      tokens = this.applyFilters(tokens, filter);

      // Sort tokens
      tokens = this.sortTokens(tokens, sortBy, sortOrder);

      // Limit results
      tokens = tokens.slice(0, limit);

      logger.info(`✅ Found ${tokens.length} trending tokens`);
      if (tokens.length > 0 && tokens[0]) {
        logger.info(`  Top token: ${tokens[0].symbol} (${tokens[0].volume24h.toFixed(0)}$ 24h vol)`);
      }

      return tokens;
    } catch (error) {
      logError('discoverTrendingTokens', error as Error);
      return [];
    }
  }

  /**
   * Discover new tokens by listening to PairCreated events
   */
  async startNewTokenListener(
    callback: (token: DiscoveredToken) => void,
    filter: TokenFilter = {}
  ): Promise<void> {
    try {
      logger.info('👂 Starting new token listener...');
      
      const factoryAbi = [
        'event PoolCreated(address indexed token0, address indexed token1, uint24 indexed fee, int24 tickSpacing, address pool)'
      ];

      const factory = new ethers.Contract(this.factoryAddress, factoryAbi, this.provider);

      factory.on('PoolCreated', async (token0: string, token1: string, fee: number, tickSpacing: number, pool: string) => {
        try {
          logger.info(`🆕 New pool detected: ${token0}/${token1} (Fee: ${fee/10000}%)`);
          
          // Determine which token is the new one (not WBNB)
          const wbnbAddress = CONFIG.WBNB_ADDRESS.toLowerCase();
          let newTokenAddress: string;
          
          if (token0.toLowerCase() === wbnbAddress) {
            newTokenAddress = token1;
          } else if (token1.toLowerCase() === wbnbAddress) {
            newTokenAddress = token0;
          } else {
            // Neither token is WBNB, skip for now
            logger.info(`  Skipping non-WBNB pair`);
            return;
          }

          // Wait a few seconds for DexScreener to index the new pair
          await new Promise(resolve => setTimeout(resolve, 5000));

          // Try to get token info from DexScreener
          const tokens = await this.getTokenByAddress(newTokenAddress);
          if (tokens.length > 0 && tokens[0]) {
            const token = tokens[0];
            
            // Apply filters
            if (this.passesFilter(token, filter)) {
              logger.info(`✅ New token passes filters: ${token.symbol}`);
              callback(token);
            } else {
              logger.info(`❌ New token filtered out: ${token.symbol}`);
            }
          }
        } catch (error) {
          logError('PoolCreated event handler', error as Error);
        }
      });

      logger.info('✅ New token listener started');
    } catch (error) {
      logError('startNewTokenListener', error as Error);
    }
  }

  /**
   * Get token information by address
   */
  async getTokenByAddress(tokenAddress: string): Promise<DiscoveredToken[]> {
    try {
      // Use the correct endpoint for getting token pairs
      const url = `https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        return [];
      }

      const data = await response.json() as any;
      const pairs = data.pairs || [];

      return pairs
        .filter((pair: any) => pair.chainId === this.chainId)
        .map((pair: any) => this.formatToken(pair))
        .filter((token: DiscoveredToken | null) => token !== null);
    } catch (error) {
      logError('getTokenByAddress', error as Error);
      return [];
    }
  }

  /**
   * Get market overview for decision making
   */
  async getMarketOverview(): Promise<{
    avgVolume24h: number;
    avgLiquidity: number;
    totalPairs: number;
    topTokens: DiscoveredToken[];
  }> {
    try {
      const topTokens = await this.discoverTrendingTokens({ limit: 100 });
      
      const avgVolume24h = topTokens.reduce((sum, token) => sum + token.volume24h, 0) / topTokens.length || 0;
      const avgLiquidity = topTokens.reduce((sum, token) => sum + token.liquidityUsd, 0) / topTokens.length || 0;
      
      return {
        avgVolume24h,
        avgLiquidity,
        totalPairs: topTokens.length,
        topTokens: topTokens.slice(0, 10)
      };
    } catch (error) {
      logError('getMarketOverview', error as Error);
      return {
        avgVolume24h: 0,
        avgLiquidity: 0,
        totalPairs: 0,
        topTokens: []
      };
    }
  }

  /**
   * Format DexScreener pair data to our token format
   */
  private formatToken(pair: any): DiscoveredToken | null {
    try {
      const baseToken = pair.baseToken;
      const quoteToken = pair.quoteToken;
      
      // Determine which token is the main token (not WBNB/USDT)
      const stableTokens = ['WBNB', 'USDT', 'USDC', 'BUSD'];
      let mainToken = baseToken;
      
      if (stableTokens.includes(baseToken.symbol) && !stableTokens.includes(quoteToken.symbol)) {
        mainToken = quoteToken;
      }

      return {
        tokenAddress: mainToken.address,
        symbol: mainToken.symbol || 'UNKNOWN',
        name: mainToken.name || 'Unknown Token',
        chainId: pair.chainId,
        volume24h: parseFloat(pair.volume?.h24 || '0'),
        liquidityUsd: parseFloat(pair.liquidity?.usd || '0'),
        priceUsd: parseFloat(pair.priceUsd || '0'),
        priceChange24h: parseFloat(pair.priceChange?.h24 || '0'),
        poolAddress: pair.pairAddress,
        pairAddress: pair.pairAddress,
        fdv: parseFloat(pair.fdv || '0'),
        marketCap: parseFloat(pair.marketCap || '0'),
        volumeChange24h: parseFloat(pair.volumeChange?.h24 || '0'),
        liquidity: {
          usd: parseFloat(pair.liquidity?.usd || '0'),
          base: parseFloat(pair.liquidity?.base || '0'),
          quote: parseFloat(pair.liquidity?.quote || '0'),
        },
        txCount: {
          m5: parseInt(pair.txns?.m5?.buys || '0') + parseInt(pair.txns?.m5?.sells || '0'),
          h1: parseInt(pair.txns?.h1?.buys || '0') + parseInt(pair.txns?.h1?.sells || '0'),
          h24: parseInt(pair.txns?.h24?.buys || '0') + parseInt(pair.txns?.h24?.sells || '0'),
        }
      };
    } catch (error) {
      logError('formatToken', error as Error);
      return null;
    }
  }

  /**
   * Apply filters to discovered tokens
   */
  private applyFilters(tokens: DiscoveredToken[], filter: TokenFilter): DiscoveredToken[] {
    return tokens.filter(token => this.passesFilter(token, filter));
  }

  /**
   * Check if token passes filter criteria
   */
  private passesFilter(token: DiscoveredToken, filter: TokenFilter): boolean {
    if (filter.minVolume24h && token.volume24h < filter.minVolume24h) return false;
    if (filter.minLiquidityUsd && token.liquidityUsd < filter.minLiquidityUsd) return false;
    if (filter.maxPriceChange24h && Math.abs(token.priceChange24h) > filter.maxPriceChange24h) return false;
    if (filter.minPriceChange24h && token.priceChange24h < filter.minPriceChange24h) return false;
    if (filter.minMarketCap && token.marketCap && token.marketCap < filter.minMarketCap) return false;
    if (filter.maxMarketCap && token.marketCap && token.marketCap > filter.maxMarketCap) return false;
    if (filter.excludeTokens && filter.excludeTokens.includes(token.tokenAddress.toLowerCase())) return false;

    return true;
  }

  /**
   * Sort tokens by specified criteria
   */
  private sortTokens(tokens: DiscoveredToken[], sortBy: string, sortOrder: string): DiscoveredToken[] {
    return tokens.sort((a, b) => {
      let aVal: number, bVal: number;

      switch (sortBy) {
        case 'volume24h':
          aVal = a.volume24h;
          bVal = b.volume24h;
          break;
        case 'liquidity':
          aVal = a.liquidityUsd;
          bVal = b.liquidityUsd;
          break;
        case 'priceChange24h':
          aVal = a.priceChange24h;
          bVal = b.priceChange24h;
          break;
        case 'txCount':
          aVal = a.txCount?.h24 || 0;
          bVal = b.txCount?.h24 || 0;
          break;
        default:
          aVal = a.volume24h;
          bVal = b.volume24h;
      }

      return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
    });
  }
}

export default TokenDiscovery;
