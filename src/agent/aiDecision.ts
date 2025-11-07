import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { logger } from '../utils/logger';
import { CONFIG } from '../config';
import type { TokenInfo, MarketData } from '../types';
import { queryMemories } from '../blockchain/memoryStorage';

// Initialize OpenAI with OpenRouter
const openai = createOpenAI({
  apiKey: CONFIG.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
});

export interface AIDecisionParams {
  tokenSymbol: string;
  tokenAddress: string;
  priceUsd: string;
  volume24h: number;
  priceChange24h: number;
  liquidity: number;
  walletBalance: number;
  marketSentiment?: string;
  previousTrades?: any[];
}

export interface AIDecisionResult {
  action: 'BUY' | 'SELL' | 'HOLD';
  amount: number; // Percentage of wallet balance (0-1)
  confidence: number; // 0-1
  reasoning: string;
  strategy: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  stopLoss?: number;
  takeProfit?: number;
}

export class AIDecisionEngine {
  async makeDecision(params: AIDecisionParams): Promise<AIDecisionResult> {
    try {
      logger.info(`🧠 AI analyzing ${params.tokenSymbol} (${params.tokenAddress})`);

      // Get relevant memories
      const relevantMemories = await queryMemories({
        tokenAddress: params.tokenAddress,
        limit: 5
      });

      // Build context for AI
      const marketContext = this.buildMarketContext(params, relevantMemories);
      
      // Generate AI decision
      const aiResponse = await this.generateAIDecision(marketContext, params);
      
      // Parse and validate response
      const decision = this.parseAIResponse(aiResponse, params);
      
      logger.info(`🎯 AI Decision: ${decision.action} ${(decision.amount * 100).toFixed(1)}% (${(decision.confidence * 100).toFixed(1)}%)`);
      
      return decision;

    } catch (error) {
      logger.error(`AI Decision error: ${(error as Error).message}`);
      
      // Return safe default
      return {
        action: 'HOLD',
        amount: 0,
        confidence: 0,
        reasoning: 'Error in AI analysis - defaulting to HOLD for safety',
        strategy: 'SAFE_MODE',
        riskLevel: 'LOW'
      };
    }
  }

  private buildMarketContext(params: AIDecisionParams, memories: any[]): string {
    const memoryContext = memories.length > 0 
      ? `Previous trades with ${params.tokenSymbol}:\n${memories.map(m => 
          `- ${m.action} at $${m.entryPrice} (${m.outcome || 'pending'})`
        ).join('\n')}\n\n`
      : '';

    return `
MARKET ANALYSIS REQUEST for ${params.tokenSymbol} (${params.tokenAddress})

Current Market Data:
- Price: $${params.priceUsd}
- 24h Volume: $${params.volume24h.toLocaleString()}
- 24h Change: ${params.priceChange24h.toFixed(2)}%
- Liquidity: $${params.liquidity.toLocaleString()}
- Wallet Balance: ${params.walletBalance.toFixed(4)} BNB

${memoryContext}Market Sentiment: ${params.marketSentiment || 'Unknown'}

You are an expert DeFi trading AI with access to immortal memory. Analyze this token and provide a trading decision.

Consider:
1. Technical indicators from price/volume data
2. Market conditions and sentiment
3. Risk management (never risk more than 10% on single trade)
4. Previous trading history with this token
5. Liquidity risks and slippage
6. Current portfolio exposure

CRITICAL: Only recommend BUY if you're highly confident (>70%) and see clear upside potential.
Always include stop-loss and take-profit levels for trades.
`.trim();
  }

