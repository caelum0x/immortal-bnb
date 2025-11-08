# 🎯 Complete Integration Guide

This document explains how all components of the Immortal AI Trading Bot are connected and working together.

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      IMMORTAL AI TRADING BOT                │
└─────────────────────────────────────────────────────────────┘

┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   Frontend   │◄────►│  API Server  │◄────►│   AI Agent   │
│  (React UI)  │      │  (Express)   │      │  (OpenRouter)│
└──────────────┘      └──────────────┘      └──────────────┘
                             │                       │
                             ▼                       ▼
                      ┌──────────────┐      ┌──────────────┐
                      │  PancakeSwap │      │  DexScreener │
                      │   SDK (V3)   │      │     API      │
                      └──────────────┘      └──────────────┘
                             │                       │
                             ▼                       ▼
                      ┌──────────────┐      ┌──────────────┐
                      │   opBNB L2   │      │ BNB Greenfield│
                      │  Blockchain  │      │ (Immortal DB) │
                      └──────────────┘      └──────────────┘
```

## 📦 Component Integration

### 1. **AI Agent Core** (`src/index.ts`)

**Purpose**: Main bot orchestrator
**Integrations**:
- ✅ Calls OpenRouter API for AI decisions
- ✅ Uses PancakeSwap SDK for trading
- ✅ Stores memories on BNB Greenfield
- ✅ Sends Telegram alerts
- ✅ Exposes REST API for frontend

**Key Functions**:
```typescript
startBot()
  ├─ startAPIServer()         // Launch Express API
  ├─ initializeProvider()     // Init PancakeSwap SDK
  ├─ initializeTelegramBot()  // Setup alerts
  └─ main()                    // Trading loop
      ├─ getTrendingTokens()
      ├─ invokeAgent()
      │   ├─ fetchAllMemories()
      │   ├─ AI Decision (tool calling)
      │   ├─ executeTrade()
      │   └─ storeMemory()
      └─ Schedule next run
```

### 2. **PancakeSwap V3 SDK** (`src/blockchain/pancakeSwapIntegration.ts`)

**Purpose**: Execute real trades on-chain
**Features**:
- ✅ Buy tokens with BNB
- ✅ Sell tokens for BNB
- ✅ Automatic pool discovery (fee tiers: 0.05%, 0.3%, 1%)
- ✅ Slippage protection
- ✅ Token approvals
- ✅ Gas optimization

**Usage**:
```typescript
const pancakeSwap = new PancakeSwapV3();

// Buy trade
const result = await pancakeSwap.buyTokenWithBNB(
  '0xTokenAddress',
  0.01,        // 0.01 BNB
  50           // 0.5% slippage (50 basis points)
);

// Sell trade
const result = await pancakeSwap.sellTokenForBNB(
  '0xTokenAddress',
  '1000000',   // Token amount
  50
);
```

### 3. **BNB Greenfield Memory** (`src/blockchain/memoryStorage.ts`)

**Purpose**: Immortal decentralized storage
**Features**:
- ✅ Store trade outcomes permanently
- ✅ Fetch historical trades
- ✅ AI learns from past performance
- ✅ Decentralized (survives server crashes)

**Data Flow**:
```typescript
Trade Execution
    ↓
Create TradeMemory object
    ↓
storeMemory() → BNB Greenfield bucket
    ↓
Returns memory ID
    ↓
AI uses memories for future decisions
```

### 4. **API Server** (`src/api/server.ts`)

**Purpose**: Connect frontend to backend
**Endpoints**:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/status` | GET | Bot status & balance |
| `/api/wallet/balance` | GET | Current BNB balance |
| `/api/trades` | GET | All trade history |
| `/api/trades/:id` | GET | Single trade details |
| `/api/stats` | GET | Performance statistics |
| `/api/token/:address` | GET | Token market data |
| `/api/token/:address/balance` | GET | Token balance |

**Tech Stack**:
- Express.js
- CORS enabled
- JSON responses
- Error handling

### 5. **Frontend Dashboard** (`frontend/src`)

**Purpose**: Visual monitoring and control
**Features**:
- ✅ Real-time trade updates (30s refresh)
- ✅ Performance charts
- ✅ Trade history
- ✅ Win rate statistics
- ✅ Profit/Loss tracking

