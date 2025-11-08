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

/**
 * Enhanced safeguards system for immortal trading bot
 */

export interface TradingLimits {
  maxSingleTradeAmount: number;
  maxDailyVolume: number;
  maxPositionsPerToken: number;
  maxTotalPortfolio: number;
  minTokenLiquidity: number;
  minTokenVolume24h: number;
  maxPriceImpact: number;
  maxSlippage: number;
  cooldownBetweenTrades: number; // milliseconds
}

export interface RiskMetrics {
  portfolioValue: number;
  exposurePercentage: number;
  volatilityRisk: 'low' | 'medium' | 'high' | 'extreme';
  liquidityRisk: 'low' | 'medium' | 'high';
  concentrationRisk: 'low' | 'medium' | 'high';
}

export class SafeguardEngine {
  private tradingHistory: Map<string, number[]> = new Map(); // token -> trade timestamps
  private dailyVolume = 0;
  private dailyVolumeResetTime = 0;
  private lastTradeTime = 0;

  private limits: TradingLimits = {
    maxSingleTradeAmount: CONFIG.MAX_TRADE_AMOUNT_BNB || 0.1,
    maxDailyVolume: 0.5, // 0.5 BNB per day
    maxPositionsPerToken: 1, // Only one position per token
    maxTotalPortfolio: 1.0, // Maximum 1 BNB total exposure
    minTokenLiquidity: 50000, // $50k minimum liquidity
    minTokenVolume24h: 10000, // $10k minimum daily volume
    maxPriceImpact: 5, // 5% maximum price impact
    maxSlippage: 3, // 3% maximum slippage
    cooldownBetweenTrades: 60000 // 1 minute between trades
  };

  /**
   * Comprehensive pre-trade validation
   */
  async validateTrade(params: {
    tokenAddress: string;
    amount: number;
    action: 'buy' | 'sell';
    tokenData?: any;
    walletBalance: number;
    currentPositions?: Map<string, number>;
  }): Promise<{ valid: boolean; reason?: string; riskLevel: 'low' | 'medium' | 'high' }> {
    
    try {
      // 1. Basic amount validation
      if (!validateTradeAmount(params.amount, this.limits.maxSingleTradeAmount)) {
        return { valid: false, reason: 'Trade amount exceeds limits', riskLevel: 'high' };
      }

      // 2. Balance check
      if (!checkSufficientBalance(params.amount, params.walletBalance)) {
        return { valid: false, reason: 'Insufficient balance', riskLevel: 'high' };
      }

      // 3. Daily volume check
      this.updateDailyVolume();
      if (this.dailyVolume + params.amount > this.limits.maxDailyVolume) {
        return { valid: false, reason: 'Daily volume limit exceeded', riskLevel: 'medium' };
      }

      // 4. Cooldown check
      if (Date.now() - this.lastTradeTime < this.limits.cooldownBetweenTrades) {
        const remaining = Math.ceil((this.limits.cooldownBetweenTrades - (Date.now() - this.lastTradeTime)) / 1000);
        return { valid: false, reason: `Cooldown active, ${remaining}s remaining`, riskLevel: 'low' };
      }

      // 5. Token-specific validations
      if (params.tokenData) {
        const tokenValidation = this.validateTokenSafety(params.tokenData);
        if (!tokenValidation.valid) {
          return tokenValidation;
        }
      }

      // 6. Position concentration check
      if (params.currentPositions) {
        const concentrationCheck = this.checkConcentrationRisk(params.tokenAddress, params.amount, params.currentPositions);
        if (!concentrationCheck.valid) {
          return concentrationCheck;
        }
      }

      // 7. Market condition checks
      const marketCheck = this.checkMarketConditions();
      if (!marketCheck.valid) {
        return marketCheck;
      }

      // Calculate overall risk level
      const riskLevel = this.calculateOverallRisk(params);

      logger.info(`✅ Trade validation passed - Risk level: ${riskLevel}`);
      return { valid: true, riskLevel };

    } catch (error) {
      logger.error(`❌ Trade validation error: ${(error as Error).message}`);
      return { valid: false, reason: 'Validation error', riskLevel: 'high' };
    }
  }

