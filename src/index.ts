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

import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import { startAPIServer } from './api-server';
import { formatPrompt } from './prompt';
import { CONFIG } from './config';
import { logger } from './utils/logger';
import { getTokenData, getTrendingTokens } from './data/marketFetcher';
import { executeTrade, getWalletBalance, initializeProvider } from './blockchain/tradeExecutor';
import { storeMemory, fetchAllMemories, fetchMemory } from './blockchain/memoryStorage';
import { initializeTelegramBot, alertBotStatus, alertAIDecision, alertTradeExecution } from './alerts/telegramBot';
import { TradeMemory } from './agent/learningLoop';
import { calculateBuySellPressure } from './data/marketFetcher';
import { BotState } from './bot-state';
import { validateOrExit, getConfigSummary } from './utils/envValidator';

// Initialize OpenRouter
const openrouter = createOpenRouter({
  apiKey: CONFIG.OPENROUTER_API_KEY,
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
    const response = await streamText({
      model: openrouter('openai/gpt-4o-mini'),
      prompt: enrichedPrompt,
      tools: {
        executeTrade: tool({
          description: 'Execute a trade on PancakeSwap. Only use for HIGH confidence trades (>70%). This spends real BNB!',
          parameters: z.object({
            tokenAddress: z.string().describe('The token contract address to trade'),
            action: z.enum(['buy', 'sell']).describe('Buy or sell the token'),
            amountBNB: z.number().min(0.001).max(CONFIG.MAX_TRADE_AMOUNT_BNB).describe('Amount of BNB to trade'),
            reasoning: z.string().describe('Clear explanation of why this trade is being made'),
            confidence: z.number().min(0).max(1).describe('Confidence level 0-1'),
          }),
          execute: async ({ tokenAddress: tradeTokenAddress, action, amountBNB, reasoning, confidence }) => {
            logger.info(`\n⚡ AI Decision: ${action.toUpperCase()} ${amountBNB} BNB`);
            logger.info(`Reasoning: ${reasoning}`);
            logger.info(`Confidence: ${(confidence * 100).toFixed(0)}%`);

            // Validate confidence
            if (confidence < 0.7) {
              logger.warn('❌ Trade rejected: Confidence too low (<70%)');
              return { success: false, message: 'Confidence too low' };
            }

            // Alert user
            await alertAIDecision(
              {
                action,
                amount: amountBNB,
                confidence,
                reason: reasoning,
                riskLevel: confidence > 0.8 ? 'low' : 'medium'
              },
              tokenData.symbol,
              tradeTokenAddress
            );

            // Execute trade
            logger.info('🔄 Executing trade on PancakeSwap...');
            const result = await executeTrade({
              tokenAddress: tradeTokenAddress,
              action,
              amountBNB,
              slippagePercent: CONFIG.MAX_SLIPPAGE_PERCENTAGE,
            });

            // Alert result
            await alertTradeExecution(result, tokenData.symbol, action);

            if (!result.success) {
              logger.error(`❌ Trade failed: ${result.error}`);
              return { success: false, message: result.error };
            }

            logger.info(`✅ Trade executed: ${result.txHash}`);
            logger.info(`Gas used: ${result.gasUsed}`);

            // Log to BotState
            BotState.addTradeLog({
              id: `${Date.now()}-${tradeTokenAddress.slice(0, 6)}`,
              timestamp: Date.now(),
              token: tradeTokenAddress,
              tokenSymbol: tokenData.symbol,
              action,
              amount: amountBNB,
              price: parseFloat(tokenData.priceUsd),
              status: 'success',
              txHash: result.txHash,
            });

            // Store memory on Greenfield
            const memory: TradeMemory = {
              id: '',
              timestamp: Date.now(),
              tokenAddress: tradeTokenAddress,
              tokenSymbol: tokenData.symbol,
              action,
              entryPrice: parseFloat(tokenData.priceUsd),
              amount: amountBNB,
              outcome: 'pending',
              aiReasoning: reasoning,
              marketConditions: {
                volume24h: tokenData.volume24h,
                liquidity: tokenData.liquidity,
                priceChange24h: tokenData.priceChange24h,
                buySellPressure: calculateBuySellPressure(tokenData),
              },
            };

            const memoryId = await storeMemory(memory);
            logger.info(`💾 Memory stored on Greenfield: ${memoryId}`);

            // Track position
            if (action === 'buy') {
              activePositions.set(tradeTokenAddress, {
                amount: amountBNB,
                entryPrice: parseFloat(tokenData.priceUsd),
                memoryId,
                tokenSymbol: tokenData.symbol,
              });
            } else if (action === 'sell') {
              activePositions.delete(tradeTokenAddress);
            }

            return {
              success: true,
              message: `Trade executed successfully! Tx: ${result.txHash}`,
              txHash: result.txHash,
              memoryId,
            };
          },
        }),
      },
      maxSteps: 5, // Allow AI to think and use tools
    });

    // Stream and log AI response
    logger.info('\n💭 AI Response:');
    for await (const chunk of response.textStream) {
      process.stdout.write(chunk);
    }
    console.log('\n');

    const finalText = await response.text;
    logger.info(`\n✅ Invocation #${invocationCount} complete`);

    return finalText;

  } catch (error) {
    logger.error(`Error in invocation #${invocationCount}: ${(error as Error).message}`);
    throw error;
  }
}

