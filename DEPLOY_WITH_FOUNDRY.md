# 🔨 Deploy Contracts with Foundry

**Fastest way to deploy smart contracts (20-30 minutes)**

Foundry is a blazing fast, portable toolkit for Ethereum development. It's simpler than Hardhat and has no ESM/CommonJS conflicts.

---

## 📋 Prerequisites

- [ ] MetaMask wallet installed
- [ ] 0.1 tBNB in wallet (from [BSC Testnet Faucet](https://testnet.bnbchain.org/faucet-smart))
- [ ] Bash shell (Linux/Mac/WSL)
- [ ] `jq` installed (for JSON parsing)
- [ ] `bc` installed (for balance checking)

---

## 🚀 Quick Start (3 Steps)

### Step 1: Install Foundry (2 minutes)

```bash
# Install Foundry
curl -L https://foundry.paradigm.xyz | bash

# Reload shell or run:
source ~/.bashrc  # or source ~/.zshrc

# Install latest version
foundryup

# Verify installation
forge --version
```

**Expected output:**
```
forge 0.2.0 (abc123 2024-01-15T00:00:00.000000000Z)
```

### Step 2: Set Up Environment (3 minutes)

```bash
# Edit .env file
nano .env  # or use your preferred editor

# Add your private key:
WALLET_PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE
```

**⚠️ How to get private key from MetaMask:**
1. Open MetaMask
2. Click the three dots → Account Details
3. Click "Show Private Key"
4. Enter your password
5. Copy the private key
6. Paste into .env file

**🔒 Security:**
- Use a dedicated deployment wallet (not your main wallet)
- Only fund with amount needed for deployment (~0.1 tBNB)
- Never commit .env to git

### Step 3: Deploy Contracts (5 minutes)

```bash
# Run deployment script
bash scripts/foundry-deploy.sh
```

The script will:
1. ✅ Check Foundry installation
2. ✅ Validate environment setup
3. ✅ Check wallet balance
4. ✅ Deploy IMMBotToken contract
5. ✅ Deploy Staking contract
6. ✅ Link token to staking
7. ✅ Save addresses to `deployment.json`

**Sample output:**
```
🚀 Foundry Contract Deployment Script
========================================

✅ Foundry detected
forge 0.2.0 (abc123)

📡 Network: BSC Testnet (Chain ID: 97)
🔗 RPC: https://data-seed-prebsc-1-s1.binance.org:8545/
📬 Deployer: 0x1234...5678
💰 Balance: 0.15 BNB

⚠️  Ready to deploy contracts

Continue? (y/N): y

📝 Step 1: Deploying IMMBotToken...
✅ IMMBotToken deployed: 0xABCD...1234

📝 Step 2: Deploying Staking contract...
✅ Staking deployed: 0xEF12...5678

📝 Step 3: Linking token to staking contract...
✅ Token linked to staking contract

✅ Deployment complete!

========================================
📋 Deployment Summary
========================================

IMMBotToken:  0xABCD...1234
Staking:      0xEF12...5678

🔍 Verify on BscScan:
  Token:   https://testnet.bscscan.com/address/0xABCD...1234
  Staking: https://testnet.bscscan.com/address/0xEF12...5678
```

---

## 🔧 Post-Deployment Setup (10 minutes)

### Update Backend Environment

Edit `.env`:
```bash
# Replace with your deployed addresses
IMMBOT_TOKEN_ADDRESS=0xYOUR_TOKEN_ADDRESS
STAKING_CONTRACT_ADDRESS=0xYOUR_STAKING_ADDRESS
```

### Update Frontend Environment

Edit `apps/frontend/.env.local`:
```bash
# Replace with your deployed addresses
NEXT_PUBLIC_IMMBOT_TOKEN_TESTNET=0xYOUR_TOKEN_ADDRESS
NEXT_PUBLIC_STAKING_TESTNET=0xYOUR_STAKING_ADDRESS
```

### Restart Services

```bash
# Terminal 1: Backend
bun run dev

# Terminal 2: Frontend
cd apps/frontend && npm run dev
```

---

## ✅ Testing Deployment (5 minutes)

### 1. Verify Contracts on BscScan

Visit the URLs from deployment summary:
- [ ] Token contract shows verified source
- [ ] Staking contract shows verified source
- [ ] Both show your deployer address

### 2. Test Frontend Integration

Open http://localhost:3000:

1. **Connect Wallet**:
   - [ ] Click "Connect Wallet"
   - [ ] Connect with MetaMask
   - [ ] Should show your address

2. **Check Staking Tab**:
   - [ ] Navigate to "Staking" tab
   - [ ] Should NOT show "Contracts Not Deployed" warning
   - [ ] Balance should show 0.00 IMMBOT (normal for new deployment)

3. **Test Approve (Optional)**:
   - Enter amount: 1000
   - Click "Stake Tokens"
   - MetaMask popup for approval
   - Approve transaction
   - Wait for confirmation

---

## 🐛 Troubleshooting

### "forge: command not found"

**Solution:**
```bash
# Reload shell configuration
source ~/.bashrc  # or ~/.zshrc

# Or reinstall
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

### "Insufficient balance"

**Solution:**
1. Visit https://testnet.bnbchain.org/faucet-smart
2. Connect wallet
3. Request 0.1 tBNB
4. Wait 1-2 minutes
5. Try deployment again

### "jq: command not found"

**Solution:**
```bash
# Ubuntu/Debian
sudo apt-get install jq bc

# Mac
brew install jq bc

# Or use deployment without script:
forge create contracts/IMMBotToken.sol:IMMBotToken \
  --rpc-url https://data-seed-prebsc-1-s1.binance.org:8545/ \
  --private-key $WALLET_PRIVATE_KEY
```

### "Failed to deploy IMMBotToken"

**Possible causes:**
1. Network issues - Try again
2. Gas price too low - RPC should auto-adjust
3. Contract compilation error - Check Solidity version

**Debug:**
```bash
# Test compilation
forge build

# Check for errors
forge build --force

# Test connection
cast chain-id --rpc-url https://data-seed-prebsc-1-s1.binance.org:8545/
```

### "Transaction reverted"

This can happen during `setStakingContract` call.

**Solution:**
```bash
# Manual linking (replace with your addresses)
cast send 0xYOUR_TOKEN_ADDRESS \
  "setStakingContract(address)" \
  0xYOUR_STAKING_ADDRESS \
  --rpc-url https://data-seed-prebsc-1-s1.binance.org:8545/ \
  --private-key $WALLET_PRIVATE_KEY
```

---

## 📊 Deployment Costs

Expected gas costs on BSC Testnet:

| Action | Gas Units | Cost (tBNB) | USD Equivalent |
|--------|-----------|-------------|----------------|
| Deploy Token | ~2,000,000 | ~0.02 | ~$8 |
| Deploy Staking | ~1,500,000 | ~0.015 | ~$6 |
| Link Contracts | ~50,000 | ~0.0005 | ~$0.20 |
| **Total** | ~3,550,000 | **~0.035** | **~$14** |

**Note:** Testnet BNB is free! These are just estimates.

---

## 🔍 Verify Contracts (Optional)

After deployment, verify on BscScan for transparency:

```bash
# Install verification plugin
forge install OpenZeppelin/openzeppelin-contracts

# Verify IMMBotToken
forge verify-contract \
  --chain-id 97 \
  --compiler-version v0.8.20 \
  0xYOUR_TOKEN_ADDRESS \
  contracts/IMMBotToken.sol:IMMBotToken

# Verify Staking (with constructor args)
forge verify-contract \
  --chain-id 97 \
  --compiler-version v0.8.20 \
  --constructor-args $(cast abi-encode "constructor(address)" 0xYOUR_TOKEN_ADDRESS) \
  0xYOUR_STAKING_ADDRESS \
  contracts/Staking.sol:Staking
```

**Note:** You need a BscScan API key in .env:
```bash
BSCSCAN_API_KEY=your-api-key
```

Get free key at: https://bscscan.com/apis

---

## 📚 Foundry Commands Cheat Sheet

```bash
# Compile contracts
forge build

# Run tests
forge test

# Check gas estimates
forge test --gas-report

# Deploy single contract
forge create contracts/IMMBotToken.sol:IMMBotToken \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY

# Call contract function
cast call $CONTRACT_ADDRESS "totalSupply()"

# Send transaction
cast send $CONTRACT_ADDRESS "transfer(address,uint256)" $TO $AMOUNT

# Get balance
cast balance $ADDRESS --rpc-url $RPC_URL

# Convert units
cast --to-unit 1000000000000000000 ether  # Wei to Ether
cast --to-wei 1 ether  # Ether to Wei
```

---

## 🎯 Summary

### What This Does:
✅ Installs Foundry (fast Ethereum toolkit)
✅ Deploys IMMBotToken to BSC Testnet
✅ Deploys Staking contract to BSC Testnet
✅ Links contracts together
✅ Saves deployment info
✅ Provides verification URLs

### Time Breakdown:
- **Install Foundry:** 2 minutes
- **Setup environment:** 3 minutes
- **Deploy contracts:** 5 minutes
- **Update config:** 5 minutes
- **Test integration:** 5 minutes
- **Total:** ~20 minutes

### After This:
✅ Staking UI fully functional
✅ Users can stake IMMBOT tokens
✅ Rewards calculated on-chain
✅ Full Web3 integration working

---

## 🆚 Comparison: Foundry vs Remix vs Hardhat

| Feature | Foundry | Remix | Hardhat |
|---------|---------|-------|---------|
| Setup Time | 2 min | 0 min (browser) | 15 min |
| Learning Curve | Easy | Easiest | Moderate |
| Automation | ✅ Full | ❌ Manual | ✅ Full |
| Speed | ⚡ Fastest | 🐌 Slow | 🚶 Medium |
| ESM Issues | ✅ None | ✅ None | ❌ Has issues |
| Verification | ✅ Built-in | ❌ Manual | ✅ Plugin |
| **Best For** | **CLI users** | **First-timers** | **JS devs** |

---

## 🔗 Resources

- **Foundry Book:** https://book.getfoundry.sh
- **Foundry GitHub:** https://github.com/foundry-rs/foundry
- **BSC Testnet Faucet:** https://testnet.bnbchain.org/faucet-smart
- **BscScan Testnet:** https://testnet.bscscan.com
- **Cast Reference:** https://book.getfoundry.sh/reference/cast

---

## 💡 Tips

1. **Save deployment.json**: This file contains all your contract addresses and deployment info
2. **Use Foundry for testing**: `forge test` is much faster than Hardhat
3. **Gas optimization**: Foundry shows gas usage per function
4. **Local testing**: `anvil` creates a local blockchain for testing
5. **Wallet safety**: Always use a dedicated deployment wallet

---

**Next:** After deployment, follow the "Post-Deployment Setup" section to update environment files and test the full staking functionality!

**Questions?** See troubleshooting section or check DEPLOY_CONTRACTS.md for alternative methods.

---

**Last Updated:** 2025-11-08
**Tested On:** Foundry 0.2.0, BSC Testnet
**Status:** ✅ Production Ready
