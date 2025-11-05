#!/usr/bin/env bun
/**
 * Immortal AI Trading Bot for BNB Chain
 *
 * An autonomous AI agent that:
 * - Fetches market data from DexScreener
 * - Uses AI (OpenRouter) for trading decisions
 * - Executes trades on PancakeSwap
 * - Stores "immortal" memories on BNB Greenfield
 * - Learns and evolves over time
 */

import { logger } from './utils/logger';
import { CONFIG } from './config';
import { validateEnv } from './utils/errorHandler';
import { TradeCooldown, RateLimiter } from './utils/safeguards';

// Import core modules
import { getTokenData, getTrendingTokens } from './data/marketFetcher';
import { getAIDecision, getRuleBasedDecision, AIDecision } from './agent/aiDecision';
import { getRecentMemories, generateLessons } from './agent/learningLoop';
import {
  executeTrade,
  getWalletBalance,
  getTokenBalance,
  initializeProvider
} from './blockchain/tradeExecutor';
import { storeMemory, initializeStorage, updateMemory } from './blockchain/memoryStorage';
import {
  initializeTelegramBot,
  alertBotStatus,
  alertAIDecision,
  alertTradeExecution,
  alertTradeOutcome,
  alertError,
  stopTelegramBot
} from './alerts/telegramBot';
import { TradeMemory } from './agent/learningLoop';
import { calculateBuySellPressure } from './data/marketFetcher';

// Global state
let isRunning = false;
let botInterval: Timer | null = null;
const tradeCooldown = new TradeCooldown(60000 * 30); // 30 minutes between trades per token
const apiRateLimiter = new RateLimiter(10, 60000); // 10 requests per minute
const activePositions = new Map<string, { amount: number; entryPrice: number; memoryId: string }>();

/**
 * Initialize the bot
 */
async function initializeBot(): Promise<void> {
  try {
    logger.info('🚀 Initializing Immortal AI Trading Bot...');

    // Validate environment
    validateEnv(['OPENROUTER_API_KEY', 'WALLET_PRIVATE_KEY', 'BNB_RPC']);

    // Initialize components
    initializeProvider();
    await initializeStorage();
    initializeTelegramBot();

    // Check wallet balance
    const balance = await getWalletBalance();
    logger.info(`💰 Wallet Balance: ${balance.toFixed(4)} BNB`);

    if (balance < 0.01) {
      logger.warn('⚠️  Low balance - bot may not be able to trade');
    }

    await alertBotStatus('started', `Bot initialized with ${balance.toFixed(4)} BNB`);

    logger.info('✅ Bot initialization complete');
  } catch (error) {
    logger.error(`Failed to initialize bot: ${(error as Error).message}`);
    await alertError('Bot Initialization', error as Error);
    throw error;
  }
}

/**
 * Main trading loop - analyzes markets and executes trades
 */
async function tradingLoop(): Promise<void> {
  if (!isRunning) return;

  try {
    logger.info('🔄 Starting trading cycle...');

    // Get watchlist (can be configured or use trending)
    const watchlist = CONFIG.DEFAULT_WATCHLIST.length > 0
      ? CONFIG.DEFAULT_WATCHLIST
      : (await getTrendingTokens(5)).map(t => t.address);

    if (watchlist.length === 0) {
      logger.warn('No tokens in watchlist, skipping cycle');
      return;
    }

    // Analyze each token
    for (const tokenAddress of watchlist) {
      try {
        await analyzeAndTrade(tokenAddress);
      } catch (error) {
        logger.error(`Error processing ${tokenAddress}: ${(error as Error).message}`);
      }

      // Delay between token analyses to avoid rate limits
      await sleep(2000);
    }

    logger.info('✅ Trading cycle complete');
  } catch (error) {
    logger.error(`Trading loop error: ${(error as Error).message}`);
    await alertError('Trading Loop', error as Error);
  }
}

/**
 * Analyze a token and potentially trade
 */
