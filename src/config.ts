import { config } from 'dotenv';
import { ethers } from 'ethers';
config();

// Determine which network to use for trading
const TRADING_NETWORK = (process.env.TRADING_NETWORK || 'opbnb').toLowerCase();
const IS_OPBNB = TRADING_NETWORK === 'opbnb';
const IS_MAINNET = process.env.NETWORK === 'mainnet';

// Network-specific configurations
const NETWORK_CONFIG = {
  opbnb: {
    RPC: IS_MAINNET
      ? process.env.OPBNB_RPC || 'https://opbnb-mainnet-rpc.bnbchain.org'
      : process.env.OPBNB_RPC || 'https://opbnb-testnet-rpc.bnbchain.org',
    WSS: IS_MAINNET
      ? process.env.OPBNB_WSS || 'wss://opbnb-mainnet-rpc.bnbchain.org'
      : process.env.OPBNB_WSS || 'wss://opbnb-testnet-rpc.bnbchain.org',
    CHAIN_ID: IS_MAINNET ? 204 : 5611,
    PANCAKE_FACTORY: process.env.OPBNB_PANCAKE_FACTORY || '0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865',
    PANCAKE_ROUTER: process.env.OPBNB_PANCAKE_ROUTER || '0x1b81D678ffb9C0263b24A97847620C99d213eB14',
    PANCAKE_SMART_ROUTER: process.env.OPBNB_PANCAKE_SMART_ROUTER || '0x678Aa4bF4E210cf2166753e054d5b7c31cc7fa86',
    WBNB_ADDRESS: process.env.OPBNB_WBNB_ADDRESS || '0x4200000000000000000000000000000000000006',
    EXPLORER: IS_MAINNET ? 'https://opbnbscan.com' : 'https://testnet.opbnbscan.com',
  },
  bnb: {
    RPC: IS_MAINNET
      ? process.env.BNB_MAINNET_RPC || 'https://bsc-dataseed.bnbchain.org'
      : process.env.BNB_RPC || 'https://bsc-testnet.bnbchain.org',
    WSS: IS_MAINNET
      ? 'wss://bsc-ws-node.nariox.org:443'
      : 'wss://bsc-testnet.bnbchain.org',
    CHAIN_ID: IS_MAINNET ? 56 : 97,
    PANCAKE_FACTORY: '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73',
    PANCAKE_ROUTER: process.env.PANCAKE_ROUTER_V3 || '0x1b81D678ffb9C0263b24A97847620C99d213eB14',
    PANCAKE_SMART_ROUTER: '0x13f4EA83D0bd40E75C8222255bc855a974568Dd4',
    WBNB_ADDRESS: process.env.WBNB_ADDRESS || '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
    EXPLORER: IS_MAINNET ? 'https://bscscan.com' : 'https://testnet.bscscan.com',
  },
  polygon: {
    RPC: IS_MAINNET
      ? process.env.POLYGON_RPC || 'https://polygon-rpc.com'
      : process.env.POLYGON_TESTNET_RPC || 'https://rpc-mumbai.maticvigil.com',
    WSS: IS_MAINNET
      ? 'wss://polygon-bor.publicnode.com'
      : 'wss://polygon-mumbai-bor.publicnode.com',
    CHAIN_ID: IS_MAINNET ? 137 : 80001,
    USDC_ADDRESS: IS_MAINNET
      ? '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174' // USDC on Polygon
      : '0x0FA8781a83E46826621b3BC094Ea2A0212e71B23', // Mumbai testnet USDC
    EXPLORER: IS_MAINNET ? 'https://polygonscan.com' : 'https://mumbai.polygonscan.com',
  },
};

// Get current network configuration
const CURRENT_NETWORK = NETWORK_CONFIG[IS_OPBNB ? 'opbnb' : 'bnb'];

