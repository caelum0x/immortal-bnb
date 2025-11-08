# 🚀 Quick Start Guide

Get the Immortal AI Trading Bot running in 5 minutes!

## ✅ What This Bot Does

1. **Frontend Dashboard** - Control bot from web interface (Next.js)
2. **Fetch Market Data** - Real-time from DexScreener for BNB Chain tokens
3. **AI Analysis** - Uses GPT-4o-mini via OpenRouter for intelligent decisions
4. **Execute Trades** - Automated trading on PancakeSwap when AI is confident
5. **Immortal Memory** - Stores all trades on BNB Greenfield for permanent learning
6. **Telegram Alerts** - Get notified of all trades and events

**Based on**: https://github.com/hkirat/ai-trading-agent (adapted for BNB Chain)

**Architecture**: Frontend-controlled backend with real-time polling (NO MOCKS)

---

## 📋 Prerequisites (5 minutes)

### 1. Get OpenRouter API Key (FREE)

```bash
# 1. Visit https://openrouter.ai/signup
# 2. Sign up with email
# 3. Go to "Keys" tab
# 4. Create new key
# 5. Copy the key (starts with sk-or-...)
```

### 2. Get BNB Testnet Funds (FREE)

```bash
# 1. Install MetaMask (if not installed)
# 2. Add BNB Testnet:
#    - Network: BNB Smart Chain Testnet
#    - RPC: https://bsc-testnet.bnbchain.org
#    - Chain ID: 97
#    - Symbol: BNB
#    - Explorer: https://testnet.bscscan.com

# 3. Get test BNB:
#    Visit: https://testnet.bnbchain.org/faucet-smart
#    Paste your wallet address
#    Claim 0.5 test BNB (repeatable daily)

# 4. Export private key:
#    MetaMask → Account Details → Export Private Key
#    Copy the key (keep it SECRET!)
```

### 3. Get Telegram Bot Token (OPTIONAL)

```bash
# 1. Open Telegram
# 2. Search: @BotFather
# 3. Send: /newbot
# 4. Follow prompts to name your bot
# 5. Copy token (e.g., 1234567890:ABC...)

# 6. Get your chat ID:
#    - Send a message to your bot
#    - Visit: https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates
#    - Find "chat":{"id": 123456789}
#    - Copy the ID
```

---

## ⚙️ Installation (2 minutes)

```bash
# 1. Clone repository
git clone https://github.com/caelum0x/immortal-bnb.git
cd immortal-bnb

# 2. Install backend dependencies
bun install

# 3. Install frontend dependencies
cd apps/frontend
bun install
cd ../..

# 4. Create .env files
cp .env.example .env
cp apps/frontend/.env.example apps/frontend/.env.local
```

---

## 🔧 Configuration (2 minutes)

### Backend Configuration (.env)

Edit `.env` file in the root directory:

```bash
# ===== CRITICAL - REQUIRED =====
OPENROUTER_API_KEY=sk-or-v1-your-actual-key-here
WALLET_PRIVATE_KEY=0xYOUR_ACTUAL_PRIVATE_KEY_HERE

# ===== NETWORK =====
RPC_URL_TESTNET=https://opbnb-testnet-rpc.bnbchain.org
NETWORK=testnet
CHAIN_ID=5611

# ===== API SERVER =====
API_PORT=3001

# ===== OPTIONAL: Telegram Alerts =====
TELEGRAM_BOT_TOKEN=your-bot-token-here
TELEGRAM_CHAT_ID=your-chat-id-here

# ===== TRADING SETTINGS (SAFE DEFAULTS) =====
MAX_TRADE_AMOUNT_BNB=1.0
STOP_LOSS_PERCENTAGE=10
MAX_SLIPPAGE_PERCENTAGE=2
BOT_LOOP_INTERVAL_MS=300000
```

### Frontend Configuration (apps/frontend/.env.local)

Edit `.env.local` in the frontend directory:

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001

# Network
NEXT_PUBLIC_USE_MAINNET=false

# WalletConnect (get from https://cloud.walletconnect.com/)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here
```

---

## 🎯 Running the Bot (1 minute)

### Development Mode (Recommended)

**Terminal 1 - Backend**:
```bash
# Start backend server + bot
bun run dev

# You'll see:
# 🌟 Immortal AI Trading Bot - Production Mode
# ✅ Environment validation passed
# 🤖 Bot is ready - use the frontend to start trading
# 🌐 API Server: http://localhost:3001
```

**Terminal 2 - Frontend**:
```bash
# Start frontend dashboard
cd apps/frontend
bun run dev

# You'll see:
# ▲ Next.js 14.x.x
# - Local:        http://localhost:3000
# - ready in Xms
```

### Production Mode

```bash
# Build frontend
cd apps/frontend
bun run build
cd ../..

# Run backend
bun run start
```

### Start Trading

1. Open **http://localhost:3000** in your browser
2. Click **"Connect Wallet"** (top right)
3. Configure in Dashboard tab:
   - **Watchlist**: Add token addresses OR leave empty for auto-discovery
   - **Risk Level**: 1-10 (start with 3-5)
4. Click **"🚀 Start Trading Bot"**
5. Watch live trades in:
   - **Dashboard**: Bot status and controls
   - **Memories**: All trade history from Greenfield
   - **Discover**: Trending tokens from DexScreener
   - **Stats**: Win rate, P/L tracking

---

## 📊 What You'll See

### Backend Console (Terminal 1)

```bash
🌟 Immortal AI Trading Bot - Production Mode

✅ Environment validation passed

📋 Current Configuration:
Network: TESTNET
Chain ID: 5611
RPC: https://opbnb-testnet-rpc.bnbchain.org...
Wallet: 0x1234567890...