async function analyzeAndTrade(tokenAddress: string): Promise<void> {
  // Rate limiting
  if (!apiRateLimiter.canMakeRequest()) {
    logger.warn('Rate limit reached, skipping token');
    return;
  }

  // Check cooldown
  if (!tradeCooldown.canTrade(tokenAddress)) {
    return;
  }

  // Fetch market data
  const tokenData = await getTokenData(tokenAddress);

  if (!tokenData) {
    logger.warn(`Could not fetch data for ${tokenAddress}`);
    return;
  }

  logger.info(`📊 Analyzing ${tokenData.symbol} ($${tokenData.priceUsd})`);

  // Get wallet balance
  const accountBalance = await getWalletBalance();

  // Fetch memories for learning
  const memories = await getRecentMemories(10);

  // Get AI decision
  let decision: AIDecision;

  try {
    decision = await getAIDecision({
      tokenData,
      memories,
      accountBalance,
      currentPositions: activePositions,
    });
  } catch (error) {
    logger.warn(`AI decision failed, using rule-based fallback: ${(error as Error).message}`);
    decision = getRuleBasedDecision(tokenData, accountBalance);
  }

  logger.info(
    `🤖 AI Decision: ${decision.action.toUpperCase()} ${decision.amount} BNB (confidence: ${(decision.confidence * 100).toFixed(0)}%)`
  );

  // Alert about decision
  await alertAIDecision(decision, tokenData.symbol, tokenAddress);

  // Execute trade if not hold
  if (decision.action !== 'hold' && decision.amount > 0) {
    if (decision.confidence < 0.5) {
      logger.warn('Low confidence, skipping trade');
      return;
    }

    await executeAndRecordTrade(tokenAddress, tokenData, decision, accountBalance);
  }
}

/**
 * Execute a trade and record it in memory
 */
async function executeAndRecordTrade(
  tokenAddress: string,
  tokenData: any,
  decision: AIDecision,
  accountBalance: number
): Promise<void> {
  try {
    // Execute the trade
    logger.info(`⚡ Executing ${decision.action.toUpperCase()} for ${tokenData.symbol}`);

    const result = await executeTrade({
      tokenAddress,
      action: decision.action,
      amountBNB: decision.amount,
      slippagePercent: CONFIG.MAX_SLIPPAGE_PERCENTAGE,
    });

    // Alert about execution
    await alertTradeExecution(result, tokenData.symbol, decision.action);

    if (!result.success) {
      logger.error(`Trade failed: ${result.error}`);
      return;
    }

    logger.info(`✅ Trade executed: ${result.txHash}`);

    // Record cooldown
    tradeCooldown.recordTrade(tokenAddress);

    // Create memory
    const memory: TradeMemory = {
      id: '',
      timestamp: Date.now(),
      tokenAddress,
      tokenSymbol: tokenData.symbol,
      action: decision.action,
      entryPrice: parseFloat(tokenData.priceUsd),
      amount: decision.amount,
      outcome: 'pending',
      aiReasoning: decision.reason,
      marketConditions: {
        volume24h: tokenData.volume24h,
        liquidity: tokenData.liquidity,
        priceChange24h: tokenData.priceChange24h,
        buySellPressure: calculateBuySellPressure(tokenData),
      },
    };

    // Store memory
    const memoryId = await storeMemory(memory);

    // Track position
    if (decision.action === 'buy') {
      activePositions.set(tokenAddress, {
        amount: decision.amount,
        entryPrice: parseFloat(tokenData.priceUsd),
        memoryId,
      });
    } else if (decision.action === 'sell') {
      // Check if we had a position
      const position = activePositions.get(tokenAddress);

      if (position) {
        const exitPrice = parseFloat(tokenData.priceUsd);
        const profitLoss = parseFloat(result.amountOut) - position.amount;
        const profitLossPercentage = ((exitPrice - position.entryPrice) / position.entryPrice) * 100;

        // Update memory with outcome
        await updateMemory(position.memoryId, {
          exitPrice,
          outcome: profitLoss > 0 ? 'profit' : 'loss',
          profitLoss,
          profitLossPercentage,
          lessons: generateLessons({
            ...memory,
            exitPrice,
            outcome: profitLoss > 0 ? 'profit' : 'loss',
            profitLossPercentage,
          } as TradeMemory),
        });

        // Alert about outcome
        await alertTradeOutcome({
          ...memory,
          exitPrice,
          outcome: profitLoss > 0 ? 'profit' : 'loss',
          profitLoss,
          profitLossPercentage,
        } as TradeMemory);

        // Remove from active positions
        activePositions.delete(tokenAddress);
      }
    }

    logger.info(`💾 Trade recorded in immortal memory: ${memoryId}`);
  } catch (error) {
    logger.error(`Trade execution error: ${(error as Error).message}`);
    await alertError('Trade Execution', error as Error);
  }
}

