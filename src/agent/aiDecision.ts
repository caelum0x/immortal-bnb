import fetch from 'node-fetch';
import { logger, logAIDecision, logError } from '../utils/logger';
import { withRetry, safeJsonParse, APIError } from '../utils/errorHandler';
import { CONFIG } from '../config';
import { TokenData, calculateBuySellPressure } from '../data/marketFetcher';

export interface AIDecision {
  action: 'buy' | 'sell' | 'hold';
  amount: number; // in BNB
  confidence: number; // 0-1
  reason: string;
  riskLevel: 'low' | 'medium' | 'high';
  targetPrice?: number;
  stopLoss?: number;
}

export interface DecisionContext {
  tokenData: TokenData;
  memories: string[];
  accountBalance: number;
  currentPositions: Map<string, number>; // token address -> amount
}

/**
 * Get AI trading decision using OpenRouter
 */
export async function getAIDecision(
  context: DecisionContext
): Promise<AIDecision> {
  const { tokenData, memories, accountBalance, currentPositions } = context;

  // Build context-rich prompt
  const prompt = buildPrompt(tokenData, memories, accountBalance, currentPositions);

  try {
    const decision = await withRetry(
      async () => {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${CONFIG.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://github.com/arhansubasi0/immortal-bnb',
          },
          body: JSON.stringify({
            model: 'openai/gpt-4o-mini', // Fast and cheap
            messages: [
              {
                role: 'system',
                content: 'You are an expert crypto trading AI specialized in BNB Chain DeFi. Analyze data and provide strategic trading decisions in JSON format.',
              },
              {
                role: 'user',
                content: prompt,
              },
            ],
            temperature: 0.7,
            max_tokens: 500,
          }),
        });

        if (!response.ok) {
          throw new APIError(
            `OpenRouter API error: ${response.statusText}`,
            response.status,
            'https://openrouter.ai/api/v1/chat/completions'
          );
        }

        return response;
      },
      3,
      2000,
      'OpenRouter AI decision'
    );

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('Empty response from AI');
    }

    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : content;

    const aiDecision: AIDecision = safeJsonParse(jsonStr, {
      action: 'hold',
      amount: 0,
      confidence: 0,
      reason: 'Failed to parse AI response',
      riskLevel: 'low',
    });

    // Validate and sanitize decision
    const validatedDecision = validateDecision(aiDecision, accountBalance);

    logAIDecision(validatedDecision, tokenData.symbol);

    return validatedDecision;
  } catch (error) {
    logError('getAIDecision', error as Error);

    // Return safe default on error
    return {
      action: 'hold',
      amount: 0,
      confidence: 0,
      reason: `AI decision failed: ${(error as Error).message}`,
      riskLevel: 'low',
    };
  }
}

/**
 * Build comprehensive prompt for AI
 */
