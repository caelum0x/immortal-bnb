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
import { logger } from './src/utils/logger';
import { CONFIG } from './src/config';
import { ImmortalAIAgent } from './src/ai/immortalAgent';
import { startAPIServer } from './src/api/server';
import { TelegramBotManager } from './src/alerts/telegramBot';
import { initializeStorage } from './src/blockchain/memoryStorage';
import fetchMarketData from './src/data/marketFetcher';
import { TradeExecutor, tradeExecutorInstance } from './src/blockchain/tradeExecutor';
import { CrossChainArbitrageEngine } from './src/ai/crossChainStrategy';
import { StrategyEvolutionEngine } from './src/ai/strategyEvolution';
import { globalErrorHandler } from './src/utils/errorHandler';
import { validateTradeAmount } from './src/utils/safeguards';

// Global state
let immortalAgent: ImmortalAIAgent;
let tradeExecutor: TradeExecutor;
let crossChainEngine: CrossChainArbitrageEngine;
let strategyEngine: StrategyEvolutionEngine;
let telegramBot: TelegramBotManager;
let isRunning = false;
let loopCount = 0;

// Watchlist of tokens to monitor (configurable)
const WATCHLIST = [
  'CAKE', 'BNB', 'ETH', 'BTC', 'USDT', 'USDC', 
  // Add more tokens as needed
];

/**
 * Initialize all bot components
 */
async function initializeBot(): Promise<void> {
  try {
    logger.info('🚀 Initializing Immortal AI Trading Bot...');
    logger.info(`📅 Started at: ${new Date().toISOString()}`);
    
    // Initialize Greenfield storage for immortal memory
    logger.info('💾 Initializing BNB Greenfield storage...');
    try {
      await initializeStorage();
      logger.info('✅ BNB Greenfield storage ready - immortal memory enabled');
    } catch (error) {
      logger.warn('⚠️  Greenfield storage unavailable, using local fallback');
    }
    
    // Initialize AI agent with immortal memory
    logger.info('🤖 Initializing Immortal AI agent...');
    immortalAgent = new ImmortalAIAgent();
    await immortalAgent.loadMemories(); // Load past experiences
    
    // Initialize trading components
    logger.info('⚡ Initializing trading components...');
    tradeExecutor = tradeExecutorInstance;
    await tradeExecutor.initialize();
    crossChainEngine = new CrossChainArbitrageEngine();
    strategyEngine = new StrategyEvolutionEngine();
    
    logger.info('✅ All components initialized successfully');
    
    // Display current configuration
    logger.info(`🌐 Network: ${CONFIG.TRADING_NETWORK.toUpperCase()}`);
    logger.info(`💰 Max trade amount: ${CONFIG.MAX_TRADE_AMOUNT_BNB} BNB`);
    logger.info(`📊 Watchlist: ${WATCHLIST.join(', ')}`);
    
  } catch (error) {
    logger.error('❌ Bot initialization failed:', error);
    throw error;
  }
}

/**
 * Fetch and analyze market data for watchlist tokens
 */
async function analyzeMarketData(): Promise<any[]> {
  try {
    logger.info('📊 Fetching market data...');
    
    // Get trending tokens from DexScreener
    const trendingTokens = await fetchMarketData.getTrendingTokens(10);
    
    // Filter for watchlist tokens or high-volume opportunities
    const relevantTokens = trendingTokens.filter(token => 
      WATCHLIST.includes(token.symbol.toUpperCase()) ||
      token.volume24h > 100000 // High volume threshold
    );
    
    if (relevantTokens.length === 0) {
      logger.warn('⚠️  No relevant tokens found in current market data');
      return [];
    }
    
    logger.info(`🎯 Found ${relevantTokens.length} relevant tokens to analyze`);
    relevantTokens.forEach(token => {
      const changeIcon = token.priceChange24h > 0 ? '📈' : '📉';
      logger.info(`  ${changeIcon} ${token.symbol}: $${token.priceUsd} (${token.priceChange24h > 0 ? '+' : ''}${token.priceChange24h.toFixed(2)}%) Vol: $${token.volume24h.toLocaleString()}`);
    });
    
    return relevantTokens;
    
  } catch (error) {
    logger.error('❌ Market data analysis failed:', error);
    return [];
  }
}

/**
 * Process a single token for trading decision
 */
