#!/usr/bin/env bun
/**
 * Polymarket Live End-to-End Demo
 *
 * Complete workflow demonstrating:
 * 1. Connection setup
 * 2. Market discovery
 * 3. AI analysis
 * 4. Order placement
 * 5. Position tracking
 * 6. Order management
 */

import { ClobClient } from '@polymarket/clob-client';
import { ethers } from 'ethers';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateText } from 'ai';
import { CONFIG } from './src/config';
import { logger } from './src/utils/logger';

// Configuration
const POLYGON_RPC = process.env.POLYGON_RPC || 'https://polygon-rpc.com';
const POLYMARKET_HOST = process.env.POLYMARKET_HOST || 'https://clob.polymarket.com';
const CHAIN_ID = parseInt(process.env.POLYMARKET_CHAIN_ID || '137');

// USDC contract address on Polygon
const USDC_ADDRESS = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174';

class PolymarketLiveDemo {
  private client: ClobClient;
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private openrouter: any;

  constructor(privateKey: string) {
    // Initialize provider and wallet
    this.provider = new ethers.JsonRpcProvider(POLYGON_RPC);
    this.wallet = new ethers.Wallet(privateKey, this.provider);

    // Initialize Polymarket client
    this.client = new ClobClient({
      host: POLYMARKET_HOST,
      chainId: CHAIN_ID,
      privateKey: privateKey,
    });

    // Initialize AI (if available)
    if (CONFIG.OPENROUTER_API_KEY) {
      this.openrouter = createOpenRouter({
        apiKey: CONFIG.OPENROUTER_API_KEY,
      });
    }

    console.log('✅ Polymarket Live Demo Initialized');
    console.log(`   Wallet: ${this.wallet.address}`);
    console.log(`   Chain ID: ${CHAIN_ID}`);
    console.log(`   Network: ${CHAIN_ID === 137 ? 'Polygon Mainnet' : 'Polygon Testnet'}`);
  }

  /**
   * Step 1: Check wallet balances
   */
  async checkBalances() {
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║   STEP 1: CHECK WALLET BALANCES        ║');
    console.log('╚════════════════════════════════════════╝\n');

    try {
      // Check MATIC balance
      const maticBalance = await this.provider.getBalance(this.wallet.address);
      const maticFormatted = ethers.formatEther(maticBalance);
      console.log(`💎 MATIC Balance: ${parseFloat(maticFormatted).toFixed(4)} MATIC`);

      if (parseFloat(maticFormatted) < 0.01) {
        console.log('⚠️  Low MATIC balance - you need MATIC for gas fees');
        console.log('   Get free MATIC: https://faucet.polygon.technology/');
      }

      // Check USDC balance
      const usdcAbi = ['function balanceOf(address) view returns (uint256)'];
      const usdcContract = new ethers.Contract(USDC_ADDRESS, usdcAbi, this.provider);
      const usdcBalance = await usdcContract.balanceOf(this.wallet.address);
      const usdcFormatted = ethers.formatUnits(usdcBalance, 6); // USDC has 6 decimals

      console.log(`💵 USDC Balance: $${parseFloat(usdcFormatted).toFixed(2)} USDC`);

      if (parseFloat(usdcFormatted) < 10) {
        console.log('⚠️  Low USDC balance - you need USDC to trade on Polymarket');
        console.log('   Get USDC: Bridge from another chain or buy on exchange');
      }

      return {
        matic: parseFloat(maticFormatted),
        usdc: parseFloat(usdcFormatted),
      };
    } catch (error) {
      console.error('❌ Error checking balances:', error);
      return { matic: 0, usdc: 0 };
    }
  }