function buildPrompt(
  tokenData: TokenData,
  memories: string[],
  accountBalance: number,
  currentPositions: Map<string, number>
): string {
  const buySellPressure = calculateBuySellPressure(tokenData);
  const hasPosition = currentPositions.has(tokenData.address);
  const positionSize = currentPositions.get(tokenData.address) || 0;

  const memoriesStr = memories.length > 0
    ? `\n\n**Past Trading Memories (Learn from these):**\n${memories.join('\n')}`
    : '\n\n**No past memories yet - this is your first analysis.**';

  return `
# Trading Analysis Request

## Token Information
- **Symbol**: ${tokenData.symbol}
- **Name**: ${tokenData.name}
- **Address**: ${tokenData.address}
- **Current Price**: $${tokenData.priceUsd} (${tokenData.price} BNB)
- **24h Change**: ${tokenData.priceChange24h.toFixed(2)}%
- **24h Volume**: $${tokenData.volume24h.toLocaleString()}
- **Liquidity**: $${tokenData.liquidity.toLocaleString()}
- **Market Cap**: $${tokenData.marketCap.toLocaleString()}
- **FDV**: $${tokenData.fdv.toLocaleString()}

## Trading Activity (24h)
- **Buys**: ${tokenData.txns24h.buys}
- **Sells**: ${tokenData.txns24h.sells}
- **Buy/Sell Pressure**: ${buySellPressure.toFixed(3)} (${buySellPressure > 0 ? 'Bullish' : 'Bearish'})

## Account Status
- **Available Balance**: ${accountBalance.toFixed(4)} BNB
- **Current Position**: ${hasPosition ? `${positionSize.toFixed(4)} BNB` : 'None'}
- **Max Trade Amount**: ${CONFIG.MAX_TRADE_AMOUNT_BNB} BNB
${memoriesStr}

## Task
Analyze this token and decide: **buy**, **sell** (if we have a position), or **hold**.

## Decision Criteria
1. **Liquidity**: Minimum $10,000 for safe trading
2. **Volume**: High volume = high interest
3. **Buy/Sell Pressure**: Positive = accumulation, Negative = distribution
4. **Price Trend**: 24h change and momentum
5. **Risk Management**: Never exceed max trade amount, use stop losses
6. **Memory Learning**: Learn from past successful/failed trades

## Output Format (JSON only)
\`\`\`json
{
  "action": "buy" | "sell" | "hold",
  "amount": 0.05,
  "confidence": 0.75,
  "reason": "Strong buy pressure (+0.45), high volume ($500K), liquidity sufficient. Similar pattern to successful memory #3.",
  "riskLevel": "low" | "medium" | "high",
  "targetPrice": 0.000123,
  "stopLoss": 0.000098
}
\`\`\`

**Important**:
- If liquidity < $10K, always return "hold"
- Amount must be between 0 and ${CONFIG.MAX_TRADE_AMOUNT_BNB} BNB
- Only "sell" if we have an existing position
- Be conservative - preservation of capital is key
`;
}

/**
 * Validate and sanitize AI decision
 */
function validateDecision(
  decision: AIDecision,
  accountBalance: number
): AIDecision {
  // Ensure action is valid
  if (!['buy', 'sell', 'hold'].includes(decision.action)) {
    logger.warn(`Invalid action '${decision.action}', defaulting to hold`);
    decision.action = 'hold';
  }

  // Ensure amount is within limits
  if (decision.amount < 0) {
    decision.amount = 0;
  }

  if (decision.amount > CONFIG.MAX_TRADE_AMOUNT_BNB) {
    logger.warn(`AI suggested ${decision.amount} BNB, capping at ${CONFIG.MAX_TRADE_AMOUNT_BNB}`);
    decision.amount = CONFIG.MAX_TRADE_AMOUNT_BNB;
  }

  // Don't trade if insufficient balance
  if (decision.action === 'buy' && decision.amount > accountBalance * 0.95) {
    logger.warn('Insufficient balance for trade, changing to hold');
    decision.action = 'hold';
    decision.amount = 0;
  }

  // Ensure confidence is 0-1
  decision.confidence = Math.max(0, Math.min(1, decision.confidence));

  // Default values
  if (!decision.riskLevel) {
    decision.riskLevel = 'medium';
  }

  if (!decision.reason) {
    decision.reason = 'No reason provided';
  }

  return decision;
}

/**
 * Simple rule-based decision (fallback if AI fails)
 */
export function getRuleBasedDecision(
  tokenData: TokenData,
  accountBalance: number
): AIDecision {
  const buySellPressure = calculateBuySellPressure(tokenData);
  const hasLiquidity = tokenData.liquidity >= 10000;
  const hasVolume = tokenData.volume24h >= 50000;
  const priceUp = tokenData.priceChange24h > 5;

  // Conservative rules
  if (!hasLiquidity) {
    return {
      action: 'hold',
      amount: 0,
      confidence: 0,
      reason: 'Insufficient liquidity (< $10K)',
      riskLevel: 'high',
    };
  }

  if (buySellPressure > 0.3 && hasVolume && priceUp) {
    return {
      action: 'buy',
      amount: Math.min(0.05, CONFIG.MAX_TRADE_AMOUNT_BNB),
      confidence: 0.6,
      reason: 'Strong buy pressure, good volume, price trending up',
      riskLevel: 'medium',
      stopLoss: parseFloat(tokenData.priceUsd) * 0.95,
    };
  }

  return {
    action: 'hold',
    amount: 0,
    confidence: 0.5,
    reason: 'Conditions not met for entry',
    riskLevel: 'low',
  };
}

export default {
  getAIDecision,
  getRuleBasedDecision,
};
