# 🚀 Quick Start Guide

Get your Immortal AI Trading Bot running in 10 minutes!

## ✅ What This Bot Does

1. **Fetches market data** from DexScreener for BNB Chain tokens
2. **AI analyzes** data using GPT-4o-mini via OpenRouter
3. **Executes trades** on PancakeSwap when AI has high confidence
4. **Stores memories** on BNB Greenfield for immortal learning
5. **Sends alerts** via Telegram for all actions

**Based on**: https://github.com/hkirat/ai-trading-agent (adapted for BNB Chain)

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

# 2. Install dependencies
npm install

# 3. Create .env file
cp .env.example .env
```

---

## 🔧 Configuration (2 minutes)

Edit `.env` file:

```bash
# REQUIRED: OpenRouter API Key
OPENROUTER_API_KEY=sk-or-your-key-here

# REQUIRED: BNB Wallet
WALLET_PRIVATE_KEY=your-private-key-here
BNB_RPC=https://bsc-testnet.bnbchain.org
NETWORK=testnet

# OPTIONAL: Telegram Alerts
TELEGRAM_BOT_TOKEN=your-bot-token-here
TELEGRAM_CHAT_ID=your-chat-id-here

# Trading Settings (SAFE DEFAULTS)
MAX_TRADE_AMOUNT_BNB=0.05
STOP_LOSS_PERCENTAGE=5
MAX_SLIPPAGE_PERCENTAGE=2
BOT_LOOP_INTERVAL_MS=300000
```

---

## 🎯 Running the Bot (1 minute)

```bash
# Option 1: Run once
npm start

# Option 2: Development mode (auto-reload)
npm run dev

# The bot will:
# 1. Check your BNB balance
# 2. Fetch trending tokens from DexScreener
# 3. Analyze each token with AI
# 4. Execute trades if AI is confident (>70%)
# 5. Store memories on Greenfield
# 6. Send Telegram alerts
# 7. Repeat every 5 minutes
```

---

## 📊 What You'll See

```bash
🚀 Starting Immortal AI Trading Bot...
📍 Network: BNB Chain TESTNET
💰 Wallet Balance: 0.4850 BNB
📈 Fetching trending tokens...
Found 3 trending tokens

🤖 Invocation #1 - Analyzing 0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c
📊 Token: BTCB - Price: $67,234.56 - Volume: $1,245,678.00

📝 Sending prompt to AI...

💭 AI Response:
Based on my analysis of BTCB:

**Market Conditions:**
- Price: $67,234.56 (up +2.3% in 24h)
- Volume: $1.2M (strong interest)
- Liquidity: $890K (sufficient for safe trading)
- Buy/Sell Pressure: 0.45 (bullish accumulation)
- Transactions: 234 buys vs 156 sells

**Decision: HOLD**

While the metrics look decent, this token already has significant
volume and the profit potential for a small trade is limited.
I recommend waiting for a better opportunity with higher potential
upside. Confidence: 60%

✅ Invocation #1 complete

🤖 Invocation #2 - Analyzing 0x...
...

```

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
