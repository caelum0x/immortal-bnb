// src/blockchain/smartTradingEngine.ts
// Smart Trading Engine that combines dynamic discovery with PancakeSwap execution
// This orchestrates intelligent trading decisions and optimal execution

import PancakeSwapV3 from './pancakeSwapIntegration';
import type { SwapResult } from './pancakeSwapIntegration';
import DynamicTokenDiscovery from './dynamicTokenDiscovery';
import type { TokenAnalysis, TradingOpportunity } from './dynamicTokenDiscovery';
import { logger, logError, logTrade } from '../utils/logger';

export interface SmartTradeParams {
  amountBNB: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  maxSlippage?: number;
  minConfidence?: number;
  targetReturn?: number;
  maxPriceImpact?: number;
}

export interface SmartTradeResult extends SwapResult {
  tokenAnalysis?: TokenAnalysis;
  opportunity?: TradingOpportunity;
  decisionReason: string;
  confidenceScore: number;
  riskAssessment: string;
}

export interface PortfolioRecommendation {
  action: 'BUY' | 'SELL' | 'HOLD' | 'REBALANCE';
  tokens: Array<{
    address: string;
    symbol: string;
    allocation: number; // Percentage
    reason: string;
  }>;
  totalScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

/**
 * Smart Trading Engine
 * Combines dynamic token discovery with optimal execution
 */
export class SmartTradingEngine {
  private pancakeSwap: PancakeSwapV3;
  private tokenDiscovery: DynamicTokenDiscovery;
  private tradeHistory: SmartTradeResult[] = [];

  constructor() {
    this.pancakeSwap = new PancakeSwapV3();
    this.tokenDiscovery = new DynamicTokenDiscovery();
    
    logger.info('🧠 Smart Trading Engine initialized');
    logger.info('  Modules: Dynamic Discovery + PancakeSwap V3');
  }

  /**
   * Execute intelligent trade with full analysis
   */
  async executeSmartTrade(params: SmartTradeParams): Promise<SmartTradeResult> {
    try {
      logger.info(`\n🎯 Executing smart trade for ${params.amountBNB} BNB...`);
      logger.info(`  Risk Level: ${params.riskLevel}`);
      logger.info(`  Min Confidence: ${params.minConfidence || 60}%`);

      // Phase 1: Discover optimal trading opportunities
      const opportunities = await this.findOptimalOpportunities(params);
      
      if (opportunities.length === 0) {
        return {
          success: false,
          amountIn: params.amountBNB.toString(),
          amountOut: '0',
          decisionReason: 'No suitable trading opportunities found',
          confidenceScore: 0,
          riskAssessment: 'HIGH - No opportunities',
          error: 'No trading opportunities meet the specified criteria'
        };
      }

      // Phase 2: Select best opportunity
      const bestOpportunity = opportunities[0];
      if (!bestOpportunity) {
        return {
          success: false,
          amountIn: params.amountBNB.toString(),
          amountOut: '0',
          decisionReason: 'No suitable opportunity selected',
          confidenceScore: 0,
          riskAssessment: 'HIGH - No opportunities',
          error: 'Failed to select trading opportunity'
        };
      }
      
      logger.info(`🎯 Selected best opportunity: ${bestOpportunity.token.symbol}`);
      logger.info(`  Overall Score: ${bestOpportunity.overallScore.toFixed(1)}`);
      logger.info(`  Expected Return: ${bestOpportunity.expectedReturn.toFixed(2)}%`);
      logger.info(`  Price Impact: ${bestOpportunity.priceImpact.toFixed(2)}%`);

      // Phase 3: Execute trade with optimal parameters
      const tradeResult = await this.executeTrade(bestOpportunity, params);
      
      // Phase 4: Enhance result with analysis data
      const smartResult: SmartTradeResult = {
        ...tradeResult,
        tokenAnalysis: bestOpportunity.token,
        opportunity: bestOpportunity,
        decisionReason: this.generateDecisionReason(bestOpportunity),
        confidenceScore: bestOpportunity.token.confidence,
        riskAssessment: this.generateRiskAssessment(bestOpportunity)
      };

      // Log the trade
      if (smartResult.success) {
        this.tradeHistory.push(smartResult);
        logTrade('SMART_BUY', bestOpportunity.token.address, params.amountBNB);
        
        logger.info('✅ Smart trade executed successfully!');
        logger.info(`  Tokens received: ${smartResult.amountOut} ${bestOpportunity.token.symbol}`);
        logger.info(`  Confidence: ${smartResult.confidenceScore}%`);
      }

      return smartResult;

    } catch (error) {
      logError('executeSmartTrade', error as Error);
      return {
        success: false,
        amountIn: params.amountBNB.toString(),
        amountOut: '0',
        decisionReason: 'Trade execution failed',
        confidenceScore: 0,
        riskAssessment: 'HIGH - Execution error',
        error: (error as Error).message
      };
    }
  }

