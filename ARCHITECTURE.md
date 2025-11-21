# 🏗️ Architecture: Immortal AI Trading Bot

## Overview

This project is built on top of [hkirat/ai-trading-agent](https://github.com/hkirat/ai-trading-agent) and adapted specifically for **BNB Chain** with **immortal memory** capabilities.

**BNB Immortal Trader** is a comprehensive multi-platform trading system that integrates:
- **DEX Trading** (PancakeSwap on BNB/opBNB)
- **Prediction Markets** (Polymarket on Polygon)
- **AI Agents** (TypeScript + Python with RAG)
- **Cross-Platform Strategies** (Arbitrage, hedging)
- **Immortal Memory** (BNB Greenfield storage)

## Key Differences from Base Repo

### Base Repo (hkirat/ai-trading-agent)
- **Protocol**: Lighter (perpetual futures)
- **Leverage**: 5-10x leveraged positions
- **Storage**: Prisma database (centralized)
- **Trading**: Perpetual contracts
- **Platform**: Multi-chain support

### Our Implementation (Immortal Bot)
- **Protocol**: PancakeSwap (spot trading)
- **Leverage**: No leverage (safer for AI)
- **Storage**: BNB Greenfield (decentralized "immortal memory")
- **Trading**: Spot tokens only
- **Platform**: BNB Chain focused

## Architecture Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                     USER INTERFACE LAYER                        │
│  • Next.js Dashboard (wallet connect, settings)                 │
│  • Telegram Alerts (real-time notifications)                    │
│  • WebSocket Real-time Updates                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    SERVICE ORCHESTRATION LAYER                  │
│  • AI Orchestrator (routes to TS/Python agents)                 │
│  • WebSocket Manager (real-time event broadcasting)             │
│  • Order Monitoring Service (LIMIT/STOP orders)                 │
│  • Price Feed Service (multi-source aggregation)                │
│  • Risk Management Service (portfolio validation)               │
│  • Analytics Service (performance tracking)                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    AI DECISION LAYER                            │
│  • OpenRouter API (GPT-4o-mini)                                 │
│  • TypeScript Agent (fast DEX decisions)                        │
│  • Python Agents (research, RAG, web search)                    │
│  • Decision Engine (src/agent/aiDecision.ts)                    │
│  • Learning Loop (src/agent/learningLoop.ts)                    │
│  • Polymarket AI Analysis                                       │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    DATA LAYER                                   │
│  • DexScreener API (market data)                                │
│  • Price Feed Service (multi-source)                            │
│  • Polymarket CLOB API                                          │
│  • Price tracking, volume, liquidity                            │
│  • Token analytics (src/data/marketFetcher.ts)                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    EXECUTION LAYER                              │
│  • PancakeSwap V2 Router (DEX trading)                          │
│  • Polymarket CLOB (prediction markets)                         │
│  • Ethers.js (blockchain interaction)                           │
│  • Trade Executor (src/blockchain/tradeExecutor.ts)             │
│  • Order Monitoring (execution tracking)                        │
│  • Gas optimization                                             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    IMMORTAL MEMORY LAYER                        │
│  • BNB Greenfield SDK                                           │
│  • Decentralized storage                                        │
│  • Memory Storage (src/blockchain/memoryStorage.ts)             │
│  • Prisma Database (trade history, analytics)                   │
│  • On-chain verification                                        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    SAFETY LAYER                                 │
│  • Risk Management Service (portfolio limits)                   │
│  • Stop-loss automation (Order Monitoring)                      │
│  • Position sizing validation                                   │
│  • Rate limiting                                                │
│  • Circuit Breakers (resilience)                                │
│  • Safeguards (src/utils/safeguards.ts)                         │
└─────────────────────────────────────────────────────────────────┘
```

## Core Innovation: Immortal Memory

### Problem with Traditional Bots
- Lose all learning when restarted
- No long-term strategy evolution
- Can't learn from community trades

### Our Solution: BNB Greenfield Storage
```typescript
// Every trade creates an immortal record
const memory = {
  timestamp: Date.now(),
  token: "GIGGLE",
  action: "buy",
  entryPrice: 0.00123,
  exitPrice: 0.00145,
  outcome: "profit", // +18%
  marketConditions: { volume, liquidity, pressure },
  lessons: "High buy pressure + trending = win"
};

// Store on-chain (permanent, verifiable)
await storeMemory(memory); // → Greenfield

// Later, AI learns from it
const pastTrades = await fetchMemories();
// AI: "This looks like memory #45 which was profitable..."
```

### Why Greenfield vs Database?
| Feature | Greenfield | Database (Prisma) |
|---------|-----------|-------------------|
| Decentralized | ✅ Yes | ❌ No (server-dependent) |
| Immortal | ✅ Permanent | ❌ Can be deleted |
| Verifiable | ✅ On-chain proof | ❌ Trust required |
| BNB Native | ✅ Yes | ❌ Separate infra |
| Hackathon Fit | ✅ Perfect | ❌ Not Web3-native |

## Data Flow: Complete Trade Lifecycle

### DEX Trading Flow (BNB Chain)
```
1. MARKET SCAN (every 5 min)
   ├─> DexScreener API (via marketFetcher.ts)
   ├─> Price Feed Service (multi-source aggregation)
   ├─> Fetch trending tokens
   └─> Get prices, volume, liquidity

2. AI ANALYSIS
   ├─> AI Orchestrator routes to TypeScript Agent (fast)
   ├─> Load past memories from Greenfield
   ├─> Format prompt with data + memories
   ├─> Call OpenRouter (GPT-4o-mini)
   └─> Get decision: buy/sell/hold

3. RISK VALIDATION
   ├─> Risk Management Service (portfolio analysis)
   ├─> Check balance (src/utils/safeguards.ts)
   ├─> Validate trade amount
   ├─> Ensure liquidity > $10K
   └─> Apply cooldowns

4. EXECUTION (if approved)
   ├─> Trade Executor → PancakeSwap Router
   ├─> Order Monitoring Service (tracks order)
   ├─> Ethers.js signs transaction
   ├─> Monitor for confirmation
   └─> Record gas used

5. MEMORY CREATION
   ├─> Create trade memory object
   ├─> Upload to Greenfield (memoryStorage.ts)
   ├─> Analytics Service (records metrics)
   ├─> Get memory ID
   └─> Track in active positions

6. MONITORING
   ├─> Order Monitoring Service (checks LIMIT/STOP orders)
   ├─> Check stop-loss every cycle
   ├─> If triggered → auto-sell
   ├─> Update memory with outcome
   └─> Calculate P/L

7. LEARNING
   ├─> Fetch updated memories
   ├─> Analytics Service (analyzes patterns)
   ├─> Feed into next AI decision
   └─> Continuous improvement!
```

### Polymarket Trading Flow (Polygon)
```
1. MARKET DISCOVERY
   ├─> Polymarket Real-Time Service (WebSocket)
   ├─> Market Data Fetcher (aggregates markets)
   └─> AI Prediction Analyzer (identifies opportunities)

2. AI ANALYSIS
   ├─> AI Orchestrator routes to Python Agent (research needed)
   ├─> Python Agents (RAG, web search, news)
   ├─> Agents Client → FastAPI microservice
   └─> Get decision: BUY/SELL/HOLD with confidence

3. RISK VALIDATION
   ├─> Risk Management Service (cross-platform risk)
   ├─> Check USDC balance
   └─> Validate position size

4. EXECUTION
   ├─> Polymarket Client → CLOB API
   ├─> Order Monitoring Service (tracks prediction market orders)
   ├─> Execute trade on Polygon
   └─> Record transaction

5. MEMORY CREATION
   ├─> Polymarket Storage → Greenfield
   ├─> Store bet outcome, market conditions
   └─> Analytics Service (tracks Polymarket performance)

6. MONITORING
   ├─> Real-Time Service (monitors market resolution)
   ├─> Update positions as markets resolve
   └─> Calculate P/L when outcome determined
```

## Directory Structure & Connections

### Complete Directory Map

```
immortal-bnb-1/
│
├── 📁 src/                          # Core Backend Logic
│   ├── 📁 agent/                    # AI Decision Layer
│   │   ├── aiDecision.ts           → Uses: config, logger, memoryStorage, marketFetcher
│   │   └── learningLoop.ts         → Uses: memoryStorage, types
│   │
│   ├── 📁 ai/                       # Advanced AI Systems
│   │   ├── immortalAgent.ts        → Uses: memoryStorage, llmInterface, config
│   │   ├── llmInterface.ts          → Uses: config, prompt
│   │   ├── orchestrator.ts        → Uses: immortalAgent, tradeExecutor
│   │   ├── tradingOrchestrator.ts  → Uses: immortalAgent, marketFetcher
│   │   ├── crossChainStrategy.ts   → Uses: config, marketFetcher
│   │   └── strategyEvolution.ts    → Uses: memoryStorage, immortalAgent
│   │
│   ├── 📁 blockchain/               # Blockchain Interactions
│   │   ├── tradeExecutor.ts         → Uses: pancakeSwapIntegration, safeguards, config
│   │   ├── memoryStorage.ts         → Uses: greenfield SDK, config, logger
│   │   ├── pancakeSwapIntegration.ts → Uses: ethers, pancakeswap SDK, config
│   │   ├── tokenDiscovery.ts        → Uses: marketFetcher, config
│   │   ├── dynamicTokenDiscovery.ts → Uses: marketFetcher, config
│   │   ├── smartTradingEngine.ts    → Uses: tradeExecutor, safeguards
│   │   └── crossChain.ts            → Uses: wormholeService, config
│   │
│   ├── 📁 data/                     # Market Data Layer
│   │   ├── marketFetcher.ts         → Uses: node-fetch, config, logger
│   │   ├── dynamicMarketFetcher.ts   → Uses: marketFetcher, config
│   │   └── enhancedMarketFetcher.ts  → Uses: marketFetcher, config
│   │
│   ├── 📁 api/                      # REST API Server
│   │   ├── server.ts                → Uses: bot-state, tradeExecutor, memoryStorage
│   │   ├── crossChainRoutes.ts      → Uses: crossChain, config
│   │   └── telegramRoutes.ts        → Uses: telegramBot, config
│   │
│   ├── 📁 alerts/                   # Notifications
│   │   └── telegramBot.ts           → Uses: telegraf, config, logger
│   │
│   ├── 📁 utils/                    # Shared Utilities
│   │   ├── logger.ts                → Uses: winston, config
│   │   ├── safeguards.ts            → Uses: config, logger
│   │   ├── errorHandler.ts          → Uses: logger
│   │   └── retry.ts                 → Uses: logger
│   │
│   ├── 📁 polymarket/               # Polymarket Integration Service
│   │   ├── polymarketClient.ts      → Uses: @polymarket/clob-client
│   │   ├── unifiedWalletManager.ts  → Uses: proxyWalletClient, safeWalletClient
│   │   ├── aiPredictionAnalyzer.ts  → Uses: llmInterface, config
│   │   ├── polymarketApiRoutes.ts   → REST API routes for Polymarket
│   │   ├── realTimeService.ts       → Real-time market data streaming
│   │   ├── marketDataFetcher.ts     → Market data aggregation
│   │   ├── crossPlatformStrategy.ts → Cross-platform arbitrage
│   │   ├── polymarketStorage.ts     → Greenfield storage for bets
│   │   └── ... (15+ files)          → Full Polymarket trading suite
│   │
│   ├── 📁 agent/                     # TypeScript AI Agent Service
│   │   ├── aiDecision.ts            → Core decision engine
│   │   └── learningLoop.ts          → Learning from outcomes
│   │
│   ├── 📁 services/                 # Core Business Services
│   │   ├── polymarketAgentOrchestrator.ts → Python agents integration
│   │   ├── agentsClient.ts          → Python FastAPI bridge (RAG, web search)
│   │   ├── pythonBridge.ts          → Python microservice communication
│   │   ├── tradingLoop.ts            → Uses: immortalAgent, tradeExecutor
│   │   ├── positionManager.ts       → Uses: tradeExecutor, memoryStorage
│   │   ├── orderMonitoringService.ts → Order lifecycle management
│   │   ├── priceFeedService.ts      → Real-time price aggregation
│   │   ├── riskManagementService.ts → Portfolio risk analysis
│   │   ├── analyticsService.ts      → Trading analytics & insights
│   │   ├── contractService.ts       → Smart contract interactions
│   │   ├── metricsService.ts        → Performance metrics
│   │   ├── webSocketManager.ts      → Real-time WebSocket updates
│   │   └── clobClient.ts            → Polymarket CLOB direct access
│   │
│   ├── index.ts                     # Main Entry Point
│   │   → Imports: All core modules above
│   │   → Orchestrates: Bot lifecycle, trading loop
│   │
│   ├── config.ts                    # Configuration (Used by EVERYTHING)
│   ├── prompt.ts                    # AI Prompt Templates
│   └── bot-state.ts                 # State Management (Used by API)
│
├── 📁 frontend/                     # Next.js Dashboard
│   ├── 📁 app/                      # Next.js App Router Pages
│   │   ├── page.tsx                 → Uses: lib/api.ts, components
│   │   ├── dashboard/page.tsx       → Uses: components/dashboard/
│   │   └── memory/page.tsx         → Uses: components/MemoriesView.tsx
│   │
│   ├── 📁 components/               # React Components
│   │   ├── dashboard/               → Uses: hooks/useBot.ts, lib/api.ts
│   │   ├── MemoriesView.tsx        → Uses: lib/api.ts (GET /api/memories)
│   │   └── TokenDiscovery.tsx      → Uses: lib/api.ts (GET /api/discover-tokens)
│   │
│   ├── 📁 lib/                      # Frontend Utilities
│   │   ├── api.ts                   → Connects to: http://localhost:3001/api/*
│   │   └── apiClient.ts             → HTTP client for backend
│   │
│   └── 📁 hooks/                     # React Hooks
│       ├── useBot.ts                → Uses: lib/api.ts
│       └── usePolling.ts            → Auto-refresh data
│
├── 📁 contracts/                    # Smart Contracts
│   ├── IMMBotToken.sol              # ERC20 Token
│   └── Staking.sol                  # Staking Contract
│
├── 📁 tests/                        # Test Files
│   └── *.test.ts                    → Tests: src/** modules
│
├── 📁 scripts/                      # Utility Scripts
│   └── *.ts                         → Uses: src/** modules
│
├── index.ts                         # Alternative Entry (uses src/index.ts)
├── start-bot.ts                     # Startup Script
└── config.ts                        # Root Config (re-exports src/config.ts)
```

### Component Dependency Graph

```
┌─────────────────────────────────────────────────────────────┐
│                    ENTRY POINTS                             │
├─────────────────────────────────────────────────────────────┤
│  index.ts / start-bot.ts                                    │
│    ↓                                                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  src/index.ts (Main Orchestrator)                     │  │
│  │    ├─> ImmortalAIAgent                                │  │
│  │    ├─> TradeExecutor                                  │  │
│  │    ├─> startAPIServer()                               │  │
│  │    └─> initializeStorage()                            │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              CORE COMPONENTS (src/)                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐      ┌──────────────┐                  │
│  │  config.ts   │◄─────┤  EVERYTHING  │                  │
│  │  (Central)   │      │  (Imports)    │                  │
│  └──────────────┘      └──────────────┘                  │
│         │                                                   │
│         ├─> ai/immortalAgent.ts                            │
│         │     ├─> Uses: memoryStorage, llmInterface       │
│         │     └─> Uses: marketFetcher (via orchestrator) │
│         │                                                   │
│         ├─> blockchain/tradeExecutor.ts                    │
│         │     ├─> Uses: pancakeSwapIntegration            │
│         │     ├─> Uses: utils/safeguards                  │
│         │     └─> Uses: utils/logger                      │
│         │                                                   │
│         ├─> blockchain/memoryStorage.ts                    │
│         │     ├─> Uses: @bnb-chain/greenfield-js-sdk      │
│         │     └─> Uses: config, logger                     │
│         │                                                   │
│         ├─> data/marketFetcher.ts                          │
│         │     ├─> Uses: node-fetch (DexScreener API)       │
│         │     └─> Uses: config, logger                     │
│         │                                                   │
│         └─> api/server.ts                                  │
│               ├─> Uses: bot-state.ts                       │
│               ├─> Uses: tradeExecutor                       │
│               └─> Uses: memoryStorage                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              FRONTEND (frontend/)                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  frontend/lib/api.ts                                 │  │
│  │    └─> HTTP Client                                   │  │
│  │         └─> Connects to: http://localhost:3001/api/* │  │
│  └──────────────────────────────────────────────────────┘  │
│         │                                                   │
│         ├─> components/dashboard/                           │
│         │     └─> Uses: hooks/useBot.ts                    │
│         │           └─> Uses: lib/api.ts                    │
│         │                                                   │
│         └─> app/page.tsx (Next.js Pages)                  │
│               └─> Uses: components/**                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Frontend ↔ Backend Connection Flow

```
┌─────────────────────────────────────────────────────────────┐
│  FRONTEND (Next.js - Port 3000)                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  User Action (Click "Start Bot")                            │
│    ↓                                                         │
│  frontend/lib/api.ts                                        │
│    └─> POST http://localhost:3001/api/start-bot            │
│         { tokens: [...], riskLevel: 5 }                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                            ↓ HTTP REST
┌─────────────────────────────────────────────────────────────┐
│  BACKEND API (Express - Port 3001)                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  src/api/server.ts                                          │
│    ├─> POST /api/start-bot                                 │
│    │     └─> BotState.start(config)                         │
│    │           └─> Sets: running = true                     │
│    │                                                         │
│    ├─> GET /api/bot-status                                 │
│    │     └─> BotState.getStatus()                          │
│    │           └─> Returns: { running, config, stats }    │
│    │                                                         │
│    ├─> GET /api/memories                                    │
│    │     └─> memoryStorage.fetchAllMemories()              │
│    │           └─> Queries: BNB Greenfield                 │
│    │                                                         │
│    └─> GET /api/trade-logs                                  │
│          └─> BotState.getTradeLogs()                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  BOT STATE & TRADING LOOP                                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  src/bot-state.ts (Singleton)                              │
│    ├─> Stores: running, config, tradeLogs                  │
│    └─> Used by: src/index.ts (trading loop)                │
│                                                             │
│  src/index.ts (Main Loop)                                   │
│    └─> Checks: BotState.isRunning()                         │
│         └─> If true: Execute trading cycle                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow Between Directories

```
┌─────────────────────────────────────────────────────────────┐
│  TRADING CYCLE (Every 5 minutes)                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. src/index.ts (Main Loop)                                │
│     │                                                       │
│     ├─> src/data/marketFetcher.ts                          │
│     │     └─> Fetches: DexScreener API                     │
│     │           └─> Returns: Token prices, volume          │
│     │                                                       │
│     ├─> src/blockchain/memoryStorage.ts                     │
│     │     └─> Fetches: BNB Greenfield                      │
│     │           └─> Returns: Past trade memories           │
│     │                                                       │
│     ├─> src/ai/immortalAgent.ts                            │
│     │     ├─> Input: Market data + Memories                │
│     │     ├─> Uses: src/ai/llmInterface.ts                 │
│     │     │     └─> Calls: OpenRouter API (GPT-4o-mini)   │
│     │     └─> Returns: Decision (BUY/SELL/HOLD)            │
│     │                                                       │
│     ├─> src/utils/safeguards.ts                            │
│     │     └─> Validates: Trade amount, balance             │
│     │                                                       │
│     ├─> src/blockchain/tradeExecutor.ts                     │
│     │     ├─> Uses: src/blockchain/pancakeSwapIntegration  │
│     │     │     └─> Executes: PancakeSwap swap            │
│     │     └─> Returns: Transaction hash                   │
│     │                                                       │
│     └─> src/blockchain/memoryStorage.ts                     │
│           └─> Stores: Trade outcome → BNB Greenfield      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  FRONTEND UPDATES (Polling every 30s)                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  frontend/components/dashboard/                            │
│    └─> hooks/usePolling.ts                                 │
│          └─> GET /api/bot-status (every 30s)               │
│                └─> Updates: UI state                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Service Integration Summary

| Service | Location | Purpose | Initialized In | Used By |
|---------|---------|---------|----------------|---------|
| **Agent Services** |
| `TypeScript Agent` | `src/agent/` | Fast DEX trading decisions | `src/index.ts` | Trading loop, API |
| `Python Agents` | `agents/` (submodule) | RAG, research, Polymarket | `polymarketAgentOrchestrator.ts` | Polymarket trading |
| `AI Orchestrator` | `src/ai/orchestrator.ts` | Routes to TS/Python agents | `api-server.ts` | Decision routing |
| **Polymarket Services** |
| `Polymarket Client` | `src/polymarket/polymarketClient.ts` | CLOB API integration | `api-server.ts` | Polymarket trading |
| `Real-Time Service` | `src/polymarket/realTimeService.ts` | WebSocket market data | `api/server.ts` | Live updates |
| `Market Data Fetcher` | `src/polymarket/marketDataFetcher.ts` | Market aggregation | `api-server.ts` | Analysis |
| `Agent Orchestrator` | `src/services/polymarketAgentOrchestrator.ts` | Python agent manager | `api-server.ts` | Agent lifecycle |
| `Agents Client` | `src/services/agentsClient.ts` | FastAPI bridge | `api-server.ts` | RAG, web search |
| **Trading Services** |
| `Order Monitoring` | `src/services/orderMonitoringService.ts` | Order lifecycle | `api-server.ts` | Order management |
| `Price Feed` | `src/services/priceFeedService.ts` | Multi-source prices | `api-server.ts` | Price data |
| `Risk Management` | `src/services/riskManagementService.ts` | Portfolio risk | `api-server.ts` | Risk analysis |
| `Analytics` | `src/services/analyticsService.ts` | Performance metrics | `api-server.ts` | Dashboard |
| `Contract Service` | `src/services/contractService.ts` | Smart contracts | `api-server.ts` | Token, staking |
| **Infrastructure** |
| `WebSocket Manager` | `src/services/webSocketManager.ts` | Real-time updates | `api-server.ts` | All services |
| `Metrics Service` | `src/services/metricsService.ts` | Prometheus metrics | `api-server.ts` | Monitoring |
| `Tracing` | `src/monitoring/tracing.ts` | OpenTelemetry | `api-server.ts` | Observability |

### Import Relationships Summary

| Module | Imports From | Used By |
|--------|-------------|---------|
| `src/config.ts` | `dotenv`, `ethers` | **Everything** (central config) |
| `src/index.ts` | All core modules | Entry point |
| `src/ai/immortalAgent.ts` | `memoryStorage`, `llmInterface`, `config` | `index.ts`, `orchestrator.ts` |
| `src/ai/orchestrator.ts` | `immortalAgent`, `pythonBridge` | Routes decisions to agents |
| `src/agent/aiDecision.ts` | `config`, `logger`, `memoryStorage` | Fast DEX decisions |
| `src/blockchain/tradeExecutor.ts` | `pancakeSwapIntegration`, `safeguards`, `config` | `index.ts`, `api/server.ts` |
| `src/blockchain/memoryStorage.ts` | `@bnb-chain/greenfield-js-sdk`, `config` | `immortalAgent`, `api/server.ts` |
| `src/data/marketFetcher.ts` | `node-fetch`, `config` | `index.ts`, `tokenDiscovery.ts` |
| `src/polymarket/polymarketClient.ts` | `@polymarket/clob-client` | `api-server.ts`, `polymarketAgentOrchestrator.ts` |
| `src/services/polymarketAgentOrchestrator.ts` | `agents/` submodule | `api-server.ts` |
| `src/services/agentsClient.ts` | Python FastAPI | `api-server.ts`, `orchestrator.ts` |
| `src/api/server.ts` | `bot-state`, `tradeExecutor`, `memoryStorage` | Frontend (HTTP) |
| `src/api-server.ts` | All services | Main API server |
| `src/bot-state.ts` | `config`, `logger` | `api/server.ts`, `index.ts` |
| `frontend/lib/api.ts` | `fetch` API | All frontend components |
| `frontend/components/**` | `lib/api.ts`, `hooks/**` | Next.js pages |

### Key Connection Points

1. **Config Hub**: `src/config.ts` is imported by virtually every module
2. **State Management**: `src/bot-state.ts` connects API server ↔ Trading loop
3. **Memory Bridge**: `src/blockchain/memoryStorage.ts` connects AI ↔ Greenfield
4. **Trading Bridge**: `src/blockchain/tradeExecutor.ts` connects AI ↔ PancakeSwap
5. **API Bridge**: `src/api/server.ts` connects Frontend ↔ Backend
6. **Data Bridge**: `src/data/marketFetcher.ts` connects Bot ↔ DexScreener

### External Service Connections

```
┌─────────────────────────────────────────────────────────────┐
│  EXTERNAL SERVICES                                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  DexScreener API                                            │
│    ↑                                                         │
│    └─ src/data/marketFetcher.ts                             │
│                                                             │
│  OpenRouter API (GPT-4o-mini)                               │
│    ↑                                                         │
│    └─ src/ai/llmInterface.ts                                │
│                                                             │
│  BNB Greenfield (Storage)                                    │
│    ↑                                                         │
│    └─ src/blockchain/memoryStorage.ts                       │
│                                                             │
│  PancakeSwap (DEX)                                          │
│    ↑                                                         │
│    └─ src/blockchain/pancakeSwapIntegration.ts             │
│                                                             │
│  Telegram Bot API                                            │
│    ↑                                                         │
│    └─ src/alerts/telegramBot.ts                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## External Dependencies

### Core (Required)
- **ethers.js**: BNB Chain interaction
- **@pancakeswap/sdk**: DEX integration
- **@bnb-chain/greenfield-js-sdk**: Immortal memory
- **node-fetch**: API calls
- **winston**: Logging
- **telegraf**: Telegram alerts
- **dotenv**: Configuration

### Frontend (Optional)
- **next.js**: Dashboard
- **wagmi**: Wallet connection
- **@rainbow-me/rainbowkit**: UI for wallets

### Development
- **typescript**: Type safety
- **bun**: Fast runtime (or Node.js)

## Smart Contracts

### $IMMBOT Token (contracts/IMMBotToken.sol)
```solidity
contract IMMBotToken is ERC20, Ownable {
  // 2% tax on transfers
  // 1% → burn (deflationary)
  // 1% → liquidity pool

  // Powers:
  // - Stake to earn from bot profits
  // - Future: Governance votes
  // - Future: Premium bot features
}
```

### Staking (contracts/Staking.sol)
```solidity
contract IMMBotStaking {
  // 4 tiers:
  // 30d = 5% APY
  // 90d = 15% APY
  // 180d = 30% APY
  // 365d = 50% APY

  // Rewards come from bot trading fees
  // Early withdrawal = 50% penalty
}
```

## Configuration System

### Environment Variables (.env)
```bash
# AI
OPENROUTER_API_KEY=sk-xxx

# Blockchain
BNB_RPC=https://bsc-testnet.bnbchain.org
WALLET_PRIVATE_KEY=0xxx

# Trading
MAX_TRADE_AMOUNT_BNB=0.1
STOP_LOSS_PERCENTAGE=5
MAX_SLIPPAGE_PERCENTAGE=2

# Alerts
TELEGRAM_BOT_TOKEN=xxx
TELEGRAM_CHAT_ID=xxx

# Network
NETWORK=testnet  # or mainnet
```

### Runtime Config (src/config.ts)
- Validates env vars
- Sets defaults
- Exports typed constants
- Includes contract addresses

## Security Measures

### 1. Input Validation
- Trade amounts within limits
- Token addresses checksummed
- Slippage bounds enforced

### 2. Rate Limiting
- API calls: 10/minute
- Trades: 30min cooldown per token
- Gas estimation before execution

### 3. Error Handling
- Try-catch everywhere
- Graceful degradation
- Retry logic with exponential backoff

### 4. Stop-Loss
- Automatic at -5% (configurable)
- Monitors every cycle
- No manual intervention needed

### 5. Key Management
- Private keys in .env (never committed)
- Separate testnet/mainnet wallets
- Read-only for balance checks

## Testing Strategy

### Unit Tests (tests/)
- AI decision logic
- Risk calculations
- Memory formatting

### Integration Tests
- PancakeSwap swaps (testnet)
- Greenfield upload/fetch
- End-to-end trade flow

### Manual Testing
1. Deploy to testnet
2. Fund with 0.1 test BNB
3. Add trending token to watchlist
4. Monitor logs for AI decisions
5. Verify trades on BscScan
6. Check memories on Greenfield

## Deployment

### Development
```bash
npm run dev  # Auto-reload on changes
```

### Production
```bash
npm run build
npm start

# Or Docker:
docker build -t immortal-bot .
docker run -d --env-file .env immortal-bot
```

### Monitoring
- Logs: `logs/combined.log`
- Errors: `logs/error.log`
- Telegram: Real-time alerts
- Dashboard: http://localhost:3000

## Performance Considerations

### Efficiency
- Parallel API calls where possible
- Caching market data (2min TTL)
- Batch memory fetches
- Gas optimization (estimate before send)

### Scalability
- Stateless bot (can run multiple instances)
- Greenfield = unlimited storage
- Rate limiting prevents API abuse
- Modular = easy to add features

## Future Enhancements

### Phase 2 (Post-Hackathon)
- [ ] Perpetual trading (Aster DEX integration)
- [ ] Cross-chain arbitrage (Wormhole)
- [ ] DAO governance via $IMMBOT
- [ ] Community memory pool (shared learning)
- [ ] Advanced strategies (grid, DCA)
- [ ] Mobile app (React Native)

### Phase 3 (Long-term)
- [ ] Multi-agent coordination
- [ ] Sentiment analysis (Twitter, Discord)
- [ ] Predictive modeling (LSTM + LLM)
- [ ] MEV protection
- [ ] Institutional features (API, webhooks)

## Acknowledgments

- Base repo: [hkirat/ai-trading-agent](https://github.com/hkirat/ai-trading-agent)
- BNB Chain docs and team
- OpenRouter for affordable AI
- PancakeSwap SDK
- Open source community

## License

MIT (keep it open!)

---

## Integrated Service Architecture

### Service Integration Flow

All services are now fully integrated into the main trading loop (`src/index.ts`):

```
┌─────────────────────────────────────────────────────────────────┐
│                    STARTUP (src/index.ts)                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  startBot()                                                     │
│    ├─> Initialize services                                     │
│    │     ├─> AI Orchestrator                                   │
│    │     ├─> Order Monitoring Service → start(5000ms)          │
│    │     ├─> Price Feed Service → start(10000ms)               │
│    │     ├─> Risk Management Service                           │
│    │     └─> Analytics Service                                 │
│    │                                                             │
│    ├─> Wire service events to WebSocket Manager                │
│    │     ├─> orderMonitoring.on('orderFilled') → broadcast     │
│    │     ├─> orderMonitoring.on('orderCancelled') → broadcast  │
│    │     ├─> priceFeed.on('priceUpdate') → broadcast           │
│    │     └─> riskManagement.on('riskAlert') → broadcast        │
│    │                                                             │
│    └─> Start trading loop (interval)                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Trading Loop Integration

```
┌─────────────────────────────────────────────────────────────────┐
│           MAIN TRADING LOOP (every 5 minutes)                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. DEX Token Analysis                                          │
│     ├─> invokeAgent(tokenAddress)                              │
│     │     ├─> Price Feed Service.getPrice() → aggregated price │
│     │     │     └─> Fallback to DexScreener if unavailable     │
│     │     │                                                     │
│     │     ├─> AI Orchestrator.makeDecision()                   │
│     │     │     ├─> Routes to TypeScript Agent (fast)          │
│     │     │     └─> Or Python Agent (research needed)          │
│     │     │                                                     │
│     │     ├─> WebSocket: Broadcast AI Decision                 │
│     │     │                                                     │
│     │     ├─> Risk Management.shouldTrade()                    │
│     │     │     ├─> Get portfolio risk                         │
│     │     │     ├─> Validate position size                     │
│     │     │     └─> Check portfolio limits                     │
│     │     │                                                     │
│     │     ├─> Trade Executor.executeTrade()                    │
│     │     │     └─> Blockchain transaction                     │
│     │     │                                                     │
│     │     ├─> Order Monitoring.createOrder()                   │
│     │     │     └─> Track order lifecycle                      │
│     │     │                                                     │
│     │     ├─> Analytics.recordTrade()                          │
│     │     │     └─> Performance metrics                        │
│     │     │                                                     │
│     │     └─> WebSocket: Broadcast Trade Event                 │
│     │                                                           │
│     └─> Repeat for all watchlist tokens                        │
│                                                                 │
│  2. Polymarket Opportunity Analysis                             │
│     ├─> Polymarket Service.getActiveMarkets()                  │
│     ├─> AI Orchestrator.makeDecision(polymarket)               │
│     │     └─> Routes to Python Agent (research)                │
│     └─> WebSocket: Broadcast Polymarket Decision               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Event-Driven Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                  SERVICE EVENT WIRING                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Order Monitoring Service                                       │
│    ├─> emit('orderFilled')                                     │
│    │     └─> WebSocket Manager → broadcast to frontend         │
│    │                                                             │
│    └─> emit('orderCancelled')                                  │
│          └─> WebSocket Manager → broadcast to frontend         │
│                                                                 │
│  Price Feed Service                                             │
│    └─> emit('priceUpdate')                                     │
│          └─> WebSocket Manager → sendPriceUpdate()             │
│                                                                 │
│  Risk Management Service                                        │
│    └─> emit('riskAlert')                                       │
│          └─> WebSocket Manager → sendNotification()            │
│                                                                 │
│  AI Orchestrator                                                │
│    └─> makeDecision() → returns decision                       │
│          └─> Main loop → WebSocket: sendAIDecisionNotification() │
│                                                                 │
│  Analytics Service                                              │
│    └─> recordTrade() → stores metrics                          │
│          └─> Queryable via API endpoints                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Service Communication Patterns

| Service | Initialization | Communication | Real-time Events |
|---------|---------------|---------------|------------------|
| **AI Orchestrator** | On-demand (singleton) | Sync calls from main loop | Decisions broadcasted via WebSocket |
| **Order Monitoring** | `startBot()` → `start(5000)` | Event emitter | `orderFilled`, `orderCancelled` |
| **Price Feed** | `startBot()` → `start()` | Event emitter | `priceUpdate` |
| **Risk Management** | On-demand (singleton) | Sync calls before trades | `riskAlert` |
| **Analytics** | On-demand (singleton) | Async calls after trades | Stored in database |
| **WebSocket Manager** | `api-server.ts` | Event broadcaster | All events → frontend |
| **Polymarket Service** | On-demand (lazy) | Async calls in main loop | Opportunities detected |

### Key Integration Points

1. **Service Initialization** (`src/index.ts:startBot()`)
   - All services initialized before trading loop starts
   - Services are singletons (shared instances)
   - Event listeners wired to WebSocket Manager

2. **Market Data Flow** (`src/index.ts:invokeAgent()`)
   - Price Feed Service → primary source
   - DexScreener → fallback source
   - Aggregated data → AI Orchestrator

3. **Risk Validation** (Before every trade)
   - Risk Management Service validates:
     - Portfolio risk level
     - Position size limits
     - Exposure constraints
   - Trade rejected if limits exceeded

4. **Order Tracking** (After every trade)
   - Order Monitoring Service tracks:
     - Order lifecycle (created → filled/cancelled)
     - LIMIT/STOP order execution
     - Real-time status updates

5. **Analytics Recording** (After every trade/decision)
   - Analytics Service records:
     - Trade execution metrics
     - AI decision confidence
     - Performance statistics
     - Strategy effectiveness

6. **Real-time Broadcasting** (Throughout lifecycle)
   - WebSocket Manager broadcasts:
     - AI decisions
     - Trade executions
     - Price updates
     - Risk alerts
     - Order status changes

### Service Dependencies

```
Main Trading Loop (src/index.ts)
  ├─> AI Orchestrator (decision routing)
  │     ├─> TypeScript Agent (fast decisions)
  │     └─> Python Agents (research)
  │
  ├─> Price Feed Service (market data)
  │     ├─> DexScreener API
  │     ├─> Polymarket API
  │     └─> Other price sources
  │
  ├─> Risk Management Service (validation)
  │     ├─> Portfolio risk calculation
  │     └─> Position size validation
  │
  ├─> Order Monitoring Service (tracking)
  │     ├─> Order lifecycle management
  │     └─> LIMIT/STOP execution
  │
  ├─> Analytics Service (metrics)
  │     ├─> Performance tracking
  │     └─> Strategy analysis
  │
  └─> WebSocket Manager (broadcasting)
        ├─> AI decisions
        ├─> Trades
        ├─> Prices
        └─> Alerts
```

## Service Integration Verification

All services listed in this architecture are **actively integrated** and **initialized** in the BNB Immortal Trader project:

- ✅ **Agent Services** (`src/agent/`, `agents/`) - Used for AI decision-making via Orchestrator
- ✅ **Polymarket Services** (`src/polymarket/`) - Full Polymarket trading suite integrated in main loop
- ✅ **Trading Services** (`src/services/`) - Order monitoring, risk, analytics, price feed all wired
- ✅ **Infrastructure Services** - WebSocket, metrics, tracing, all services event-driven
- ✅ **AI Orchestrator** - Routes decisions to appropriate agents (TypeScript/Python)
- ✅ **Service Events** - All events wired to WebSocket Manager for real-time updates

All services are initialized in `src/index.ts:startBot()` and integrated into the main trading loop:
- WebSocket Manager for real-time updates to frontend
- API endpoints for frontend access (via `src/api-server.ts`)
- Event emitters for inter-service communication
- Service singletons for shared state

**"An AI that never forgets"** 🧠💾
 