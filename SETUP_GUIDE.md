# 🚀 Complete Setup Guide - Immortal AI Trading Bot

This guide walks you through setting up and running the complete Immortal AI Trading Bot from scratch.

## ⚡ Quick Start (3 Steps)

```bash
# 1. Install and configure
git clone https://github.com/caelum0x/immortal-bnb.git
cd immortal-bnb
bun install
cp .env.example .env
# Edit .env with your keys (see below)

# 2. Test everything
bun test:integration

# 3. Start trading!
bun start
```

Then open `http://localhost:3000` for the dashboard.

---

## 📋 Prerequisites

### Required Software

1. **Bun** (v1.0+) - Fast JavaScript runtime
   ```bash
   curl -fsSL https://bun.sh/install | bash
   ```

2. **Git** - Version control
   ```bash
   # Already installed on most systems
   git --version
   ```

### Required API Keys

1. **OpenRouter API Key** (for AI decisions)
   - Sign up: https://openrouter.ai/signup
   - Get API key from dashboard
   - Cost: ~$0.001 per decision (very cheap)

2. **Wallet Private Key** (for trading)
   - Use MetaMask or any BNB Chain wallet
   - **IMPORTANT**: Use a TEST wallet, not your main wallet!
   - Never share or commit this key

### Optional But Recommended

3. **Telegram Bot** (for alerts)
   - Talk to @BotFather on Telegram
   - Create new bot with `/newbot`
   - Get bot token
   - Get your chat ID from @userinfobot

---

## 🔧 Step-by-Step Setup

### Step 1: Clone and Install

```bash
# Clone the repository
git clone https://github.com/caelum0x/immortal-bnb.git
cd immortal-bnb

# Install dependencies
bun install

# This installs:
# - Backend dependencies (AI, blockchain, APIs)
# - Testing framework
# - All integrations
```

### Step 2: Configure Environment Variables

```bash
# Copy the example file
cp .env.example .env

# Edit with your favorite editor
nano .env
# or
code .env
# or
vim .env
```

### Step 3: Fill in Required Variables

Open `.env` and add your values:

```bash
# ============================================
# REQUIRED - Bot won't start without these
# ============================================

# OpenRouter API Key (get from https://openrouter.ai)
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxx

# Your wallet private key (without 0x prefix)
WALLET_PRIVATE_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Network selection
NETWORK=testnet                    # Use testnet first!
TRADING_NETWORK=opbnb              # Use opBNB for 99% gas savings

# ============================================
# REQUIRED - Greenfield Storage
# ============================================

GREENFIELD_RPC_URL=https://gnfd-testnet-fullnode-tendermint-ap.bnbchain.org
GREENFIELD_CHAIN_ID=5600
GREENFIELD_BUCKET_NAME=immortal-bot-memory-YOUR_NAME  # Make this unique!

# ============================================
# OPTIONAL - But Recommended
# ============================================

# Telegram Alerts
TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
TELEGRAM_CHAT_ID=123456789

# Trading Limits (Conservative defaults)
MAX_TRADE_AMOUNT_BNB=0.1          # Max 0.1 BNB per trade
STOP_LOSS_PERCENTAGE=5            # 5% stop loss
MAX_SLIPPAGE_PERCENTAGE=2         # 2% max slippage

# Bot Configuration
BOT_LOOP_INTERVAL_MS=300000       # Check every 5 minutes
API_PORT=3001                     # API server port
```

### Step 4: Get Testnet BNB

You need testnet BNB for gas fees:

**For opBNB Testnet** (Recommended):
1. Go to: https://opbnb-testnet-bridge.bnbchain.org/faucet
2. Connect your wallet
3. Request testnet BNB
4. Wait 1-2 minutes

**For BNB Chain Testnet** (Alternative):
1. Go to: https://testnet.bnbchain.org/faucet-smart
2. Enter your wallet address
3. Complete captcha
4. Receive 0.5 tBNB

**Verify Balance:**
```bash
bun cli.ts balance
```

### Step 5: Test Configuration

Run the integration tests to verify everything is set up correctly:

```bash
bun test:integration
```

