import { logger, logMemory } from '../utils/logger';
import { fetchMemory, fetchAllMemories } from '../blockchain/memoryStorage';

export interface TradeMemory {
  id: string;
  timestamp: number;
  tokenAddress: string;
  tokenSymbol: string;
  action: 'buy' | 'sell';
  entryPrice: number;
  exitPrice?: number;
  amount: number;
  outcome?: 'profit' | 'loss' | 'pending';
  profitLoss?: number;
  profitLossPercentage?: number;
  aiReasoning: string;
  marketConditions: {
    volume24h: number;
    liquidity: number;
    priceChange24h: number;
    buySellPressure: number;
  };
  lessons?: string;
}

/**
 * Fetch recent memories to inform AI decisions
 */
export async function getRecentMemories(
  limit: number = 10
): Promise<string[]> {
  try {
    // Fetch from Greenfield (stub for now, will implement in memoryStorage.ts)
    const memoryIds = await fetchAllMemories();

    if (!memoryIds || memoryIds.length === 0) {
      logger.info('No memories found yet');
      return [];
    }

    // Fetch the most recent memories
    const recentIds = memoryIds.slice(-limit);
    const memories: string[] = [];

    for (const id of recentIds) {
      try {
        const memory = await fetchMemory(id);
        if (memory) {
          memories.push(formatMemoryForPrompt(memory));
        }
      } catch (error) {
        logger.warn(`Failed to fetch memory ${id}: ${(error as Error).message}`);
      }
    }

    logMemory(`${memories.length} memories`, 'fetch');

    return memories;
  } catch (error) {
    logger.error(`Failed to get recent memories: ${(error as Error).message}`);
    return [];
  }
}

/**
 * Get memories filtered by outcome (successful trades only)
 */
export async function getSuccessfulMemories(
  limit: number = 5
): Promise<string[]> {
  const allMemories = await getRecentMemories(50); // Get more to filter

  // Parse and filter
  const successful = allMemories
    .map(mem => {
      try {
        // Extract JSON if wrapped in text
        const match = mem.match(/\{[\s\S]*\}/);
        if (!match) return null;

        const parsed = JSON.parse(match[0]) as TradeMemory;
        return parsed.outcome === 'profit' ? mem : null;
      } catch {
        return null;
      }
    })
    .filter(mem => mem !== null) as string[];

  return successful.slice(-limit);
}

/**
 * Get memories for a specific token
 */
export async function getTokenMemories(
  tokenAddress: string,
  limit: number = 5
): Promise<string[]> {
  const allMemories = await getRecentMemories(50);

  const tokenMemories = allMemories
    .filter(mem => mem.includes(tokenAddress.toLowerCase()))
    .slice(-limit);

  return tokenMemories;
}

/**
 * Format memory for AI prompt
 */
function formatMemoryForPrompt(memory: TradeMemory | any): string {
  if (typeof memory === 'string') {
    return memory; // Already formatted
  }

  return `
Memory #${memory.id}:
- Token: ${memory.tokenSymbol} (${memory.tokenAddress})
- Action: ${memory.action.toUpperCase()}
- Entry: $${memory.entryPrice}${memory.exitPrice ? ` → Exit: $${memory.exitPrice}` : ''}
- Amount: ${memory.amount} BNB
- Outcome: ${memory.outcome || 'pending'}${memory.profitLossPercentage ? ` (${memory.profitLossPercentage > 0 ? '+' : ''}${memory.profitLossPercentage.toFixed(2)}%)` : ''}
- Reasoning: ${memory.aiReasoning}
- Market: Vol $${memory.marketConditions.volume24h.toLocaleString()}, Liq $${memory.marketConditions.liquidity.toLocaleString()}, Pressure ${memory.marketConditions.buySellPressure.toFixed(2)}
${memory.lessons ? `- Lessons: ${memory.lessons}` : ''}
`.trim();
}

/**
 * Analyze memories to generate insights
 */
export function analyzeMemories(memories: TradeMemory[]): {
  totalTrades: number;
  winRate: number;
  avgProfitLoss: number;
  bestToken: string | null;
  worstToken: string | null;
  insights: string[];
} {
  if (memories.length === 0) {
    return {
      totalTrades: 0,
      winRate: 0,
      avgProfitLoss: 0,
      bestToken: null,
      worstToken: null,
      insights: ['No trading history yet'],
    };
  }

  const completedTrades = memories.filter(m => m.outcome !== 'pending');
  const wins = completedTrades.filter(m => m.outcome === 'profit');

  const winRate = completedTrades.length > 0
    ? (wins.length / completedTrades.length) * 100
    : 0;

  const totalPL = completedTrades.reduce((sum, m) => sum + (m.profitLoss || 0), 0);
  const avgProfitLoss = completedTrades.length > 0
    ? totalPL / completedTrades.length
    : 0;

  // Find best/worst performing tokens
  const tokenPerformance = new Map<string, number>();
  completedTrades.forEach(m => {
    const current = tokenPerformance.get(m.tokenSymbol) || 0;
    tokenPerformance.set(m.tokenSymbol, current + (m.profitLoss || 0));
  });

  const sorted = Array.from(tokenPerformance.entries()).sort((a, b) => b[1] - a[1]);
  const bestToken = sorted[0]?.[0] || null;
  const worstToken = sorted[sorted.length - 1]?.[0] || null;

  // Generate insights
  const insights: string[] = [];

  if (winRate > 60) {
    insights.push('Strong performance - maintain current strategy');
  } else if (winRate < 40) {
    insights.push('Low win rate - consider more conservative approach');
  }

  if (avgProfitLoss > 0) {
    insights.push(`Positive P/L: +${avgProfitLoss.toFixed(4)} BNB avg per trade`);
  } else {
    insights.push(`Negative P/L: ${avgProfitLoss.toFixed(4)} BNB avg per trade`);
  }

  if (bestToken) {
    insights.push(`Best performer: ${bestToken}`);
  }

  return {
    totalTrades: completedTrades.length,
    winRate,
    avgProfitLoss,
    bestToken,
    worstToken,
    insights,
  };
}

/**
 * Generate lessons from a completed trade
 */
export function generateLessons(memory: TradeMemory): string {
  const { outcome, profitLossPercentage, marketConditions, aiReasoning } = memory;

  if (outcome === 'profit') {
    if ((profitLossPercentage || 0) > 20) {
      return `Excellent trade! High profit achieved. Market had: high volume (${marketConditions.volume24h.toLocaleString()}), positive pressure (${marketConditions.buySellPressure.toFixed(2)}). Strategy: "${aiReasoning}" worked well.`;
    }
    return `Profitable trade. Continue monitoring similar market conditions.`;
  } else if (outcome === 'loss') {
    if ((profitLossPercentage || 0) < -10) {
      return `Significant loss. Market conditions: volume ${marketConditions.volume24h.toLocaleString()}, pressure ${marketConditions.buySellPressure.toFixed(2)}. Avoid similar setups or tighten stop-loss.`;
    }
    return `Small loss within acceptable range. Part of trading.`;
  }

  return 'Trade still pending completion.';
}

export default {
  getRecentMemories,
  getSuccessfulMemories,
  getTokenMemories,
  analyzeMemories,
  generateLessons,
};
