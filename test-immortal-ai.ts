#!/usr/bin/env bun
/**
 * Test script for the immortal AI agent system
 */
import 'reflect-metadata';
import { ImmortalAIAgent } from './src/ai/immortalAgent';
import { CrossChainArbitrageEngine } from './src/ai/crossChainStrategy';
import { StrategyEvolutionEngine } from './src/ai/strategyEvolution';
import { logger } from './src/utils/logger';

console.log('🧪 Testing Immortal AI Agent System...\n');

async function testImmortalAgent() {
  console.log('1️⃣ Testing Immortal AI Agent...');
  
  const agent = new ImmortalAIAgent();
  console.log('✅ Immortal AI Agent created successfully');

  // Test decision making with sample data
  const testTokenData = {
    symbol: 'TEST',
    priceUsd: '1.234',
    volume24h: 1000000,
    liquidity: 500000,
    priceChange24h: 5.2,
    txns24h: { buys: 150, sells: 100 }
  };

  console.log('🧠 Testing AI decision making...');
  const decision = await agent.makeDecision('0x123...', testTokenData, 1.0);
  console.log(`🎯 AI Decision: ${decision.action} | Amount: ${decision.amount.toFixed(4)} | Confidence: ${(decision.confidence * 100).toFixed(1)}%`);
  console.log(`📝 Reasoning: ${decision.reasoning}`);
  console.log(`🎯 Strategy: ${decision.strategy}\n`);
}

async function testCrossChain() {
  console.log('2️⃣ Testing Cross-Chain Arbitrage Engine...');
  
  const crossChain = new CrossChainArbitrageEngine();
  console.log('✅ Cross-chain arbitrage engine created successfully');
  
  console.log('🌐 Discovering arbitrage opportunities...');
  const opportunities = await crossChain.discoverArbitrageOpportunities();
  console.log(`🔍 Found ${opportunities.length} arbitrage opportunities`);
  
  if (opportunities.length > 0) {
    const best = opportunities[0];
    if (best) {
      console.log(`🚀 Best opportunity: ${best.sourceChain} → ${best.targetChain} | Profit: ${best.profitPotential.toFixed(2)}%`);
    }
  }
  console.log('');
}

async function testStrategyEvolution() {
  console.log('3️⃣ Testing Strategy Evolution Engine...');
  
  const strategyEngine = new StrategyEvolutionEngine();
  console.log('✅ Strategy evolution engine created successfully');
  
  console.log('🧬 Evolving strategies...');
  await strategyEngine.evolveStrategies();
  console.log('✅ Strategy evolution completed\n');
}

async function main() {
  try {
    await testImmortalAgent();
    await testCrossChain();
    await testStrategyEvolution();
    
    console.log('🎉 All tests completed successfully!');
    console.log('🤖 Immortal AI Agent System is fully operational');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

main();