You should see:
```
🚀 Starting End-to-End Integration Tests
═══════════════════════════════════════

📦 Environment Configuration
──────────────────────────────────────
  ✓ Wallet Private Key configured
  ✓ OpenRouter API Key configured
  ✓ Greenfield RPC configured
  ✓ Greenfield Bucket configured
  ℹ Trading Network: opbnb
  ℹ Chain ID: 5611

📦 Blockchain Connection
──────────────────────────────────────
  ✓ PancakeSwap SDK initialized
  ✓ Wallet connected: 0.5000 BNB
  ✓ Sufficient balance for trading

... (all tests passing)

✅ All tests passed! Your bot is ready to trade.
```

---

## 🎮 Running the Bot

### Option 1: Full Startup (Recommended)

```bash
bun start
```

This runs the comprehensive startup script with:
- Pre-flight health checks
- Service validation
- Configuration verification
- Beautiful terminal UI
- Helpful error messages

### Option 2: Development Mode

```bash
bun run dev
```

Auto-reloads when you change code. Good for development.

### Option 3: Direct Run

```bash
bun run src/index.ts
```

Basic startup without health checks.

---

## 📊 Using the Dashboard

### Start the Frontend

In a **separate terminal**:

```bash
cd frontend
bun install        # First time only
bun run dev
```

Then open your browser to:
**http://localhost:3000**

You'll see:
- Real-time P/L chart
- Win rate and statistics
- Recent trades
- Market conditions
- AI reasoning

Updates every 30 seconds automatically.

---

## 🎯 Managing the Bot

### CLI Commands

```bash
# Quick status check
bun status

# Check wallet balance
bun balance

# View recent trades
bun trades

# View performance stats
bun stats

# Test a token (no execution)
bun cli.ts test 0xTokenAddress

# View Greenfield memories
bun cli.ts memory

# Show configuration
bun cli.ts config

# All commands
bun cli.ts help
```

### Monitor Logs

```bash
# View application logs
tail -f logs/app.log

# Follow bot output in real-time
bun run dev
```

---

## 🧪 Testing Before Real Trading

### 1. Test Single Trade

```bash
# Test SDK without executing
bun test-trade.ts

# Test with specific token
bun test-trade.ts 0xYourTokenAddress
```

### 2. Test Integration

```bash
# Full system test
bun test:integration
```

### 3. Test in Dry Run Mode

Edit `src/index.ts` and add at the top:
```typescript
const DRY_RUN = true;  // Set to false for real trading
```

Then in `executeTrade`, add:
```typescript
if (DRY_RUN) {
  logger.info('DRY RUN: Would execute trade:', params);
  return { success: true, message: 'Dry run' };
}
```

---

## ⚙️ Configuration Options

### Network Selection

```bash
# opBNB L2 (Recommended - 99% cheaper gas)
TRADING_NETWORK=opbnb
OPBNB_RPC=https://opbnb-testnet-rpc.bnbchain.org

# BNB Chain L1 (Original)
TRADING_NETWORK=bnb
BNB_RPC=https://bsc-testnet.bnbchain.org
```

### Risk Management

**Conservative** (Start here):
```bash
MAX_TRADE_AMOUNT_BNB=0.05
STOP_LOSS_PERCENTAGE=5
MAX_SLIPPAGE_PERCENTAGE=2
BOT_LOOP_INTERVAL_MS=600000  # 10 minutes
```

**Moderate**:
```bash
MAX_TRADE_AMOUNT_BNB=0.1
STOP_LOSS_PERCENTAGE=7
MAX_SLIPPAGE_PERCENTAGE=3
BOT_LOOP_INTERVAL_MS=300000  # 5 minutes
```

**Aggressive** (Not recommended for beginners):
```bash
MAX_TRADE_AMOUNT_BNB=0.5
STOP_LOSS_PERCENTAGE=10
MAX_SLIPPAGE_PERCENTAGE=5
BOT_LOOP_INTERVAL_MS=180000  # 3 minutes
```

---

## 🐛 Troubleshooting

### Problem: "Missing required environment variables"

**Solution:**
```bash
# Check .env file exists
ls -la .env

# Verify all required variables are set
cat .env | grep -v "^#" | grep -v "^$"

# Copy example again if needed
cp .env.example .env
```

### Problem: "Insufficient funds"

**Solution:**
```bash
# Check balance
bun cli.ts balance

# Get testnet BNB
# opBNB: https://opbnb-testnet-bridge.bnbchain.org/faucet
# BNB Chain: https://testnet.bnbchain.org/faucet-smart
```

