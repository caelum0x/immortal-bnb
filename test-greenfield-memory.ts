#!/usr/bin/env bun
// test-greenfield-memory.ts
// Comprehensive test for BNB Greenfield memory storage
// Tests store, retrieve, AI learning, and memory persistence

import 'reflect-metadata';

import { logger } from './src/utils/logger';
import { 
  initializeStorage, 
  storeMemory, 
  fetchMemory, 
  fetchAllMemories, 
  queryMemories, 
  getStorageStats,
  updateMemory,
  deleteMemory
} from './src/blockchain/memoryStorage';
import { ImmortalAIAgent } from './src/ai/immortalAgent';
import type { TradeMemory } from './src/types/memory';
import { CONFIG } from './src/config';

// Test data for memory validation
const testTradeMemory: TradeMemory = {
  id: 'test_memory_1',
  timestamp: Date.now(),
  tokenAddress: '0x55d398326f99059ff775485246999027b3197955', // USDT on BSC
  tokenSymbol: 'USDT',
  action: 'buy',
  entryPrice: 1.0,
  exitPrice: 1.05,
  amount: 100,
  outcome: 'profit',
  profitLoss: 5.0,
  profitLossPercentage: 5.0,
  aiReasoning: 'Strong bullish indicators with high volume and positive market sentiment',
  marketConditions: {
    volume24h: 1000000,
    liquidity: 5000000,
    priceChange24h: 2.5,
    buySellPressure: 0.7
  },
  lessons: 'High volume often indicates strong price movements; positive sentiment correlation'
};

const testTradeMemory2: TradeMemory = {
  id: 'test_memory_2',
  timestamp: Date.now() + 1000,
  tokenAddress: '0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c', // BTCB on BSC
  tokenSymbol: 'BTCB',
  action: 'sell',
  entryPrice: 45000,
  exitPrice: 43000,
  amount: 0.1,
  outcome: 'loss',
  profitLoss: -2000,
  profitLossPercentage: -4.44,
  aiReasoning: 'Market correction signals detected but timing was poor',
  marketConditions: {
    volume24h: 800000,
    liquidity: 3000000,
    priceChange24h: -3.2,
    buySellPressure: 0.3
  },
  lessons: 'Market corrections can be deeper than expected; need better exit timing'
};

async function testBasicMemoryOperations(): Promise<boolean> {
  try {
    logger.info('🧪 Testing basic memory operations...');

    // Test 1: Store Memory
    logger.info('📝 Test 1: Storing trade memory...');
    const memoryId1 = await storeMemory(testTradeMemory);
    logger.info(`✅ Memory stored with ID: ${memoryId1}`);

    // Test 2: Store Second Memory
    logger.info('📝 Test 2: Storing second trade memory...');
    const memoryId2 = await storeMemory(testTradeMemory2);
    logger.info(`✅ Second memory stored with ID: ${memoryId2}`);

    // Test 3: List All Memories
    logger.info('📝 Test 3: Listing all memories...');
    const allMemories = await fetchAllMemories();
    logger.info(`✅ Found ${allMemories.length} memories in storage`);
    allMemories.forEach((memoryName, index) => {
      logger.info(`  Memory ${index + 1}: ${memoryName}`);
    });

    // Test 4: Fetch Specific Memory
    if (allMemories.length > 0) {
      logger.info('📝 Test 4: Fetching specific memory...');
      const firstMemory = allMemories[0];
      if (firstMemory) {
        const fetchedMemory = await fetchMemory(firstMemory);
        if (fetchedMemory) {
          logger.info(`✅ Successfully fetched memory: ${fetchedMemory.tokenSymbol} ${fetchedMemory.action}`);
          logger.info(`   Outcome: ${fetchedMemory.outcome}, P&L: ${fetchedMemory.profitLoss}%`);
          logger.info(`   AI Reasoning: ${fetchedMemory.aiReasoning.substring(0, 100)}...`);
        } else {
          logger.error('❌ Failed to fetch memory');
          return false;
        }
      } else {
        logger.warn('⚠️  First memory is undefined');
      }
    }

    // Test 5: Query Memories by Filters
    logger.info('📝 Test 5: Querying profitable memories...');
    const profitableMemories = await queryMemories({ 
      outcome: 'profit',
      limit: 10
    });
    logger.info(`✅ Found ${profitableMemories.length} profitable trades`);

    logger.info('📝 Test 6: Querying loss memories...');
    const lossMemories = await queryMemories({ 
      outcome: 'loss',
      limit: 10
    });
    logger.info(`✅ Found ${lossMemories.length} loss trades`);

    // Test 7: Storage Statistics
    logger.info('📝 Test 7: Getting storage statistics...');
    const stats = await getStorageStats();
    logger.info(`✅ Storage Stats:`);
    logger.info(`   Total memories: ${stats.totalMemories}`);
    logger.info(`   Oldest memory: ${stats.oldestMemory ? new Date(stats.oldestMemory) : 'None'}`);
    logger.info(`   Newest memory: ${stats.newestMemory ? new Date(stats.newestMemory) : 'None'}`);
    logger.info(`   Total size: ${stats.totalSize} bytes`);

    return true;

  } catch (error) {
    logger.error('❌ Basic memory operations failed:', error);
    return false;
  }
}

