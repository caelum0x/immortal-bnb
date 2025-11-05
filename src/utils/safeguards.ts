import { logger } from './logger';
import { CONFIG } from '../config';
import { InsufficientFundsError, SlippageError } from './errorHandler';

export interface SafeguardConfig {
  maxTradeAmount: number;
  stopLossPercentage: number;
  maxSlippagePercentage: number;
}

/**
 * Check if trade amount is within allowed limits
 */
export function validateTradeAmount(amount: number, maxAmount?: number): boolean {
  const limit = maxAmount || CONFIG.MAX_TRADE_AMOUNT_BNB;

  if (amount > limit) {
    logger.warn(`Trade amount ${amount} BNB exceeds maximum ${limit} BNB`);
    return false;
  }

  if (amount <= 0) {
    logger.warn(`Trade amount must be positive, got ${amount} BNB`);
    return false;
  }

  return true;
}

/**
 * Check if wallet has sufficient balance
 */
export function checkSufficientBalance(
  requiredAmount: number,
  availableBalance: number,
  reserveAmount: number = 0.01 // Keep 0.01 BNB for gas
): boolean {
  const totalRequired = requiredAmount + reserveAmount;

  if (availableBalance < totalRequired) {
    throw new InsufficientFundsError(totalRequired, availableBalance);
  }

  return true;
}

/**
 * Calculate stop loss price
 */
export function calculateStopLoss(
  entryPrice: number,
  stopLossPercentage: number
): number {
  return entryPrice * (1 - stopLossPercentage / 100);
}

/**
 * Check if stop loss is triggered
 */
export function isStopLossTriggered(
  currentPrice: number,
  entryPrice: number,
  stopLossPercentage: number
): boolean {
  const stopLossPrice = calculateStopLoss(entryPrice, stopLossPercentage);

  if (currentPrice <= stopLossPrice) {
    logger.warn(
      `Stop loss triggered: Current price ${currentPrice} <= Stop loss ${stopLossPrice}`
    );
    return true;
  }

  return false;
}

/**
 * Calculate slippage percentage
 */
export function calculateSlippage(
  expectedPrice: number,
  actualPrice: number
): number {
  return Math.abs(((actualPrice - expectedPrice) / expectedPrice) * 100);
}

/**
 * Validate slippage is within acceptable range
 */
export function validateSlippage(
  expectedPrice: number,
  actualPrice: number,
  maxSlippage?: number
): boolean {
  const slippage = calculateSlippage(expectedPrice, actualPrice);
  const limit = maxSlippage || CONFIG.MAX_SLIPPAGE_PERCENTAGE;

  if (slippage > limit) {
    throw new SlippageError(limit, slippage);
  }

  return true;
}

/**
 * Calculate position size based on risk
 */
export function calculatePositionSize(
  accountBalance: number,
  riskPercentage: number,
  stopLossPercentage: number
): number {
  // Kelly Criterion-inspired calculation
  const riskAmount = accountBalance * (riskPercentage / 100);
  const positionSize = riskAmount / (stopLossPercentage / 100);

  // Cap at max trade amount
  return Math.min(positionSize, CONFIG.MAX_TRADE_AMOUNT_BNB);
}

/**
 * Rate limiting check
 */
export class RateLimiter {
  private requests: number[] = [];

  constructor(
    private maxRequests: number,
    private windowMs: number
  ) {}

  canMakeRequest(): boolean {
    const now = Date.now();

    // Remove old requests outside the window
    this.requests = this.requests.filter(time => now - time < this.windowMs);

    if (this.requests.length >= this.maxRequests) {
      logger.warn(`Rate limit reached: ${this.requests.length}/${this.maxRequests} requests`);
      return false;
    }

    this.requests.push(now);
    return true;
  }

  reset(): void {
    this.requests = [];
  }
}

/**
 * Cooldown manager for trading
 */
export class TradeCooldown {
  private lastTradeTime: { [token: string]: number } = {};

  constructor(private cooldownMs: number) {}

  canTrade(tokenAddress: string): boolean {
    const now = Date.now();
    const lastTrade = this.lastTradeTime[tokenAddress] || 0;

    if (now - lastTrade < this.cooldownMs) {
      const remainingMs = this.cooldownMs - (now - lastTrade);
      logger.warn(`Trade cooldown active for ${tokenAddress}: ${Math.round(remainingMs / 1000)}s remaining`);
      return false;
    }

    return true;
  }

  recordTrade(tokenAddress: string): void {
    this.lastTradeTime[tokenAddress] = Date.now();
  }

  reset(tokenAddress?: string): void {
    if (tokenAddress) {
      delete this.lastTradeTime[tokenAddress];
    } else {
      this.lastTradeTime = {};
    }
  }
}

export default {
  validateTradeAmount,
  checkSufficientBalance,
  calculateStopLoss,
  isStopLossTriggered,
  calculateSlippage,
  validateSlippage,
  calculatePositionSize,
  RateLimiter,
  TradeCooldown,
};
