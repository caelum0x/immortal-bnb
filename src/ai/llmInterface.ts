// src/ai/llmInterface.ts
// Interface for AI decision making using OpenRouter and LLM models
// Provides intelligent trading decisions based on market data and memories

import fetch from 'node-fetch';
import { logger } from '../utils/logger';
import { CONFIG } from '../config';
import type { AIPersonality } from './immortalAgent';

export interface AIDecisionRequest {
  context: string;
  personality: AIPersonality;
  action?: 'analyze' | 'decide' | 'learn';
}

export interface AIDecisionResponse {
  action: 'BUY' | 'SELL' | 'HOLD';
  amount: number;
  confidence: number;
  reasoning: string;
  strategy: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

/**
 * Get AI trading decision using OpenRouter and advanced LLM models
 */
export async function getAIDecision(
  context: string, 
  personality: AIPersonality
): Promise<AIDecisionResponse> {
  try {
    if (!CONFIG.OPENROUTER_API_KEY) {
      logger.warn('No OpenRouter API key configured, using fallback logic');
      return getFallbackDecision(context, personality);
    }

    const prompt = buildTradingPrompt(context, personality);
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CONFIG.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://immortal-bnb-bot.vercel.app',
        'X-Title': 'Immortal BNB Trading Bot'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        messages: [
          {
            role: 'system',
            content: getSystemPrompt()
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000,
        top_p: 0.9
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.statusText}`);
    }

    const data = await response.json() as any;
    const aiResponse = data.choices[0].message.content;
    
    return parseAIResponse(aiResponse);
    
  } catch (error) {
    logger.error('AI decision failed:', error);
    return getFallbackDecision(context, personality);
  }
}

/**
 * Get system prompt that defines the AI's role and behavior
 */
function getSystemPrompt(): string {
  return `You are an immortal AI trading agent operating on BNB Chain and PancakeSwap. You have access to decentralized memory storage on BNB Greenfield that allows you to learn from past trades and evolve your strategies over time.

Your capabilities:
- Analyze token market data and trading opportunities
- Learn from past trading decisions stored in immortal memory
- Evolve trading strategies based on performance
- Manage risk according to your current personality traits
- Make autonomous trading decisions

Your goals:
- Maximize long-term profitability while managing risk
- Learn from both successes and failures
- Evolve your trading strategies over time
- Build an immortal trading reputation on-chain

Decision format:
You must respond with a JSON object containing:
{
  "action": "BUY" | "SELL" | "HOLD",
  "amount": number (0-1, representing percentage of available funds),
  "confidence": number (0-1, representing confidence in decision),
  "reasoning": "detailed explanation of decision",
  "strategy": "name of strategy being used",
  "riskLevel": "LOW" | "MEDIUM" | "HIGH"
}

Always consider:
- Market conditions and trends
- Token fundamentals (liquidity, volume, price history)
- Past trading memories and lessons learned
- Current personality traits (risk tolerance, aggressiveness)
- Risk management principles`;
}

/**
 * Build specific trading prompt with context and personality
 */
function buildTradingPrompt(context: string, personality: AIPersonality): string {
  return `Analyze the following trading situation and make a decision:

${context}

Your current AI personality:
- Risk Tolerance: ${personality.riskTolerance.toFixed(2)} (0=very conservative, 1=very aggressive)
- Aggressiveness: ${personality.aggressiveness.toFixed(2)} (0=passive, 1=very active)
- Learning Rate: ${personality.learningRate.toFixed(2)} (how quickly you adapt)
- Memory Weight: ${personality.memoryWeight.toFixed(2)} (how much you trust past experiences)
- Exploration Rate: ${personality.explorationRate.toFixed(2)} (willingness to try new strategies)
- Confidence Threshold: ${personality.confidenceThreshold.toFixed(2)} (minimum confidence to act)

Based on this information, your personality, and your immortal memories, what is your trading decision? Respond with valid JSON only.`;
}

/**
 * Parse AI response and extract trading decision
 */
function parseAIResponse(response: string): AIDecisionResponse {
  try {
    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response');
    }
    
    const parsed = JSON.parse(jsonMatch[0]);
    
    // Validate and clean response
    return {
      action: ['BUY', 'SELL', 'HOLD'].includes(parsed.action) ? parsed.action : 'HOLD',
      amount: Math.max(0, Math.min(1, parseFloat(parsed.amount) || 0)),
      confidence: Math.max(0, Math.min(1, parseFloat(parsed.confidence) || 0)),
      reasoning: String(parsed.reasoning || 'No reasoning provided'),
      strategy: String(parsed.strategy || 'default'),
      riskLevel: ['LOW', 'MEDIUM', 'HIGH'].includes(parsed.riskLevel) ? parsed.riskLevel : 'MEDIUM'
    };
    
  } catch (error) {
    logger.warn('Failed to parse AI response:', error);
    return {
      action: 'HOLD',
      amount: 0,
      confidence: 0.3,
      reasoning: 'Failed to parse AI response',
      strategy: 'error',
      riskLevel: 'MEDIUM'
    };
  }
}

/**
 * Fallback decision logic when AI is unavailable
 */
function getFallbackDecision(context: string, personality: AIPersonality): AIDecisionResponse {
  logger.info('Using fallback trading logic');
  
  // Simple heuristic-based decision
  const lines = context.split('\n');
  const priceLine = lines.find(l => l.includes('24h Change:'));
  const volumeLine = lines.find(l => l.includes('Volume:'));
  const liquidityLine = lines.find(l => l.includes('Liquidity:'));
  
  let priceChange = 0;
  let volume = 0;
  let liquidity = 0;
  
  if (priceLine) {
    const match = priceLine.match(/([-+]?\d+\.?\d*)%/);
    if (match && match[1]) priceChange = parseFloat(match[1]);
  }
  
  if (volumeLine) {
    const match = volumeLine.match(/\$(\d+(?:,\d{3})*)/);
    if (match && match[1]) volume = parseFloat(match[1].replace(/,/g, ''));
  }
  
  if (liquidityLine) {
    const match = liquidityLine.match(/\$(\d+(?:,\d{3})*)/);
    if (match && match[1]) liquidity = parseFloat(match[1].replace(/,/g, ''));
  }
  
  // Heuristic decision logic
  let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
  let confidence = 0.3;
  let reasoning = 'Fallback heuristic analysis';
  
  // Bullish conditions
  if (priceChange > 5 && volume > 1000000 && liquidity > 500000) {
    action = 'BUY';
    confidence = Math.min(0.7, 0.5 + personality.riskTolerance * 0.2);
    reasoning = 'Positive momentum with good volume and liquidity';
  }
  // Bearish conditions
  else if (priceChange < -10 || liquidity < 100000) {
    action = 'SELL';
    confidence = 0.6;
    reasoning = 'Negative trend or insufficient liquidity';
  }
  
  // Apply personality filters
  if (confidence < personality.confidenceThreshold) {
    action = 'HOLD';
    reasoning += ' (below confidence threshold)';
  }
  
  return {
    action,
    amount: personality.riskTolerance * 0.5, // Conservative default
    confidence,
    reasoning,
    strategy: 'fallback_heuristic',
    riskLevel: personality.riskTolerance > 0.7 ? 'HIGH' : 
               personality.riskTolerance > 0.4 ? 'MEDIUM' : 'LOW'
  };
}

/**
 * Analyze market sentiment using AI
 */
export async function analyzeSentiment(tokenSymbol: string, marketData: any): Promise<{
  sentiment: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  reasoning: string;
}> {
  try {
    const context = `
Token: ${tokenSymbol}
Price Change 24h: ${marketData.priceChange24h || 0}%
Volume 24h: $${marketData.volume24h || 0}
Liquidity: $${marketData.liquidity || 0}

Analyze the market sentiment for this token based on the data provided.
`;

    const prompt = `${context}

Analyze the market sentiment and respond with JSON:
{
  "sentiment": "bullish" | "bearish" | "neutral",
  "confidence": number (0-1),
  "reasoning": "explanation"
}`;

    if (!CONFIG.OPENROUTER_API_KEY) {
      return {
        sentiment: 'neutral',
        confidence: 0.5,
        reasoning: 'No AI available for sentiment analysis'
      };
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CONFIG.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://immortal-bnb-bot.vercel.app',
        'X-Title': 'Immortal BNB Trading Bot'
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        messages: [
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.statusText}`);
    }

    const data = await response.json() as any;
    const aiResponse = data.choices[0].message.content;
    
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        sentiment: ['bullish', 'bearish', 'neutral'].includes(parsed.sentiment) ? parsed.sentiment : 'neutral',
        confidence: Math.max(0, Math.min(1, parseFloat(parsed.confidence) || 0.5)),
        reasoning: String(parsed.reasoning || 'No reasoning provided')
      };
    }
    
    throw new Error('No valid JSON in sentiment response');
    
  } catch (error) {
    logger.warn('Sentiment analysis failed:', error);
    return {
      sentiment: 'neutral',
      confidence: 0.5,
      reasoning: 'Sentiment analysis unavailable'
    };
  }
}

