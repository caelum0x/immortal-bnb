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
import { logTradeEvent, logAIDecision, logErrorWithContext, logPerformance } from './monitoring/logging';
import { CONFIG } from './config';
import { ImmortalAIAgent } from './ai/immortalAgent';
import { startAPIServer } from './api-server';
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
import { recordTrade, recordAIDecision } from './monitoring/metrics';
import { tradeRepository } from './db/repositories/tradeRepository';
import { withSpan } from './monitoring/tracing';
import { dexscreenerCircuitBreaker, openRouterCircuitBreaker, blockchainCircuitBreaker } from './resilience/circuitBreaker';
import { networkRetryPolicy } from './resilience/retryPolicy';
import { getOrchestrator, type DecisionRequest, type DecisionResponse } from './ai/orchestrator';
import { getOrderMonitoringService } from './services/orderMonitoringService';
import { getPriceFeedService } from './services/priceFeedService';
import { getRiskManagementService } from './services/riskManagementService';
import { getAnalyticsService } from './services/analyticsService';

// Import WebSocket Manager for real-time updates (initialized in api-server.ts)
let webSocketManager: any = null;
async function getWebSocketManager() {
  if (!webSocketManager) {
    try {
      const { webSocketManager: wsm } = await import('./api-server');
      webSocketManager = wsm;
    } catch (error) {
      logger.warn('WebSocket Manager not yet initialized');
    }
  }
  return webSocketManager;
}

// Import Polymarket services
let polymarketService: any = null;
async function getPolymarketService() {
  if (!polymarketService) {
    try {
      const { polymarketService: pms } = await import('./services/polymarketService');
      polymarketService = pms;
    } catch (error) {
      logger.warn('Polymarket Service not available');
    }
  }
  return polymarketService;
}

// Global provider and wallet
let provider: ethers.JsonRpcProvider;
let wallet: ethers.Wallet | null = null;
let tradeExecutor: TradeExecutor;

/**
 * Get or create wallet instance (lazy initialization)
 */