/**
 * Main loop - check markets periodically
 * Now integrated with BotState for frontend control
 */
async function main() {
  // Check if bot is running via BotState
  if (!BotState.isRunning()) {
    logger.info('⏸️  Bot is stopped via frontend - skipping cycle');
    return;
  }

  const config = BotState.getConfig();
  if (!config) {
    logger.warn('⚠️  No bot configuration found - skipping cycle');
    return;
  }

  logger.info('🚀 Starting trading cycle...');
  logger.info(`📍 Network: ${config.network} | Risk: ${config.riskLevel}/10`);

  // Initialize
  initializeProvider();
  await initializeTelegramBot();

  const balance = await getWalletBalance();
  logger.info(`💰 Wallet Balance: ${balance.toFixed(4)} BNB`);

  if (balance < 0.01) {
    logger.warn('⚠️  Low balance! Get testnet BNB from https://testnet.bnbchain.org/faucet-smart');
  }

  // Get tokens from BotState config or auto-discover
  let tokensToWatch = config.tokens;

  if (tokensToWatch.length === 0) {
    logger.info('📈 Auto-discovering trending tokens from DexScreener...');
    const trending = await getTrendingTokens(3);
    tokensToWatch = trending.map(t => t.address);
    logger.info(`Found ${tokensToWatch.length} trending tokens`);
  } else {
    logger.info(`📋 Monitoring ${tokensToWatch.length} tokens from watchlist`);
  }

  // Analyze each token
  for (const tokenAddress of tokensToWatch) {
    // Check if still running before each token
    if (!BotState.isRunning()) {
      logger.info('🛑 Bot stopped during cycle - exiting');
      break;
    }

    try {
      await invokeAgent(tokenAddress);

      // Small delay between tokens
      await new Promise(resolve => setTimeout(resolve, 5000));
    } catch (error) {
      logger.error(`Error analyzing ${tokenAddress}: ${(error as Error).message}`);
    }
  }

  logger.info('\n✅ Trading cycle complete');
  const nextRunMinutes = (config.interval / 1000 / 60).toFixed(1);
  logger.info(`Next run in ${nextRunMinutes} minutes\n`);
}

/**
 * Background loop - runs continuously and checks BotState
 * The bot is controlled via BotState (start/stop from frontend)
 */
async function backgroundLoop() {
  logger.info('🔄 Background loop started - waiting for bot to be started via frontend');

  // Run every minute to check if bot should execute
  const checkInterval = setInterval(async () => {
    if (BotState.isRunning()) {
      const config = BotState.getConfig();
      const now = Date.now();
      const lastRun = (global as any).lastBotRun || 0;
      const intervalMs = config?.interval || parseInt(CONFIG.BOT_LOOP_INTERVAL_MS);

      // Check if it's time to run
      if (now - lastRun >= intervalMs) {
        (global as any).lastBotRun = now;
        await main();
      }
    }
  }, 60000); // Check every minute

  // Store interval for cleanup
  (global as any).backgroundLoopInterval = checkInterval;
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  logger.info('\n👋 Shutting down gracefully...');

  // Stop bot if running
  if (BotState.isRunning()) {
    BotState.stop();
  }

  // Clear background loop
  if ((global as any).backgroundLoopInterval) {
    clearInterval((global as any).backgroundLoopInterval);
  }

  await alertBotStatus('stopped', 'Bot shutting down');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('\n👋 Shutting down gracefully...');

  // Stop bot if running
  if (BotState.isRunning()) {
    BotState.stop();
  }

  // Clear background loop
  if ((global as any).backgroundLoopInterval) {
    clearInterval((global as any).backgroundLoopInterval);
  }

  await alertBotStatus('stopped', 'Bot shutting down');
  process.exit(0);
});

// Start if run directly
if (import.meta.main) {
  logger.info('🌟 Immortal AI Trading Bot - Production Mode');
  logger.info('');

  // Comprehensive environment validation
  validateOrExit();

  // Show configuration summary
  logger.info(getConfigSummary());

  // Start API server for frontend
  startAPIServer();
  logger.info('');

  // Start background loop
  logger.info('🤖 Bot is ready - use the frontend to start trading');
  logger.info('🌐 Frontend: http://localhost:3000');
  logger.info('🌐 API Server: http://localhost:' + CONFIG.API_PORT);
  logger.info('');

  backgroundLoop().catch((error) => {
    logger.error(`Fatal error: ${error.message}`);
    process.exit(1);
  });
}

export { invokeAgent, main };