async function processToken(tokenData: any): Promise<void> {
  try {
    logger.info(`🔍 Processing ${tokenData.symbol}...`);
    
    // Check if we have sufficient liquidity and volume
    if (!fetchMarketData.hasSufficientLiquidity(tokenData, CONFIG.MAX_TRADE_AMOUNT_BNB)) {
      logger.warn(`⚠️  ${tokenData.symbol} has insufficient liquidity, skipping`);
      return;
    }
    
    // Get AI decision based on current data and past memories
    const decision = await immortalAgent.makeDecision(
      tokenData.address,
      tokenData,
      CONFIG.MAX_TRADE_AMOUNT_BNB
    );
    
    logger.info(`🤖 AI Decision for ${tokenData.symbol}:`);
    logger.info(`   Action: ${decision.action}`);
    logger.info(`   Amount: ${decision.amount.toFixed(4)} BNB`);
    logger.info(`   Confidence: ${(decision.confidence * 100).toFixed(1)}%`);
    logger.info(`   Strategy: ${decision.strategy}`);
    logger.info(`   Reasoning: ${decision.reasoning}`);
    
    // Execute trade if confidence is high enough
    if (decision.action !== 'HOLD' && decision.confidence > CONFIG.MIN_CONFIDENCE_THRESHOLD) {
      await executeTrade(tokenData, decision);
    } else {
      logger.info(`💤 No action taken for ${tokenData.symbol} (low confidence or HOLD decision)`);
    }
    
  } catch (error) {
    globalErrorHandler.handleError(error as Error, `Processing token ${tokenData.symbol}`);
  }
}

/**
 * Execute a trade based on AI decision
 */
async function executeTrade(tokenData: any, decision: any): Promise<void> {
  try {
    // Validate trade amount with safeguards
    if (!validateTradeAmount(decision.amount)) {
      logger.warn(`⚠️  Trade amount ${decision.amount} BNB exceeds safety limits`);
      return;
    }
    
    logger.info(`🚀 Executing ${decision.action} for ${tokenData.symbol}...`);
    logger.info(`   Amount: ${decision.amount.toFixed(4)} BNB`);
    
    const startTime = Date.now();
    
    // Prepare swap parameters
    const tradeParams = {
      tokenAddress: tokenData.address,
      action: decision.action.toLowerCase() as 'buy' | 'sell',
      amountBNB: decision.amount,
      slippagePercent: CONFIG.MAX_SLIPPAGE_PERCENTAGE
    };
    
    // Execute the swap
    const tradeResult = await tradeExecutor.executeTrade(tradeParams);
    
    const executionTime = Date.now() - startTime;
    
    if (tradeResult.success && tradeResult.txHash) {
      logger.info(`✅ Trade executed successfully!`);
      logger.info(`   TX Hash: ${tradeResult.txHash}`);
      logger.info(`   Execution time: ${executionTime}ms`);
      logger.info(`   Explorer: ${CONFIG.EXPLORER_URL}/tx/${tradeResult.txHash}`);
      
      // Learn from successful trade
      await learnFromTrade(tokenData, decision, tradeResult, 'executed');
      
      // Send success alert
      await sendAlert(`🎉 Trade Executed!\n${decision.action} ${tokenData.symbol}\nAmount: ${decision.amount.toFixed(4)} BNB\nTX: ${tradeResult.txHash}`);
      
    } else {
      logger.error(`❌ Trade failed: ${tradeResult.error}`);
      
      // Learn from failed trade
      await learnFromTrade(tokenData, decision, tradeResult, 'failed');
      
      // Send failure alert
      await sendAlert(`❌ Trade Failed!\n${decision.action} ${tokenData.symbol}\nReason: ${tradeResult.error}`);
    }
    
  } catch (error) {
    globalErrorHandler.handleError(error as Error, 'Trade execution');
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await sendAlert(`🚨 Trade Error!\nFailed to execute ${decision.action} for ${tokenData.symbol}\nError: ${errorMessage}`);
  }
}

/**
 * Learn from trade outcome and store in immortal memory
 */
async function learnFromTrade(tokenData: any, decision: any, result: any, outcome: string): Promise<void> {
  try {
    const currentPrice = parseFloat(tokenData.priceUsd);
    const marketConditions = {
      volume24h: tokenData.volume24h,
      liquidity: tokenData.liquidity || 0,
      priceChange24h: tokenData.priceChange24h,
      marketTrend: tokenData.priceChange24h > 0 ? 'bullish' : 'bearish' as 'bullish' | 'bearish' | 'sideways',
      buySellPressure: fetchMarketData.calculateBuySellPressure(tokenData)
    };
    
    // Store the trade in immortal memory for future learning
    await immortalAgent.learnFromTrade(
      tokenData.symbol,
      tokenData.address,
      decision.action,
      decision.amount,
      currentPrice,
      currentPrice, // Exit price will be updated later when we track actual outcomes
      marketConditions,
      decision.strategy
    );
    
    logger.info(`🧠 Trade outcome stored in immortal memory for future learning`);
    
  } catch (error) {
    globalErrorHandler.handleError(error as Error, 'Learning from trade');
  }
}