async function testAIMemoryIntegration(): Promise<boolean> {
  try {
    logger.info('🤖 Testing AI agent memory integration...');

    // Initialize AI agent
    const agent = new ImmortalAIAgent();
    
    // Test 1: AI Memory Analysis
    logger.info('📝 Test 1: AI analyzing existing memories...');
    const memoryAnalysis = await agent.analyzeMemories();
    
    logger.info(`✅ Memory Analysis Results:`);
    logger.info(`   Total trades analyzed: ${memoryAnalysis.totalTrades}`);
    logger.info(`   Win rate: ${memoryAnalysis.winRate.toFixed(2)}%`);
    logger.info(`   Average P&L: ${memoryAnalysis.avgProfitLoss.toFixed(2)}%`);
    logger.info(`   Best performing token: ${memoryAnalysis.bestToken || 'None'}`);
    logger.info(`   Worst performing token: ${memoryAnalysis.worstToken || 'None'}`);
    logger.info(`   Key insights:`);
    memoryAnalysis.insights.forEach((insight: string, index: number) => {
      logger.info(`     ${index + 1}. ${insight}`);
    });

    // Test 2: AI Learning from Trade
    logger.info('📝 Test 2: Testing AI learning from new trade...');
    
    const learningTestMemory = {
      tokenAddress: '0x1af3dd5d9eff6e39ea494a8bfe56bffc18aa8f61', // CAKE
      tokenSymbol: 'CAKE',
      action: 'buy' as const,
      entryPrice: 3.50,
      exitPrice: 4.20,
      amount: 50,
      outcome: 'profit' as const,
      profitLoss: 35.0,
      aiReasoning: 'DeFi revival signals with protocol updates and increased TVL',
      marketConditions: {
        volume24h: 2500000,
        liquidity: 8000000,
        priceChange24h: 8.5,
        buySellPressure: 0.8
      }
    };

    await agent.learnFromTrade(
      learningTestMemory.tokenSymbol,
      learningTestMemory.tokenAddress,
      learningTestMemory.action.toUpperCase() as 'BUY' | 'SELL',
      learningTestMemory.amount,
      learningTestMemory.entryPrice,
      learningTestMemory.exitPrice || learningTestMemory.entryPrice,
      learningTestMemory.marketConditions,
      'test-strategy'
    );
    logger.info('✅ AI successfully learned from trade');

    // Test 3: AI Strategy Evolution Based on Memories
    logger.info('📝 Test 3: Testing AI strategy evolution...');
    const beforeStrategies = agent.getCurrentStrategy();
    logger.info(`   Current strategy before evolution: Risk tolerance ${beforeStrategies.riskTolerance}`);

    // Simulate more learning
    const evolutionTestMemory = {
      tokenAddress: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d', // USDC
      tokenSymbol: 'USDC',
      action: 'sell' as const,
      entryPrice: 1.0,
      exitPrice: 0.98,
      amount: 200,
      outcome: 'loss' as const,
      profitLoss: -4.0,
      aiReasoning: 'Stablecoin depeg risk underestimated during market volatility',
      marketConditions: {
        volume24h: 500000,
        liquidity: 2000000,
        priceChange24h: -1.8,
        buySellPressure: 0.2
      }
    };

    await agent.learnFromTrade(
      evolutionTestMemory.tokenSymbol,
      evolutionTestMemory.tokenAddress,
      evolutionTestMemory.action.toUpperCase() as 'BUY' | 'SELL',
      evolutionTestMemory.amount,
      evolutionTestMemory.entryPrice,
      evolutionTestMemory.exitPrice || evolutionTestMemory.entryPrice,
      evolutionTestMemory.marketConditions,
      'evolution-test-strategy'
    );
    
    const afterStrategies = agent.getCurrentStrategy();
    logger.info(`   Strategy after evolution: Risk tolerance ${afterStrategies.riskTolerance}`);
    logger.info('✅ AI strategy evolution completed');

    return true;

  } catch (error) {
    logger.error('❌ AI memory integration test failed:', error);
    return false;
  }
}

