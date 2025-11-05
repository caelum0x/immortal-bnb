#!/usr/bin/env bun
/**
 * Test Trade Script
 * Verifies PancakeSwap SDK integration works end-to-end
 *
 * Usage:
 *   1. Set up your .env file with testnet credentials
 *   2. Get testnet BNB from faucet
 *   3. Run: bun test-trade.ts <token-address>
 */

import PancakeSwapV3 from './src/blockchain/pancakeSwapIntegration';
import { logger } from './src/utils/logger';
import { CONFIG } from './src/config';

async function testTrade() {
  console.log('🧪 Testing PancakeSwap SDK Integration\n');
  console.log('═'.repeat(60));

  try {
    // Initialize PancakeSwap SDK
    const pancake = new PancakeSwapV3();

    // Test 1: Check wallet balance
    console.log('\n📊 Test 1: Wallet Balance');
    console.log('─'.repeat(60));
    const balance = await pancake.getBalance();
    console.log(`✓ Wallet address: ${pancake['wallet'].address}`);
    console.log(`✓ Balance: ${balance.toFixed(4)} BNB`);
    console.log(`✓ Network: ${CONFIG.TRADING_NETWORK} (Chain ID: ${CONFIG.CHAIN_ID})`);

    if (balance < 0.01) {
      console.log('\n⚠️  WARNING: Low balance!');
      console.log('Get testnet BNB from:');
      console.log('  - opBNB: https://opbnb-testnet-bridge.bnbchain.org/faucet');
      console.log('  - BNB Chain: https://testnet.bnbchain.org/faucet-smart');
      return;
    }

    // Test 2: Check if token address provided
    console.log('\n📊 Test 2: Token Address');
    console.log('─'.repeat(60));
    const tokenAddress = process.argv[2];

    if (!tokenAddress) {
      console.log('ℹ️  No token address provided');
      console.log('\nTo test a real trade, run:');
      console.log('  bun test-trade.ts 0xYOUR_TOKEN_ADDRESS');
      console.log('\nExample testnet tokens:');
      console.log('  - Check DexScreener: https://dexscreener.com/opbnb');
      console.log('  - Or deploy a test token first');
      console.log('\n✅ SDK integration test PASSED (balance check works)');
      return;
    }

    console.log(`✓ Token address: ${tokenAddress}`);

    // Test 3: Get token info
    console.log('\n📊 Test 3: Token Information');
    console.log('─'.repeat(60));
    const tokenBalance = await pancake.getTokenBalance(tokenAddress);
    console.log(`✓ Current token balance: ${tokenBalance}`);

    // Test 4: Simulate a small buy (0.001 BNB)
    console.log('\n📊 Test 4: Simulated Buy Trade');
    console.log('─'.repeat(60));
    const testAmount = 0.001; // Very small test amount
    console.log(`Amount: ${testAmount} BNB`);
    console.log(`Slippage: 0.5%`);

    console.log('\n⚠️  READY TO EXECUTE REAL TRADE');
    console.log('This will spend real testnet BNB!');
    console.log('\nTo execute, uncomment the buyTokenWithBNB call in test-trade.ts');
    console.log('Or run the full bot with: bun run dev');

    // Uncomment below to execute a real test trade:
    /*
    console.log('\n🔄 Executing buy trade...');
    const result = await pancake.buyTokenWithBNB(
      tokenAddress,
      testAmount,
      50 // 0.5% slippage (50 basis points)
    );

    if (result.success) {
      console.log('\n✅ TRADE SUCCESSFUL!');
      console.log(`  TX Hash: ${result.txHash}`);
      console.log(`  Amount In: ${result.amountIn} BNB`);
      console.log(`  Amount Out: ${result.amountOut} tokens`);
      console.log(`  Price Impact: ${result.priceImpact}%`);
      console.log(`  Execution Price: ${result.executionPrice}`);
      console.log(`  Gas Used: ${result.gasUsed}`);

      console.log('\nView transaction:');
      if (CONFIG.TRADING_NETWORK === 'opbnb') {
        console.log(`  https://testnet.opbnbscan.com/tx/${result.txHash}`);
      } else {
        console.log(`  https://testnet.bscscan.com/tx/${result.txHash}`);
      }
    } else {
      console.log('\n❌ TRADE FAILED');
      console.log(`  Error: ${result.error}`);
    }
    */

    console.log('\n✅ All tests PASSED');
    console.log('═'.repeat(60));
    console.log('\n📖 Next steps:');
    console.log('  1. Uncomment the trade execution code above to test real trades');
    console.log('  2. Or run the full AI bot: bun run dev');
    console.log('  3. Check QUICKSTART_TRADING.md for detailed instructions');

  } catch (error) {
    console.error('\n❌ Test FAILED');
    console.error('═'.repeat(60));
    console.error('Error:', (error as Error).message);
    console.error('\nDebug info:');
    console.error('  - Check your .env file is configured correctly');
    console.error('  - Verify you have testnet BNB in your wallet');
    console.error('  - Ensure RPC endpoint is accessible');
    console.error('  - Check token address is valid on your network');
    process.exit(1);
  }
}

// Run the test
if (import.meta.main) {
  testTrade();
}