  /**
   * Get portfolio recommendations based on current market
   */
  async getPortfolioRecommendations(
    totalBNB: number,
    riskProfile: 'CONSERVATIVE' | 'BALANCED' | 'AGGRESSIVE'
  ): Promise<PortfolioRecommendation> {
    try {
      logger.info(`📊 Generating portfolio recommendations for ${totalBNB} BNB...`);
      logger.info(`  Risk Profile: ${riskProfile}`);

      // Discover tokens based on risk profile
      const riskLevel = this.mapRiskProfileToLevel(riskProfile);
      const opportunities = await this.tokenDiscovery.findTradingOpportunities(
        totalBNB,
        { riskTolerance: riskLevel, maxPriceImpact: this.getMaxPriceImpact(riskProfile) }
      );

      if (opportunities.length === 0) {
        return {
          action: 'HOLD',
          tokens: [],
          totalScore: 0,
          riskLevel: 'HIGH'
        };
      }

      // Generate allocations based on scores and risk profile
      const allocations = this.calculateOptimalAllocations(opportunities, riskProfile);
      
      const totalScore = allocations.reduce((sum, token) => sum + token.allocation, 0);
      const avgRiskLevel = this.calculateAverageRiskLevel(allocations, opportunities);

      const recommendation: PortfolioRecommendation = {
        action: totalScore > 70 ? 'BUY' : totalScore > 40 ? 'REBALANCE' : 'HOLD',
        tokens: allocations,
        totalScore,
        riskLevel: avgRiskLevel
      };

      logger.info(`💡 Portfolio recommendation: ${recommendation.action}`);
      logger.info(`  Total Score: ${totalScore.toFixed(1)}`);
      logger.info(`  Recommended tokens: ${allocations.length}`);

      return recommendation;

    } catch (error) {
      logError('getPortfolioRecommendations', error as Error);
      return {
        action: 'HOLD',
        tokens: [],
        totalScore: 0,
        riskLevel: 'HIGH'
      };
    }
  }

  /**
   * Monitor and analyze current positions
   */
  async monitorPositions(): Promise<Array<{
    token: string;
    currentPrice: number;
    priceChange: number;
    recommendation: 'HOLD' | 'SELL' | 'BUY_MORE';
    confidence: number;
    reason: string;
  }>> {
    try {
      logger.info('📈 Monitoring current positions...');
      
      const positions = [];
      
      // Analyze each token from trade history
      for (const trade of this.tradeHistory.slice(-10)) { // Last 10 trades
        if (trade.success && trade.tokenAnalysis) {
          try {
            const currentAnalysis = await this.tokenDiscovery.analyzeToken(
              trade.tokenAnalysis.address
            );
            
            const priceChange = ((currentAnalysis.price - trade.tokenAnalysis.price) / 
                               trade.tokenAnalysis.price) * 100;
            
            const recommendation = this.getPositionRecommendation(
              currentAnalysis, 
              priceChange
            );

            positions.push({
              token: currentAnalysis.symbol,
              currentPrice: currentAnalysis.price,
              priceChange,
              recommendation: recommendation.action,
              confidence: currentAnalysis.confidence,
              reason: recommendation.reason
            });
          } catch (error) {
            // Skip positions that can't be analyzed
            continue;
          }
        }
      }

      logger.info(`📊 Monitoring ${positions.length} positions`);
      return positions;

    } catch (error) {
      logError('monitorPositions', error as Error);
      return [];
    }
  }

  /**
   * Get trading statistics and performance
   */
  getStatistics(): {
    totalTrades: number;
    successRate: number;
    avgConfidence: number;
    avgReturn: number;
    riskDistribution: Record<string, number>;
  } {
    const successfulTrades = this.tradeHistory.filter(t => t.success);
    const successRate = this.tradeHistory.length > 0 ? 
      (successfulTrades.length / this.tradeHistory.length) * 100 : 0;
    
    const avgConfidence = successfulTrades.length > 0 ?
      successfulTrades.reduce((sum, t) => sum + t.confidenceScore, 0) / successfulTrades.length : 0;
    
    // Calculate risk distribution
    const riskDistribution = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0
    };
    
    successfulTrades.forEach(trade => {
      if (trade.tokenAnalysis) {
        riskDistribution[trade.tokenAnalysis.riskLevel]++;
      }
    });

    return {
      totalTrades: this.tradeHistory.length,
      successRate,
      avgConfidence,
      avgReturn: 0, // Would calculate from actual returns
      riskDistribution
    };
  }

  /**
   * Private helper methods
   */
  private async findOptimalOpportunities(params: SmartTradeParams): Promise<TradingOpportunity[]> {
    const preferences = {
      riskTolerance: params.riskLevel,
      expectedReturn: params.targetReturn || 5,
      maxPriceImpact: params.maxPriceImpact || 3,
      timeframe: 'MEDIUM' as const
    };

    const opportunities = await this.tokenDiscovery.findTradingOpportunities(
      params.amountBNB,
      preferences
    );

    // Filter by minimum confidence
    const minConfidence = params.minConfidence || 60;
    return opportunities.filter(opp => opp.token.confidence >= minConfidence);
  }

