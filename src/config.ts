import { config } from 'dotenv';
config();

export const CONFIG = {
  // API Keys
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || '',

  // Blockchain
  BNB_RPC: process.env.NETWORK === 'mainnet'
    ? process.env.BNB_MAINNET_RPC || 'https://bsc-dataseed.bnbchain.org'
    : process.env.BNB_RPC || 'https://bsc-testnet.bnbchain.org',
  WALLET_PRIVATE_KEY: process.env.WALLET_PRIVATE_KEY || '',

  // Telegram
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '',
  TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID || '',

  // Contract Addresses
  PANCAKE_ROUTER_V2: process.env.PANCAKE_ROUTER_V2 || '0x10ED43C718714eb63d5aA57B6Da2929C30bC095c',
  PANCAKE_ROUTER_V3: process.env.PANCAKE_ROUTER_V3 || '0x1b81D678ffb9C0263b24A97847620C99d213eB14',
  WBNB_ADDRESS: process.env.WBNB_ADDRESS || '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
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

export default CONFIG;