💰 Trading Parameters:
  Max Trade: 1.0 BNB
  Stop Loss: 10%
  Slippage: 2%
  Interval: 300s

🔌 Integrations:
  OpenRouter: ✅ Configured
  Telegram: ✅ Configured
  Greenfield: ⚪ Optional

API server listening on port 3001
🤖 Bot is ready - use the frontend to start trading
```

### Frontend Dashboard (Browser)

**Dashboard Tab**:
- ✅ Bot status (Running/Stopped)
- ⚙️ Token watchlist configuration
- 🎚️ Risk level slider (1-10)
- 🚀 Start/Stop button
- 📊 Current configuration display

**Trading Stats**:
- 📈 Total trades: 12
- ✅ Win rate: 67%
- 💵 Total P/L: +0.15 BNB
- 📊 Real-time updates every 30s

**Memories Tab**:
- 📜 All trades from Greenfield
- 🔍 Filter by profit/loss/pending
- 🧠 AI reasoning for each trade
- 📈 Market conditions snapshot
- 🔄 Auto-refresh every minute

**Discover Tab**:
- 🔥 Trending tokens from DexScreener
- 💰 Price, volume, liquidity data
- 📋 Copy contract addresses
- 🔗 Links to DexScreener & PancakeSwap
- 🔄 Auto-refresh every 2 minutes

---

## 💡 Understanding AI Decisions

The AI will ONLY trade when:

1. **High Confidence** (>70%) based on:
   - Strong volume and liquidity
   - Positive buy/sell pressure
   - Good price momentum
   - Similar patterns to successful past trades

2. **Safety Checks Pass**:
   - Liquidity > $10,000
   - Amount within max limit
   - Sufficient wallet balance
   - Not on cooldown

3. **Risk is Acceptable**:
   - Stop-loss set
   - Position sizing appropriate
   - Slippage within limits

---

## 🔍 Monitoring

### Check Logs

```bash
# View all logs
tail -f logs/combined.log

# View only errors
tail -f logs/error.log

# Search for trades
grep "Trade executed" logs/combined.log
```

### Check Telegram

All important events sent to your Telegram:
- AI decisions
- Trade executions
- Profit/loss results
- Error notifications

### Check Blockchain

Every trade creates a transaction:
```bash
# Testnet: https://testnet.bscscan.com
# Search your wallet address
# View all transactions
```

---

## 🛑 Stopping the Bot

```bash
# Press Ctrl+C

# You'll see:
👋 Shutting down gracefully...
Bot shutting down
```

---

## 🎓 Advanced Usage

### Add Token Watchlist

Edit `.env`:

```bash
# Instead of trending tokens, monitor specific tokens
DEFAULT_WATCHLIST=0xToken1,0xToken2,0xToken3
```

### Adjust Risk Settings

Edit `.env`:

```bash
# More conservative (recommended for beginners)
MAX_TRADE_AMOUNT_BNB=0.01
STOP_LOSS_PERCENTAGE=3

# More aggressive (higher risk/reward)
MAX_TRADE_AMOUNT_BNB=0.2
STOP_LOSS_PERCENTAGE=10
```

### Change Bot Frequency

Edit `.env`:

```bash
# Check every 1 minute (more active)
BOT_LOOP_INTERVAL_MS=60000

# Check every 30 minutes (less active)
BOT_LOOP_INTERVAL_MS=1800000
```

---

## ❓ Troubleshooting

### "OPENROUTER_API_KEY not set"

```bash
# Make sure .env exists and has the key
cat .env | grep OPENROUTER
# Should show: OPENROUTER_API_KEY=sk-or-...
```

### "Insufficient funds"

```bash
# Get more testnet BNB
# Visit: https://testnet.bnbchain.org/faucet-smart
```

### "Could not fetch data for token"

```bash
# Token might not be on DexScreener yet
# Try with a different token address
# Or wait and retry
```

### "Trade failed"

Common causes:
- Not enough BNB for gas
- Token has transfer restrictions
- Liquidity too low
- Slippage too high

---

## 🚨 Important Warnings

1. **Start with Testnet**
   - Never use mainnet until thoroughly tested
   - Testnet BNB is free and safe

2. **Use Small Amounts**
   - Keep MAX_TRADE_AMOUNT_BNB low
   - $5-10 max for testing

3. **Monitor Actively**
   - Check logs regularly
   - Don't leave unattended for long periods

4. **Private Keys**
   - NEVER share your private key
   - NEVER commit .env to git
   - Use separate wallet for bot

5. **This is Experimental**
   - AI can make mistakes
   - Past performance ≠ future results
   - Only risk what you can afford to lose

---

## 📈 Next Steps

Once comfortable with testnet:

1. **Deploy Contracts**
   - See `INTEGRATION_GUIDE.md`
   - Deploy $IMMBOT token to testnet
   - Set up staking

2. **Switch to Mainnet** (when ready)
   ```bash
   NETWORK=mainnet
   BNB_RPC=https://bsc-dataseed.bnbchain.org
   ```

3. **Add More Features**
   - Customize AI prompt in `src/prompt.ts`
   - Add more trading strategies
   - Build dashboard frontend

---

## 🤝 Get Help

- **Issues**: https://github.com/caelum0x/immortal-bnb/issues
- **Docs**: See `README.md`, `ARCHITECTURE.md`, `INTEGRATION_GUIDE.md`
- **Base Repo**: https://github.com/hkirat/ai-trading-agent

---

## ✨ What Makes This Special

**"An AI that never forgets"**

Every trade is stored on BNB Greenfield (decentralized storage), creating
a permanent learning history. The AI learns from every trade and gets
smarter over time. Unlike other bots that reset on restart, this bot
has true immortal memory.

---

**Happy Trading! 🚀**

Remember: Start small, trade safe, and let the AI learn!