/**
 * Monitor active positions for stop-loss
 */
async function monitorPositions(): Promise<void> {
  if (activePositions.size === 0) return;

  logger.info(`📈 Monitoring ${activePositions.size} active positions`);

  for (const [tokenAddress, position] of activePositions.entries()) {
    try {
      const tokenData = await getTokenData(tokenAddress);

      if (!tokenData) continue;

      const currentPrice = parseFloat(tokenData.priceUsd);
      const priceChange = ((currentPrice - position.entryPrice) / position.entryPrice) * 100;

      // Check stop-loss
      if (priceChange <= -CONFIG.STOP_LOSS_PERCENTAGE) {
        logger.warn(
          `⚠️  Stop-loss triggered for ${tokenData.symbol}: ${priceChange.toFixed(2)}%`
        );

        // Execute sell
        const decision: AIDecision = {
          action: 'sell',
          amount: position.amount,
          confidence: 1,
          reason: 'Stop-loss triggered',
          riskLevel: 'high',
        };

        const accountBalance = await getWalletBalance();
        await executeAndRecordTrade(tokenAddress, tokenData, decision, accountBalance);
      }

      // Optional: Take profit at +20%
      if (priceChange >= 20) {
        logger.info(
          `💰 Take profit opportunity for ${tokenData.symbol}: ${priceChange.toFixed(2)}%`
        );
        // Could auto-sell here or alert user
      }
    } catch (error) {
      logger.error(`Error monitoring ${tokenAddress}: ${(error as Error).message}`);
    }
  }
}

/**
 * Start the bot
 */
export async function startBot(): Promise<void> {
  if (isRunning) {
    logger.warn('Bot is already running');
    return;
  }

  await initializeBot();

  isRunning = true;

  // Run immediately
  await tradingLoop();

  // Set up interval
  botInterval = setInterval(async () => {
    await tradingLoop();
    await monitorPositions();
  }, CONFIG.BOT_LOOP_INTERVAL_MS);

  logger.info(`🔁 Bot loop started (interval: ${CONFIG.BOT_LOOP_INTERVAL_MS / 1000}s)`);
}

/**
 * Stop the bot
 */
export async function stopBot(): Promise<void> {
  if (!isRunning) {
    logger.warn('Bot is not running');
    return;
  }

  isRunning = false;

  if (botInterval) {
    clearInterval(botInterval);
    botInterval = null;
  }

  stopTelegramBot();

  await alertBotStatus('stopped', 'Bot has been stopped');

  logger.info('🛑 Bot stopped');
}

/**
 * Utility: Sleep function
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Handle graceful shutdown
 */
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, shutting down gracefully...');
  await stopBot();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, shutting down gracefully...');
  await stopBot();
  process.exit(0);
});

// Start bot if run directly
if (import.meta.main) {
  startBot().catch((error) => {
    logger.error(`Fatal error: ${error.message}`);
    process.exit(1);
  });
}
