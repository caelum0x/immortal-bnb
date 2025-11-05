#!/usr/bin/env bun
/**
 * Immortal AI Trading Bot - Main Entry Point
 * Based on hkirat/ai-trading-agent but adapted for BNB Chain
 *
 * Key Changes from Base:
 * - Lighter Protocol → PancakeSwap (spot trading)
 * - Prisma Database → BNB Greenfield (immortal memory)
 * - Perpetual futures → Spot tokens
 * - OpenRouter AI with tool calling (kept from base)
 */

import 'reflect-metadata';

import { createOpenAI } from '@ai-sdk/openai';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import { formatPrompt } from './prompt';
import { CONFIG } from './config';
import { logger } from './utils/logger';
import { getTokenData, getTrendingTokens, calculateBuySellPressure } from './data/marketFetcher';
import { executeTrade, getWalletBalance, initializeProvider } from './blockchain/tradeExecutor';
import { storeMemory, fetchAllMemories, fetchMemory } from './blockchain/memoryStorage';
import { initializeTelegramBot, alertBotStatus, alertAIDecision, alertTradeExecution } from './alerts/telegramBot';
import type { TradeMemory } from './types/memory';
import { startAPIServer } from './api/server';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';

// Initialize OpenAI with OpenRouter endpoint
const openai = createOpenAI({
  apiKey: CONFIG.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
});

// Track state
let invocationCount = 0;
const activePositions = new Map<string, {
  amount: number;
  entryPrice: number;
  memoryId: string;
  tokenSymbol: string;
}>();

/**
 * Main AI agent invocation - adapted from base repo pattern
 */
async function invokeAgent(tokenAddress: string) {
  invocationCount++;

  logger.info(`\n🤖 Invocation #${invocationCount} - Analyzing ${tokenAddress}`);

  try {
    // Get wallet balance
    const walletBalance = await getWalletBalance();

    // Get token data from DexScreener
    const tokenData = await getTokenData(tokenAddress);
    if (!tokenData) {
      logger.warn(`Could not fetch data for ${tokenAddress}`);
      return;
    }

    logger.info(`📊 Token: ${tokenData.symbol} - Price: $${tokenData.priceUsd} - Volume: $${tokenData.volume24h.toLocaleString()}`);

    // Get past memories from Greenfield
    const memoryIds = await fetchAllMemories();
    const recentMemories = await Promise.all(
      memoryIds.slice(-10).map(id => fetchMemory(id))
    );
    const memoriesText = recentMemories
      .filter(m => m !== null)
      .map(m => `- ${m!.tokenSymbol} ${m!.action}: ${m!.outcome || 'pending'} (${m!.aiReasoning})`)
      .join('\n') || 'No past trades yet';

    // Calculate portfolio value
    const portfolioValue = walletBalance * 300; // Rough BNB to USD (update with real price)

    // Get trading stats
    const completedTrades = recentMemories.filter(m => m && m.outcome !== 'pending');
    const profitableTrades = completedTrades.filter(m => m!.outcome === 'profit');
    const stats = {
      totalTrades: completedTrades.length,
      winRate: completedTrades.length > 0 ? (profitableTrades.length / completedTrades.length) * 100 : 0,
      totalPL: completedTrades.reduce((sum, m) => sum + (m!.profitLoss || 0), 0),
      bestTrade: profitableTrades[0]?.tokenSymbol || 'None',
      worstTrade: completedTrades.find(m => m!.outcome === 'loss')?.tokenSymbol || 'None'
    };

    // Format market data
    const marketData = `
Token: ${tokenData.symbol}
Price: $${tokenData.priceUsd}
24h Change: ${tokenData.priceChange24h.toFixed(2)}%
24h Volume: $${tokenData.volume24h.toLocaleString()}
Liquidity: $${tokenData.liquidity.toLocaleString()}
Buy/Sell Pressure: ${calculateBuySellPressure(tokenData).toFixed(3)}
Buys (24h): ${tokenData.txns24h.buys}
Sells (24h): ${tokenData.txns24h.sells}
    `.trim();

    // Format enriched prompt
    const enrichedPrompt = formatPrompt({
      invocationCount,
      walletBalance,
      openPositions: Array.from(activePositions.entries())
        .map(([addr, pos]) => `${pos.tokenSymbol}: ${pos.amount} BNB @ $${pos.entryPrice}`)
        .join(', ') || 'None',
      portfolioValue,
      maxTradeAmount: CONFIG.MAX_TRADE_AMOUNT_BNB,
      stopLossPercentage: CONFIG.STOP_LOSS_PERCENTAGE,
      marketData,
      pastMemories: memoriesText,
      stats
    });

    logger.info('📝 Sending prompt to AI...');

    // Call AI with tools (adapted from base repo)  
    const response = streamText({
      model: openai('openai/gpt-4o-mini') as any,
      prompt: enrichedPrompt,
      tools: {
        executeTrade: tool({
          description: 'EXECUTE A REAL TRADE on PancakeSwap. Call this when confidence ≥0.7 (70%). This is the ONLY way to trade - analysis alone does NOT execute trades. You must call this tool to buy or sell!',
          parameters: z.object({
            tokenAddress: z.string().describe('The token contract address (0x...)'),
            action: z.enum(['buy', 'sell']).describe('buy = enter position with BNB, sell = exit position to BNB'),
            amountBNB: z.number().min(0.01).max(CONFIG.MAX_TRADE_AMOUNT_BNB).describe('BNB amount: 0.01-0.05 for testing, scale up after wins'),
            reasoning: z.string().describe('Detailed reasoning with specific data points (price, volume, liquidity, signals)'),
            confidence: z.number().min(0.7).max(1).describe('Confidence as decimal: 0.7=70%, 0.8=80%, 0.9=90%, 1.0=100%. Minimum 0.7 required'),
          }),
        }),
      },
      toolChoice: 'auto',
    });

    // Stream and log AI response
    logger.info('\n💭 AI Response:');
    const result = await response;
    for await (const chunk of result.textStream) {
      process.stdout.write(chunk);
    }
    console.log('\n');

    const finalText = await result.text;
    logger.info(`\n✅ Invocation #${invocationCount} complete`);

    return finalText;

  } catch (error) {
    logger.error(`Error in invocation #${invocationCount}: ${(error as Error).message}`);
    throw error;
  }
}