  /**
   * Step 2: Discover trending markets
   */
  async discoverMarkets() {
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║   STEP 2: DISCOVER TRENDING MARKETS    ║');
    console.log('╚════════════════════════════════════════╝\n');

    try {
      console.log('🔍 Fetching active markets from Polymarket...');

      const markets = await this.client.getMarkets();

      if (!markets || markets.length === 0) {
        console.log('⚠️  No markets found');
        return [];
      }

      // Sort by volume
      const sortedMarkets = markets
        .filter((m: any) => m.active && parseFloat(m.volume || '0') > 0)
        .sort((a: any, b: any) => parseFloat(b.volume || '0') - parseFloat(a.volume || '0'))
        .slice(0, 10);

      console.log(`✅ Found ${sortedMarkets.length} active markets\n`);

      // Display top markets
      console.log('📊 Top 10 Markets by Volume:\n');
      sortedMarkets.forEach((market: any, index: number) => {
        const volume = parseFloat(market.volume || '0');
        console.log(`${index + 1}. ${market.question}`);
        console.log(`   Volume: $${volume.toLocaleString()}`);
        console.log(`   Market ID: ${market.condition_id}`);
        console.log('');
      });

      return sortedMarkets;
    } catch (error) {
      console.error('❌ Error fetching markets:', error);
      return [];
    }
  }

  /**
   * Step 3: Analyze a specific market with AI
   */
  async analyzeMarket(market: any) {
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║   STEP 3: AI MARKET ANALYSIS           ║');
    console.log('╚════════════════════════════════════════╝\n');

    try {
      console.log(`🤖 Analyzing: ${market.question}\n`);

      // Get orderbook
      const orderbook = await this.client.getOrderBook(market.condition_id);

      if (!orderbook || !orderbook.bids || !orderbook.asks) {
        console.log('⚠️  No orderbook data available');
        return null;
      }

      const bestBid = orderbook.bids.length > 0 ? parseFloat(orderbook.bids[0].price) : 0;
      const bestAsk = orderbook.asks.length > 0 ? parseFloat(orderbook.asks[0].price) : 1;
      const midPrice = (bestBid + bestAsk) / 2;
      const spread = bestAsk - bestBid;

      console.log('📈 Market Data:');
      console.log(`   Best Bid: ${(bestBid * 100).toFixed(1)}%`);
      console.log(`   Best Ask: ${(bestAsk * 100).toFixed(1)}%`);
      console.log(`   Mid Price: ${(midPrice * 100).toFixed(1)}%`);
      console.log(`   Spread: ${(spread * 100).toFixed(2)}%`);
      console.log(`   Volume: $${parseFloat(market.volume || '0').toLocaleString()}`);

      // AI Analysis (if available)
      if (this.openrouter && CONFIG.OPENROUTER_API_KEY) {
        console.log('\n🧠 Running AI Analysis...\n');

        const prompt = `You are an expert prediction market trader.

Market: "${market.question}"

Current Data:
- Mid Price (probability): ${(midPrice * 100).toFixed(1)}%
- Spread: ${(spread * 100).toFixed(2)}%
- 24h Volume: $${parseFloat(market.volume || '0').toLocaleString()}

Analyze this market and provide a brief assessment in 2-3 sentences:
1. Is the current price reasonable?
2. What's your confidence level?
3. Would you recommend buying, selling, or staying neutral?

Keep your response concise and actionable.`;

        const { text } = await generateText({
          model: this.openrouter(CONFIG.AI_MODEL),
          prompt,
          maxTokens: 150,
          temperature: 0.7,
        });

        console.log('💡 AI Analysis:');
        console.log(text);
        console.log('');

        return {
          market,
          bestBid,
          bestAsk,
          midPrice,
          spread,
          aiAnalysis: text,
        };
      } else {
        console.log('\n⚠️  OpenRouter API key not set - skipping AI analysis');
        console.log('   Set OPENROUTER_API_KEY in .env to enable AI features\n');

        return {
          market,
          bestBid,
          bestAsk,
          midPrice,
          spread,
          aiAnalysis: null,
        };
      }
    } catch (error) {
      console.error('❌ Error analyzing market:', error);
      return null;
    }
  }