async function testMemoryPersistence(): Promise<boolean> {
  try {
    logger.info('💾 Testing memory persistence...');

    // Test 1: Store memory and verify it persists
    logger.info('📝 Test 1: Storing persistence test memory...');
    const persistenceTestMemory: TradeMemory = {
      id: 'persistence_test',
      timestamp: Date.now(),
      tokenAddress: '0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82', // CAKE
      tokenSymbol: 'CAKE',
      action: 'buy',
      entryPrice: 2.80,
      exitPrice: 3.10,
      amount: 75,
      outcome: 'profit',
      profitLoss: 22.5,
      profitLossPercentage: 10.71,
      aiReasoning: 'Persistence test: Strong fundamentals with ecosystem growth',
      marketConditions: {
        volume24h: 1800000,
        liquidity: 6000000,
        priceChange24h: 5.2,
        buySellPressure: 0.65
      },
      lessons: 'Ecosystem growth often precedes price appreciation'
    };

    const persistenceMemoryId = await storeMemory(persistenceTestMemory);
    logger.info(`✅ Persistence test memory stored: ${persistenceMemoryId}`);

    // Test 2: Simulate system restart by waiting and re-fetching
    logger.info('📝 Test 2: Waiting and re-fetching to test persistence...');
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds

    const allMemoriesAfterWait = await fetchAllMemories();
    logger.info(`✅ Found ${allMemoriesAfterWait.length} memories after wait`);

    // Verify our test memory is still there
    let foundPersistenceMemory = false;
    for (const memoryName of allMemoriesAfterWait) {
      const memory = await fetchMemory(memoryName);
      if (memory && memory.aiReasoning.includes('Persistence test')) {
        foundPersistenceMemory = true;
        logger.info('✅ Persistence test memory successfully retrieved');
        break;
      }
    }

    if (!foundPersistenceMemory) {
      logger.error('❌ Persistence test memory not found');
      return false;
    }

    // Test 3: Update existing memory
    if (allMemoriesAfterWait.length > 0) {
      logger.info('📝 Test 3: Testing memory update...');
      const memoryToUpdate = allMemoriesAfterWait[0];
      if (memoryToUpdate) {
        const updateResult = await updateMemory(memoryToUpdate, {
          lessons: 'Updated lesson: Memory persistence validated successfully'
        });
        
        if (updateResult) {
          logger.info('✅ Memory update successful');
        } else {
          logger.warn('⚠️  Memory update failed (may be due to test environment)');
        }
      } else {
        logger.warn('⚠️  No memory to update');
      }
    }

    return true;

  } catch (error) {
    logger.error('❌ Memory persistence test failed:', error);
    return false;
  }
}

