// src/blockchain/tradeDecisionEngine.ts
// Dynamic trade decision engine using real-time market data
// Implements automated trade execution decisions based on liquidity, volatility, and risk metrics

import { ethers } from 'ethers';
import { logger, logError } from '../utils/logger';
import { CONFIG } from '../config';
import TokenDiscovery from './tokenDiscovery';
import type { DiscoveredToken } from './tokenDiscovery';
import PancakeSwapV3 from './pancakeSwapIntegration';

export interface TradeDecision {
  executable: boolean;
  confidence: number; // 0-100
  reason: string;
  recommendedAmount?: number;
  estimatedSlippage?: number;
  estimatedGasCost?: number;
  priceImpact?: number;
  liquidityScore?: number;
  riskScore?: number; // 0-100 (lower is better)
  timeframe?: 'immediate' | 'short' | 'medium' | 'long';
}

export interface MarketConditions {
  avgVolume24h: number;
  avgLiquidity: number;
  marketVolatility: number;
  gasPriceGwei: number;
  bnbPriceUsd: number;
  totalMarketCap: number;
}

export interface TradeAnalysis {
  token: DiscoveredToken;
  decision: TradeDecision;
  marketConditions: MarketConditions;
  technicalIndicators: {
    volumeRatio: number; // Current volume vs average
    liquidityRatio: number; // Current liquidity vs average  
    priceVolatility: number; // Price change volatility
    tradingActivity: number; // Transaction count score
    marketCapRank: number; // Relative market cap ranking
  };
}

/**
 * Trade Decision Engine
 * Analyzes tokens and market conditions to make automated trading decisions
 */
export class TradeDecisionEngine {
  private tokenDiscovery: TokenDiscovery;
  private pancakeSwap: PancakeSwapV3;
  private provider: ethers.Provider;
  private marketConditions: MarketConditions | null = null;
  private lastMarketUpdate = 0;
  private readonly MARKET_UPDATE_INTERVAL = 300000; // 5 minutes

  constructor() {
    this.tokenDiscovery = new TokenDiscovery();
    this.pancakeSwap = new PancakeSwapV3();
    this.provider = new ethers.JsonRpcProvider(CONFIG.RPC_URL);
    
    logger.info('🧠 Trade Decision Engine initialized');
  }

  /**
   * Analyze a token and determine if it's worth trading
   */
  async analyzeToken(
    tokenAddress: string, 
    tradeAmount: number, 
    action: 'buy' | 'sell' = 'buy'
  ): Promise<TradeAnalysis | null> {
    try {
      logger.info(`\n🔍 Analyzing ${action} opportunity for ${tokenAddress}...`);
      
      // Get token data
      const tokens = await this.tokenDiscovery.getTokenByAddress(tokenAddress);
      if (tokens.length === 0) {
        logger.warn(`Token ${tokenAddress} not found on DexScreener`);
        return null;
      }

      const token = tokens[0];
      if (!token) {
        logger.warn(`Invalid token data for ${tokenAddress}`);
        return null;
      }
      
      logger.info(`  Token: ${token.symbol} ($${token.priceUsd.toFixed(6)})`);

      // Update market conditions if needed
      await this.updateMarketConditions();
      if (!this.marketConditions) {
        logger.error('Failed to get market conditions');
        return null;
      }

      // Calculate technical indicators
      const technicalIndicators = this.calculateTechnicalIndicators(token, this.marketConditions);
      
      // Make trade decision
      const decision = await this.makeTradeDecision(token, tradeAmount, action, technicalIndicators);
      
      const analysis: TradeAnalysis = {
        token,
        decision,
        marketConditions: this.marketConditions,
        technicalIndicators
      };

      this.logAnalysis(analysis);
      return analysis;
    } catch (error) {
      logError('analyzeToken', error as Error);
      return null;
    }
  }