  /**
   * Validate token safety parameters
   */
  private validateTokenSafety(tokenData: any): { valid: boolean; reason?: string; riskLevel: 'low' | 'medium' | 'high' } {
    // Liquidity check
    if (tokenData.liquidity < this.limits.minTokenLiquidity) {
      return { 
        valid: false, 
        reason: `Low liquidity: $${tokenData.liquidity.toLocaleString()} < $${this.limits.minTokenLiquidity.toLocaleString()}`,
        riskLevel: 'high'
      };
    }

    // Volume check
    if (tokenData.volume24h < this.limits.minTokenVolume24h) {
      return { 
        valid: false, 
        reason: `Low volume: $${tokenData.volume24h.toLocaleString()} < $${this.limits.minTokenVolume24h.toLocaleString()}`,
        riskLevel: 'high'
      };
    }

    // Extreme volatility check
    if (Math.abs(tokenData.priceChange24h) > 80) {
      return { 
        valid: false, 
        reason: `Extreme volatility: ${tokenData.priceChange24h.toFixed(2)}% change`,
        riskLevel: 'high'
      };
    }

    // Honeypot/scam indicators
    if (this.detectSuspiciousActivity(tokenData)) {
      return { 
        valid: false, 
        reason: 'Suspicious token activity detected',
        riskLevel: 'high'
      };
    }

    return { valid: true, riskLevel: 'low' };
  }

  /**
   * Check for position concentration risk
   */
  private checkConcentrationRisk(
    tokenAddress: string, 
    amount: number, 
    positions: Map<string, number>
  ): { valid: boolean; reason?: string; riskLevel: 'low' | 'medium' | 'high' } {
    
    // Check if already have position in this token
    if (positions.has(tokenAddress) && positions.get(tokenAddress)! > 0) {
      return { 
        valid: false, 
        reason: 'Already have position in this token',
        riskLevel: 'medium'
      };
    }

    // Check total portfolio exposure
    const totalExposure = Array.from(positions.values()).reduce((sum, pos) => sum + pos, 0) + amount;
    if (totalExposure > this.limits.maxTotalPortfolio) {
      return { 
        valid: false, 
        reason: `Total exposure would exceed limit: ${totalExposure.toFixed(4)} > ${this.limits.maxTotalPortfolio}`,
        riskLevel: 'high'
      };
    }

    return { valid: true, riskLevel: 'low' };
  }

  /**
   * Check overall market conditions
   */
  private checkMarketConditions(): { valid: boolean; reason?: string; riskLevel: 'low' | 'medium' | 'high' } {
    // TODO: Implement market condition checks
    // - Check for high gas prices
    // - Check for network congestion
    // - Check for extreme market volatility
    // - Check for maintenance periods

    return { valid: true, riskLevel: 'low' };
  }