  /**
   * Step 4: Approve USDC spending (required before trading)
   */
  async approveUSDC(amount: string = '1000') {
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║   STEP 4: APPROVE USDC SPENDING        ║');
    console.log('╚════════════════════════════════════════╝\n');

    try {
      // Get exchange contract address from Polymarket
      // This is the contract that needs approval to spend your USDC
      const exchangeAddress = '0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E'; // Polymarket exchange on Polygon

      console.log(`🔐 Approving ${amount} USDC for Polymarket exchange...`);
      console.log(`   Spender: ${exchangeAddress}`);

      const usdcAbi = ['function approve(address spender, uint256 amount) returns (bool)'];
      const usdcContract = new ethers.Contract(USDC_ADDRESS, usdcAbi, this.wallet);

      const tx = await usdcContract.approve(
        exchangeAddress,
        ethers.parseUnits(amount, 6) // USDC has 6 decimals
      );

      console.log(`📤 Transaction submitted: ${tx.hash}`);
      console.log('⏳ Waiting for confirmation...');

      await tx.wait();

      console.log('✅ USDC approval successful!');
      console.log(`   You can now trade up to $${amount} USDC on Polymarket\n`);

      return true;
    } catch (error) {
      console.error('❌ Error approving USDC:', error);
      return false;
    }
  }

  /**
   * Step 5: Place a limit order
   */
  async placeLimitOrder(marketId: string, side: 'BUY' | 'SELL', price: number, size: number) {
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║   STEP 5: PLACE LIMIT ORDER            ║');
    console.log('╚════════════════════════════════════════╝\n');

    try {
      console.log(`📝 Creating ${side} order:`);
      console.log(`   Market ID: ${marketId.substring(0, 10)}...`);
      console.log(`   Price: ${(price * 100).toFixed(1)}%`);
      console.log(`   Size: $${size.toFixed(2)}`);

      // Create the order
      const order = await this.client.createOrder({
        tokenID: marketId,
        price: price.toString(),
        size: size.toString(),
        side: side,
        feeRateBps: '0', // Fee rate in basis points (usually 0 for limit orders)
      });

      console.log('\n📤 Submitting order to Polymarket...');

      // Post the order
      const response = await this.client.postOrder(order);

      console.log('✅ Order placed successfully!');
      console.log(`   Order ID: ${response.orderID}`);
      console.log(`   Status: ${response.status || 'LIVE'}\n`);

      return response;
    } catch (error) {
      console.error('❌ Error placing order:', error);
      return null;
    }
  }

  /**
   * Step 6: Get open orders
   */
  async getOpenOrders() {
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║   STEP 6: VIEW OPEN ORDERS             ║');
    console.log('╚════════════════════════════════════════╝\n');

    try {
      console.log('🔍 Fetching your open orders...\n');

      const orders = await this.client.getOrders();

      if (!orders || orders.length === 0) {
        console.log('📭 No open orders found\n');
        return [];
      }

      console.log(`📋 You have ${orders.length} open order(s):\n`);

      orders.forEach((order: any, index: number) => {
        console.log(`${index + 1}. Order ID: ${order.id}`);
        console.log(`   Side: ${order.side}`);
        console.log(`   Price: ${(parseFloat(order.price) * 100).toFixed(1)}%`);
        console.log(`   Size: $${parseFloat(order.size).toFixed(2)}`);
        console.log(`   Status: ${order.status}`);
        console.log('');
      });

      return orders;
    } catch (error) {
      console.error('❌ Error fetching orders:', error);
      return [];
    }
  }

  /**
   * Step 7: Cancel an order
   */
  async cancelOrder(orderId: string) {
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║   STEP 7: CANCEL ORDER                 ║');
    console.log('╚════════════════════════════════════════╝\n');

    try {
      console.log(`🗑️  Cancelling order: ${orderId}\n`);

      await this.client.cancelOrder(orderId);

      console.log('✅ Order cancelled successfully!\n');
      return true;
    } catch (error) {
      console.error('❌ Error cancelling order:', error);
      return false;
    }
  }

