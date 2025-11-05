import { config } from 'dotenv';
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
};

// Get current network configuration
const CURRENT_NETWORK = NETWORK_CONFIG[IS_OPBNB ? 'opbnb' : 'bnb'];

export const CONFIG = {
  // API Keys
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || '',

  // Network Selection
  TRADING_NETWORK,
  IS_OPBNB,
  IS_MAINNET,

  // Blockchain Configuration (Dynamic based on selected network)
  RPC_URL: CURRENT_NETWORK.RPC,
  WSS_URL: CURRENT_NETWORK.WSS,
  CHAIN_ID: CURRENT_NETWORK.CHAIN_ID,
  EXPLORER_URL: CURRENT_NETWORK.EXPLORER,

  // Legacy BNB RPC (for backward compatibility)
  BNB_RPC: NETWORK_CONFIG.bnb.RPC,

  WALLET_PRIVATE_KEY: process.env.WALLET_PRIVATE_KEY || '',

  // Telegram
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '',
  TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID || '',

  // Contract Addresses (Dynamic based on network)
  PANCAKE_FACTORY: CURRENT_NETWORK.PANCAKE_FACTORY,
  PANCAKE_ROUTER: CURRENT_NETWORK.PANCAKE_ROUTER,
  PANCAKE_SMART_ROUTER: CURRENT_NETWORK.PANCAKE_SMART_ROUTER,
  WBNB_ADDRESS: CURRENT_NETWORK.WBNB_ADDRESS,

  // Legacy addresses
  PANCAKE_ROUTER_V2: process.env.PANCAKE_ROUTER_V2 || '0x10ED43C718714eb63d5aA57B6Da2929C30bC095c',
  PANCAKE_ROUTER_V3: process.env.PANCAKE_ROUTER_V3 || '0x1b81D678ffb9C0263b24A97847620C99d213eB14',

  IMMBOT_TOKEN_ADDRESS: process.env.IMMBOT_TOKEN_ADDRESS || '',

  // Trading Parameters
  MAX_TRADE_AMOUNT_BNB: parseFloat(process.env.MAX_TRADE_AMOUNT_BNB || '0.1'),
  STOP_LOSS_PERCENTAGE: parseFloat(process.env.STOP_LOSS_PERCENTAGE || '5'),
  MAX_SLIPPAGE_PERCENTAGE: parseFloat(process.env.MAX_SLIPPAGE_PERCENTAGE || '2'),

  // Greenfield
  GREENFIELD_BUCKET_NAME: process.env.GREENFIELD_BUCKET_NAME || 'immortal-bot-memory',
  GREENFIELD_RPC: process.env.GREENFIELD_RPC || 'https://greenfield-chain.bnbchain.org',

  // APIs
  DEXSCREENER_API_URL: process.env.DEXSCREENER_API_URL || 'https://api.dexscreener.com/latest/dex',

  // Bot Configuration
  BOT_LOOP_INTERVAL_MS: parseInt(process.env.BOT_LOOP_INTERVAL_MS || '300000'),
  ENABLE_CROSS_CHAIN: process.env.ENABLE_CROSS_CHAIN === 'true',
  NETWORK: process.env.NETWORK || 'testnet',

  // Token Watchlist (default meme tokens on BNB)
  DEFAULT_WATCHLIST: [
    // Add token addresses here
  ] as string[],

  // Risk Levels
  RISK_LEVELS: {
    LOW: { maxTradeAmount: 0.05, stopLoss: 3 },
    MEDIUM: { maxTradeAmount: 0.1, stopLoss: 5 },
    HIGH: { maxTradeAmount: 0.2, stopLoss: 10 },
  },
} as const;

export type RiskLevel = keyof typeof CONFIG.RISK_LEVELS;

// Validation
if (!CONFIG.OPENROUTER_API_KEY && process.env.NODE_ENV !== 'test') {
  console.warn('⚠️  OPENROUTER_API_KEY not set - AI features will not work');
}

if (!CONFIG.WALLET_PRIVATE_KEY && process.env.NODE_ENV !== 'test') {
  console.warn('⚠️  WALLET_PRIVATE_KEY not set - Trading will not work');
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
