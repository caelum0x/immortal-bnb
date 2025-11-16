/**
 * AI Prediction Market Analyzer
 *
 * Uses OpenRouter LLM to analyze prediction markets and make intelligent trading decisions
 * Combines market data with AI reasoning for better predictions
 */

import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateText } from 'ai';
import { logger } from '../utils/logger';
import { CONFIG } from '../config';
import type { MarketOpportunity } from './marketDataFetcher';
import type { MarketInfo } from './polymarketClient';
import { polymarketDataFetcher } from './marketDataFetcher';
import { polymarketService } from './polymarketClient';

export interface AIMarketAnalysis {
  marketId: string;
  question: string;
  recommendation: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL';
  confidence: number; // 0-1
  suggestedPrice: number;
  suggestedSize: number;
  reasoning: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  timeframe: 'SHORT' | 'MEDIUM' | 'LONG';
}

export interface TradeDecision {
  execute: boolean;
  marketId: string;
  side: 'BUY' | 'SELL';
  price: number;
  size: number;
  reasoning: string;
  confidence: number;
}

export class AIPredictionAnalyzer {
  private openrouter: any;

  constructor() {
    if (CONFIG.OPENROUTER_API_KEY) {
      this.openrouter = createOpenRouter({
        apiKey: CONFIG.OPENROUTER_API_KEY,
      });
    }
  }

  /**
   * Analyze a prediction market using AI
   */
  async analyzeMarket(market: MarketInfo, orderbook?: any): Promise<AIMarketAnalysis> {
    try {
      if (!this.openrouter) {
        logger.warn('OpenRouter not initialized, using basic analysis');
        return this.basicAnalysis(market);
      }

      // Get mid price
      const midPrice = await polymarketService.getMidPrice(market.id);

      // Get market opportunity analysis
      const opportunity = await polymarketDataFetcher.analyzeMarket(market.id);

      // Build AI prompt
      const prompt = this.buildAnalysisPrompt(market, midPrice, opportunity);

      logger.info(`Analyzing market with AI: ${market.question.substring(0, 50)}...`);

      // Get AI analysis
      const { text } = await generateText({
        model: this.openrouter(CONFIG.AI_MODEL),
        prompt,
        maxTokens: 500,
        temperature: 0.7,
      });

      // Parse AI response
      const analysis = this.parseAIResponse(text, market, midPrice || 0.5);

      logger.info(`AI Analysis complete: ${analysis.recommendation} (confidence: ${(analysis.confidence * 100).toFixed(1)}%)`);

      return analysis;
    } catch (error) {
      logger.error('Error in AI market analysis:', error);
      return this.basicAnalysis(market);
    }
  }

  /**
   * Build AI prompt for market analysis
   */
  private buildAnalysisPrompt(market: MarketInfo, midPrice: number | null, opportunity: MarketOpportunity | null): string {
    const timeUntilClose = market.endDate ? (market.endDate.getTime() - Date.now()) / (1000 * 60 * 60) : 0;

    return `You are an expert prediction market trader analyzing opportunities on Polymarket.

Market Question: "${market.question}"

Current Data:
- Current Price (probability): ${midPrice ? (midPrice * 100).toFixed(1) + '%' : 'Unknown'}
- 24h Volume: $${market.volume.toLocaleString()}
- Liquidity: $${market.liquidity.toLocaleString()}
- Time Until Close: ${timeUntilClose.toFixed(1)} hours
- Outcomes: ${market.outcomes.join(', ')}

${opportunity ? `Technical Analysis: ${opportunity.reasoning}` : ''}

Please analyze this market and provide:
1. Your recommendation: STRONG_BUY, BUY, HOLD, SELL, or STRONG_SELL
2. Confidence level (0-100%)
3. Suggested entry price (probability between 0.00 and 1.00)
4. Suggested position size ($100-$1000)
5. Risk level: LOW, MEDIUM, or HIGH
6. Timeframe: SHORT (<24h), MEDIUM (1-7 days), or LONG (>7 days)
7. Detailed reasoning for your analysis

Consider:
- Is the current price accurate given available information?
- Are there any known biases in prediction markets?
- What are the risks and uncertainties?
- How liquid is this market?
- Is there enough time for the market to resolve?

Format your response as JSON:
{
  "recommendation": "...",
  "confidence": 0.XX,
  "suggestedPrice": 0.XX,
  "suggestedSize": XXX,
  "riskLevel": "...",
  "timeframe": "...",
  "reasoning": "..."
}`;
  }