  private async executeTrade(
    opportunity: TradingOpportunity, 
    params: SmartTradeParams
  ): Promise<SwapResult> {
    const slippage = this.calculateOptimalSlippage(opportunity, params.maxSlippage || 1);
    
    return await this.pancakeSwap.buyTokenWithBNB(
      opportunity.token.address,
      params.amountBNB,
      slippage
    );
  }

  private generateDecisionReason(opportunity: TradingOpportunity): string {
    const reasons = [
      `Confidence: ${opportunity.token.confidence}%`,
      `Overall Score: ${opportunity.overallScore.toFixed(1)}`,
      opportunity.reason
    ];
    
    return reasons.join(' | ');
  }

  private generateRiskAssessment(opportunity: TradingOpportunity): string {
    const risk = opportunity.token.riskLevel;
    const impact = opportunity.priceImpact;
    
    if (risk === 'LOW' && impact < 1) return 'LOW - Stable token with low impact';
    if (risk === 'LOW' && impact < 3) return 'LOW-MEDIUM - Stable token with moderate impact';
    if (risk === 'MEDIUM' && impact < 2) return 'MEDIUM - Moderate risk with low impact';
    if (risk === 'MEDIUM' && impact < 5) return 'MEDIUM - Moderate risk and impact';
    
    return 'HIGH - High risk or high price impact';
  }

  private calculateOptimalSlippage(
    opportunity: TradingOpportunity, 
    maxSlippage: number
  ): number {
    // Base slippage
    let slippage = 50; // 0.5%
    
    // Adjust based on risk level
    if (opportunity.token.riskLevel === 'HIGH') {
      slippage *= 2; // 1%
    } else if (opportunity.token.riskLevel === 'LOW') {
      slippage *= 0.5; // 0.25%
    }
    
    // Adjust based on liquidity
    if (opportunity.liquidityScore < 50) {
      slippage *= 1.5;
    }
    
    // Cap at maximum
    const maxSlippageBps = maxSlippage * 100;
    return Math.min(slippage, maxSlippageBps);
  }

  private mapRiskProfileToLevel(profile: string): 'LOW' | 'MEDIUM' | 'HIGH' {
    switch (profile) {
      case 'CONSERVATIVE': return 'LOW';
      case 'BALANCED': return 'MEDIUM';
      case 'AGGRESSIVE': return 'HIGH';
      default: return 'MEDIUM';
    }
  }

  private getMaxPriceImpact(profile: string): number {
    switch (profile) {
      case 'CONSERVATIVE': return 1.0;
      case 'BALANCED': return 3.0;
      case 'AGGRESSIVE': return 5.0;
      default: return 3.0;
    }
  }

  private calculateOptimalAllocations(
    opportunities: TradingOpportunity[],
    riskProfile: string
  ): Array<{
    address: string;
    symbol: string;
    allocation: number;
    reason: string;
  }> {
    const maxTokens = riskProfile === 'CONSERVATIVE' ? 3 : 
                     riskProfile === 'BALANCED' ? 5 : 8;
    
    const topOpportunities = opportunities.slice(0, maxTokens);
    const totalScore = topOpportunities.reduce((sum, opp) => sum + opp.overallScore, 0);
    
    return topOpportunities.map(opp => ({
      address: opp.token.address,
      symbol: opp.token.symbol,
      allocation: (opp.overallScore / totalScore) * 100,
      reason: opp.reason
    }));
  }

  private calculateAverageRiskLevel(
    allocations: any[],
    opportunities: TradingOpportunity[]
  ): 'LOW' | 'MEDIUM' | 'HIGH' {
    // Simplified calculation
    const riskScores = allocations.map(alloc => {
      const opp = opportunities.find(o => o.token.address === alloc.address);
      const riskMap = { LOW: 1, MEDIUM: 2, HIGH: 3 };
      return riskMap[opp?.token.riskLevel || 'MEDIUM'];
    });
    
    const avgRisk = riskScores.reduce((sum, score) => sum + score, 0) / riskScores.length;
    
    if (avgRisk <= 1.5) return 'LOW';
    if (avgRisk <= 2.5) return 'MEDIUM';
    return 'HIGH';
  }

  private getPositionRecommendation(
    analysis: TokenAnalysis,
    priceChange: number
  ): { action: 'HOLD' | 'SELL' | 'BUY_MORE'; reason: string } {
    if (priceChange > 25) {
      return { action: 'SELL', reason: 'Take profits - significant gains' };
    }
    if (priceChange < -15) {
      return { action: 'SELL', reason: 'Cut losses - significant decline' };
    }
    if (analysis.confidence > 80 && priceChange > 5) {
      return { action: 'BUY_MORE', reason: 'High confidence with positive momentum' };
    }
    if (analysis.confidence < 40) {
      return { action: 'SELL', reason: 'Low confidence - deteriorating fundamentals' };
    }
    
    return { action: 'HOLD', reason: 'Stable position with adequate confidence' };
  }
}

export default SmartTradingEngine;
