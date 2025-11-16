#!/usr/bin/env bun
/**
 * Immortal AI Trading Bot - Main Entry Point
 * 
 * Features:
 * - Real market data from DexScreener API
 * - AI-powered trading decisions via OpenRouter LLM
 * - Cross-chain arbitrage detection (BNB ↔ Solana/Ethereum)
 * - Strategy evolution using genetic algorithms
 * - Immortal memory storage on BNB Greenfield
 * - PancakeSwap integration for DEX trading
 * - Telegram alerts and monitoring
 * - Non-custodial user-approved trades
 */

import 'reflect-metadata';
import { logger } from './utils/logger';
import { CONFIG } from './config';
import { ImmortalAIAgent } from './ai/immortalAgent';
import { startAPIServer } from './api/server';
import { telegramBotManager } from './alerts/telegramBot';
import { storeMemory, initializeStorage } from './blockchain/memoryStorage';
import { getTokenData, getTrendingTokens, calculateBuySellPressure } from './data/marketFetcher';
import { TradeExecutor } from './blockchain/tradeExecutor';
import { CrossChainArbitrageEngine } from './ai/crossChainStrategy';
import { StrategyEvolutionEngine } from './ai/strategyEvolution';
import handleError from './utils/errorHandler';
import { validateTradeAmount } from './utils/safeguards';
import { BotState } from './bot-state';
import { ethers } from 'ethers';

// Global provider and wallet
let provider: ethers.JsonRpcProvider;
let wallet: ethers.Wallet;
let tradeExecutor: TradeExecutor;

// Initialize AI agent systems
const immortalAgent = new ImmortalAIAgent();
const crossChainEngine = new CrossChainArbitrageEngine();
const strategyEngine = new StrategyEvolutionEngine();

let invocationCount = 0;
const activePositions = new Map<string, {
  amount: number;
  entryPrice: number;
  memoryId: string;
  tokenSymbol: string;
}>();

/**
 * Initialize blockchain provider and wallet
 */
async function initializeProvider() {
  try {
    provider = new ethers.JsonRpcProvider(CONFIG.RPC_URL);
    wallet = new ethers.Wallet(CONFIG.WALLET_PRIVATE_KEY!, provider);
    tradeExecutor = new TradeExecutor();
    await tradeExecutor.initialize();
    
    await initializeStorage();
    logger.info('✅ Provider and wallet initialized');
  } catch (error) {
    logger.error(`Failed to initialize provider: ${(error as Error).message}`);
    throw error;
  }
}

/**
 * Get wallet BNB balance
 */
async function getWalletBalance(): Promise<number> {
  try {
    const balance = await provider.getBalance(wallet.address);
    return parseFloat(ethers.formatEther(balance));
  } catch (error) {
    logger.error(`Failed to get wallet balance: ${(error as Error).message}`);
    return 0;
  }
}

/**
 * Execute a trade
 */
