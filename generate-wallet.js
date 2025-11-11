#!/usr/bin/env node

/**
 * Generate a new test wallet for development
 */

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

console.log('\n🔐 Generating New Test Wallet...\n');

// Generate random wallet
const wallet = ethers.Wallet.createRandom();

console.log('✅ Wallet generated successfully!\n');
console.log('📝 SAVE THIS INFORMATION SECURELY:\n');
console.log('Private Key:', wallet.privateKey);
console.log('Address:    ', wallet.address);
console.log('Mnemonic:   ', wallet.mnemonic.phrase);

console.log('\n⚠️  IMPORTANT SECURITY WARNINGS:');
console.log('   1. This is for TESTING ONLY - use small amounts');
console.log('   2. NEVER share your private key with anyone');
console.log('   3. NEVER commit .env file to git');
console.log('   4. Store the mnemonic phrase securely as backup');

console.log('\n📝 To use this wallet:');
console.log('   1. Copy the private key above');
console.log('   2. Open your .env file');
console.log('   3. Update: WALLET_PRIVATE_KEY=' + wallet.privateKey);
console.log('   4. Save the file');
console.log('   5. Send some test BNB to ' + wallet.address);

// Ask if user wants to update .env automatically
console.log('\n❓ Update .env file automatically? (y/n)');

process.stdin.setEncoding('utf-8');
process.stdin.on('data', (input) => {
  const answer = input.toString().trim().toLowerCase();
  
  if (answer === 'y' || answer === 'yes') {
    try {
      const envPath = path.join(__dirname, '.env');
      
      if (!fs.existsSync(envPath)) {
        console.error('❌ .env file not found');
        process.exit(1);
      }
      
      // Read current .env
      let envContent = fs.readFileSync(envPath, 'utf-8');
      
      // Update or add WALLET_PRIVATE_KEY
      if (envContent.includes('WALLET_PRIVATE_KEY=')) {
        envContent = envContent.replace(
          /WALLET_PRIVATE_KEY=.*/,
          `WALLET_PRIVATE_KEY=${wallet.privateKey}`
        );
      } else {
        envContent += `\nWALLET_PRIVATE_KEY=${wallet.privateKey}\n`;
      }
      
      // Backup old .env
      fs.copyFileSync(envPath, envPath + '.backup');
      console.log('✅ Backed up old .env to .env.backup');
      
      // Write new .env
      fs.writeFileSync(envPath, envContent);
      console.log('✅ Updated .env file with new private key');
      console.log('✅ Wallet address:', wallet.address);
      console.log('\n🎉 Configuration complete! Run: node check-env.js to verify');
      
    } catch (error) {
      console.error('❌ Failed to update .env:', error.message);
    }
    process.exit(0);
  } else {
    console.log('\n👍 Okay, you can manually update your .env file');
    process.exit(0);
  }
});