  private async generateAIDecision(context: string, params: AIDecisionParams): Promise<string> {
    const model = openai('openai/gpt-4o-mini');
    
    const { text } = await generateText({
      model,
      messages: [
        {
          role: 'system',
          content: `You are an expert DeFi trading AI with immortal memory. You make precise, data-driven trading decisions.

RESPONSE FORMAT (JSON):
{
  "action": "BUY|SELL|HOLD",
  "amount": 0.05,
  "confidence": 0.85,
  "reasoning": "Clear explanation of decision",
  "strategy": "MOMENTUM|MEAN_REVERSION|BREAKOUT|ARBITRAGE|DCA",
  "riskLevel": "LOW|MEDIUM|HIGH",
  "stopLoss": 0.95,
  "takeProfit": 1.20
}

RULES:
- Amount is percentage of wallet (0-1, max 0.1 for single trade)
- Confidence must be >0.7 for BUY/SELL recommendations
- Always include reasoning and strategy
- Set realistic stop-loss (5-15% below entry) and take-profit (15-50% above)
- Consider gas fees and slippage in calculations
- NEVER recommend more than 10% of wallet on single trade`
        },
        {
          role: 'user',
          content: context
        }
      ],
      temperature: 0.3
    });

    return text;
  }

  private parseAIResponse(response: string, params: AIDecisionParams): AIDecisionResult {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate and sanitize
      const action = ['BUY', 'SELL', 'HOLD'].includes(parsed.action) ? parsed.action : 'HOLD';
      const amount = Math.max(0, Math.min(0.1, parseFloat(parsed.amount) || 0)); // Cap at 10%
      const confidence = Math.max(0, Math.min(1, parseFloat(parsed.confidence) || 0));
      
      // Safety checks
      if (amount > 0.1) {
        logger.warn(`AI recommended ${(amount * 100).toFixed(1)}% - capping at 10%`);
      }

      if (confidence < 0.7 && action !== 'HOLD') {
        logger.warn(`AI confidence ${(confidence * 100).toFixed(1)}% too low - switching to HOLD`);
        return {
          action: 'HOLD',
          amount: 0,
          confidence: confidence,
          reasoning: `Original: ${parsed.reasoning}. Confidence too low for execution.`,
          strategy: parsed.strategy || 'SAFE_MODE',
          riskLevel: 'LOW'
        };
      }

      return {
        action,
        amount,
        confidence,
        reasoning: parsed.reasoning || 'AI provided decision without reasoning',
        strategy: parsed.strategy || 'UNKNOWN',
        riskLevel: parsed.riskLevel || 'MEDIUM',
        stopLoss: parsed.stopLoss,
        takeProfit: parsed.takeProfit
      };

    } catch (error) {
      logger.error(`Error parsing AI response: ${(error as Error).message}`);
      logger.debug(`Raw AI response: ${response}`);
      
      return {
        action: 'HOLD',
        amount: 0,
        confidence: 0,
        reasoning: 'Failed to parse AI response - defaulting to HOLD',
        strategy: 'ERROR_FALLBACK',
        riskLevel: 'LOW'
      };
    }
  }

  async getMarketSentiment(tokenSymbol: string): Promise<string> {
    try {
      // Simple sentiment analysis based on recent memories
      const recentMemories = await queryMemories({
        limit: 10
      });

      if (recentMemories.length === 0) {
        return 'NEUTRAL - No trading history';
      }

      const recentOutcomes = recentMemories
        .filter((m: any) => m.outcome && m.outcome !== 'pending')
        .map((m: any) => m.outcome);

      if (recentOutcomes.length === 0) {
        return 'NEUTRAL - No completed trades';
      }

      const profitable = recentOutcomes.filter((o: any) => o === 'profit').length;
      const total = recentOutcomes.length;
      const successRate = profitable / total;

      if (successRate > 0.7) return 'BULLISH - High success rate';
      if (successRate < 0.3) return 'BEARISH - Low success rate';
      return 'NEUTRAL - Mixed results';

    } catch (error) {
      logger.error(`Error getting market sentiment: ${(error as Error).message}`);
      return 'UNKNOWN';
    }
  }
}

export const aiDecisionEngine = new AIDecisionEngine();