  /**
   * Batch analyze multiple tokens and rank them by trading opportunity
   */
  async analyzeBatch(
    tokens: DiscoveredToken[], 
    tradeAmount: number,
    action: 'buy' | 'sell' = 'buy'
  ): Promise<TradeAnalysis[]> {
    logger.info(`\n📊 Batch analyzing ${tokens.length} tokens...`);
    
    const analyses: TradeAnalysis[] = [];
    
    for (const token of tokens) {
      const analysis = await this.analyzeToken(token.tokenAddress, tradeAmount, action);
      if (analysis && analysis.decision.executable) {
        analyses.push(analysis);
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Sort by confidence and liquidity score
    analyses.sort((a, b) => {
      const scoreA = a.decision.confidence * (a.decision.liquidityScore || 0);
      const scoreB = b.decision.confidence * (b.decision.liquidityScore || 0);
      return scoreB - scoreA;
    });

    logger.info(`✅ Found ${analyses.length} executable opportunities`);
    return analyses;
  }

  /**
   * Find the best trading opportunities automatically
   */
  async findBestOpportunities(
    tradeAmount: number,
    maxTokens: number = 10,
    minConfidence: number = 70
  ): Promise<TradeAnalysis[]> {
    try {
      logger.info(`\n🎯 Finding best trading opportunities...`);
      logger.info(`  Trade amount: ${tradeAmount} BNB`);
      logger.info(`  Max tokens: ${maxTokens}`);
      logger.info(`  Min confidence: ${minConfidence}%`);

      // Get trending tokens
      const trendingTokens = await this.tokenDiscovery.discoverTrendingTokens({
        limit: 100,
        sortBy: 'volume24h',
        filter: {
          minVolume24h: 1000, // $1k minimum volume
          minLiquidityUsd: tradeAmount * 1000 * 10, // 10x trade amount in liquidity
          maxPriceChange24h: 500, // Max 500% change (avoid rugs)
        }
      });

      if (trendingTokens.length === 0) {
        logger.warn('No trending tokens found matching criteria');
        return [];
      }

      // Analyze batch
      const analyses = await this.analyzeBatch(trendingTokens, tradeAmount);
      
      // Filter by confidence
      const goodOpportunities = analyses.filter(analysis => 
        analysis.decision.confidence >= minConfidence
      ).slice(0, maxTokens);

      logger.info(`🚀 Found ${goodOpportunities.length} high-confidence opportunities`);
      
      return goodOpportunities;
    } catch (error) {
      logError('findBestOpportunities', error as Error);
      return [];
    }
  }

  /**
   * Make trading decision based on token and market analysis
   */
  private async makeTradeDecision(
    token: DiscoveredToken,
    tradeAmount: number,
    action: 'buy' | 'sell',
    indicators: any
  ): Promise<TradeDecision> {
    try {
      let score = 50; // Base score
      let reasons: string[] = [];
      let riskFactors: string[] = [];

      // Liquidity Analysis
      const liquidityMultiple = token.liquidityUsd / (tradeAmount * 1000); // Convert BNB to USD roughly
      if (liquidityMultiple > 20) {
        score += 20;
        reasons.push(`Excellent liquidity (${liquidityMultiple.toFixed(1)}x trade amount)`);
      } else if (liquidityMultiple > 10) {
        score += 10;
        reasons.push(`Good liquidity (${liquidityMultiple.toFixed(1)}x trade amount)`);
      } else if (liquidityMultiple > 5) {
        score += 5;
        reasons.push(`Adequate liquidity (${liquidityMultiple.toFixed(1)}x trade amount)`);
      } else {
        score -= 30;
        riskFactors.push(`Low liquidity (${liquidityMultiple.toFixed(1)}x trade amount)`);
      }

      // Volume Analysis
      if (indicators.volumeRatio > 2) {
        score += 15;
        reasons.push(`High volume spike (${indicators.volumeRatio.toFixed(1)}x average)`);
      } else if (indicators.volumeRatio > 1.5) {
        score += 10;
        reasons.push(`Above-average volume (${indicators.volumeRatio.toFixed(1)}x average)`);
      } else if (indicators.volumeRatio < 0.5) {
        score -= 15;
        riskFactors.push(`Low volume (${indicators.volumeRatio.toFixed(1)}x average)`);
      }

      // Price Change Analysis
      const absChange = Math.abs(token.priceChange24h);
      if (action === 'buy') {
        if (token.priceChange24h > 50 && token.priceChange24h < 200) {
          score += 15;
          reasons.push(`Strong positive momentum (+${token.priceChange24h.toFixed(1)}%)`);
        } else if (token.priceChange24h > 500) {
          score -= 25;
          riskFactors.push(`Extreme pump (+${token.priceChange24h.toFixed(1)}%) - high rug risk`);
        } else if (token.priceChange24h < -30) {
          score -= 10;
          riskFactors.push(`Declining price (${token.priceChange24h.toFixed(1)}%)`);
        }
      }

      // Trading Activity
      const txCount24h = token.txCount?.h24 || 0;
      if (txCount24h > 100) {
        score += 10;
        reasons.push(`High trading activity (${txCount24h} transactions)`);
      } else if (txCount24h < 10) {
        score -= 15;
        riskFactors.push(`Low trading activity (${txCount24h} transactions)`);
      }

      // Market Cap Analysis
      if (token.marketCap && token.marketCap > 0) {
        if (token.marketCap > 10000000) { // > $10M
          score += 5;
          reasons.push(`Established market cap ($${(token.marketCap / 1000000).toFixed(1)}M)`);
        } else if (token.marketCap < 100000) { // < $100k
          score -= 20;
          riskFactors.push(`Very low market cap ($${(token.marketCap / 1000).toFixed(0)}k) - high risk`);
        }
      }

      // Get on-chain validation
      try {
        const quote = await this.pancakeSwap.getQuote(token.tokenAddress, tradeAmount);
        const priceImpact = this.calculatePriceImpact(quote, tradeAmount);
        
        if (priceImpact > 10) {
          score -= 25;
          riskFactors.push(`High price impact (${priceImpact.toFixed(1)}%)`);
        } else if (priceImpact > 5) {
          score -= 10;
          riskFactors.push(`Moderate price impact (${priceImpact.toFixed(1)}%)`);
        } else {
          score += 5;
          reasons.push(`Low price impact (${priceImpact.toFixed(1)}%)`);
        }

        // Estimate gas cost
        const gasPrice = await this.provider.getFeeData();
        const estimatedGasCost = gasPrice.gasPrice ? 
          parseFloat(ethers.formatEther(gasPrice.gasPrice * BigInt(200000))) : 0; // Rough estimate

        if (estimatedGasCost > tradeAmount * 0.05) { // More than 5% of trade
          score -= 15;
          riskFactors.push(`High gas cost (${(estimatedGasCost * 100 / tradeAmount).toFixed(1)}% of trade)`);
        }

      } catch (error) {
        score -= 20;
        riskFactors.push('Failed to get on-chain quote - possible liquidity issues');
      }

      // Final decision
      const confidence = Math.max(0, Math.min(100, score));
      const executable = confidence >= 60 && riskFactors.length <= 2;
      
      const mainReason = executable ? 
        `Good opportunity: ${reasons.slice(0, 2).join(', ')}` :
        `High risk: ${riskFactors.slice(0, 2).join(', ')}`;

      return {
        executable,
        confidence,
        reason: mainReason,
        recommendedAmount: executable ? tradeAmount : undefined,
        liquidityScore: liquidityMultiple,
        riskScore: 100 - confidence,
        timeframe: this.determineTimeframe(indicators)
      };

    } catch (error) {
      logError('makeTradeDecision', error as Error);
      return {
        executable: false,
        confidence: 0,
        reason: 'Analysis failed',
        riskScore: 100
      };
    }
  }

  /**
   * Calculate technical indicators for a token
   */
  private calculateTechnicalIndicators(token: DiscoveredToken, market: MarketConditions) {
    const volumeRatio = market.avgVolume24h > 0 ? token.volume24h / market.avgVolume24h : 0;
    const liquidityRatio = market.avgLiquidity > 0 ? token.liquidityUsd / market.avgLiquidity : 0;
    
    return {
      volumeRatio,
      liquidityRatio,
      priceVolatility: Math.abs(token.priceChange24h),
      tradingActivity: (token.txCount?.h24 || 0) / 100, // Normalized to 0-1+ scale
      marketCapRank: token.marketCap ? Math.log10(token.marketCap) : 0
    };
  }

  /**
   * Update market conditions from various sources
   */
  private async updateMarketConditions(): Promise<void> {
    if (this.marketConditions && Date.now() - this.lastMarketUpdate < this.MARKET_UPDATE_INTERVAL) {
      return; // Use cached data
    }

    try {
      logger.info('📈 Updating market conditions...');
      
      // Get market overview from token discovery
      const overview = await this.tokenDiscovery.getMarketOverview();
      
      // Get gas price
      const feeData = await this.provider.getFeeData();
      const gasPriceGwei = feeData.gasPrice ? 
        parseFloat(ethers.formatUnits(feeData.gasPrice, 'gwei')) : 5;

      // Calculate market volatility from top tokens
      const volatilities = overview.topTokens.map(token => Math.abs(token.priceChange24h));
      const marketVolatility = volatilities.length > 0 ? 
        volatilities.reduce((sum, vol) => sum + vol, 0) / volatilities.length : 0;

      this.marketConditions = {
        avgVolume24h: overview.avgVolume24h,
        avgLiquidity: overview.avgLiquidity,
        marketVolatility,
        gasPriceGwei,
        bnbPriceUsd: 600, // Approximate - could fetch from API
        totalMarketCap: overview.topTokens.reduce((sum, token) => sum + (token.marketCap || 0), 0)
      };

      this.lastMarketUpdate = Date.now();
      
      logger.info(`  Avg Volume: $${overview.avgVolume24h.toFixed(0)}`);
      logger.info(`  Avg Liquidity: $${overview.avgLiquidity.toFixed(0)}`);
      logger.info(`  Market Volatility: ${marketVolatility.toFixed(1)}%`);
      logger.info(`  Gas Price: ${gasPriceGwei.toFixed(1)} gwei`);
      
    } catch (error) {
      logError('updateMarketConditions', error as Error);
    }
  }

  /**
   * Calculate price impact from quote
   */
  private calculatePriceImpact(quote: any, tradeAmount: number): number {
    try {
      // This is a simplified calculation - adjust based on your quote structure
      const expectedTokens = quote.expectedTokens || 0;
      const pricePerToken = quote.pricePerToken || 0;
      
      if (expectedTokens > 0 && pricePerToken > 0) {
        const idealTokens = tradeAmount / pricePerToken;
        const impact = Math.abs((idealTokens - expectedTokens) / idealTokens) * 100;
        return impact;
      }
      
      return 0;
    } catch {
      return 10; // Conservative estimate if calculation fails
    }
  }

  /**
   * Determine recommended timeframe for trade
   */
  private determineTimeframe(indicators: any): 'immediate' | 'short' | 'medium' | 'long' {
    if (indicators.volumeRatio > 3) return 'immediate';
    if (indicators.volumeRatio > 1.5) return 'short';
    if (indicators.liquidityRatio > 2) return 'medium';
    return 'long';
  }

  /**
   * Log analysis results
   */
  private logAnalysis(analysis: TradeAnalysis): void {
    const { token, decision, technicalIndicators } = analysis;
    
    logger.info(`\n📋 Analysis Results for ${token.symbol}:`);
    logger.info(`  Decision: ${decision.executable ? '✅ EXECUTABLE' : '❌ NOT EXECUTABLE'}`);
    logger.info(`  Confidence: ${decision.confidence}%`);
    logger.info(`  Reason: ${decision.reason}`);
    logger.info(`  Risk Score: ${decision.riskScore}/100`);
    
    if (decision.executable) {
      logger.info(`  Recommended Amount: ${decision.recommendedAmount} BNB`);
      logger.info(`  Liquidity Score: ${decision.liquidityScore?.toFixed(1)}x`);
      logger.info(`  Timeframe: ${decision.timeframe}`);
    }
    
    logger.info(`  Technical Indicators:`);
    logger.info(`    Volume Ratio: ${technicalIndicators.volumeRatio.toFixed(2)}x`);
    logger.info(`    Liquidity Ratio: ${technicalIndicators.liquidityRatio.toFixed(2)}x`);
    logger.info(`    Price Volatility: ${technicalIndicators.priceVolatility.toFixed(1)}%`);
    logger.info(`    Trading Activity: ${technicalIndicators.tradingActivity.toFixed(2)}`);
  }
}

export default TradeDecisionEngine;