**API Integration** (`frontend/src/services/api.ts`):
```typescript
import api from './services/api';

// Fetch bot stats
const stats = await api.getStats();
// {totalTrades, winRate, totalProfitLoss, ...}

// Fetch recent trades
const {trades} = await api.getTrades(50);
// [...TradeMemory objects]
```

### 6. **Market Data** (`src/data/marketFetcher.ts`)

**Purpose**: Fetch real-time token data
**Sources**:
- DexScreener API (trending tokens, prices, volume)
- Direct blockchain queries (balances)

**Integration**:
```typescript
getTrendingTokens(3)
    ↓
Returns top 3 trending tokens on BNB Chain
    ↓
getTokenData(address)
    ↓
Returns price, volume, liquidity, buy/sell pressure
    ↓
AI analyzes data and makes decision
```

## 🔄 Complete Trading Flow

### Step-by-Step Execution:

1. **Bot Starts**
   ```
   bun run dev
   ```
   - ✅ API Server starts on port 3001
   - ✅ PancakeSwap SDK initialized
   - ✅ Telegram bot connected
   - ✅ Wallet balance checked

2. **Market Analysis**
   ```
   Every 5 minutes (configurable)
   ```
   - ✅ Fetch trending tokens from DexScreener
   - ✅ Get detailed token data (price, volume, liquidity)
   - ✅ Calculate buy/sell pressure

3. **AI Decision**
   ```
   For each token
   ```
   - ✅ Load past memories from Greenfield
   - ✅ Send enriched prompt to OpenRouter
   - ✅ AI analyzes market + historical performance
   - ✅ Returns decision with confidence score

4. **Trade Execution** (if confidence > 70%)
   ```
   executeTrade()
   ```
   - ✅ Find best liquidity pool (V3 fee tiers)
   - ✅ Calculate trade with SDK
   - ✅ Apply slippage protection
   - ✅ Execute swap on-chain
   - ✅ Wait for confirmation

5. **Memory Storage**
   ```
   storeMemory()
   ```
   - ✅ Create TradeMemory object
   - ✅ Upload to Greenfield bucket
   - ✅ Store memory ID for tracking
   - ✅ Future AI uses this data

6. **Alerts & Monitoring**
   ```
   After each action
   ```
   - ✅ Telegram notification sent
   - ✅ Logs written to console
   - ✅ API endpoints updated
   - ✅ Frontend refreshes data

## 🧪 Testing Integration

### Run Integration Tests:
```bash
# Test all components
bun test-integration.ts

# Test individual trade
bun test-trade.ts 0xTokenAddress

# Run unit tests
bun test
```

### Manual Testing:

1. **Start Backend**
   ```bash
   bun run dev
   ```

2. **Check API Health**
   ```bash
   curl http://localhost:3001/api/health
   ```

3. **Start Frontend** (separate terminal)
   ```bash
   cd frontend
   bun install
   bun run dev
   ```

4. **View Dashboard**
   ```
   Open http://localhost:3000
   ```

## 🔧 Configuration

### Environment Variables:

**Backend** (`.env`):
```bash
# Core
WALLET_PRIVATE_KEY=0x...
OPENROUTER_API_KEY=sk-or-...

# Network (choose one)
TRADING_NETWORK=opbnb    # or 'bnb'

# Greenfield
GREENFIELD_RPC_URL=https://gnfd-testnet-fullnode-tendermint-ap.bnbchain.org
GREENFIELD_BUCKET_NAME=immortal-bot-memory

# API
API_PORT=3001

# Telegram (optional)
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...
```

**Frontend** (`frontend/.env`):
```bash
VITE_API_URL=http://localhost:3001
```

## 📊 Data Flow Diagram