export const CONFIG = {
  // ===== API Keys =====
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || '',
  AI_MODEL: process.env.AI_MODEL || 'openai/gpt-4o-mini',

  // Network Selection
  TRADING_NETWORK,
  IS_OPBNB,
  IS_MAINNET,
  NETWORK: process.env.NETWORK || 'testnet',

  // Blockchain Configuration (Dynamic based on selected network)
  RPC_URL: CURRENT_NETWORK.RPC,
  WSS_URL: CURRENT_NETWORK.WSS,
  CHAIN_ID: CURRENT_NETWORK.CHAIN_ID,
  EXPLORER_URL: CURRENT_NETWORK.EXPLORER,

  // Legacy BNB RPC (for backward compatibility)
  BNB_RPC: NETWORK_CONFIG.bnb.RPC,
  RPC_URL_TESTNET: process.env.RPC_URL_TESTNET || 'https://opbnb-testnet-rpc.bnbchain.org',
  RPC_URL_MAINNET: process.env.RPC_URL_MAINNET || 'https://bsc-dataseed.binance.org',

  WALLET_PRIVATE_KEY: process.env.WALLET_PRIVATE_KEY || '',
  WALLET_ADDRESS: (() => {
    if (process.env.WALLET_ADDRESS) {
      return process.env.WALLET_ADDRESS;
    }
    
    const privateKey = process.env.WALLET_PRIVATE_KEY;
    if (!privateKey) {
      console.warn('⚠️  WALLET_PRIVATE_KEY not set in .env file');
      return '';
    }
    
    // Check if private key has correct length (64 hex chars or 66 with 0x prefix)
    const keyLength = privateKey.length;
    if (keyLength !== 64 && keyLength !== 66) {
      console.error(`❌ Invalid WALLET_PRIVATE_KEY length: ${keyLength} (expected 64 or 66 characters)`);
      console.error('   Private key should be 64 hex characters or 66 with 0x prefix');
      return '';
    }
    
    try {
      return new ethers.Wallet(privateKey).address;
    } catch (error) {
      console.error('❌ Invalid WALLET_PRIVATE_KEY format:', (error as Error).message);
      return '';
    }
  })(),

  // Telegram
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '',
  TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID || '',

  // Contract Addresses (Dynamic based on network)
  PANCAKE_FACTORY: CURRENT_NETWORK.PANCAKE_FACTORY,
  PANCAKE_ROUTER: CURRENT_NETWORK.PANCAKE_ROUTER,
  PANCAKE_SMART_ROUTER: CURRENT_NETWORK.PANCAKE_SMART_ROUTER,
  WBNB_ADDRESS: CURRENT_NETWORK.WBNB_ADDRESS,

  // Legacy router addresses
  PANCAKE_ROUTER_V2: process.env.PANCAKE_ROUTER_V2 || '0x10ED43C718714eb63d5aA57B6Da2929C30bC095c',
  PANCAKE_ROUTER_V3: process.env.PANCAKE_ROUTER_V3 || '0x1b81D678ffb9C0263b24A97847620C99d213eB14',

  IMMBOT_TOKEN_ADDRESS: process.env.IMMBOT_TOKEN_ADDRESS || '',
  STAKING_CONTRACT_ADDRESS: process.env.STAKING_CONTRACT_ADDRESS || '',

  // ===== Trading Parameters =====
  MAX_TRADE_AMOUNT_BNB: parseFloat(process.env.MAX_TRADE_AMOUNT_BNB || '1.0'),
  STOP_LOSS_PERCENTAGE: parseFloat(process.env.STOP_LOSS_PERCENTAGE || '10'),
  MAX_SLIPPAGE_PERCENTAGE: parseFloat(process.env.MAX_SLIPPAGE_PERCENTAGE || '2'),
  BOT_LOOP_INTERVAL_MS: parseInt(process.env.BOT_LOOP_INTERVAL_MS || '300000'), // 5 minutes

  // AI Trading Thresholds
  MIN_CONFIDENCE_THRESHOLD: parseFloat(process.env.MIN_CONFIDENCE_THRESHOLD || '0.7'),

  // Greenfield
  GREENFIELD_BUCKET_NAME: process.env.GREENFIELD_BUCKET_NAME || 'immortal-bot-memories',
  GREENFIELD_RPC_URL: process.env.GREENFIELD_RPC_URL || 'https://gnfd-testnet-fullnode-tendermint-ap.bnbchain.org',
  GREENFIELD_CHAIN_ID: process.env.GREENFIELD_CHAIN_ID || '5600',
  GREENFIELD_RPC: process.env.GREENFIELD_RPC || 'https://greenfield-chain.bnbchain.org',
  GREENFIELD_ACCESS_KEY: process.env.GREENFIELD_ACCESS_KEY || '',
  GREENFIELD_SECRET_KEY: process.env.GREENFIELD_SECRET_KEY || '',

  // ===== DexScreener API =====
  DEXSCREENER_API_URL: process.env.DEXSCREENER_API_URL || 'https://api.dexscreener.com/latest/dex',
  DEXSCREENER_CHAIN: process.env.DEXSCREENER_CHAIN || 'bsc', // bsc for BNB Chain

  // ===== Polymarket Configuration =====
  POLYMARKET_ENABLED: process.env.POLYMARKET_ENABLED === 'true',
  POLYMARKET_HOST: process.env.POLYMARKET_HOST || 'https://clob.polymarket.com',
  POLYMARKET_CHAIN_ID: parseInt(process.env.POLYMARKET_CHAIN_ID || '137'), // Polygon mainnet
  POLYGON_RPC: process.env.POLYGON_RPC || 'https://polygon-rpc.com',
  POLYGON_TESTNET_RPC: process.env.POLYGON_TESTNET_RPC || 'https://rpc-mumbai.maticvigil.com',

  // API Server
  API_PORT: parseInt(process.env.API_PORT || '3001'),
  API_KEY: process.env.API_KEY || '',

  // Python Microservice
  PYTHON_API_URL: process.env.PYTHON_API_URL || 'http://localhost:5000',
  PYTHON_API_KEY: process.env.PYTHON_API_KEY || '',

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  LOG_TO_FILE: process.env.LOG_TO_FILE === 'true',

  // Bot Features
  ENABLE_CROSS_CHAIN: process.env.ENABLE_CROSS_CHAIN === 'true',

  // Token Watchlist (default meme tokens on BNB)
  DEFAULT_WATCHLIST: (process.env.DEFAULT_WATCHLIST?.split(',').filter(t => t.trim()) || []) as string[],

  // Risk Levels
  RISK_LEVELS: {
    LOW: { maxTradeAmount: 0.05, stopLoss: 3 },
    MEDIUM: { maxTradeAmount: 0.1, stopLoss: 5 },
    HIGH: { maxTradeAmount: 0.2, stopLoss: 10 },
  },
} as const;

