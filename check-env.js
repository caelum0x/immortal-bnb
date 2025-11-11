#!/usr/bin/env node

/**
 * Check environment configuration
 */

require('dotenv').config();

console.log('\n🔍 Checking Environment Configuration...\n');

// Check WALLET_PRIVATE_KEY
const privateKey = process.env.WALLET_PRIVATE_KEY;

if (!privateKey) {
  console.error('❌ WALLET_PRIVATE_KEY is not set in .env file');
  console.log('\n📝 To fix this:');
  console.log('   1. Open your .env file');
  console.log('   2. Add: WALLET_PRIVATE_KEY=0x...(your 64 character hex private key)');
  console.log('   3. Make sure it\'s 64 hex characters (or 66 with 0x prefix)');
  process.exit(1);
}

console.log('✅ WALLET_PRIVATE_KEY is set');
console.log(`   Length: ${privateKey.length} characters`);

// Validate length
if (privateKey.length !== 64 && privateKey.length !== 66) {
  console.error(`❌ Invalid private key length: ${privateKey.length}`);
  console.error('   Expected: 64 hex characters OR 66 with "0x" prefix');
  console.log('\n📝 Current format: ' + privateKey.substring(0, 10) + '...');
  console.log('   Correct format: 0x followed by 64 hex characters');
  console.log('   Example: 0x1234567890abcdef... (total 66 chars)');
  process.exit(1);
}

// Validate hex format
const hexPattern = /^(0x)?[0-9a-fA-F]+$/;
if (!hexPattern.test(privateKey)) {
  console.error('❌ Private key contains invalid characters');
  console.error('   Should only contain: 0-9, a-f, A-F');
  process.exit(1);
}

console.log('✅ Private key format is valid');

// Try to create wallet
try {
  const { ethers } = require('ethers');
  const wallet = new ethers.Wallet(privateKey);
  console.log('✅ Wallet created successfully');
  console.log(`   Address: ${wallet.address}`);
} catch (error) {
  console.error('❌ Failed to create wallet:', error.message);
  process.exit(1);
}

console.log('\n✅ All checks passed! Your configuration is valid.\n');
