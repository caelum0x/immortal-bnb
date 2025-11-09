/**
 * Wagmi Configuration for Immortal AI Trading Bot
 * Supports opBNB Testnet (5611) and BNB Chain Mainnet (56)
 */

import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { defineChain } from 'viem';

// Define opBNB Testnet (chainId 5611)
export const opBNBTestnet = defineChain({
  id: 5611,
  name: 'opBNB Testnet',
  nativeCurrency: {
    name: 'tBNB',
    symbol: 'tBNB',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://opbnb-testnet-rpc.bnbchain.org'],
    },
    public: {
      http: ['https://opbnb-testnet-rpc.bnbchain.org'],
    },
  },
  blockExplorers: {
    default: {
      name: 'opBNBScan',
      url: 'https://opbnb-testnet.bscscan.com',
    },
  },
  testnet: true,
});

// Define BNB Chain Mainnet (chainId 56)
export const bscMainnet = defineChain({
  id: 56,
  name: 'BNB Smart Chain',
  nativeCurrency: {
    name: 'BNB',
    symbol: 'BNB',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['https://bsc-dataseed1.binance.org'],
    },
    public: {
      http: ['https://bsc-dataseed1.binance.org'],
    },
  },
  blockExplorers: {
    default: {
      name: 'BscScan',
      url: 'https://bscscan.com',
    },
  },
  testnet: false,
});

// Get environment variable for network selection
const USE_MAINNET = process.env.NEXT_PUBLIC_USE_MAINNET === 'true';

// Configure Wagmi with RainbowKit
export const config = getDefaultConfig({
  appName: 'Immortal AI Trading Bot',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'default-project-id',
  chains: USE_MAINNET ? [bscMainnet, opBNBTestnet] : [opBNBTestnet, bscMainnet],
  ssr: true, // Enable SSR for Next.js
});

// Export chain utilities
export const defaultChain = USE_MAINNET ? bscMainnet : opBNBTestnet;
export const supportedChains = [opBNBTestnet, bscMainnet];

// Contract addresses (will be populated after deployment)
export const CONTRACT_ADDRESSES = {
  IMMBOT_TOKEN: {
    [opBNBTestnet.id]: process.env.NEXT_PUBLIC_IMMBOT_TOKEN_TESTNET || '',
    [bscMainnet.id]: process.env.NEXT_PUBLIC_IMMBOT_TOKEN_MAINNET || '',
  },
  STAKING: {
    [opBNBTestnet.id]: process.env.NEXT_PUBLIC_STAKING_TESTNET || '',
    [bscMainnet.id]: process.env.NEXT_PUBLIC_STAKING_MAINNET || '',
  },
};

// API endpoint
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