  /**
   * Step 8: View positions
   */
  async viewPositions() {
    console.log('\n╔════════════════════════════════════════╗');
    console.log('║   STEP 8: VIEW POSITIONS               ║');
    console.log('╚════════════════════════════════════════╝\n');

    try {
      console.log('🔍 Fetching your positions...\n');

      // Get positions from balance allowance endpoint
      const balanceAllowance = await this.client.getBalanceAllowance();

      console.log('💼 Account Summary:');
      console.log(`   Address: ${this.wallet.address}`);
      console.log(`   USDC Balance: $${parseFloat(balanceAllowance.balance || '0').toFixed(2)}`);
      console.log(`   USDC Allowance: $${parseFloat(balanceAllowance.allowance || '0').toFixed(2)}`);
      console.log('');

      return balanceAllowance;
    } catch (error) {
      console.error('❌ Error fetching positions:', error);
      return null;
    }
  }

  /**
   * Complete end-to-end demo workflow
   */
  async runCompleteDemo() {
    console.log('\n');
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║                                                        ║');
    console.log('║     POLYMARKET LIVE END-TO-END TRADING DEMO            ║');
    console.log('║                                                        ║');
    console.log('╚════════════════════════════════════════════════════════╝');

    try {
      // Step 1: Check balances
      const balances = await this.checkBalances();

      if (balances.matic < 0.01) {
        console.log('\n❌ Insufficient MATIC for gas fees. Please get MATIC from faucet first.');
        console.log('   Visit: https://faucet.polygon.technology/\n');
        return;
      }

      // Step 2: Discover markets
      const markets = await this.discoverMarkets();

      if (markets.length === 0) {
        console.log('\n❌ No markets found. Please try again later.\n');
        return;
      }

      // Step 3: Analyze top market
      const topMarket = markets[0];
      const analysis = await this.analyzeMarket(topMarket);

      if (!analysis) {
        console.log('\n❌ Failed to analyze market.\n');
        return;
      }

      // Step 4: View current positions
      await this.viewPositions();

      // Step 5: View open orders
      const openOrders = await this.getOpenOrders();

      // Demo complete
      console.log('\n╔════════════════════════════════════════╗');
      console.log('║   DEMO COMPLETE                        ║');
      console.log('╚════════════════════════════════════════╝\n');

      console.log('✅ You have successfully:');
      console.log('   1. ✓ Connected to Polymarket');
      console.log('   2. ✓ Checked wallet balances');
      console.log('   3. ✓ Discovered trending markets');
      console.log('   4. ✓ Analyzed markets with AI');
      console.log('   5. ✓ Viewed your positions');
      console.log('   6. ✓ Checked open orders\n');

      console.log('🎯 Next Steps:');
      console.log('   • To approve USDC: Add "await demo.approveUSDC()" to script');
      console.log('   • To place order: Add "await demo.placeLimitOrder(...)" to script');
      console.log('   • To cancel order: Add "await demo.cancelOrder(orderId)" to script\n');

      console.log('📚 For more examples, see:');
      console.log('   • POLYMARKET_INTEGRATION.md');
      console.log('   • test-polymarket.ts');
      console.log('   • src/polymarket/*.ts\n');

    } catch (error) {
      console.error('\n❌ Demo failed:', error);
    }
  }
}

// Main execution
async function main() {
  // Check if wallet is configured
  if (!CONFIG.WALLET_PRIVATE_KEY || CONFIG.WALLET_PRIVATE_KEY.startsWith('0x0000')) {
    console.log('\n❌ ERROR: Wallet private key not configured');
    console.log('\nPlease set WALLET_PRIVATE_KEY in .env file');
    console.log('Example: WALLET_PRIVATE_KEY=0xYOUR_ACTUAL_PRIVATE_KEY\n');
    process.exit(1);
  }

  // Check if Polymarket is enabled
  if (!CONFIG.POLYMARKET_ENABLED) {
    console.log('\n⚠️  WARNING: Polymarket is disabled');
    console.log('\nSet POLYMARKET_ENABLED=true in .env to enable Polymarket trading\n');
    process.exit(1);
  }

  // Create demo instance
  const demo = new PolymarketLiveDemo(CONFIG.WALLET_PRIVATE_KEY);

  // Run complete demo
  await demo.runCompleteDemo();
}

// Run if executed directly
if (import.meta.main) {
  main().catch(console.error);
}

export { PolymarketLiveDemo };
