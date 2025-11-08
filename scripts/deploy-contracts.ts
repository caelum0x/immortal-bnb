/**
 * Standalone Contract Deployment Script
 * Deploys IMMBotToken and Staking contracts to BSC Testnet
 * Uses ethers.js directly (no Hardhat dependency)
 */

import { ethers } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

// Contract source code
const IMMBotTokenSource = fs.readFileSync(
  path.join(__dirname, '../contracts/IMMBotToken.sol'),
  'utf8'
);

const StakingSource = fs.readFileSync(
  path.join(__dirname, '../contracts/Staking.sol'),
  'utf8'
);

// Network configuration
const BSC_TESTNET_RPC = 'https://data-seed-prebsc-1-s1.binance.org:8545/';
const CHAIN_ID = 97;

interface DeploymentResult {
  tokenAddress: string;
  stakingAddress: string;
  deployer: string;
  network: string;
  timestamp: string;
}

async function main() {
  console.log('🚀 Starting contract deployment to BSC Testnet...\n');

  // Validate environment
  const privateKey = process.env.WALLET_PRIVATE_KEY;
  if (!privateKey || privateKey === 'your-private-key-here') {
    console.error('❌ Error: WALLET_PRIVATE_KEY not set in .env file');
    console.error('\nPlease:');
    console.error('1. Create a deployment wallet in MetaMask');
    console.error('2. Export the private key');
    console.error('3. Add it to .env: WALLET_PRIVATE_KEY=0x...');
    console.error('4. Get testnet BNB from: https://testnet.bnbchain.org/faucet-smart');
    process.exit(1);
  }

  // Connect to BSC Testnet
  console.log('📡 Connecting to BSC Testnet...');
  const provider = new ethers.JsonRpcProvider(BSC_TESTNET_RPC);
  const wallet = new ethers.Wallet(privateKey, provider);

  console.log(`✅ Connected to network (Chain ID: ${CHAIN_ID})`);
  console.log(`📬 Deployer address: ${wallet.address}\n`);

  // Check balance
  const balance = await provider.getBalance(wallet.address);
  const balanceInBNB = ethers.formatEther(balance);
  console.log(`💰 Wallet balance: ${balanceInBNB} BNB`);

  if (parseFloat(balanceInBNB) < 0.05) {
    console.error('❌ Error: Insufficient balance');
    console.error('   You need at least 0.05 tBNB for deployment');
    console.error('   Get free tBNB from: https://testnet.bnbchain.org/faucet-smart');
    process.exit(1);
  }

  console.log('\n⚠️  IMPORTANT: This script requires pre-compiled contract bytecode.');
  console.log('📚 Please use one of these deployment methods instead:');
  console.log('\n1️⃣  Remix IDE (RECOMMENDED - Easiest):');
  console.log('   - Open: https://remix.ethereum.org');
  console.log('   - Copy contracts/IMMBotToken.sol');
  console.log('   - Compile with Solidity 0.8.20');
  console.log('   - Deploy to BSC Testnet');
  console.log('   - See DEPLOY_CONTRACTS.md for full guide');
  console.log('\n2️⃣  Hardhat in separate environment:');
  console.log('   - Create fresh Node.js project');
  console.log('   - Install Hardhat 3.x with ESM');
  console.log('   - Copy contracts and deploy');
  console.log('   - See DEPLOY_CONTRACTS.md Option A');
  console.log('\n3️⃣  Foundry (Alternative):');
  console.log('   - Install: curl -L https://foundry.paradigm.xyz | bash');
  console.log('   - Run: forge create contracts/IMMBotToken.sol:IMMBotToken \\');
  console.log('         --rpc-url https://data-seed-prebsc-1-s1.binance.org:8545/ \\');
  console.log('         --private-key $WALLET_PRIVATE_KEY');

  console.log('\n📖 For detailed instructions, see: DEPLOY_CONTRACTS.md');
  console.log('✨ After deployment, update addresses in .env and apps/frontend/.env.local\n');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Deployment failed:', error);
    process.exit(1);
  });