### Problem: "OpenRouter API failed"

**Solution:**
```bash
# Verify API key is correct
echo $OPENROUTER_API_KEY

# Test API key manually
curl https://openrouter.ai/api/v1/models \
  -H "Authorization: Bearer YOUR_API_KEY"

# Get new key from https://openrouter.ai
```

### Problem: "Greenfield connection failed"

**Solution:**
```bash
# Check Greenfield RPC
curl https://gnfd-testnet-fullnode-tendermint-ap.bnbchain.org/status

# Try different RPC endpoint
GREENFIELD_RPC_URL=https://gnfd-testnet-fullnode-tendermint-us.bnbchain.org

# Create unique bucket name
GREENFIELD_BUCKET_NAME=immortal-bot-${USER}-$(date +%s)
```

### Problem: "Token not found on DexScreener"

**Solution:**
```bash
# Verify token exists on BNB Chain/opBNB
# Check on DexScreener: https://dexscreener.com/bnb/

# Use a known token for testing
# CAKE: 0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82
bun cli.ts test 0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82
```

---

## 🎓 Learning Resources

| Topic | Document |
|-------|----------|
| Complete Integration | `INTEGRATION_COMPLETE.md` |
| CLI Commands | `README_CLI.md` |
| Production Deployment | `DEPLOYMENT_GUIDE.md` |
| Trading Guide | `QUICKSTART_TRADING.md` |
| PancakeSwap SDK | `PANCAKESWAP_SDK_GUIDE.md` |
| opBNB Integration | `OPBNB_INTEGRATION.md` |
| External APIs | `EXTERNAL_RESOURCES.md` |
| System Overview | `SYSTEM_COMPLETE.md` |

---

## ✅ Pre-Launch Checklist

Before running on testnet:

- [ ] All environment variables configured
- [ ] Testnet BNB in wallet (check with `bun balance`)
- [ ] Integration tests passing (`bun test:integration`)
- [ ] OpenRouter API key working
- [ ] Greenfield bucket created
- [ ] Telegram bot connected (optional)
- [ ] CLI tools working (`bun status`)
- [ ] Dashboard accessible (http://localhost:3000)
- [ ] Understand risk management settings
- [ ] Know how to stop the bot (Ctrl+C)

---

## 🚀 Going to Mainnet

**⚠️ ONLY after extensive testnet testing!**

1. Change network:
   ```bash
   NETWORK=mainnet
   TRADING_NETWORK=opbnb
   ```

2. Update RPCs:
   ```bash
   OPBNB_RPC=https://opbnb-mainnet-rpc.bnbchain.org
   GREENFIELD_RPC_URL=https://greenfield-chain.bnbchain.org
   GREENFIELD_CHAIN_ID=1017
   ```

3. Use production wallet with real BNB

4. **Start with VERY small amounts**:
   ```bash
   MAX_TRADE_AMOUNT_BNB=0.01  # Start tiny!
   ```

5. Monitor closely for first 24 hours

6. See `DEPLOYMENT_GUIDE.md` for production setup

---

## 💡 Tips for Success

1. **Start Small**: Use minimum trade amounts initially
2. **Monitor Closely**: Watch first 10-20 trades carefully
3. **Use opBNB**: 99% cheaper gas than BNB Chain
4. **Check Greenfield**: Verify memories are being stored
5. **Review AI Reasoning**: Make sure decisions make sense
6. **Set Stop Losses**: Protect against big losses
7. **Use Telegram**: Get instant trade notifications
8. **Regular Backups**: Export memories periodically
9. **Update Regularly**: Pull latest code improvements
10. **Ask Questions**: Open GitHub issues if stuck

---

## 📞 Getting Help

- **Issues**: https://github.com/caelum0x/immortal-bnb/issues
- **Docs**: All .md files in the repository
- **Logs**: Check `logs/app.log` for detailed output
- **CLI Help**: `bun cli.ts help`

---

## ⚖️ Disclaimer

```
⚠️ IMPORTANT:
- This is experimental software
- Trading involves significant financial risk
- Use at your own risk
- Start with testnet
- Only invest what you can afford to lose
- Past performance doesn't guarantee future results
- No warranty provided
```

---

**Ready to trade? Start with:** `bun start`

Good luck and trade wisely! 🚀💎