function getWallet(): ethers.Wallet {
  if (!wallet) {
    const privateKey = CONFIG.WALLET_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('WALLET_PRIVATE_KEY is not set in .env file');
    }
    
    // Ensure private key starts with 0x
    const normalizedKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
    
    try {
      wallet = new ethers.Wallet(normalizedKey, provider);
      logger.info(`✅ Wallet initialized: ${wallet.address}`);
    } catch (walletError: any) {
      // Don't log full error details - just a simple message
      // The caller will handle the error appropriately
      const errorMsg = walletError.message?.includes('bigint') 
        ? 'Invalid private key format' 
        : walletError.message;
      throw new Error(`Invalid WALLET_PRIVATE_KEY: ${errorMsg}`);
    }
  }
  return wallet;
}

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
    
    // Wallet will be created lazily when needed via getWallet()
    // This prevents errors during initialization if private key is invalid
    
    tradeExecutor = new TradeExecutor();
    await tradeExecutor.initialize();
    
    await initializeStorage();
    logger.info('✅ Provider initialized (wallet will be created when needed)');
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
    const wallet = getWallet();
    const balance = await provider.getBalance(wallet.address);
    return parseFloat(ethers.formatEther(balance));
  } catch (error: any) {
    // Don't log as error if it's just an invalid wallet key (expected in dev)
    if (error.message?.includes('bigint') || error.message?.includes('WALLET_PRIVATE_KEY')) {
      logger.warn(`⚠️  Cannot get wallet balance: Invalid wallet key (using 0.0000)`);
    } else {
      logger.error(`Failed to get wallet balance: ${(error as Error).message}`);
    }
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

    // Get service instances
    const priceFeed = getPriceFeedService();
    const riskManagement = getRiskManagementService();
    const analytics = getAnalyticsService();
    const orderMonitoring = getOrderMonitoringService();

    // Get token data from Price Feed Service with DexScreener fallback
    const tokenData = await withSpan('fetch-token-data', async (span) => {
      span.setAttribute('token.address', tokenAddress);
      
      // Try Price Feed Service first
      const priceData = await priceFeed.getPrice(tokenAddress);
      
      if (priceData && priceData.price > 0) {
        logger.info(`📡 Using Price Feed Service for ${tokenAddress}`);
        // Use price feed data, but still fetch additional data from DexScreener
        const dexData = await dexscreenerCircuitBreaker.execute(
          () => getTokenData(tokenAddress),
          async () => null
        );
        
        // Merge price feed data with DexScreener data
        return dexData ? {
          ...dexData,
          priceUsd: priceData.price,
        } : {
          address: tokenAddress,
          symbol: tokenAddress.substring(0, 8),
          priceUsd: priceData.price,
          volume24h: 0,
          liquidity: 0,
          priceChange24h: priceData.change24h || 0,
        };
      }
      
      // Fallback to DexScreener only
      return await dexscreenerCircuitBreaker.execute(
        () => networkRetryPolicy.execute(
          () => getTokenData(tokenAddress),
          'fetch-token-data'
        ),
        async () => {
          logger.warn(`All market data sources unavailable for ${tokenAddress}`);
          return null;
        }
      );
    });
    
    if (!tokenData) {
      logger.warn(`Could not fetch data for ${tokenAddress}`);
      return;
    }

    logger.info(`📊 Token: ${tokenData.symbol} - Price: $${tokenData.priceUsd} - Volume: $${tokenData.volume24h.toLocaleString()}`);

    // Use AI Orchestrator for intelligent agent routing (TS/Python)
    const orchestrator = getOrchestrator();
    
    // Create decision request for the orchestrator
    const decisionRequest: DecisionRequest = {
      platform: 'dex' as const,
      asset: {
        tokenAddress,
        tokenSymbol: tokenData.symbol,
      },
      marketData: tokenData,
      urgency: 'medium' as const, // Fast DEX decisions
      requiresResearch: false, // Use TypeScript agent for speed
    };

    // Use orchestrator for decision making with circuit breaker
    const aiDecision = await withSpan('ai-decision', async (span) => {
      span.setAttribute('token.address', tokenAddress);
      span.setAttribute('token.symbol', tokenData.symbol);
      
      return await openRouterCircuitBreaker.execute(
        async () => {
          const decision = await orchestrator.makeDecision(decisionRequest);
          // Convert DecisionResponse to expected format
          return {
            action: decision.shouldTrade ? 
              (decision.confidence > 0.6 ? 'BUY' : 'HOLD') : 'HOLD' as const,
            amount: decision.estimatedProfit ? decision.estimatedProfit / 100 : 0.01,
            confidence: decision.confidence,
            reasoning: decision.reasoning,
            strategy: decision.strategy,
            riskLevel: decision.riskLevel,
          };
        },
        async () => {
          // Fallback: conservative HOLD decision
          return {
            action: 'HOLD' as const,
            amount: 0,
            confidence: 0,
            reasoning: 'AI service unavailable - holding position',
            strategy: 'conservative',
            riskLevel: 'LOW' as const,
          };
        }
      );
    });
    
    // Record AI decision metrics
    recordAIDecision('immortal', 'pancakeswap', aiDecision.action, aiDecision.confidence);
    
    // Structured logging
    logAIDecision({
      tokenAddress,
      tokenSymbol: tokenData.symbol,
      action: aiDecision.action,
      confidence: aiDecision.confidence,
      reasoning: aiDecision.reasoning,
      strategy: aiDecision.strategy,
    });
    
    logger.info(`🧠 Immortal AI Decision: ${aiDecision.action} ${aiDecision.amount.toFixed(4)} BNB (${(aiDecision.confidence * 100).toFixed(1)}%)`);
    logger.info(`📝 AI Reasoning: ${aiDecision.reasoning}`);
    logger.info(`🎯 Strategy: ${aiDecision.strategy}`);
    
    // Broadcast AI Decision via WebSocket
    const wsManager = await getWebSocketManager();
    if (wsManager) {
      try {
        wsManager.sendAIDecisionNotification({
          token: tokenData.symbol,
          action: aiDecision.action,
          confidence: aiDecision.confidence,
          reasoning: aiDecision.reasoning,
        });
      } catch (error) {
        logger.warn('Failed to broadcast AI decision:', error);
      }
    }

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

        // Risk Management Validation
        logger.info(`🔍 Validating trade with Risk Management Service...`);
        
        // Check portfolio risk
        const portfolioRisk = await riskManagement.getPortfolioRisk();
        logger.info(`📊 Portfolio Risk: ${portfolioRisk.overallRisk} (VaR: $${portfolioRisk.valueAtRisk.toFixed(2)})`);
        
        // Validate if trade should proceed
        const shouldTrade = await riskManagement.shouldTrade(
          tokenAddress,
          tradeParams.action,
          tradeParams.amountBNB
        );
        
        if (!shouldTrade) {
          logger.warn(`⚠️  Trade rejected by Risk Management Service`);
          logger.warn(`   Reason: Portfolio risk limits exceeded or position size too large`);
          
          // Record decision in analytics
          await analytics.recordDecision({
            tokenAddress,
            tokenSymbol: tokenData.symbol,
            action: aiDecision.action,
            confidence: aiDecision.confidence,
            reasoning: aiDecision.reasoning,
            outcome: 'rejected_risk',
            timestamp: Date.now(),
          });
          
          return;
        }
        
        logger.info(`✅ Trade validated - proceeding with execution`);
        logger.info(`💎 Executing immortal AI trade: ${tradeParams.action} ${tradeParams.amountBNB.toFixed(4)} BNB`);
        
        // Execute trade with tracing and circuit breaker
        const tradeStartTime = Date.now();
        const tradeResult = await withSpan('execute-trade', async (span) => {
          span.setAttribute('token.address', tokenAddress);
          span.setAttribute('token.symbol', tokenData.symbol);
          span.setAttribute('action', tradeParams.action);
          span.setAttribute('amount', tradeParams.amountBNB);
          
          return await blockchainCircuitBreaker.execute(
            () => executeTrade(tradeParams),
            async () => {
              // Fallback: return failure
              return {
                success: false,
                amountIn: tradeParams.amountBNB.toString(),
                amountOut: '0',
                actualPrice: 0,
                error: 'Circuit breaker is OPEN - blockchain unavailable'
              };
            }
          );
        });
        
        const tradeDuration = Date.now() - tradeStartTime;
        logPerformance('trade-execution', tradeDuration, {
          token: tokenData.symbol,
          action: tradeParams.action,
          success: tradeResult.success,
        });
        
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

          // Store trade in database
          try {
            await tradeRepository.create({
              tokenAddress,
              tokenSymbol: tokenData.symbol,
              action: tradeParams.action,
              amountBNB: tradeParams.amountBNB.toString(),
              amountTokens: (tradeResult as any).amountOut || '0',
              entryPrice: parseFloat(tokenData.priceUsd).toString(),
              actualPrice: (tradeResult as any).actualPrice?.toString(),
              txHash: tradeResult.txHash,
              gasUsed: (tradeResult as any).gasUsed,
              slippagePercent: tradeParams.slippagePercent || 2,
              outcome: 'pending',
              confidence: aiDecision.confidence,
              strategy: aiDecision.strategy,
              riskLevel: aiDecision.riskLevel,
              aiReasoning: aiDecision.reasoning,
              marketConditions: {
                volume24h: tokenData.volume24h,
                liquidity: tokenData.liquidity,
                priceChange24h: tokenData.priceChange24h,
                buySellPressure: calculateBuySellPressure(tokenData)
              },
              platform: 'pancakeswap',
              chain: CONFIG.TRADING_NETWORK,
            });
          } catch (dbError) {
            logger.warn('Failed to store trade in database:', dbError);
            // Continue - database is not critical
          }
          
          // Track order with Order Monitoring Service
          try {
            await orderMonitoring.createOrder({
              id: tradeResult.txHash || `order_${Date.now()}`,
              userId: getWallet().address,
              tokenId: tokenAddress,
              type: 'MARKET' as any, // Market order (executed immediately)
              side: tradeParams.action.toUpperCase() as any,
              amount: tradeParams.amountBNB,
              price: parseFloat(tokenData.priceUsd),
              status: 'FILLED' as any,
              filledAmount: tradeParams.amountBNB,
              remainingAmount: 0,
              createdAt: new Date(tradeStartTime),
              executedAt: new Date(),
            });
            
            logger.info(`📋 Order tracked in Order Monitoring Service`);
          } catch (orderError) {
            logger.warn('Failed to track order:', orderError);
          }
          
          // Record trade in Analytics Service
          try {
            await analytics.recordTrade({
              tokenAddress,
              tokenSymbol: tokenData.symbol,
              action: tradeParams.action,
              amountBNB: tradeParams.amountBNB,
              amountTokens: parseFloat((tradeResult as any).amountOut || '0'),
              entryPrice: parseFloat(tokenData.priceUsd),
              actualPrice: (tradeResult as any).actualPrice || 0,
              profitLoss: 0, // Will be calculated later when position closes
              confidence: aiDecision.confidence,
              reasoning: aiDecision.reasoning,
              strategy: aiDecision.strategy,
              riskLevel: aiDecision.riskLevel,
              executionTime: tradeDuration,
              gasUsed: (tradeResult as any).gasUsed || 0,
              outcome: 'success',
              timestamp: Date.now(),
            });
            
            logger.info(`📊 Trade recorded in Analytics Service`);
          } catch (analyticsError) {
            logger.warn('Failed to record trade in analytics:', analyticsError);
          }
          
          // Broadcast Trade via WebSocket
          if (wsManager) {
            try {
              wsManager.sendTradeNotification({
                tradeId: tradeResult.txHash || `trade_${Date.now()}`,
                action: tradeParams.action,
                token: tokenData.symbol,
                amount: tradeParams.amountBNB,
                price: (tradeResult as any).actualPrice || parseFloat(tokenData.priceUsd),
                profitLoss: 0, // Will be calculated later
              });
              
              logger.info(`🔌 Trade broadcasted via WebSocket`);
            } catch (error) {
              logger.warn('Failed to broadcast trade:', error);
            }
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

          // Record metrics
          recordTrade('pancakeswap', 'success', 0); // P&L calculated later
          
          // Structured logging
          logTradeEvent('executed', {
            tokenAddress,
            tokenSymbol: tokenData.symbol,
            action: tradeParams.action,
            amount: tradeParams.amountBNB,
            price: parseFloat(tokenData.priceUsd),
            txHash: tradeResult.txHash,
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

  // Analyze each token for DEX trading
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
  
  // Check Polymarket opportunities (if enabled)
  try {
    const polymarket = await getPolymarketService();
    if (polymarket) {
      logger.info('🎲 Checking Polymarket opportunities...');
      
      // Get active markets
      const markets = await polymarket.getActiveMarkets({ limit: 10 });
      
      if (markets && markets.length > 0) {
        logger.info(`📊 Found ${markets.length} active Polymarket markets`);
        
        // Analyze most promising market with AI Orchestrator
        const topMarket = markets[0];
        const orchestrator = getOrchestrator();
        
        const polymarketRequest: DecisionRequest = {
          platform: 'polymarket' as const,
          asset: {
            marketId: topMarket.id,
            marketQuestion: topMarket.question,
          },
          marketData: topMarket,
          urgency: 'low' as const,
          requiresResearch: true, // Use Python agent for research
        };
        
        const decision = await orchestrator.makeDecision(polymarketRequest);
        
        if (decision.shouldTrade && decision.confidence > 0.7) {
          logger.info(`🎯 Polymarket opportunity: ${topMarket.question}`);
          logger.info(`   Confidence: ${(decision.confidence * 100).toFixed(1)}%`);
          logger.info(`   Strategy: ${decision.strategy}`);
          
          // Broadcast Polymarket decision
          const wsManager = await getWebSocketManager();
          if (wsManager) {
            wsManager.sendAIDecisionNotification({
              token: topMarket.question,
              action: decision.shouldTrade ? 'BUY' : 'HOLD',
              confidence: decision.confidence,
              reasoning: decision.reasoning,
            });
          }
          
          // Note: Actual Polymarket trade execution would be handled by polymarketOrchestrator
          // This is just opportunity detection and analysis
        }
      }
    }
  } catch (polymarketError) {
    logger.warn('Polymarket analysis failed:', polymarketError);
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

  // Initialize and start all services
  logger.info('🔧 Initializing trading services...');
  
  const orderMonitoring = getOrderMonitoringService();
  const priceFeed = getPriceFeedService();
  const riskManagement = getRiskManagementService();
  const analytics = getAnalyticsService();
  const orchestrator = getOrchestrator();
  
  // Ensure services are started (start() handles multiple calls gracefully)
  logger.info('🔍 Starting Order Monitoring Service...');
  orderMonitoring.start(5000); // Check every 5 seconds
  
  logger.info('📡 Starting Price Feed Service...');
  priceFeed.start(); // Fetch prices every 10 seconds
  
  logger.info('✅ All services initialized and started');
  logger.info('   - AI Orchestrator: Ready');
  logger.info('   - Order Monitoring: Active');
  logger.info('   - Price Feed: Active');
  logger.info('   - Risk Management: Ready');
  logger.info('   - Analytics: Ready');
  
  // Wire service events to WebSocket Manager for real-time updates
  const wsManager = await getWebSocketManager();
  if (wsManager) {
    logger.info('🔌 Wiring service events to WebSocket Manager...');
    
    // Listen to Order Monitoring events (if service supports events)
    if (typeof orderMonitoring.on === 'function') {
      orderMonitoring.on('orderFilled', (order: any) => {
        wsManager.sendNotification({
          type: 'trade',
          title: 'Order Filled',
          message: `${order.side} order for ${order.amount} filled`,
          data: order,
        });
      });
      
      orderMonitoring.on('orderCancelled', (order: any) => {
        wsManager.sendNotification({
          type: 'info',
          title: 'Order Cancelled',
          message: `${order.side} order cancelled`,
          data: order,
        });
      });
    } else {
      logger.warn('⚠️  Order Monitoring service does not support events');
    }
    
    // Listen to Price Feed events (if service supports events)
    if (typeof priceFeed.on === 'function') {
      priceFeed.on('priceUpdate', (priceData: any) => {
        wsManager.sendPriceUpdate({
          tokenId: priceData.tokenId,
          price: priceData.price,
          change24h: priceData.change24h || 0,
          timestamp: Date.now(),
        });
      });
    } else {
      logger.warn('⚠️  Price Feed service does not support events');
    }
    
    // Listen to Risk Management events (if service supports events)
    if (typeof riskManagement.on === 'function') {
      riskManagement.on('riskAlert', (alert: any) => {
        wsManager.sendNotification({
          type: 'warning',
          title: 'Risk Alert',
          message: alert.message,
          data: alert,
        });
      });
    } else {
      logger.warn('⚠️  Risk Management service does not support events');
    }
    
    logger.info('✅ Service events wired to WebSocket Manager');
  }

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
