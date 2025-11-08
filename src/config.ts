import { config } from 'dotenv';
config();

export const CONFIG = {
  // ===== API Keys =====
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || '',
  AI_MODEL: process.env.AI_MODEL || 'openai/gpt-4o-mini',

  // ===== Blockchain Configuration =====
  NETWORK: process.env.NETWORK || 'testnet',
  CHAIN_ID: parseInt(process.env.CHAIN_ID || '5611'), // 5611 = opBNB testnet, 56 = BSC mainnet

  RPC_URL_TESTNET: process.env.RPC_URL_TESTNET || 'https://opbnb-testnet-rpc.bnbchain.org',
  RPC_URL_MAINNET: process.env.RPC_URL_MAINNET || 'https://bsc-dataseed.binance.org',

  // Dynamic RPC based on network
  BNB_RPC: process.env.NETWORK === 'mainnet'
    ? (process.env.RPC_URL_MAINNET || 'https://bsc-dataseed.binance.org')
    : (process.env.RPC_URL_TESTNET || 'https://opbnb-testnet-rpc.bnbchain.org'),

  WALLET_PRIVATE_KEY: process.env.WALLET_PRIVATE_KEY || '',

  // ===== Contract Addresses =====
  PANCAKE_ROUTER_V2: process.env.PANCAKE_ROUTER_V2 || '0x10ED43C718714eb63d5aA57B6Da2929C30bC095c',
  PANCAKE_ROUTER_V3: process.env.PANCAKE_ROUTER_V3 || '0x1b81D678ffb9C0263b24A97847620C99d213eB14',
  WBNB_ADDRESS: process.env.WBNB_ADDRESS || '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
  IMMBOT_TOKEN_ADDRESS: process.env.IMMBOT_TOKEN_ADDRESS || '',
  STAKING_CONTRACT_ADDRESS: process.env.STAKING_CONTRACT_ADDRESS || '',

  // ===== Trading Parameters =====
  MAX_TRADE_AMOUNT_BNB: parseFloat(process.env.MAX_TRADE_AMOUNT_BNB || '1.0'),
  STOP_LOSS_PERCENTAGE: parseFloat(process.env.STOP_LOSS_PERCENTAGE || '10'),
  MAX_SLIPPAGE_PERCENTAGE: parseFloat(process.env.MAX_SLIPPAGE_PERCENTAGE || '2'),
  BOT_LOOP_INTERVAL_MS: parseInt(process.env.BOT_LOOP_INTERVAL_MS || '300000'), // 5 minutes

  // ===== BNB Greenfield Storage =====
  GREENFIELD_BUCKET_NAME: process.env.GREENFIELD_BUCKET_NAME || 'immortal-bot-memories',
  GREENFIELD_RPC: process.env.GREENFIELD_RPC || 'https://greenfield-chain.bnbchain.org',
  GREENFIELD_ACCESS_KEY: process.env.GREENFIELD_ACCESS_KEY || '',
  GREENFIELD_SECRET_KEY: process.env.GREENFIELD_SECRET_KEY || '',

  // ===== DexScreener API =====
  DEXSCREENER_API_URL: process.env.DEXSCREENER_API_URL || 'https://api.dexscreener.com/latest/dex',
  DEXSCREENER_CHAIN: process.env.DEXSCREENER_CHAIN || 'bsc', // bsc for BNB Chain

  // ===== Telegram Alerts =====
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '',
  TELEGRAM_CHAT_ID: process.env.TELEGRAM_CHAT_ID || '',

  // ===== API Server =====
  API_PORT: parseInt(process.env.API_PORT || '3001'),
  API_KEY: process.env.API_KEY || '',

  // ===== Logging =====
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  LOG_TO_FILE: process.env.LOG_TO_FILE === 'true',

  // ===== Bot Features =====
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

export default CONFIG;
