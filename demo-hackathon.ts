#!/usr/bin/env bun
/**
 * IMMORTAL AI TRADING BOT - HACKATHON DEMO SCRIPT
 * 
 * This demo showcases the key features of our immortal AI trading bot:
 * 🤖 AI-driven decision making with personality evolution
 * 🧠 Immortal memory on BNB Greenfield for continuous learning
 * 🌐 Cross-chain arbitrage detection across multiple networks
 * 🧬 Strategy evolution using genetic algorithms
 * 📊 Real-time market data integration
 */
import 'reflect-metadata';
import { ImmortalAIAgent } from './src/ai/immortalAgent';
import { CrossChainArbitrageEngine } from './src/ai/crossChainStrategy';
import { StrategyEvolutionEngine } from './src/ai/strategyEvolution';
import { getTokenData } from './src/data/marketFetcher';

const DEMO_TOKENS = [
  { address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', name: 'WBNB' },
  { address: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8', name: 'ETH' },
  { address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', name: 'USDC' },
];

function printBanner() {
  console.log('\n' + '='.repeat(80));
  console.log('🤖 IMMORTAL AI TRADING BOT - BNB HACKATHON DEMO 🧬');
  console.log('   Autonomous • Evolving • Cross-Chain • Immortal Memory');
  console.log('='.repeat(80) + '\n');
}

function printSection(title: string) {
  console.log('\n' + '─'.repeat(60));
  console.log(`📍 ${title}`);
  console.log('─'.repeat(60));
}

async function demoMarketDataIntegration() {
  printSection('REAL MARKET DATA INTEGRATION');
  
  console.log('🌍 Fetching live market data from DexScreener API...\n');
  
  for (const token of DEMO_TOKENS) {
    try {
      const data = await getTokenData(token.address);
      if (data) {
        console.log(`📊 ${token.name} (${token.address.substring(0, 8)}...)`);
        console.log(`   💰 Price: $${parseFloat(data.priceUsd).toLocaleString()}`);
        console.log(`   📈 24h Change: ${data.priceChange24h > 0 ? '+' : ''}${data.priceChange24h.toFixed(2)}%`);
        console.log(`   💧 Volume: $${data.volume24h.toLocaleString()}`);
        console.log(`   🏊 Liquidity: $${data.liquidity.toLocaleString()}\n`);
      }
    } catch (error) {
      console.log(`⚠️  ${token.name}: Data unavailable\n`);
    }
    
    // Small delay for demo effect
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

async function demoImmortalAI() {
  printSection('IMMORTAL AI AGENT - AUTONOMOUS DECISION MAKING');
  
  console.log('🤖 Initializing Immortal AI Agent with evolving personality...\n');
  
  const agent = new ImmortalAIAgent();
  
  // Show AI personality
  const personality = agent.getPersonality();
  console.log('🧠 AI Agent Personality Profile:');
  console.log(`   🎯 Risk Tolerance: ${(personality.riskTolerance * 100).toFixed(1)}% (${personality.riskTolerance > 0.6 ? 'Aggressive' : personality.riskTolerance > 0.3 ? 'Moderate' : 'Conservative'})`);
  console.log(`   ⚡ Aggressiveness: ${(personality.aggressiveness * 100).toFixed(1)}%`);
  console.log(`   🧠 Learning Rate: ${(personality.learningRate * 100).toFixed(1)}%`);
  console.log(`   💭 Memory Weight: ${(personality.memoryWeight * 100).toFixed(1)}%`);
  console.log(`   🔬 Exploration Rate: ${(personality.explorationRate * 100).toFixed(1)}%`);
  console.log(`   ✅ Confidence Threshold: ${(personality.confidenceThreshold * 100).toFixed(1)}%\n`);
  
  // Demo AI decision making for a popular token
  console.log('💡 Making AI trading decisions for live tokens...\n');
  
  for (const token of DEMO_TOKENS.slice(0, 2)) { // Test first 2 tokens
    try {
      const tokenData = await getTokenData(token.address);
      if (tokenData) {
        console.log(`🔮 Analyzing ${token.name}...`);
        
        const decision = await agent.makeDecision(token.address, tokenData, 1.0);
        
        const actionEmoji = decision.action === 'BUY' ? '🟢' : decision.action === 'SELL' ? '🔴' : '🟡';
        const confidenceColor = decision.confidence > 0.7 ? '🟢' : decision.confidence > 0.4 ? '🟡' : '🔴';
        
        console.log(`   ${actionEmoji} Decision: ${decision.action}`);
        console.log(`   💰 Amount: ${decision.amount.toFixed(4)} BNB`);
        console.log(`   ${confidenceColor} Confidence: ${(decision.confidence * 100).toFixed(1)}%`);
        console.log(`   🎯 Strategy: ${decision.strategy}`);
        console.log(`   📝 Reasoning: ${decision.reasoning.substring(0, 120)}...\n`);
      }
    } catch (error) {
      console.log(`   ⚠️  Analysis failed for ${token.name}\n`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Show memory stats
  const memoryStats = agent.getMemoryStats();
  console.log('🧠 Immortal Memory System:');
  console.log(`   📚 Total Memories: ${memoryStats.totalMemories}`);
  console.log(`   🎯 Success Rate: ${(memoryStats.successRate * 100).toFixed(1)}%`);
  console.log(`   📊 Total Trades: ${memoryStats.totalTrades}`);
  console.log(`   💹 Average Return: ${memoryStats.avgReturn.toFixed(2)}%`);
  console.log(`   🏆 Top Strategies: ${memoryStats.topStrategies.length} active\n`);
}

async function demoCrossChainArbitrage() {
  printSection('CROSS-CHAIN ARBITRAGE ENGINE');
  
  console.log('🌐 Scanning multiple blockchains for arbitrage opportunities...\n');
  console.log('   Supported Networks: BNB Chain, opBNB, Solana, Ethereum');
  console.log('   Analyzing price differences across DEXs...\n');
  
  const crossChain = new CrossChainArbitrageEngine();
  
  console.log('🔍 Discovering arbitrage opportunities...');
  const opportunities = await crossChain.discoverArbitrageOpportunities();
  
  console.log(`\n💰 Found ${opportunities.length} cross-chain arbitrage opportunities!\n`);
  
  if (opportunities.length > 0) {
    console.log('🚀 TOP 5 ARBITRAGE OPPORTUNITIES:');
    console.log('─'.repeat(50));
    
    opportunities.slice(0, 5).forEach((opp, index) => {
      const profitEmoji = opp.profitPotential > 5 ? '🔥' : opp.profitPotential > 3 ? '🚀' : '📈';
      const riskEmoji = opp.riskLevel === 'LOW' ? '🟢' : opp.riskLevel === 'MEDIUM' ? '🟡' : '🔴';
      
      console.log(`${index + 1}. ${profitEmoji} ${opp.tokenSymbol}: ${opp.sourceChain} → ${opp.targetChain}`);
      console.log(`   💰 Profit: ${opp.profitPotential.toFixed(2)}%`);
      console.log(`   ${riskEmoji} Risk: ${opp.riskLevel}`);
      console.log(`   ⚡ Confidence: ${(opp.confidence * 100).toFixed(0)}%`);
      console.log(`   ⏱️  Est. Time: ${Math.round(opp.executionTime / 60)} minutes`);
      console.log(`   💧 Liquidity: $${opp.liquidity.source.toLocaleString()} / $${opp.liquidity.target.toLocaleString()}\n`);
    });
  } else {
    console.log('🔍 No high-value arbitrage opportunities detected at this time.');
    console.log('   The engine continues scanning 24/7 for profitable trades.\n');
  }
}

async function demoStrategyEvolution() {
  printSection('STRATEGY EVOLUTION ENGINE - GENETIC ALGORITHMS');
  
  console.log('🧬 Demonstrating strategy evolution using genetic algorithms...\n');
  
  const strategyEngine = new StrategyEvolutionEngine();
  
  // Get current strategy state
  const strategies = strategyEngine.getStrategies();
  const metrics = strategyEngine.getMetrics();
  
  console.log('📊 Current Strategy Population:');
  console.log(`   🧬 Generation: ${metrics.generation}`);
  console.log(`   🔬 Population Size: ${strategies.length} strategies`);
  console.log(`   📈 Average Fitness: ${(metrics.avgFitness * 100).toFixed(1)}%`);
  console.log(`   🏆 Best Fitness: ${(metrics.bestFitness * 100).toFixed(1)}%\n`);
  
  console.log('🎯 Active Trading Strategies:');
  strategies.slice(0, 3).forEach((strategy, index) => {
    console.log(`   ${index + 1}. ${strategy.name} (${strategy.type})`);
    console.log(`      🏆 Fitness: ${(strategy.fitness * 100).toFixed(1)}%`);
    console.log(`      🧬 Generation: ${strategy.generation}`);
    console.log(`      📊 Type: ${strategy.type.charAt(0).toUpperCase() + strategy.type.slice(1)}\n`);
  });
  
  console.log('🔬 Triggering evolution process...');
  await strategyEngine.evolveStrategies();
  
  const newMetrics = strategyEngine.getMetrics();
  console.log(`✅ Evolution completed! Now at Generation ${newMetrics.generation}`);
  console.log(`📈 New Average Fitness: ${(newMetrics.avgFitness * 100).toFixed(1)}%`);
  console.log(`🚀 Strategies have evolved based on market performance!\n`);
}

async function demoSystemCapabilities() {
  printSection('SYSTEM CAPABILITIES SUMMARY');
  
  console.log('🤖 IMMORTAL AI TRADING BOT - Full Feature Set:\n');
  
  const capabilities = [
    { icon: '🧠', name: 'Autonomous AI Decision Making', desc: 'LLM-powered trading decisions with fallback heuristics' },
    { icon: '📚', name: 'Immortal Memory System', desc: 'BNB Greenfield storage for persistent learning' },
    { icon: '🌐', name: 'Cross-Chain Arbitrage', desc: 'Multi-blockchain opportunity detection' },
    { icon: '🧬', name: 'Strategy Evolution', desc: 'Genetic algorithms for optimization' },
    { icon: '📊', name: 'Real Market Data', desc: 'Live DexScreener API integration' },
    { icon: '🥞', name: 'PancakeSwap Trading', desc: 'Native BNB Chain DEX execution' },
    { icon: '🎯', name: 'Personality System', desc: 'Evolving risk and trading preferences' },
    { icon: '⚡', name: 'Real-Time Processing', desc: 'Instant market analysis and response' }
  ];
  
  capabilities.forEach(cap => {
    console.log(`${cap.icon} ${cap.name}`);
    console.log(`   └─ ${cap.desc}\n`);
  });
  
  console.log('🏆 HACKATHON VALUE PROPOSITION:');
  console.log('   ✅ BNB Chain Native - PancakeSwap, Greenfield, opBNB');
  console.log('   ✅ True AI Innovation - Evolving strategies with immortal memory');
  console.log('   ✅ Cross-Chain Ready - Multi-blockchain arbitrage detection');
  console.log('   ✅ Production Ready - Real market data, comprehensive testing');
  console.log('   ✅ Open Source - Fully documented, hackathon-ready codebase\n');
}

async function main() {
  try {
    printBanner();
    
    console.log('🚀 Starting Immortal AI Trading Bot demonstration...');
    console.log('   This demo showcases a fully autonomous AI trading agent');
    console.log('   that learns, evolves, and trades across multiple blockchains.\n');
    
    await demoMarketDataIntegration();
    await demoImmortalAI();
    await demoCrossChainArbitrage();
    await demoStrategyEvolution();
    demoSystemCapabilities();
    
    console.log('='.repeat(80));
    console.log('🎉 DEMONSTRATION COMPLETE!');
    console.log('');
    console.log('🤖 The Immortal AI Trading Bot represents the future of');
    console.log('   autonomous trading - an AI that never forgets, always learns,');
    console.log('   and continuously evolves its strategies for maximum profit.');
    console.log('');
    console.log('🏆 Ready for BNB Chain Hackathon submission!');
    console.log('🌟 GitHub: https://github.com/arhansubasi0/immortal-bnb-bot');
    console.log('='.repeat(80));
    
  } catch (error) {
    console.error('💥 Demo failed:', error);
    process.exit(1);
  }
}

// Run the demo
main();