```
User Starts Bot
      │
      ▼
┌─────────────┐
│ src/index.ts│
└─────────────┘
      │
      ├─► startAPIServer() ──► Express on :3001
      │                              │
      │                              ▼
      │                    Frontend connects via api.ts
      │
      ├─► initializeProvider() ──► PancakeSwapV3 ready
      │
      ├─► initializeTelegramBot() ──► Alerts ready
      │
      └─► main() loop every 5 min
            │
            ├─► getTrendingTokens()
            │        │
            │        ▼
            │   DexScreener API
            │
            ├─► fetchAllMemories()
            │        │
            │        ▼
            │   BNB Greenfield bucket
            │
            ├─► invokeAgent(token)
            │        │
            │        ├─► OpenRouter AI
            │        │        │
            │        │        ▼
            │        │   Decision + Confidence
            │        │
            │        └─► executeTrade()
            │                 │
            │                 ├─► PancakeSwapV3.buyTokenWithBNB()
            │                 │        │
            │                 │        ▼
            │                 │   opBNB Blockchain
            │                 │
            │                 └─► storeMemory()
            │                          │
            │                          ▼
            │                     Greenfield bucket
            │
            └─► alertTradeExecution()
                     │
                     ▼
                Telegram notification
```

## 🚀 Deployment

### Local Development:
```bash
# Terminal 1: Backend + Bot
bun install
cp .env.example .env
# Edit .env with your keys
bun run dev

# Terminal 2: Frontend
cd frontend
bun install
cp .env.example .env
bun run dev
```

### Docker Deployment:
```bash
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f bot

# Stop
docker-compose down
```

### Production Checklist:
- [ ] Set `NETWORK=mainnet` in .env
- [ ] Use `TRADING_NETWORK=opbnb` for cheaper gas
- [ ] Set proper `MAX_TRADE_AMOUNT_BNB`
- [ ] Configure Telegram alerts
- [ ] Test with small amounts first
- [ ] Monitor Greenfield storage costs
- [ ] Set up monitoring/alerting

## 🔍 Monitoring

### Logs:
```bash
# View bot logs
tail -f logs/app.log

# Docker logs
docker-compose logs -f bot
```

### API Endpoints:
```bash
# Bot status
curl http://localhost:3001/api/status

# Recent trades
curl http://localhost:3001/api/trades?limit=10

# Statistics
curl http://localhost:3001/api/stats
```

### Frontend:
- Real-time updates every 30 seconds
- Performance charts
- Trade history
- Win rate tracking

## 📚 File Structure

```
immortal-bnb/
├─ src/
│  ├─ index.ts                          # Main entry point ⭐
│  ├─ api/
│  │  └─ server.ts                      # Express API server ⭐
│  ├─ blockchain/
│  │  ├─ pancakeSwapIntegration.ts     # PancakeSwap V3 SDK ⭐
│  │  ├─ tradeExecutor.ts              # Trade execution logic
│  │  └─ memoryStorage.ts              # Greenfield integration ⭐
│  ├─ data/
│  │  └─ marketFetcher.ts              # DexScreener API
│  ├─ agent/
│  │  └─ learningLoop.ts               # AI learning types
│  └─ alerts/
│     └─ telegramBot.ts                # Telegram notifications
├─ frontend/
│  └─ src/
│     ├─ App.tsx                        # Main UI ⭐
│     ├─ services/
│     │  └─ api.ts                      # Backend API client ⭐
│     └─ components/
│        ├─ PerformanceChart.tsx
│        └─ RecentInvocations.tsx
├─ test-trade.ts                        # Trade testing script ⭐
├─ test-integration.ts                  # Integration tests ⭐
└─ .env                                 # Configuration

⭐ = Critical integration points
```

## ✅ Integration Checklist

All components are now connected:

- [x] AI Agent (OpenRouter) → Trade Executor
- [x] Trade Executor → PancakeSwap V3 SDK
- [x] PancakeSwap SDK → opBNB Blockchain
- [x] Trade Executor → Memory Storage
- [x] Memory Storage → BNB Greenfield
- [x] Memory Storage → AI Agent (learning)
- [x] Trade Executor → Telegram Alerts
- [x] API Server → All Backend Services
- [x] Frontend → API Server
- [x] Market Fetcher → DexScreener API
- [x] All components → Configuration (.env)

## 🎉 You're Ready!

Everything is connected and working together. Run:

```bash
bun test-integration.ts    # Verify all integrations
bun run dev                # Start the bot
```

Then open `http://localhost:3000` to see the dashboard!
