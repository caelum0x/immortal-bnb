# 🔧 Environment Setup Required

## Current Issue

The application can't start because the `.env` file needs valid configuration:

```
error: Expected valid bigint: 0 < bigint < curve.n
```

This means `WALLET_PRIVATE_KEY` in `.env` is invalid or missing.

## Quick Fix

### Option 1: Use Test Private Key (For Development Only)

Edit `.env` and set a valid test private key:

```bash
# DO NOT use real funds - testnet only!
WALLET_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# This is the well-known Hardhat test private key
# Address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
```

### Option 2: Generate New Wallet

Generate a new test wallet:

```bash
# Install ethers (if not already)
bun add -g ethers

# Generate new wallet
node -e "const {Wallet} = require('ethers'); const w = Wallet.createRandom(); console.log('Address:', w.address); console.log('Private Key:', w.privateKey);"
```

Then add the private key to `.env`:

```bash
WALLET_PRIVATE_KEY=<your_generated_private_key>
```

## Complete .env Configuration

Your `.env` should look like this:

```bash
# AI Configuration
OPENROUTER_API_KEY=sk-or-v1-your-key-here

# Blockchain Configuration
BNB_RPC=https://bsc-testnet.bnbchain.org
WALLET_PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE

# Trading Configuration
MAX_TRADE_AMOUNT_BNB=0.01
STOP_LOSS_PERCENTAGE=5
MAX_SLIPPAGE_PERCENTAGE=2
MIN_CONFIDENCE_THRESHOLD=0.7
BOT_LOOP_INTERVAL_MS=300000

# Network
NETWORK=testnet
TRADING_NETWORK=testnet

# API Server
PORT=3001
API_PORT=3001

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## After Fixing .env

1. Save your `.env` file
2. Run the application:

```bash
bun start
```

## Get Test BNB

Once running, get testnet BNB for your wallet:

1. Go to: https://testnet.bnbchain.org/faucet-smart
2. Enter your wallet address
3. Request test BNB

## Security Warning

⚠️ **NEVER** use your real private key with mainnet funds!

- Use testnet ONLY for development
- Keep private keys secret
- Never commit .env to git (it's in .gitignore)

## Need Help?

Check if .env exists:
```bash
ls -la .env
```

View current config (without sensitive data):
```bash
cat .env | grep -v "PRIVATE_KEY\|API_KEY"
```

