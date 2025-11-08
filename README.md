# 🤖 Immortal AI Trading Bot

An autonomous AI trading agent for BNB Chain that learns and evolves through decentralized memory storage.

> **Built on**: Inspired by [hkirat/ai-trading-agent](https://github.com/hkirat/ai-trading-agent) and adapted specifically for BNB Chain with PancakeSwap spot trading and BNB Greenfield immortal memory.

---

## 🌟 Features

- **AI-Powered Trading**: Uses OpenRouter LLMs (GPT-4o-mini) for intelligent trading decisions
- **Immortal Memory**: Stores trade history on BNB Greenfield for persistent learning
- **PancakeSwap Integration**: Automated spot trading on BNB Chain DEX
- **Risk Management**: Built-in stop-loss, position sizing, and safeguards
- **Real-Time Alerts**: Telegram notifications for trades and events
- **$IMMBOT Token**: Utility token with staking rewards from bot profits
- **Learning Loop**: Bot improves by analyzing past successful/failed trades

## 🏗️ Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│ DexScreener │────────▶│   AI Engine  │────────▶│ PancakeSwap │
│  (Market    │         │  (OpenRouter)│         │   (Trades)  │
│   Data)     │         └──────────────┘         └─────────────┘
└─────────────┘                │                          │
                               │                          │
                               ▼                          ▼
                     ┌──────────────────┐      ┌─────────────────┐
                     │ BNB Greenfield   │      │ Smart Contracts │
                     │ (Immortal Memory)│      │   ($IMMBOT)     │
                     └──────────────────┘      └─────────────────┘
```

## 📋 Prerequisites

- **Bun** (v1.0+): Fast JavaScript runtime
- **Node.js** 18+ (alternative to Bun)
- **BNB Chain Wallet**: With testnet BNB for testing
- **API Keys**:
  - OpenRouter API key (https://openrouter.ai)
  - Telegram Bot Token (optional, from @BotFather)

## 🚀 Quick Start

### 1. Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/immortal-bnb.git
cd immortal-bnb

# Install backend dependencies
bun install

# Install frontend dependencies
cd apps/frontend
bun install
cd ../..

# Copy environment template
cp .env.example .env
```

### 2. Configuration

Edit `.env` with your credentials:

```bash
# ===== CRITICAL - REQUIRED FOR BOT TO START =====
# OpenRouter API Key (get from https://openrouter.ai/signup)
OPENROUTER_API_KEY=sk-or-v1-your_actual_key_here

# Your wallet private key (NEVER share this! Use testnet wallet!)
WALLET_PRIVATE_KEY=0xYOUR_ACTUAL_PRIVATE_KEY_HERE

# BNB Chain RPC
RPC_URL_TESTNET=https://opbnb-testnet-rpc.bnbchain.org
RPC_URL_MAINNET=https://bsc-dataseed.binance.org

# ===== NETWORK SELECTION =====
NETWORK=testnet  # Use 'testnet' for testing, 'mainnet' for production
CHAIN_ID=5611    # 5611 for opBNB testnet, 56 for BSC mainnet

# ===== BNB GREENFIELD STORAGE =====
GREENFIELD_BUCKET_NAME=immortal-bot-memories
GREENFIELD_ACCESS_KEY=your_access_key_here
GREENFIELD_SECRET_KEY=your_secret_key_here

# ===== TELEGRAM ALERTS (OPTIONAL) =====
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id

# ===== API SERVER =====
API_PORT=3001
API_KEY=generate_a_secure_random_key_here

# ===== BOT CONFIGURATION =====
MAX_TRADE_AMOUNT_BNB=1.0
STOP_LOSS_PERCENTAGE=10
MAX_SLIPPAGE_PERCENTAGE=2
BOT_LOOP_INTERVAL_MS=300000  # 5 minutes
```

**Important**: The bot validates environment variables on startup and will exit if:
- `WALLET_PRIVATE_KEY` is missing or uses placeholder value
- `OPENROUTER_API_KEY` is missing or uses placeholder value
- `RPC_URL_TESTNET` is missing

### 3. Get Testnet BNB

Get free testnet BNB from the faucet:
- https://testnet.bnbchain.org/faucet-smart

### 4. Run Backend + Frontend

**Terminal 1 - Backend (API Server + Bot)**:
```bash
# Start backend server (includes API + trading bot)
bun run dev

# The backend will:
# 1. Validate environment variables
# 2. Start API server on http://localhost:3001
# 3. Wait for you to start the bot via frontend
```

**Terminal 2 - Frontend Dashboard**:
```bash
# In a new terminal
cd apps/frontend
bun run dev

# Frontend will start on http://localhost:3000
```

### 5. Start Trading

1. Open http://localhost:3000 in your browser
2. Configure trading parameters:
   - Add token addresses to watchlist (or leave empty to auto-discover)
   - Set risk level (1-10)
3. Click "Start Trading Bot"
4. Monitor trades in real-time on the dashboard

**Production Mode**:
```bash
# Build frontend
cd apps/frontend
bun run build
cd ../..

# Run production
bun run start
```

## 🎯 How It Works

### Architecture Overview

The bot uses a **frontend-controlled backend** architecture:

```
Frontend Dashboard (Next.js)
    ↓ (HTTP REST API)
API Server (Express on :3001)
    ↓ (controls)
BotState Manager (Singleton)
    ↓ (triggers)
Background Loop (checks every minute)
    ↓ (executes when conditions met)
Trading Cycle (AI + Blockchain)
```

### Startup Flow

1. **Backend starts** (`bun run dev`)
   - Validates environment variables
   - Starts API server on port 3001
   - Starts background loop (idle state)
   - Waits for frontend to start the bot

2. **Frontend connects** (`http://localhost:3000`)
   - User configures tokens & risk level
   - Clicks "Start Trading Bot"
   - Sends POST to `/api/start-bot`

3. **BotState activated**
   - Stores user configuration
   - Sets running = true
   - Background loop detects change

4. **Trading cycles begin**
   - Bot executes based on configured interval
   - Can be stopped anytime via frontend

### Trading Cycle (Configurable Interval)

When bot is running and interval elapsed:

1. **Check BotState**: Verify bot is still running
2. **Fetch Market Data**: Gets token prices, volume, liquidity from DexScreener
3. **Fetch Memories**: Retrieves past trade outcomes from Greenfield storage
4. **AI Decision**: Analyzes data + memories to decide: buy/sell/hold
5. **Execute Trade**: If confidence > 70%, executes on PancakeSwap
6. **Log to BotState**: Records trade in memory for frontend display
7. **Store Memory**: Records trade details in immortal storage on Greenfield
8. **Alert User**: Sends Telegram notification

### Example AI Decision

```json
{
  "action": "buy",
  "amount": 0.05,
  "confidence": 0.82,
  "reason": "Strong buy pressure (+0.45), high volume ($500K), similar to profitable memory #12",
  "riskLevel": "medium",
  "stopLoss": 0.000098
}
```

### Memory Learning

The bot learns by:
- Storing every trade outcome (profit/loss)
- Analyzing market conditions during success/failure
- Including past memories in future AI prompts
- Adapting strategies based on historical performance

## 💎 $IMMBOT Token

### Token Features

- **Symbol**: IMMBOT
- **Tax**: 2% on transfers (1% burn, 1% liquidity)
- **Utility**: Stake to earn from bot trading profits
- **Governance**: Future DAO voting rights

### Staking Tiers

| Duration | APY  | Min Stake |
|----------|------|-----------|
| 30 days  | 5%   | 1000      |
| 90 days  | 15%  | 1000      |
| 180 days | 30%  | 1000      |
| 365 days | 50%  | 1000      |

### Deploy Contracts

**⚡ Recommended: Foundry (Fastest - One Command!)**

```bash
# 1. Install Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup

# 2. Set private key in .env
WALLET_PRIVATE_KEY=0xYOUR_KEY_HERE

# 3. Get testnet BNB from faucet
# https://testnet.bnbchain.org/faucet-smart

# 4. Deploy with one command
npm run contracts:deploy
# OR
bash scripts/foundry-deploy.sh
```

**Alternative: Remix IDE (Easiest for Beginners)**
- Browser-based, no installation
- Copy contracts to https://remix.ethereum.org
- Deploy manually with MetaMask
- See `DEPLOY_CONTRACTS.md` for step-by-step

**Alternative: Hardhat (Advanced)**
- Requires separate Node.js environment
- See `DEPLOY_CONTRACTS.md` - Option A

**Update `.env` with deployed addresses:**
```bash
IMMBOT_TOKEN_ADDRESS=0x...
STAKING_CONTRACT_ADDRESS=0x...
```

📖 **Detailed guides**:
- **Foundry**: [DEPLOY_WITH_FOUNDRY.md](DEPLOY_WITH_FOUNDRY.md) ⭐ Recommended
- **Remix/Hardhat**: [DEPLOY_CONTRACTS.md](DEPLOY_CONTRACTS.md)
- **Status & Options**: [DEPLOYMENT_STATUS.md](DEPLOYMENT_STATUS.md)

## 📊 Configuration

### Trading Parameters

Edit `src/config.ts`:

```typescript
MAX_TRADE_AMOUNT_BNB: 0.1,        // Max BNB per trade
STOP_LOSS_PERCENTAGE: 5,          // Auto-sell if -5%
MAX_SLIPPAGE_PERCENTAGE: 2,       // Max price slippage
BOT_LOOP_INTERVAL_MS: 300000,     // 5 minutes
```

### Token Watchlist

Add tokens to monitor:

```typescript
DEFAULT_WATCHLIST: [
  '0x...', // Token address 1
  '0x...', // Token address 2
]
```

Or leave empty to auto-track trending tokens.

## 🧪 Testing

### Automated Tests

```bash
# Run all tests
bun test

# Run integration tests
bun test src/__tests__/integration/

# Run smoke tests
bun test src/__tests__/smoke/

# Test specific module
bun test src/agent/aiDecision.test.ts
```

### Manual Testing

Follow the comprehensive manual testing checklist:

```bash
# View testing guide
cat TESTING.md
```

The testing guide covers:
- ✅ Backend API endpoint testing
- ✅ Frontend UI testing
- ✅ Error handling scenarios
- ✅ Performance metrics
- ✅ Security verification
- ✅ Production deployment checks

📖 **Testing guide**: See [TESTING.md](TESTING.md) for complete testing procedures

## 📱 Telegram Setup

1. Create bot: Talk to @BotFather on Telegram
2. Get token: `/newbot` → Follow prompts
3. Get chat ID: Send message to bot, then:
   ```
   https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates
   ```
4. Add to `.env`

## 🛡️ Safety & Security Features

### Trading Safety
- **Stop-Loss**: Auto-sells at configured loss threshold
- **Position Sizing**: Limits based on account balance
- **Cooldowns**: Prevents over-trading same token
- **Rate Limiting**: Respects API limits
- **Gas Estimation**: Checks costs before execution
- **Slippage Protection**: Rejects unfavorable prices

### API Security (Production)
- **Input Validation**: All endpoints validate request parameters
  - Token address format validation (Ethereum addresses)
  - Risk level bounds checking (1-10)
  - Query parameter limits enforcement
- **Rate Limiting**: Protects against abuse and DDoS
  - Bot control: 10 requests/minute
  - General API: 100 requests/15 minutes
  - Read operations: 200 requests/15 minutes
- **CORS Protection**: Restricts frontend origins
- **XSS Protection**: Request sanitization middleware
- **API Key Authentication**: Optional header-based auth

### Deployment Validation

Run pre-deployment checks before going to production:

```bash
npx ts-node scripts/validate-deployment.ts
```

This validates:
- ✅ All required environment variables
- ✅ Critical dependencies installed
- ✅ Security middleware configured
- ✅ Network configuration
- ✅ Deployment readiness

📖 **Production guide**: See [DEPLOYMENT.md](DEPLOYMENT.md) for complete deployment instructions

## 📈 Monitoring

### Logs

Logs are saved in `logs/`:
- `combined.log`: All logs
- `error.log`: Errors only

### Telegram Alerts

Receive notifications for:
- AI decisions
- Trade executions
- Profit/loss outcomes
- Errors and warnings

## 🌐 Frontend Dashboard

### Production Features (NO MOCKS)

The frontend provides **real-time control and monitoring** of the trading bot:

```bash
cd apps/frontend
bun install
bun dev
```

Access at: **http://localhost:3000**

### Dashboard Features

**Control Panel**:
- ✅ Start/Stop bot with one click
- ✅ Configure token watchlist (or auto-discover)
- ✅ Set risk level (1-10 slider)
- ✅ Real-time bot status indicator
- ✅ Backend availability check

**Token Discovery**:
- ✅ Real-time trending tokens from DexScreener
- ✅ Live price, volume, liquidity data
- ✅ Auto-refresh every 2 minutes
- ✅ Copy contract addresses
- ✅ Direct links to DexScreener & PancakeSwap

**Trading Memories**:
- ✅ View all trades stored on BNB Greenfield
- ✅ Filter by outcome (profit/loss/pending)
- ✅ See AI reasoning for each trade
- ✅ Market conditions at time of trade
- ✅ Auto-refresh every minute

**Trading Statistics**:
- ✅ Win rate & profit/loss tracking
- ✅ Total trades executed
- ✅ Best/worst trade history
- ✅ Real-time from backend + Greenfield

### API Endpoints (Backend)

All frontend data comes from the backend API:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/start-bot` | POST | Start trading with config |
| `/api/stop-bot` | POST | Stop trading |
| `/api/bot-status` | GET | Get current bot status |
| `/api/trade-logs` | GET | Get recent trade logs |
| `/api/memories` | GET | Get trades from Greenfield |
| `/api/discover-tokens` | GET | Get trending tokens |
| `/api/trading-stats` | GET | Get performance stats |
| `/health` | GET | Health check |

### Real-Time Updates

The frontend uses **custom polling hooks** for automatic data refresh:
- TradingStats: Refresh every 30 seconds
- MemoriesView: Refresh every 60 seconds
- TokenDiscovery: Refresh every 120 seconds
- BotStatus: Loaded on mount + after actions

**No mock data** - all components show real API data or errors

## 🔗 BNB Hackathon Submission

This bot targets the **Unibase Challenge**:
- ✅ Autonomous AI agent
- ✅ On-chain execution (PancakeSwap)
- ✅ Decentralized memory (Greenfield)
- ✅ Learning/evolution capabilities
- ✅ Token economy ($IMMBOT)

## 🛠️ Development

### Project Structure

```
immortal-bnb/
├── src/
│   ├── agent/          # AI decision engine
│   ├── blockchain/     # Trade execution & memory
│   ├── data/           # Market data fetching
│   ├── utils/          # Helpers & safeguards
│   ├── alerts/         # Telegram notifications
│   ├── config.ts       # Configuration
│   └── index.ts        # Main bot loop
├── contracts/          # Solidity smart contracts
├── apps/frontend/      # Next.js dashboard
├── tests/              # Unit tests
└── logs/               # Runtime logs
```

### Adding New Features

1. **New Trading Strategy**: Modify `src/agent/aiDecision.ts`
2. **Additional DEX**: Create new executor in `src/blockchain/`
3. **Custom Indicators**: Add to `src/data/marketFetcher.ts`

## ⚠️ Disclaimer

**This is experimental software for educational purposes.**

- Use at your own risk
- Start with testnet
- Never invest more than you can afford to lose
- Crypto trading is highly risky
- Bot performance is not guaranteed
- Always do your own research (DYOR)

## 📄 License

MIT License - see LICENSE file

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repo
2. Create feature branch
3. Make changes
4. Submit PR

## 🔗 Links

- **GitHub**: https://github.com/YOUR_USERNAME/immortal-bnb
- **BNB Chain Docs**: https://docs.bnbchain.org
- **PancakeSwap**: https://pancakeswap.finance
- **OpenRouter**: https://openrouter.ai
- **BNB Greenfield**: https://greenfield.bnbchain.org

## 📞 Support

- **Issues**: GitHub Issues
- **Telegram**: [Your community channel]
- **Twitter**: @arhansubasi0

---

Built with ❤️ for the BNB Hackathon 🚀

**"An AI that never forgets"**
