// src/utils/chainMapping.ts
// Chain ID mapping utilities for DexScreener API integration

export interface ChainInfo {
  chainId: number;
  dexScreenerId: string;
  name: string;
  isMainnet: boolean;
}

// Mapping from our internal chain IDs to DexScreener chain IDs
export const CHAIN_MAPPING: Record<number, ChainInfo> = {
  // BSC Mainnet
  56: {
    chainId: 56,
    dexScreenerId: 'bsc',
    name: 'BSC Mainnet',
    isMainnet: true
  },
  // BSC Testnet -> Use BSC mainnet data for DexScreener
  97: {
    chainId: 97,
    dexScreenerId: 'bsc', // Use mainnet data for testnet
    name: 'BSC Testnet',
    isMainnet: false
  },
  // opBNB Mainnet
  204: {
    chainId: 204,
    dexScreenerId: 'opbnb',
    name: 'opBNB Mainnet',
    isMainnet: true
  },
  // opBNB Testnet -> Use BSC mainnet data for DexScreener
  5611: {
    chainId: 5611,
    dexScreenerId: 'bsc', // Use BSC mainnet data for opBNB testnet
    name: 'opBNB Testnet',
    isMainnet: false
  }
};

/**
 * Get DexScreener chain ID for API calls
 */
export function getDexScreenerChainId(chainId: number): string {
  const chainInfo = CHAIN_MAPPING[chainId];
  if (!chainInfo) {
    // Default to BSC for unknown chains
    return 'bsc';
  }
  return chainInfo.dexScreenerId;
}

/**
 * Get chain information for a given chain ID
 */
export function getChainInfo(chainId: number): ChainInfo | null {
  return CHAIN_MAPPING[chainId] || null;
}

/**
 * Check if we should use testnet fallback (use mainnet data for testnet)
 */
export function shouldUseFallbackData(chainId: number): boolean {
  const chainInfo = CHAIN_MAPPING[chainId];
  return chainInfo ? !chainInfo.isMainnet : false;
}

/**
 * Get the best available chain ID for API calls
 * For testnets, returns the mainnet equivalent
 */
export function getBestChainIdForAPI(chainId: number): string {
  return getDexScreenerChainId(chainId);
}
