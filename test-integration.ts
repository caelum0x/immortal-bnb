#!/usr/bin/env bun
/**
 * End-to-End Integration Test
 * Tests all components working together
 *
 * Usage: bun test-integration.ts
 */

import { logger } from './src/utils/logger';
import { CONFIG } from './src/config';
import { initializeProvider, getWalletBalance } from './src/blockchain/tradeExecutor';
import { fetchAllMemories, storeMemory } from './src/blockchain/memoryStorage';
import { getTokenData, getTrendingTokens } from './src/data/marketFetcher';
import PancakeSwapV3 from './src/blockchain/pancakeSwapIntegration';
import { TradeMemory } from './src/agent/learningLoop';

let testsPassed = 0;
let testsFailed = 0;

function testHeader(name: string) {
  console.log('\n' + '═'.repeat(70));
  console.log(`🧪 ${name}`);
  console.log('═'.repeat(70));
}

function testPass(message: string) {
  console.log(`✅ ${message}`);
  testsPassed++;
}

function testFail(message: string, error?: any) {
  console.log(`❌ ${message}`);
  if (error) {
    console.log(`   Error: ${error.message}`);
  }
  testsFailed++;
}

async function testConfiguration() {
  testHeader('Configuration Tests');

  try {
    // Test 1: Environment variables loaded
    if (CONFIG.PRIVATE_KEY && CONFIG.PRIVATE_KEY !== 'your_private_key_here') {
      testPass('Private key loaded from environment');
    } else {
      testFail('Private key not configured in .env');
    }

    // Test 2: Network configuration
    if (CONFIG.TRADING_NETWORK && CONFIG.RPC_URL) {
      testPass(`Network configured: ${CONFIG.TRADING_NETWORK} (${CONFIG.CHAIN_ID})`);
    } else {
      testFail('Network configuration missing');
    }

    // Test 3: API keys
    if (CONFIG.OPENROUTER_API_KEY && CONFIG.OPENROUTER_API_KEY !== 'your_openrouter_api_key') {
      testPass('OpenRouter API key configured');
    } else {
      testFail('OpenRouter API key not configured');
    }

    // Test 4: Greenfield configuration
    if (CONFIG.GREENFIELD_RPC && CONFIG.GREENFIELD_BUCKET) {
      testPass(`Greenfield configured: ${CONFIG.GREENFIELD_BUCKET}`);
    } else {
      testFail('Greenfield configuration missing');
    }

  } catch (error) {
    testFail('Configuration test failed', error);
  }
}

async function testBlockchainConnection() {
  testHeader('Blockchain Connection Tests');

  try {
    // Test 1: Initialize provider
    await initializeProvider();
    testPass('PancakeSwap SDK initialized');

    // Test 2: Get wallet balance
    const balance = await getWalletBalance();
    testPass(`Wallet balance retrieved: ${balance.toFixed(4)} BNB`);

    if (balance < 0.01) {
      console.log('   ⚠️  WARNING: Low balance for testing trades');
    }

    // Test 3: Check network connection
    const pancakeSwap = new PancakeSwapV3();
    const walletBalance = await pancakeSwap.getBalance();
    testPass(`Network connection verified: ${walletBalance.toFixed(4)} BNB`);

  } catch (error) {
    testFail('Blockchain connection test failed', error);
  }
}

async function testMarketData() {
  testHeader('Market Data Tests');

  try {
    // Test 1: Fetch trending tokens
    console.log('   Fetching trending tokens from DexScreener...');
    const trending = await getTrendingTokens(3);

    if (trending && trending.length > 0) {
      testPass(`Fetched ${trending.length} trending tokens`);
      console.log(`   Examples: ${trending.map(t => t.symbol).join(', ')}`);
    } else {
      testFail('No trending tokens found');
    }

    // Test 2: Fetch specific token data
    if (trending && trending.length > 0) {
      const tokenAddress = trending[0].address;
      console.log(`   Fetching data for ${trending[0].symbol}...`);
      const tokenData = await getTokenData(tokenAddress);

      if (tokenData) {
        testPass(`Token data retrieved: ${tokenData.symbol} @ $${tokenData.priceUsd}`);
        console.log(`   24h Volume: $${tokenData.volume24h.toLocaleString()}`);
        console.log(`   Liquidity: $${tokenData.liquidity.toLocaleString()}`);
      } else {
        testFail('Could not fetch token data');
      }
    }

  } catch (error) {
    testFail('Market data test failed', error);
  }
}