/**
 * Generate strategy evolution suggestions using AI
 */
export async function evolveStrategy(
  strategyName: string,
  performance: {
    successRate: number;
    avgReturn: number;
    totalTrades: number;
  },
  recentMemories: any[]
): Promise<{
  suggestions: string[];
  newParameters: Record<string, number>;
  confidence: number;
}> {
  try {
    const context = `
Strategy: ${strategyName}
Performance:
- Success Rate: ${performance.successRate.toFixed(1)}%
- Average Return: ${performance.avgReturn.toFixed(2)}%
- Total Trades: ${performance.totalTrades}

Recent trade outcomes:
${recentMemories.map(m => 
  `${m.tokenSymbol}: ${m.action} → ${m.outcome} (${m.profitLoss?.toFixed(2) || 0}%)`
).join('\n')}

Suggest improvements to this trading strategy.
`;

    // For now, return a simple heuristic-based suggestion
    const suggestions: string[] = [];
    const newParameters: Record<string, number> = {};
    
    if (performance.successRate < 50) {
      suggestions.push('Increase risk management thresholds');
      suggestions.push('Require higher confidence scores');
      newParameters.minConfidence = 0.7;
    } else if (performance.successRate > 70) {
      suggestions.push('Consider increasing position sizes');
      suggestions.push('Explore more aggressive opportunities');
      newParameters.maxPositionSize = 1.2;
    }
    
    if (performance.avgReturn < 2) {
      suggestions.push('Focus on higher volatility tokens');
      newParameters.minVolatility = 0.1;
    }
    
    return {
      suggestions,
      newParameters,
      confidence: 0.6
    };
    
  } catch (error) {
    logger.warn('Strategy evolution failed:', error);
    return {
      suggestions: ['Continue with current strategy'],
      newParameters: {},
      confidence: 0.3
    };
  }
}

export default {
  getAIDecision,
  analyzeSentiment,
  evolveStrategy
};