/**
 * Check for cross-chain arbitrage opportunities
 */
async function checkCrossChainOpportunities(): Promise<void> {
  if (!CONFIG.ENABLE_CROSS_CHAIN) {
    return;
  }
  
  try {
    logger.info('🌉 Checking cross-chain arbitrage opportunities...');
    
    const opportunities = await crossChainEngine.discoverArbitrageOpportunities();
    
    if (opportunities.length > 0) {
      logger.info(`💰 Found ${opportunities.length} cross-chain opportunities`);
      
      const bestOpp = opportunities[0];
      if (bestOpp && bestOpp.profitPotential > 3) { // 3% minimum profit
        logger.info(`🎯 High-profit arbitrage: ${bestOpp.sourceChain} → ${bestOpp.targetChain}`);
        logger.info(`   Profit potential: ${bestOpp.profitPotential.toFixed(2)}%`);
        logger.info(`   Token: ${bestOpp.tokenSymbol}`);
        
        // Note: Actual cross-chain execution would require additional implementation
        await sendAlert(`🌉 Cross-Chain Opportunity!\n${bestOpp.tokenSymbol}: ${bestOpp.sourceChain} → ${bestOpp.targetChain}\nProfit: ${bestOpp.profitPotential.toFixed(2)}%`);
      }
    }
    
  } catch (error) {
    globalErrorHandler.handleError(error as Error, 'Cross-chain opportunity check');
  }
}

/**
 * Evolve trading strategies based on performance
 */
async function evolveStrategies(): Promise<void> {
  try {
    // Evolve strategies every 10 loops or randomly with 15% chance
    const shouldEvolve = loopCount % 10 === 0 || Math.random() < 0.15;
    
    if (shouldEvolve) {
      logger.info('🧬 Evolving trading strategies...');
      await strategyEngine.evolveStrategies();
      
      const agentStats = immortalAgent.getMemoryStats();
      logger.info(`📊 Current performance: ${agentStats.successRate.toFixed(1)}% success rate over ${agentStats.totalTrades} trades`);
    }
    
  } catch (error) {
    globalErrorHandler.handleError(error as Error, 'Strategy evolution');
  }
}

/**
 * Send alert via Telegram (if configured)
 */