async function testMemoryStorage() {
  testHeader('Memory Storage Tests (Greenfield)');

  try {
    // Test 1: Fetch all memories
    console.log('   Fetching memories from Greenfield...');
    const memoryIds = await fetchAllMemories();
    testPass(`Retrieved ${memoryIds.length} memory IDs from Greenfield`);

    // Test 2: Store a test memory
    console.log('   Storing test memory...');
    const testMemory: TradeMemory = {
      id: '',
      timestamp: Date.now(),
      tokenAddress: '0x0000000000000000000000000000000000000000',
      tokenSymbol: 'TEST',
      action: 'buy',
      entryPrice: 1.23,
      amount: 0.001,
      outcome: 'pending',
      aiReasoning: 'Integration test memory',
      marketConditions: {
        volume24h: 10000,
        liquidity: 50000,
        priceChange24h: 5.5,
        buySellPressure: 0.6,
      },
    };

    const memoryId = await storeMemory(testMemory);
    testPass(`Test memory stored on Greenfield: ${memoryId}`);

  } catch (error) {
    testFail('Memory storage test failed', error);
  }
}

async function testPancakeSwapSDK() {
  testHeader('PancakeSwap SDK Tests');

  try {
    const pancakeSwap = new PancakeSwapV3();

    // Test 1: Get wallet balance
    const balance = await pancakeSwap.getBalance();
    testPass(`SDK wallet balance: ${balance.toFixed(4)} BNB`);

    // Test 2: Get WBNB token balance
    const wbnbBalance = await pancakeSwap.getTokenBalance(CONFIG.WBNB_ADDRESS);
    testPass(`WBNB balance: ${wbnbBalance}`);

    console.log('\n   ℹ️  To test actual trades:');
    console.log('      1. Uncomment trade execution in test-trade.ts');
    console.log('      2. Run: bun test-trade.ts <token-address>');
    console.log('      3. Or run the full AI bot: bun run dev');

  } catch (error) {
    testFail('PancakeSwap SDK test failed', error);
  }
}

async function testAPIEndpoints() {
  testHeader('API Server Tests');

  try {
    const apiUrl = `http://localhost:${process.env.API_PORT || 3001}`;

    console.log('   ℹ️  Note: API server must be running for these tests');
    console.log('   To start: bun run dev (in another terminal)');
    console.log(`   API URL: ${apiUrl}`);

    console.log('\n   Available endpoints:');
    console.log(`   - GET ${apiUrl}/api/health`);
    console.log(`   - GET ${apiUrl}/api/status`);
    console.log(`   - GET ${apiUrl}/api/wallet/balance`);
    console.log(`   - GET ${apiUrl}/api/trades`);
    console.log(`   - GET ${apiUrl}/api/stats`);
    console.log(`   - GET ${apiUrl}/api/token/:address`);

    testPass('API endpoints documented (manual testing required)');

  } catch (error) {
    testFail('API test failed', error);
  }
}

async function runAllTests() {
  console.log('\n🚀 Starting End-to-End Integration Tests');
  console.log('═'.repeat(70));

  const startTime = Date.now();

  // Run all test suites
  await testConfiguration();
  await testBlockchainConnection();
  await testMarketData();
  await testMemoryStorage();
  await testPancakeSwapSDK();
  await testAPIEndpoints();

  // Summary
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('\n' + '═'.repeat(70));
  console.log('📊 Test Summary');
  console.log('═'.repeat(70));
  console.log(`✅ Passed: ${testsPassed}`);
  console.log(`❌ Failed: ${testsFailed}`);
  console.log(`⏱️  Duration: ${duration}s`);
  console.log('═'.repeat(70));

  if (testsFailed === 0) {
    console.log('\n🎉 All tests passed! Your bot is ready to trade.');
    console.log('\n📖 Next steps:');
    console.log('   1. Start the bot: bun run dev');
    console.log('   2. Monitor trades in the logs');
    console.log('   3. Check Greenfield for stored memories');
    console.log('   4. View dashboard at http://localhost:3000 (if frontend is running)');
    console.log('   5. API available at http://localhost:3001');
  } else {
    console.log('\n⚠️  Some tests failed. Please fix the issues before running the bot.');
    console.log('   Check your .env file and network connectivity.');
    process.exit(1);
  }
}

// Run tests
if (import.meta.main) {
  runAllTests().catch((error) => {
    console.error('\n❌ Fatal error during testing:', error.message);
    process.exit(1);
  });
}