/**
 * Main loop - check markets periodically
 */
async function main() {
  logger.info('🚀 Starting Immortal AI Trading Bot...');
  logger.info('📍 Network: BNB Chain ' + (CONFIG.NETWORK === 'mainnet' ? 'MAINNET' : 'TESTNET'));

  // Initialize
  await initializeProvider();
  initializeTelegramBot();

  const balance = await getWalletBalance();
  logger.info(`💰 Wallet Balance: ${balance.toFixed(4)} BNB`);

  if (balance < 0.01) {
    logger.warn('⚠️  Low balance! Get testnet BNB from https://testnet.bnbchain.org/faucet-smart');
  }

  await alertBotStatus('started', `Bot started with ${balance.toFixed(4)} BNB balance`);

  // Get trending tokens or use watchlist
  let tokensToWatch = CONFIG.DEFAULT_WATCHLIST;

  if (tokensToWatch.length === 0) {
    logger.info('📈 Fetching trending tokens...');
    const trending = await getTrendingTokens(3);
    tokensToWatch = trending.map(t => t.address);
    logger.info(`Found ${tokensToWatch.length} trending tokens`);
  }

  // Analyze each token
  for (const tokenAddress of tokensToWatch) {
    try {
      await invokeAgent(tokenAddress);

      // Small delay between tokens
      await new Promise(resolve => setTimeout(resolve, 5000));
    } catch (error) {
      logger.error(`Error analyzing ${tokenAddress}: ${(error as Error).message}`);
    }
  }

  logger.info('\n✅ Trading cycle complete');
  logger.info(`Next run in ${CONFIG.BOT_LOOP_INTERVAL_MS / 1000 / 60} minutes\n`);
}

/**
 * Start bot with interval
 */
async function startBot() {
  // Start API server for frontend communication
  startAPIServer();

  // Run immediately
  await main();

  // Then run on interval
  setInterval(async () => {
    await main();
  }, CONFIG.BOT_LOOP_INTERVAL_MS);
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  logger.info('\n👋 Shutting down gracefully...');
  await alertBotStatus('stopped', 'Bot shutting down');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('\n👋 Shutting down gracefully...');
  await alertBotStatus('stopped', 'Bot shutting down');
  process.exit(0);
});

// Start if run directly
if (require.main === module || process.argv[1]?.endsWith('index.ts')) {
  startBot().catch((error) => {
    logger.error(`Fatal error: ${error.message}`);
    process.exit(1);
  });
}

export { invokeAgent, main, startBot };