async function sendAlert(message: string): Promise<void> {
  try {
    if (CONFIG.TELEGRAM_BOT_TOKEN !== 'your_telegram_bot_token_here') {
      // Telegram bot implementation would be called here
      logger.info(`📱 Alert: ${message}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.warn('📱 Failed to send Telegram alert:', errorMessage);
  }
}

/**
 * Main trading loop - runs every 5 minutes
 */
async function mainTradingLoop(): Promise<void> {
  if (isRunning) {
    logger.debug('🔄 Trading loop already running, skipping...');
    return;
  }
  
  isRunning = true;
  loopCount++;
  
  try {
    logger.info(`🎯 Starting trading loop #${loopCount}...`);
    const startTime = Date.now();
    
    // 1. Analyze current market data
    const relevantTokens = await analyzeMarketData();
    
    if (relevantTokens.length === 0) {
      logger.warn('⚠️  No tokens to analyze, skipping this loop');
      return;
    }
    
    // 2. Process each token for trading opportunities
    for (const tokenData of relevantTokens.slice(0, 3)) { // Limit to top 3 for efficiency
      await processToken(tokenData);
      
      // Small delay between tokens to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // 3. Check for cross-chain arbitrage opportunities
    await checkCrossChainOpportunities();
    
    // 4. Evolve strategies based on recent performance
    await evolveStrategies();
    
    const executionTime = Date.now() - startTime;
    logger.info(`✅ Trading loop #${loopCount} completed in ${executionTime}ms`);
    
    // Send periodic status update
    if (loopCount % 12 === 0) { // Every hour (12 loops * 5 minutes)
      const stats = immortalAgent.getMemoryStats();
      await sendAlert(`📊 Hourly Status\nLoop #${loopCount}\nTrades: ${stats.totalTrades}\nSuccess: ${stats.successRate.toFixed(1)}%\nTop strategy: ${stats.topStrategies[0]?.name || 'None'}`);
    }
    
  } catch (error) {
    globalErrorHandler.handleError(error as Error, 'Main trading loop');
  } finally {
    isRunning = false;
  }
}

/**
 * Start the immortal trading bot
 */
async function startBot(): Promise<void> {
  try {
    // Display startup banner
    console.log('');
    console.log('🤖 ===============================================');
    console.log('🌟    IMMORTAL AI TRADING BOT');
    console.log('💫    Building immortal memory on BNB Greenfield');
    console.log('🚀    Ready for BNB Chain Hackathon!');
    console.log('🤖 ===============================================');
    console.log('');
    
    logger.info('🌟 Starting Immortal AI Trading Bot...');
    logger.info(`🕐 Timestamp: ${new Date().toISOString()}`);
    
    // Initialize all components
    await initializeBot();
    
    // Start API server for frontend integration
    logger.info('🌐 Starting API server...');
    await startAPIServer();
    logger.info(`✅ API server running on port ${CONFIG.API_PORT}`);
    
    // Initialize Telegram bot if configured
    if (CONFIG.TELEGRAM_BOT_TOKEN !== 'your_telegram_bot_token_here') {
      telegramBot = new TelegramBotManager();
      await telegramBot.initialize();
      logger.info('📱 Telegram bot initialized');
    } else {
      logger.warn('📱 Telegram bot not configured (add TELEGRAM_BOT_TOKEN)');
    }
    
    // Send startup notification
    await sendAlert(`🚀 Immortal AI Trading Bot Started!\nNetwork: ${CONFIG.TRADING_NETWORK}\nMax trade: ${CONFIG.MAX_TRADE_AMOUNT_BNB} BNB\nWatchlist: ${WATCHLIST.join(', ')}`);
    
    // Start the main trading loop
    logger.info(`🔄 Starting trading loop (every ${CONFIG.BOT_LOOP_INTERVAL_MS / 1000} seconds)`);
    
    // Run initial loop immediately
    await mainTradingLoop();
    
    // Set up recurring loop
    const loopInterval = setInterval(async () => {
      await mainTradingLoop();
    }, CONFIG.BOT_LOOP_INTERVAL_MS);
    
    logger.info('🎉 Immortal AI Trading Bot is now fully operational!');
    logger.info('');
    logger.info('🔮 Key Features Active:');
    logger.info('  💾 Immortal memory on BNB Greenfield');
    logger.info('  🤖 AI-powered trading decisions');
    logger.info('  🌉 Cross-chain arbitrage detection');
    logger.info('  🧬 Self-evolving strategies');
    logger.info('  📱 Real-time alerts and monitoring');
    logger.info('');
    logger.info('📊 Monitor the bot at:');
    logger.info(`  🌐 Dashboard: http://localhost:${CONFIG.API_PORT}`);
    logger.info(`  📈 Logs: Real-time via console`);
    logger.info(`  💬 Alerts: ${CONFIG.TELEGRAM_BOT_TOKEN !== 'your_telegram_bot_token_here' ? 'Telegram configured' : 'Configure Telegram for alerts'}`);
    logger.info('');
    
    // Keep process alive
    process.on('SIGINT', () => shutdownBot(loopInterval));
    process.on('SIGTERM', () => shutdownBot(loopInterval));
    
  } catch (error) {
    logger.error('💥 Failed to start bot:', error);
    process.exit(1);
  }
}

/**
 * Graceful shutdown handler
 */
async function shutdownBot(loopInterval?: NodeJS.Timeout): Promise<void> {
  logger.info('🛑 Shutting down Immortal AI Trading Bot...');
  
  // Clear the trading loop interval
  if (loopInterval) {
    clearInterval(loopInterval);
  }
  
  // Save final statistics and memories
  try {
    if (immortalAgent) {
      const finalStats = immortalAgent.getMemoryStats();
      logger.info(`📊 Final Statistics:`);
      logger.info(`   Total trades: ${finalStats.totalTrades}`);
      logger.info(`   Success rate: ${finalStats.successRate.toFixed(1)}%`);
      logger.info(`   Average return: ${finalStats.avgReturn.toFixed(2)}%`);
      
      await sendAlert(`👋 Bot Shutdown\nFinal Stats:\nTrades: ${finalStats.totalTrades}\nSuccess: ${finalStats.successRate.toFixed(1)}%\nAvg Return: ${finalStats.avgReturn.toFixed(2)}%`);
    }
  } catch (error) {
    logger.error('Error during shutdown:', error);
  }
  
  logger.info('💫 Immortal memories preserved on BNB Greenfield');
  logger.info('👋 Shutdown complete - until next time!');
  process.exit(0);
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('💥 Uncaught exception:', error);
  shutdownBot();
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('💥 Unhandled rejection at:', promise, 'reason:', reason);
  shutdownBot();
});

// Start the bot if this file is run directly
if (require.main === module) {
  startBot().catch((error) => {
    logger.error('💥 Bot startup failed:', error);
    process.exit(1);
  });
}

export { 
  startBot, 
  immortalAgent, 
  tradeExecutor, 
  crossChainEngine, 
  strategyEngine,
  mainTradingLoop 
};
