#!/bin/bash

# Quick script to fix the WALLET_PRIVATE_KEY in .env

echo "🔧 Fixing .env configuration..."

# Backup existing .env
cp .env .env.backup
echo "✅ Backed up .env to .env.backup"

# Generate a new test wallet using Node.js
echo "🔑 Generating test wallet..."

node -e "
const { Wallet } = require('ethers');
const wallet = Wallet.createRandom();
console.log('');
console.log('='.repeat(60));
console.log('NEW TEST WALLET GENERATED');
console.log('='.repeat(60));
console.log('Address:', wallet.address);
console.log('Private Key:', wallet.privateKey);
console.log('='.repeat(60));
console.log('');
console.log('⚠️  TESTNET ONLY - DO NOT USE WITH REAL FUNDS');
console.log('');

// Update .env file
const fs = require('fs');
let envContent = fs.readFileSync('.env', 'utf8');

// Replace the WALLET_PRIVATE_KEY line
envContent = envContent.replace(
  /WALLET_PRIVATE_KEY=.*/,
  'WALLET_PRIVATE_KEY=' + wallet.privateKey
);

fs.writeFileSync('.env', envContent);
console.log('✅ Updated .env with new private key');
console.log('');
console.log('Get testnet BNB from:');
console.log('https://testnet.bnbchain.org/faucet-smart');
console.log('');
console.log('Your wallet address: ' + wallet.address);
"

echo ""
echo "✅ Done! Now run: bun start"