export type RiskLevel = keyof typeof CONFIG.RISK_LEVELS;

// Validation - warn if critical keys are missing
if (!CONFIG.OPENROUTER_API_KEY && process.env.NODE_ENV !== 'test') {
  console.warn('⚠️  OPENROUTER_API_KEY not set - AI features will not work');
}

if (!CONFIG.WALLET_PRIVATE_KEY && process.env.NODE_ENV !== 'test') {
  console.warn('⚠️  WALLET_PRIVATE_KEY not set - Trading will not work');
}

if (CONFIG.WALLET_PRIVATE_KEY.startsWith('0x0000000') && process.env.NODE_ENV !== 'test') {
  console.warn('⚠️  WALLET_PRIVATE_KEY appears to be a placeholder - update with real key');
}

if (CONFIG.NETWORK === 'mainnet') {
  console.warn('⚠️  MAINNET MODE - Real funds at risk! Double-check all settings.');
}

// Network information logging
if (process.env.NODE_ENV !== 'test') {
  console.log(`
🌐 Network Configuration:
  - Trading Network: ${CONFIG.IS_OPBNB ? 'opBNB (L2 - Fast & Cheap)' : 'BNB Chain (L1)'}
  - Environment: ${CONFIG.IS_MAINNET ? 'MAINNET' : 'TESTNET'}
  - Chain ID: ${CONFIG.CHAIN_ID}
  - RPC: ${CONFIG.RPC_URL}
  - Explorer: ${CONFIG.EXPLORER_URL}
  - Router: ${CONFIG.PANCAKE_ROUTER}
  - WBNB: ${CONFIG.WBNB_ADDRESS}
${CONFIG.IS_OPBNB ? '  ⚡ Benefits: ~1s blocks, $0.001 gas, 10-100x cheaper than L1' : ''}
  `);
}

export default CONFIG;
