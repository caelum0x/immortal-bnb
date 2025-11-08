/**
 * Shared TypeScript types for the Immortal AI Trading Bot
 */

/**
 * AI Decision structure for trades
 */
export interface AIDecision {
  action: 'buy' | 'sell' | 'hold';
  amount: number; // in BNB
  confidence: number; // 0-1
  reason: string;
  riskLevel: 'low' | 'medium' | 'high';
  targetPrice?: number;
  stopLoss?: number;
}

/**
 * Trade execution result
 */
export interface TradeResult {
  success: boolean;
  txHash?: string;
  error?: string;
  amountIn?: string;
  amountOut?: string;
  gasUsed?: string;
}

/**
 * Token information from market data
 */
export interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
}

/**
 * Market data for a token
 */
export interface MarketData {
  price: number;
  priceChange24h: number;
  volume24h: number;
  liquidity: number;
  marketCap: number;
  buySellPressure: number;
}

// Remove the default export since it's causing the "used as value" errors
// All exports are type-only interfaces, they should be imported with 'type'