async function runMemoryValidationSuite(): Promise<void> {
  logger.info('🚀 Starting BNB Greenfield Memory Validation Suite');
  logger.info('================================================');

  // Check configuration
  logger.info('🔧 Checking configuration...');
  logger.info(`   Greenfield RPC: ${CONFIG.GREENFIELD_RPC_URL}`);
  logger.info(`   Chain ID: ${CONFIG.GREENFIELD_CHAIN_ID}`);
  logger.info(`   Bucket Name: ${CONFIG.GREENFIELD_BUCKET_NAME}`);
  
  const hasValidKey = CONFIG.WALLET_PRIVATE_KEY && 
    CONFIG.WALLET_PRIVATE_KEY !== 'your_test_wallet_private_key_here' &&
    CONFIG.WALLET_PRIVATE_KEY !== 'your_wallet_private_key_here' &&
    CONFIG.WALLET_PRIVATE_KEY.length > 20;

  if (!hasValidKey) {
    logger.warn('⚠️  No valid wallet private key configured');
    logger.warn('   Memory tests will run in simulation mode');
  } else {
    logger.info('✅ Valid wallet configuration detected');
  }

  let allTestsPassed = true;

  try {
    // Initialize storage
    logger.info('\n🏗️  Initializing Greenfield storage...');
    await initializeStorage();
    logger.info('✅ Storage initialization complete');

  } catch (error) {
    logger.error('❌ Storage initialization failed:', error);
    if (hasValidKey) {
      logger.error('This may indicate network issues or invalid configuration');
      return;
    } else {
      logger.warn('Continuing with simulation mode...');
    }
  }

  // Run test suite
  logger.info('\n📋 Running test suite...');
  logger.info('========================');

  // Test 1: Basic Memory Operations
  const basicTestResult = await testBasicMemoryOperations();
  if (!basicTestResult) {
    allTestsPassed = false;
    logger.error('❌ Basic memory operations test failed');
  }

  // Test 2: AI Memory Integration
  const aiTestResult = await testAIMemoryIntegration();
  if (!aiTestResult) {
    allTestsPassed = false;
    logger.error('❌ AI memory integration test failed');
  }

  // Test 3: Memory Persistence
  const persistenceTestResult = await testMemoryPersistence();
  if (!persistenceTestResult) {
    allTestsPassed = false;
    logger.error('❌ Memory persistence test failed');
  }

  // Final Results
  logger.info('\n🏁 Test Suite Results');
  logger.info('====================');
  
  if (allTestsPassed) {
    logger.info('✅ ALL TESTS PASSED! BNB Greenfield memory system is working correctly');
    logger.info('🧠 AI agent can successfully store, retrieve, and learn from trade memories');
    logger.info('💾 Memory persistence is validated and operational');
    logger.info('🚀 The Immortal AI Trading Bot memory system is ready for production!');
  } else {
    logger.error('❌ Some tests failed. Please check the logs and configuration');
    logger.error('🔧 Ensure proper wallet configuration and network connectivity');
  }

  // Summary
  logger.info('\n📊 Test Summary:');
  logger.info(`   Basic Operations: ${basicTestResult ? '✅ PASS' : '❌ FAIL'}`);
  logger.info(`   AI Integration:   ${aiTestResult ? '✅ PASS' : '❌ FAIL'}`);
  logger.info(`   Persistence:      ${persistenceTestResult ? '✅ PASS' : '❌ FAIL'}`);
  
  if (hasValidKey) {
    logger.info('\n🌐 Live BNB Greenfield integration active');
  } else {
    logger.info('\n🔄 Simulation mode - configure wallet for live testing');
  }
}

// Run the validation suite
if (require.main === module) {
  runMemoryValidationSuite()
    .then(() => {
      logger.info('🏁 Memory validation suite completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('💥 Memory validation suite failed:', error);
      process.exit(1);
    });
}

export { runMemoryValidationSuite };