  /**
   * Parse AI response into structured analysis
   */
  private parseAIResponse(text: string, market: MarketInfo, fallbackPrice: number): AIMarketAnalysis {
    try {
      // Try to extract JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return {
        marketId: market.id,
        question: market.question,
        recommendation: parsed.recommendation || 'HOLD',
        confidence: parseFloat(parsed.confidence) || 0.5,
        suggestedPrice: parseFloat(parsed.suggestedPrice) || fallbackPrice,
        suggestedSize: parseFloat(parsed.suggestedSize) || 100,
        reasoning: parsed.reasoning || 'AI analysis completed',
        riskLevel: parsed.riskLevel || 'MEDIUM',
        timeframe: parsed.timeframe || 'MEDIUM',
      };
    } catch (error) {
      logger.error('Error parsing AI response:', error);
      logger.debug('AI response text:', text);

      // Fallback analysis
      return {
        marketId: market.id,
        question: market.question,
        recommendation: 'HOLD',
        confidence: 0.5,
        suggestedPrice: fallbackPrice,
        suggestedSize: 100,
        reasoning: 'Failed to parse AI analysis, using conservative defaults',
        riskLevel: 'MEDIUM',
        timeframe: 'MEDIUM',
      };
    }
  }

  /**
   * Basic analysis when AI is not available
   */
  private basicAnalysis(market: MarketInfo): AIMarketAnalysis {
    return {
      marketId: market.id,
      question: market.question,
      recommendation: 'HOLD',
      confidence: 0.3,
      suggestedPrice: 0.5,
      suggestedSize: 100,
      reasoning: 'Basic analysis: Insufficient data for recommendation',
      riskLevel: 'MEDIUM',
      timeframe: 'MEDIUM',
    };
  }

  /**
   * Make a trade decision based on AI analysis
   */
  async makeTradeDecision(market: MarketInfo, maxRiskAmount: number = 500): Promise<TradeDecision> {
    try {
      // Get AI analysis
      const analysis = await this.analyzeMarket(market);

      // Get current price
      const currentPrice = await polymarketService.getMidPrice(market.id);
      if (!currentPrice) {
        return {
          execute: false,
          marketId: market.id,
          side: 'BUY',
          price: 0.5,
          size: 0,
          reasoning: 'Unable to determine current price',
          confidence: 0,
        };
      }

      // Determine if we should execute
      const shouldExecute = this.shouldExecuteTrade(analysis, currentPrice);

      if (!shouldExecute) {
        return {
          execute: false,
          marketId: market.id,
          side: analysis.recommendation.includes('BUY') ? 'BUY' : 'SELL',
          price: currentPrice,
          size: 0,
          reasoning: analysis.reasoning + ' | Confidence too low or conditions not met',
          confidence: analysis.confidence,
        };
      }

      // Calculate position size based on confidence and risk
      const positionSize = this.calculatePositionSize(analysis, maxRiskAmount);

      // Determine side
      const side = analysis.recommendation.includes('BUY') ? 'BUY' : 'SELL';

      // Determine execution price (slight improvement on suggested price)
      const executionPrice = side === 'BUY'
        ? Math.min(analysis.suggestedPrice + 0.01, 0.99) // Slightly above for faster fill
        : Math.max(analysis.suggestedPrice - 0.01, 0.01); // Slightly below for faster fill

      return {
        execute: true,
        marketId: market.id,
        side,
        price: executionPrice,
        size: positionSize,
        reasoning: analysis.reasoning,
        confidence: analysis.confidence,
      };
    } catch (error) {
      logger.error('Error making trade decision:', error);
      return {
        execute: false,
        marketId: market.id,
        side: 'BUY',
        price: 0.5,
        size: 0,
        reasoning: 'Error in decision making process',
        confidence: 0,
      };
    }
  }

  /**
   * Determine if trade should be executed based on analysis
   */
  private shouldExecuteTrade(analysis: AIMarketAnalysis, currentPrice: number): boolean {
    // Don't trade if confidence is too low
    if (analysis.confidence < CONFIG.MIN_CONFIDENCE_THRESHOLD) {
      return false;
    }

    // Don't trade if risk is too high
    if (analysis.riskLevel === 'HIGH' && analysis.confidence < 0.8) {
      return false;
    }

    // Don't trade on HOLD recommendations
    if (analysis.recommendation === 'HOLD') {
      return false;
    }

    // For BUY recommendations, current price should be lower than suggested
    if (analysis.recommendation.includes('BUY')) {
      return currentPrice <= analysis.suggestedPrice;
    }

    // For SELL recommendations, current price should be higher than suggested
    if (analysis.recommendation.includes('SELL')) {
      return currentPrice >= analysis.suggestedPrice;
    }

    return false;
  }

  /**
   * Calculate position size based on confidence and risk
   */
  private calculatePositionSize(analysis: AIMarketAnalysis, maxAmount: number): number {
    // Base size on confidence
    let size = maxAmount * analysis.confidence;

    // Adjust for risk level
    if (analysis.riskLevel === 'HIGH') {
      size *= 0.5; // Half size for high risk
    } else if (analysis.riskLevel === 'LOW') {
      size *= 1.5; // Increase size for low risk
    }

    // Adjust for recommendation strength
    if (analysis.recommendation.includes('STRONG')) {
      size *= 1.2; // Increase for strong recommendations
    }

    // Cap at max amount
    return Math.min(size, maxAmount);
  }

  /**
   * Batch analyze multiple markets and rank by opportunity
   */
  async analyzeBatchMarkets(markets: MarketInfo[], topN: number = 5): Promise<AIMarketAnalysis[]> {
    logger.info(`Analyzing ${markets.length} markets with AI...`);

    const analyses = await Promise.all(
      markets.map(market => this.analyzeMarket(market))
    );

    // Sort by confidence and filter for actionable opportunities
    const actionable = analyses
      .filter(a => a.recommendation !== 'HOLD')
      .filter(a => a.confidence >= CONFIG.MIN_CONFIDENCE_THRESHOLD)
      .sort((a, b) => b.confidence - a.confidence);

    logger.info(`Found ${actionable.length} actionable opportunities`);

    return actionable.slice(0, topN);
  }
}

// Singleton instance
export const aiPredictionAnalyzer = new AIPredictionAnalyzer();