  /**
   * Detect suspicious token activity
   */
  private detectSuspiciousActivity(tokenData: any): boolean {
    // Red flags for potential scams/honeypots
    
    // Extremely high price increase (possible pump)
    if (tokenData.priceChange24h > 500) {
      logger.warn(`🚨 Suspicious: Extreme price pump ${tokenData.priceChange24h.toFixed(2)}%`);
      return true;
    }

    // Very low liquidity vs market cap
    if (tokenData.marketCap > 0 && tokenData.liquidity / tokenData.marketCap < 0.01) {
      logger.warn(`🚨 Suspicious: Very low liquidity ratio`);
      return true;
    }

    // Unbalanced buy/sell pressure (possible honeypot)
    if (tokenData.txns24h) {
      const totalTxns = tokenData.txns24h.buys + tokenData.txns24h.sells;
      if (totalTxns > 0) {
        const buyRatio = tokenData.txns24h.buys / totalTxns;
        if (buyRatio > 0.95 || buyRatio < 0.05) {
          logger.warn(`🚨 Suspicious: Unbalanced buy/sell ratio ${buyRatio.toFixed(2)}`);
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Calculate overall risk level for a trade
   */
  private calculateOverallRisk(params: any): 'low' | 'medium' | 'high' {
    let riskScore = 0;

    // Amount risk
    const amountRatio = params.amount / this.limits.maxSingleTradeAmount;
    if (amountRatio > 0.8) riskScore += 2;
    else if (amountRatio > 0.5) riskScore += 1;

    // Token data risk
    if (params.tokenData) {
      const liquidityRatio = params.tokenData.liquidity / this.limits.minTokenLiquidity;
      if (liquidityRatio < 2) riskScore += 1;
      if (liquidityRatio < 1.5) riskScore += 1;

      if (Math.abs(params.tokenData.priceChange24h) > 20) riskScore += 1;
      if (Math.abs(params.tokenData.priceChange24h) > 50) riskScore += 2;
    }

    if (riskScore >= 3) return 'high';
    if (riskScore >= 1) return 'medium';
    return 'low';
  }

  /**
   * Update daily volume tracking
   */
  private updateDailyVolume(): void {
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    // Reset daily volume if it's a new day
    if (now - this.dailyVolumeResetTime > oneDayMs) {
      this.dailyVolume = 0;
      this.dailyVolumeResetTime = now;
      logger.info('📊 Daily volume counter reset');
    }
  }

  /**
   * Record a completed trade
   */
  recordTrade(tokenAddress: string, amount: number): void {
    // Update daily volume
    this.updateDailyVolume();
    this.dailyVolume += amount;
    this.lastTradeTime = Date.now();

    // Update token trading history
    const history = this.tradingHistory.get(tokenAddress) || [];
    history.push(Date.now());
    
    // Keep only last 10 trades per token
    if (history.length > 10) {
      history.shift();
    }
    
    this.tradingHistory.set(tokenAddress, history);

    logger.info(`📝 Trade recorded: ${amount} BNB for ${tokenAddress}`);
  }

  /**
   * Get current safeguard statistics
   */
  getSafeguardStats(): {
    dailyVolume: number;
    dailyVolumeLimit: number;
    lastTradeTime: number;
    activeTokens: number;
    limits: TradingLimits;
  } {
    this.updateDailyVolume();
    
    return {
      dailyVolume: this.dailyVolume,
      dailyVolumeLimit: this.limits.maxDailyVolume,
      lastTradeTime: this.lastTradeTime,
      activeTokens: this.tradingHistory.size,
      limits: this.limits
    };
  }

  /**
   * Update safeguard limits
   */
  updateLimits(newLimits: Partial<TradingLimits>): void {
    this.limits = { ...this.limits, ...newLimits };
    logger.info('⚙️  Safeguard limits updated', newLimits);
  }

  /**
   * Emergency stop - disable all trading
   */
  emergencyStop(): void {
    this.limits.maxSingleTradeAmount = 0;
    this.limits.maxDailyVolume = 0;
    logger.warn('🚨 EMERGENCY STOP ACTIVATED - All trading disabled');
  }

  /**
   * Reset emergency stop
   */
  resetEmergencyStop(): void {
    this.limits.maxSingleTradeAmount = CONFIG.MAX_TRADE_AMOUNT_BNB || 0.1;
    this.limits.maxDailyVolume = 0.5;
    logger.info('✅ Emergency stop reset - Trading re-enabled');
  }
}

// Global safeguard engine instance
export const safeguardEngine = new SafeguardEngine();

// Utility functions for slippage
export function checkSlippage(actualSlippage: number, maxSlippage = 5): void {
  if (actualSlippage > maxSlippage) {
    throw new SlippageError(maxSlippage, actualSlippage);
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
