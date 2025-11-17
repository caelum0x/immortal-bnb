/**
 * PancakeSwap Token List Validator
 *
 * Validates discovered tokens against official PancakeSwap token lists
 * to filter out scams and low-quality tokens
 */

import { logger } from '../utils/logger';

export interface TokenListToken {
  chainId: number;
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI?: string;
}

export interface TokenList {
  name: string;
  timestamp: string;
  version: {
    major: number;
    minor: number;
    patch: number;
  };
  tokens: TokenListToken[];
}

export class TokenListValidator {
  private tokenList: TokenList | null = null;
  private validTokenAddresses: Set<string> = new Set();
  private lastFetch: number = 0;
  private readonly CACHE_DURATION = 60 * 60 * 1000; // 1 hour

  // Official PancakeSwap token lists
  private readonly TOKEN_LIST_URLS = [
    'https://tokens.pancakeswap.finance/pancakeswap-extended.json', // Extended list
    'https://tokens.pancakeswap.finance/pancakeswap-top-100.json', // Top 100
    'https://tokens.pancakeswap.finance/coingecko.json', // CoinGecko verified
  ];

  /**
   * Fetch and cache PancakeSwap token lists
   */
  async fetchTokenLists(): Promise<void> {
    try {
      // Check cache
      if (this.tokenList && Date.now() - this.lastFetch < this.CACHE_DURATION) {
        return;
      }

      logger.info('📋 Fetching PancakeSwap token lists...');

      // Fetch all lists
      const lists = await Promise.all(
        this.TOKEN_LIST_URLS.map(async (url) => {
          try {
            const response = await fetch(url);
            if (!response.ok) {
              logger.warn(`Failed to fetch token list from ${url}`);
              return null;
            }
            return await response.json() as TokenList;
          } catch (error) {
            logger.warn(`Error fetching ${url}:`, error);
            return null;
          }
        })
      );

      // Merge all valid tokens
      const allTokens: TokenListToken[] = [];
      lists.forEach((list) => {
        if (list && list.tokens) {
          allTokens.push(...list.tokens);
        }
      });

      // Filter for BNB Chain (chainId 56)
      const bscTokens = allTokens.filter((token) => token.chainId === 56);

      // Store in cache
      this.tokenList = {
        name: 'PancakeSwap Merged List',
        timestamp: new Date().toISOString(),
        version: { major: 1, minor: 0, patch: 0 },
        tokens: bscTokens,
      };

      // Build address lookup set (lowercase for case-insensitive comparison)
      this.validTokenAddresses = new Set(
        bscTokens.map((token) => token.address.toLowerCase())
      );

      this.lastFetch = Date.now();

      logger.info(`✅ Loaded ${this.validTokenAddresses.size} validated tokens from PancakeSwap lists`);
    } catch (error) {
      logger.error('Error fetching token lists:', error);
      // Keep old cache if fetch fails
    }
  }

  /**
   * Check if a token address is in the validated list
   */
  isValidToken(address: string): boolean {
    return this.validTokenAddresses.has(address.toLowerCase());
  }

  /**
   * Get token info from the list
   */
  getTokenInfo(address: string): TokenListToken | null {
    if (!this.tokenList) return null;

    const token = this.tokenList.tokens.find(
      (t) => t.address.toLowerCase() === address.toLowerCase()
    );

    return token || null;
  }

  /**
   * Filter an array of token addresses to only validated ones
   */
  filterValidTokens(addresses: string[]): string[] {
    return addresses.filter((addr) => this.isValidToken(addr));
  }

  /**
   * Get validation statistics
   */
  getStats() {
    return {
      totalValidTokens: this.validTokenAddresses.size,
      lastFetch: this.lastFetch,
      cacheAge: Date.now() - this.lastFetch,
      isCacheValid: Date.now() - this.lastFetch < this.CACHE_DURATION,
    };
  }

  /**
   * Force refresh of token lists
   */
  async refresh(): Promise<void> {
    this.lastFetch = 0; // Invalidate cache
    await this.fetchTokenLists();
  }
}

// Singleton instance
export const tokenListValidator = new TokenListValidator();