async function executeTrade(params: {
  tokenAddress: string;
  action: 'buy' | 'sell';
  amountBNB: number;
  slippagePercent: number;
}): Promise<{ success: boolean; error?: string; txHash?: string }> {
  try {
    if (!validateTradeAmount(params.amountBNB)) {
      throw new Error('Invalid trade amount');
    }

    const tradeParams = {
      tokenAddress: params.tokenAddress,
      action: params.action,
      amountBNB: params.amountBNB,
      slippagePercent: params.slippagePercent
    };

    const result = await tradeExecutor.executeTrade(tradeParams);

    return { success: result.success, txHash: result.txHash };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Send trade execution alert
 */
async function alertTradeExecution(
  tradeResult: { success: boolean; txHash?: string; error?: string },
  tokenSymbol: string,
  action: string
) {
  await telegramBotManager.sendTradeAlert(
    action,
    tokenSymbol,
    0, // Amount will be filled by caller if needed
    0, // Price will be filled by caller if needed
    tradeResult.success
  );
}

/**
 * Send bot status alert
 */
async function alertBotStatus(status: string, message: string) {
  const alertMessage = `🤖 *BOT ${status.toUpperCase()}*\n\n${message}\n🕐 ${new Date().toLocaleString()}`;
  await telegramBotManager.sendAlert(alertMessage, status === 'started' ? 'success' : 'info');
}

/**
 * Initialize telegram bot
 */
function initializeTelegramBot() {
  telegramBotManager.initialize();
}

// Track state

/**
 * Main AI agent invocation - integrated with immortal AI system
 */
async function invokeAgent(tokenAddress: string) {
  invocationCount++;

  logger.info(`\n🤖 Invocation #${invocationCount} - Analyzing ${tokenAddress}`);

  try {
    // Load immortal memories on first run
    if (invocationCount === 1) {
      logger.info('🧠 Loading immortal agent memories...');
      await immortalAgent.loadMemories();
    }

    // Get wallet balance
    const walletBalance = await getWalletBalance();

    // Get token data from DexScreener
    const tokenData = await getTokenData(tokenAddress);
    if (!tokenData) {
      logger.warn(`Could not fetch data for ${tokenAddress}`);
      return;
    }

    logger.info(`📊 Token: ${tokenData.symbol} - Price: $${tokenData.priceUsd} - Volume: $${tokenData.volume24h.toLocaleString()}`);

    // Use immortal AI agent for decision making
    const aiDecision = await immortalAgent.makeDecision(tokenAddress, tokenData, walletBalance);
    
    logger.info(`🧠 Immortal AI Decision: ${aiDecision.action} ${aiDecision.amount.toFixed(4)} BNB (${(aiDecision.confidence * 100).toFixed(1)}%)`);
    logger.info(`📝 AI Reasoning: ${aiDecision.reasoning}`);
    logger.info(`🎯 Strategy: ${aiDecision.strategy}`);

    // Check cross-chain arbitrage opportunities
    const crossChainOps = await crossChainEngine.discoverArbitrageOpportunities();
    if (crossChainOps.length > 0) {
      logger.info(`🌐 Found ${crossChainOps.length} cross-chain arbitrage opportunities`);
      const bestOpp = crossChainOps[0];
      if (bestOpp && bestOpp.profitPotential > 5) { // 5% minimum profit
        logger.info(`🚀 High-value arbitrage: ${bestOpp.profitPotential.toFixed(2)}% profit potential`);
      }
    }

    // Execute trade if AI decision confidence is high enough
    if (aiDecision.action !== 'HOLD' && aiDecision.confidence >= immortalAgent.getPersonality().confidenceThreshold) {
      try {
        const tradeParams = {
          tokenAddress,
          action: aiDecision.action.toLowerCase() as 'buy' | 'sell',
          amountBNB: aiDecision.amount * walletBalance,
          slippagePercent: 2
        };

        logger.info(`� Executing immortal AI trade: ${tradeParams.action} ${tradeParams.amountBNB.toFixed(4)} BNB`);
        
        const tradeResult = await executeTrade(tradeParams);
        
        if (tradeResult.success) {
          // Update active positions
          if (tradeParams.action === 'buy') {
            activePositions.set(tokenAddress, {
              amount: tradeParams.amountBNB,
              entryPrice: parseFloat(tokenData.priceUsd),
              memoryId: `trade_${Date.now()}`,
              tokenSymbol: tokenData.symbol
            });
          } else {
            activePositions.delete(tokenAddress);
          }

          // Log trade to BotState
          BotState.addTradeLog({
            id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
            token: tokenAddress,
            tokenSymbol: tokenData.symbol,
            action: tradeParams.action,
            amount: tradeParams.amountBNB,
            price: parseFloat(tokenData.priceUsd),
            status: 'success',
            txHash: tradeResult.txHash
          });

          // Alert successful trade
          await alertTradeExecution(tradeResult, tokenData.symbol, tradeParams.action);
          
          // Store immortal memory of this trade
          const tradeMemory = {
            id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
            tokenSymbol: tokenData.symbol,
            tokenAddress,
            action: aiDecision.action.toLowerCase() as 'buy' | 'sell',
            amount: tradeParams.amountBNB,
            entryPrice: parseFloat(tokenData.priceUsd),
            exitPrice: undefined,
            outcome: 'pending' as 'pending',
            profitLoss: undefined,
            aiReasoning: aiDecision.reasoning,
            marketConditions: {
              volume24h: tokenData.volume24h,
              liquidity: tokenData.liquidity,
              priceChange24h: tokenData.priceChange24h,
              buySellPressure: calculateBuySellPressure(tokenData)
            }
          };
          
          await storeMemory(tradeMemory);
          logger.info(`🧠 Trade memory stored in immortal storage`);
          
        } else {
          // Log failed trade to BotState
          BotState.addTradeLog({
            id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
            token: tokenAddress,
            tokenSymbol: tokenData.symbol,
            action: tradeParams.action,
            amount: tradeParams.amountBNB,
            price: parseFloat(tokenData.priceUsd),
            status: 'failed',
            error: tradeResult.error
          });
          
          logger.error(`❌ Trade execution failed: ${tradeResult.error}`);
        }
        
      } catch (error) {
        logger.error(`❌ Trade execution error: ${(error as Error).message}`);
      }
      
    } else if (aiDecision.action === 'HOLD') {
      logger.info(`⏸️  AI recommends HOLD - ${aiDecision.reasoning}`);
    } else {
      logger.info(`⚠️  AI confidence below threshold (${(aiDecision.confidence * 100).toFixed(1)}% < ${(immortalAgent.getPersonality().confidenceThreshold * 100).toFixed(1)}%)`);
    }

    // Evolve strategies periodically
    if (invocationCount % 10 === 0) {
      logger.info('🧬 Evolving trading strategies...');
      await strategyEngine.evolveStrategies();
    }

    logger.info(`\n✅ Invocation #${invocationCount} complete`);
    return `Immortal AI analysis complete. Decision: ${aiDecision.action} with ${(aiDecision.confidence * 100).toFixed(1)}% confidence.`;

  } catch (error) {
    logger.error(`Error in invocation #${invocationCount}: ${(error as Error).message}`);
    throw error;
  }
}

/**
 * Main loop - check markets periodically
 */
async function main() {
  // Check if bot is running (frontend-controlled)
  if (!BotState.isRunning()) {
    logger.debug('⏸️  Bot is not running (waiting for frontend to start)');
    return;
  }

  logger.info('🚀 Starting Immortal AI Trading Bot cycle...');
  logger.info('📍 Network: BNB Chain ' + (CONFIG.NETWORK === 'mainnet' ? 'MAINNET' : 'TESTNET'));

  // Initialize if not already done
  if (!provider) {
    await initializeProvider();
    initializeTelegramBot();
  }

  const balance = await getWalletBalance();
  logger.info(`💰 Wallet Balance: ${balance.toFixed(4)} BNB`);

  if (balance < 0.01) {
    logger.warn('⚠️  Low balance! Get testnet BNB from https://testnet.bnbchain.org/faucet-smart');
  }

  // Get tokens from BotState config or fallback to defaults
  const botConfig = BotState.getConfig();
  let tokensToWatch = botConfig?.tokens || CONFIG.DEFAULT_WATCHLIST;

  if (tokensToWatch.length === 0) {
    logger.info('📈 Fetching trending tokens...');
    const trending = await getTrendingTokens(3);
    tokensToWatch = trending.map(t => t.address);
    logger.info(`Found ${tokensToWatch.length} trending tokens`);
  }

  // Analyze each token
  for (const tokenAddress of tokensToWatch) {
    // Check again if bot is still running (user might have stopped it)
    if (!BotState.isRunning()) {
      logger.info('⏸️  Bot stopped during cycle');
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
  logger.info(`Next run in ${CONFIG.BOT_LOOP_INTERVAL_MS / 1000 / 60} minutes\n`);
}

/**
 * Start bot with interval
 */
async function startBot() {
  // Start API server for frontend communication
  startAPIServer();

  // Initialize provider once
  await initializeProvider();
  initializeTelegramBot();

  const balance = await getWalletBalance();
  logger.info(`💰 Wallet Balance: ${balance.toFixed(4)} BNB`);
  await alertBotStatus('started', `Bot initialized with ${balance.toFixed(4)} BNB balance`);

  // Run trading loop on interval (checks BotState.isRunning() inside)
  const intervalId = setInterval(async () => {
    try {
      await main();
    } catch (error) {
      logger.error(`Error in trading loop: ${(error as Error).message}`);
    }
  }, CONFIG.BOT_LOOP_INTERVAL_MS);

  // Store interval ID in BotState for cleanup
  BotState.setIntervalId(intervalId);

  logger.info('✅ Bot loop started - waiting for frontend to start trading');
  logger.info('   Use the frontend dashboard to start/stop the bot');
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
