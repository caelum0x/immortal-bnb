# Product Requirements Document (PRD)
## Immortal AI Trading Bot - Architecture & System Design

**Version:** 1.0  
**Date:** November 12, 2025  
**Status:** Production-Ready Architecture

---

## Executive Summary

The **Immortal AI Trading Bot** is an autonomous, self-learning trading system that operates across multiple DeFi protocols (PancakeSwap, Polymarket) with permanent memory storage on BNB Greenfield. The system combines AI-powered decision-making with decentralized memory to create a truly "immortal" trading agent that evolves and improves over time.

### Core Innovation
Unlike traditional trading bots that lose all learning when restarted, our system stores every trade decision, outcome, and market condition on BNB Greenfield—creating an immortal memory that persists forever and can be shared across instances.

---

## 1. System Architecture

### 1.1 High-Level Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                          │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐             │
│  │   Next.js    │  │   Mobile     │  │  Telegram   │             │
│  │  Dashboard   │  │   App (RN)   │  │    Bot      │             │
│  └──────────────┘  └──────────────┘  └─────────────┘             │
└────────────────────────────────────────────────────────────────────┘
                                ↓
┌────────────────────────────────────────────────────────────────────┐
│                        APPLICATION LAYER                           │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐             │
│  │  API Server  │  │  WebSocket   │  │   CLI       │             │
│  │  (Express)   │  │   Service    │  │  Interface  │             │
│  └──────────────┘  └──────────────┘  └─────────────┘             │
└────────────────────────────────────────────────────────────────────┘
                                ↓
┌────────────────────────────────────────────────────────────────────┐
│                          CORE ENGINE                               │
│  ┌─────────────────────────────────────────────────────┐          │
│  │           Immortal AI Agent (immortalAgent.ts)       │          │
│  │  • Decision Making    • Strategy Evolution           │          │
│  │  • Personality Traits • Risk Management              │          │
│  └─────────────────────────────────────────────────────┘          │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐             │
│  │    LLM       │  │   Memory     │  │  Learning   │             │
│  │  Interface   │  │   Manager    │  │    Loop     │             │
│  └──────────────┘  └──────────────┘  └─────────────┘             │
└────────────────────────────────────────────────────────────────────┘
                                ↓
┌────────────────────────────────────────────────────────────────────┐
│                       INTEGRATION LAYER                            │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐             │
│  │ PancakeSwap  │  │  Polymarket  │  │ DexScreener │             │
│  │ (DEX Trading)│  │ (Predictions)│  │  (Market    │             │
│  │              │  │              │  │   Data)     │             │
│  └──────────────┘  └──────────────┘  └─────────────┘             │
└────────────────────────────────────────────────────────────────────┘
                                ↓
┌────────────────────────────────────────────────────────────────────┐
│                        BLOCKCHAIN LAYER                            │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐             │
│  │  BNB Chain   │  │  Greenfield  │  │   Smart     │             │
│  │ (Execution)  │  │  (Storage)   │  │  Contracts  │             │
│  │              │  │              │  │  ($IMMBOT)  │             │
│  └──────────────┘  └──────────────┘  └─────────────┘             │
└────────────────────────────────────────────────────────────────────┘
```

### 1.2 Core Components

#### A. **Immortal AI Agent** (`src/ai/immortalAgent.ts`)
**Purpose:** Central intelligence system that makes trading decisions

**Key Features:**
- **Personality System:** Dynamic AI personality with evolving traits
  - Risk tolerance (0-1 scale)
  - Aggressiveness (0-1 scale)
  - Learning rate
  - Memory weight
  - Exploration vs exploitation balance
  - Confidence threshold

- **Memory Management:**
  - Loads all historical trades from BNB Greenfield
  - Analyzes past successes and failures
  - Stores new trades permanently on-chain
  - Retrieves similar past scenarios for context

- **Strategy Evolution:**
  - Multiple trading strategies in parallel
  - Performance tracking (short/medium/long-term)
  - Automatic strategy optimization
  - Market condition matching

**Data Structures:**
```typescript
interface AIPersonality {
  riskTolerance: number;        // 0-1 scale
  aggressiveness: number;        // 0-1 scale
  learningRate: number;          // Adaptation speed
  memoryWeight: number;          // Past experience weight
  explorationRate: number;       // New vs proven strategies
  confidenceThreshold: number;   // Minimum confidence for trade
}

interface ExtendedTradeMemory {
  id: string;
  timestamp: number;
  tokenSymbol: string;
  tokenAddress: string;
  action: 'BUY' | 'SELL';
  amount: number;
  entryPrice: number;
  exitPrice?: number;
  outcome: 'profit' | 'loss' | 'pending';
  profitLoss?: number;
  confidence: number;
  strategy: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  lessons: string[];
  aiReasoning: string;
  marketConditions: MarketConditions;
}

interface StrategyEvolution {
  strategyId: string;
  name: string;
  successRate: number;
  avgReturn: number;
  totalTrades: number;
  lastUsed: number;
  conditions: string;
  parameters: Record<string, number>;
  performance: {
    shortTerm: number;   // 7-day
    mediumTerm: number;  // 30-day
    longTerm: number;    // 90-day
  };
}
```

#### B. **Memory Storage System** (`src/blockchain/memoryStorage.ts`)
**Purpose:** Immortal memory on BNB Greenfield

**Key Features:**
- **Decentralized Storage:** All trades stored permanently on-chain
- **Bucket Management:** Automatic bucket creation and management
- **Object Versioning:** Track memory evolution over time
- **Retrieval System:** Fast memory lookup and batch fetching
- **Compression:** Efficient storage using JSON compression

**Functions:**
```typescript
// Store a new trade memory (returns memory ID)
async function storeMemory(tradeData: TradeMemory): Promise<string>

// Fetch specific memory by ID
async function fetchMemory(objectName: string): Promise<TradeMemory | null>

// Get all memory IDs (for loading agent history)
async function fetchAllMemories(): Promise<string[]>

// Initialize Greenfield bucket (setup)
async function initializeGreenfieldBucket(): Promise<void>
```

#### C. **Trade Execution Engine** (`src/blockchain/tradeExecutor.ts`)
**Purpose:** Execute trades on PancakeSwap and other DEXs

**Key Features:**
- **Multi-DEX Support:** PancakeSwap V2/V3, Smart Router
- **Slippage Protection:** Automatic slippage calculation
- **Gas Optimization:** Dynamic gas price adjustment
- **Transaction Retry:** Automatic retry with higher gas
- **Safety Checks:** Amount validation, liquidity checks
- **Approval Management:** Token approval handling

**Trade Flow:**
```
1. Validate trade parameters
2. Check token balances
3. Approve token spending (if needed)
4. Calculate slippage tolerance
5. Get optimal swap path
6. Execute swap transaction
7. Wait for confirmation
8. Verify trade success
9. Record results
```

#### D. **Market Data Integration** (`src/data/marketFetcher.ts`)
**Purpose:** Real-time market data and analytics

**Data Sources:**
- **DexScreener API:** Token prices, volume, liquidity
- **PancakeSwap API:** Pool data, APR calculations
- **Polymarket API:** Prediction market odds
- **BNB Chain RPC:** On-chain data, gas prices

**Metrics Tracked:**
```typescript
interface TokenMetrics {
  address: string;
  symbol: string;
  price: number;
  priceChange24h: number;
  volume24h: number;
  liquidity: number;
  marketCap: number;
  holders: number;
  buySellPressure: number;
  trending: boolean;
  riskScore: number;
}
```

#### E. **LLM Interface** (`src/ai/llmInterface.ts`)
**Purpose:** AI decision-making via OpenRouter

**Supported Models:**
- GPT-4o-mini (default, fast + cheap)
- GPT-4o (premium, better reasoning)
- Claude-3.5-Sonnet (alternative)
- Llama-3-70B (open source option)

**Decision Process:**
```typescript
async function getAIDecision(
  tokenData: TokenMetrics,
  memories: TradeMemory[],
  marketConditions: MarketConditions
): Promise<{
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  reasoning: string;
  suggestedAmount: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  timeHorizon: string;
}>
```

---

## 2. Multi-Protocol Integration

### 2.1 PancakeSwap Integration

**DEX Trading (Spot Markets)**

**Supported Routers:**
- PancakeSwap V2 Router (legacy)
- PancakeSwap V3 Router (concentrated liquidity)
- PancakeSwap Smart Router (optimal routing)

**Trading Features:**
- Spot token swaps (no leverage)
- Automatic liquidity path finding
- Multi-hop routing
- Price impact calculation
- Deadline protection

**Example Trade:**
```typescript
const result = await executeTrade({
  tokenIn: WBNB_ADDRESS,
  tokenOut: TOKEN_ADDRESS,
  amountIn: ethers.parseEther('0.1'), // 0.1 BNB
  slippage: 2, // 2% max slippage
  deadline: 300 // 5 minutes
});
```

### 2.2 Polymarket Integration

**Prediction Market Trading**

**Components:**
1. **CLOB Client** (`clob-client/`)
   - Centralized limit order book
   - Real-time order placement
   - Market making capabilities

2. **CTF Exchange** (`polymarket-ctf-exchange/`)
   - Conditional token framework
   - Atomic trade execution
   - Settlement mechanism

3. **Adapters:**
   - **Neg-Risk Adapter** (`polymarket-neg-risk-adapter/`)
   - **UMA Adapter** (`polymarket-uma-adapter/`)

4. **Examples** (`polymarket-examples/`)
   - Integration patterns
   - Strategy examples
   - Testing utilities

**Trading Flow:**
```
1. Monitor active prediction markets
2. Analyze market odds and volume
3. AI evaluates probability vs odds
4. Place limit orders on CLOB
5. Execute conditional token trades
6. Monitor positions
7. Settle on resolution
8. Record outcomes to memory
```

**Key Features:**
- Binary outcome markets
- Categorical markets
- Liquidity provision
- Market making
- Strategy backtesting

### 2.3 Data Integration

**DexScreener API:**
```typescript
// Get trending tokens on BNB Chain
const trending = await fetchTrendingTokens('bsc', 50);

// Get token analytics
const analytics = await getTokenAnalytics(tokenAddress);

// Monitor price feeds
const priceStream = streamTokenPrices([...tokens]);
```

---

## 3. Data Flow & State Management

### 3.1 Trading Loop

```
┌─────────────────────────────────────────────────────────────┐
│                    MAIN TRADING LOOP                        │
│                    (Every 5 minutes)                        │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  1. DISCOVER TOKENS                                         │
│     • Fetch trending tokens from DexScreener               │
│     • Filter by volume, liquidity, market cap              │
│     • Score tokens by risk/opportunity                     │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  2. ANALYZE MARKET CONDITIONS                               │
│     • Get real-time prices                                  │
│     • Calculate buy/sell pressure                          │
│     • Identify market trends                               │
│     • Assess volatility                                     │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  3. LOAD RELEVANT MEMORIES                                  │
│     • Fetch similar past trades from Greenfield           │
│     • Filter by token characteristics                      │
│     • Weight memories by recency and success              │
│     • Extract lessons learned                              │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  4. AI DECISION MAKING                                      │
│     • Build comprehensive prompt with:                     │
│       - Current market data                                 │
│       - Historical memories                                 │
│       - Agent personality                                   │
│       - Risk parameters                                     │
│     • Query LLM (GPT-4o-mini)                             │
│     • Parse AI response                                     │
│     • Validate decision confidence                         │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  5. RISK ASSESSMENT                                         │
│     • Validate trade amount                                 │
│     • Check position sizing                                 │
│     • Verify confidence threshold                          │
│     • Calculate potential loss                              │
│     • Apply stop-loss rules                                 │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  6. EXECUTE TRADE (if approved)                             │
│     • Approve token spending                                │
│     • Execute swap on PancakeSwap                          │
│     • Wait for confirmation                                 │
│     • Verify transaction success                           │
│     • Update portfolio                                      │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  7. STORE MEMORY                                            │
│     • Create trade memory object                            │
│     • Include all context and reasoning                    │
│     • Upload to BNB Greenfield                             │
│     • Verify storage success                                │
│     • Update local cache                                    │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  8. MONITOR & LEARN                                         │
│     • Track position performance                            │
│     • Calculate unrealized P&L                             │
│     • Check stop-loss conditions                           │
│     • Update strategy performance                          │
│     • Evolve agent personality                              │
└─────────────────────────────────────────────────────────────┘
                          ↓
                    [Repeat Loop]
```

### 3.2 State Management

**Application State:**
```typescript
interface BotState {
  isRunning: boolean;
  currentBalance: bigint;
  activePositions: Position[];
  pendingTrades: PendingTrade[];
  recentMemories: TradeMemory[];
  personality: AIPersonality;
  strategies: StrategyEvolution[];
  metrics: PerformanceMetrics;
}
```

**Persistence:**
- **BNB Greenfield:** All trade memories (permanent)
- **Local Cache:** Recent memories for fast access
- **API State:** Dashboard stats, real-time updates
- **WebSocket:** Live trade events

---

## 4. Security & Risk Management

### 4.1 Safety Mechanisms

**1. Position Sizing**
```typescript
const maxTradeAmount = CONFIG.MAX_TRADE_AMOUNT_BNB; // e.g., 1 BNB
const positionSize = Math.min(
  balance * 0.1, // Max 10% of balance per trade
  maxTradeAmount
);
```

**2. Stop-Loss**
```typescript
const stopLossThreshold = CONFIG.STOP_LOSS_PERCENTAGE; // e.g., 10%
if (currentLoss >= stopLossThreshold) {
  await executeSellOrder(position);
}
```

**3. Slippage Protection**
```typescript
const maxSlippage = CONFIG.MAX_SLIPPAGE_PERCENTAGE; // e.g., 2%
const minAmountOut = expectedAmount * (1 - maxSlippage / 100);
```

**4. Rate Limiting**
```typescript
// API rate limits
const botControlLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5 // 5 trades per minute max
});
```

**5. Confidence Threshold**
```typescript
if (aiDecision.confidence < personality.confidenceThreshold) {
  logger.info('Decision confidence too low, skipping trade');
  return; // Don't execute low-confidence trades
}
```

### 4.2 Error Handling

**Transaction Failures:**
- Automatic retry with higher gas
- Fallback to alternative DEX routes
- Graceful degradation

**API Failures:**
- Cached data fallback
- Multiple data source redundancy
- Circuit breaker pattern

**Memory Storage Failures:**
- Local backup storage
- Retry with exponential backoff
- Alert notifications

---

## 5. API Architecture

### 5.1 REST API (`src/api-server.ts`)

**Base URL:** `http://localhost:3001/api`

**Endpoints:**

**Bot Control:**
```
POST   /api/start-bot        # Start trading bot
POST   /api/stop-bot         # Stop trading bot
GET    /api/bot/status       # Get bot status
```

**Trading:**
```
GET    /api/trades           # Get trade history
GET    /api/positions        # Get active positions
GET    /api/portfolio        # Get portfolio value
GET    /api/stats            # Get performance stats
```

**Memory:**
```
GET    /api/memories         # Get trade memories
GET    /api/memories/:id     # Get specific memory
POST   /api/memories         # Store new memory
```

**Market Data:**
```
GET    /api/tokens/trending  # Get trending tokens
GET    /api/tokens/:address  # Get token details
GET    /api/market/overview  # Get market overview
```

**Polymarket:**
```
GET    /api/polymarket/markets           # Get active markets
GET    /api/polymarket/leaderboard       # Get top traders
POST   /api/polymarket/place-order       # Place order
GET    /api/polymarket/positions         # Get positions
```

### 5.2 WebSocket API (`src/services/websocket.ts`)

**Connection:** `ws://localhost:3001`

**Events:**

**Client → Server:**
```javascript
{ type: 'subscribe', channel: 'trades' }
{ type: 'subscribe', channel: 'prices' }
{ type: 'subscribe', channel: 'bot-status' }
```

**Server → Client:**
```javascript
// Trade executed
{
  type: 'trade-executed',
  data: {
    id: string,
    token: string,
    action: 'buy' | 'sell',
    amount: number,
    price: number,
    timestamp: number
  }
}

// Price update
{
  type: 'price-update',
  data: {
    token: string,
    price: number,
    change24h: number
  }
}

// Bot status change
{
  type: 'bot-status',
  data: {
    status: 'running' | 'stopped',
    uptime: number,
    tradesCount: number
  }
}
```

---

## 6. Frontend Architecture

### 6.1 Next.js Dashboard (`frontend/`)

**Tech Stack:**
- Next.js 14 (App Router)
- React 18
- TypeScript
- TailwindCSS
- RainbowKit (wallet connect)
- Wagmi (Web3 hooks)
- Recharts (data visualization)

**Pages:**
```
/                    # Dashboard home
/trades              # Trade history
/positions           # Active positions
/memories            # AI memories view
/discovery           # Token discovery
/polymarket          # Polymarket integration
/settings            # Bot configuration
/analytics           # Performance analytics
```

**Key Components:**

**1. Dashboard (`components/dashboard/Dashboard.tsx`)**
- Real-time stats
- P&L charts
- AI learning status
- Active positions

**2. Trading Interface (`components/TradingInterface.tsx`)**
- Manual trade execution
- Token search
- Order preview
- Transaction confirmation

**3. Memories View (`components/MemoriesView.tsx`)**
- Historical trades
- AI reasoning display
- Memory filtering
- Performance breakdown

**4. Token Discovery (`components/TokenDiscovery.tsx`)**
- Trending tokens
- Risk scores
- Quick trade actions
- Detailed analytics

### 6.2 Mobile App (`mobile/`)

**React Native + Expo**

**Features:**
- Push notifications for trades
- Portfolio overview
- Quick trade actions
- Bot control
- Memory browsing

---

## 7. Scalability & Performance

### 7.1 Optimization Strategies

**1. Memory Caching**
```typescript
// Cache recent memories locally
const memoryCache = new LRUCache<string, TradeMemory>({
  max: 100, // Keep last 100 memories in memory
  ttl: 1000 * 60 * 60 // 1 hour TTL
});
```

**2. Batch Processing**
```typescript
// Load memories in parallel
const memories = await Promise.all(
  memoryIds.slice(0, 50).map(id => fetchMemory(id))
);
```

**3. WebSocket Optimization**
```typescript
// Only send updates to subscribed clients
if (clients.has(channel)) {
  broadcast(channel, data);
}
```

**4. Database Indexing**
```sql
-- PostgreSQL indexes for fast queries
CREATE INDEX idx_trades_timestamp ON trades(timestamp DESC);
CREATE INDEX idx_trades_outcome ON trades(outcome);
CREATE INDEX idx_memories_token ON memories(token_address);
```

### 7.2 Horizontal Scaling

**Multi-Instance Support:**
- Shared memory via Greenfield
- Redis for state synchronization
- Load balancer for API
- Database connection pooling

**Example Setup:**
```yaml
# docker-compose.yml
services:
  bot-instance-1:
    image: immortal-bot:latest
    environment:
      INSTANCE_ID: 1
      REDIS_URL: redis://redis:6379
  
  bot-instance-2:
    image: immortal-bot:latest
    environment:
      INSTANCE_ID: 2
      REDIS_URL: redis://redis:6379
  
  redis:
    image: redis:alpine
  
  postgres:
    image: postgres:15
```

---

## 8. Monitoring & Observability

### 8.1 Metrics Collection

**System Metrics:**
```typescript
// src/monitoring/metrics.ts
export interface Metrics {
  trades: {
    total: number;
    successful: number;
    failed: number;
    avgExecutionTime: number;
  };
  performance: {
    totalProfit: number;
    totalLoss: number;
    winRate: number;
    sharpeRatio: number;
  };
  system: {
    uptime: number;
    memoryUsage: number;
    cpuUsage: number;
    apiLatency: number;
  };
}
```

**Logging:**
```typescript
// Winston logger with levels
logger.info('Trade executed', { token, amount, price });
logger.warn('Low confidence decision', { confidence });
logger.error('Trade failed', { error, token });
```

### 8.2 Alerting

**Telegram Notifications:**
- Trade executions
- Significant profits/losses
- Bot errors
- System health issues

**Email Alerts:**
- Daily performance summary
- Weekly strategy reports
- Critical errors

---

## 9. Deployment Architecture

### 9.1 Production Setup

**Infrastructure:**
```
┌─────────────────────────────────────────────────────┐
│              Load Balancer (Nginx)                  │
└─────────────────────────────────────────────────────┘
              ↓                    ↓
┌─────────────────────┐  ┌─────────────────────┐
│   Backend Server 1   │  │   Backend Server 2   │
│   (Node.js + Bun)   │  │   (Node.js + Bun)   │
└─────────────────────┘  └─────────────────────┘
              ↓                    ↓
┌─────────────────────────────────────────────────────┐
│              PostgreSQL Database (Primary)           │
└─────────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────────┐
│              Redis Cache & Queue                     │
└─────────────────────────────────────────────────────┘
```

**Docker Compose:**
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
    volumes:
      - ./logs:/app/logs
    restart: always
  
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - app
    restart: always
  
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
  
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: immortal_bot
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres-data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  redis-data:
  postgres-data:
```

### 9.2 Environment Configuration

**.env.production:**
```bash
# Network
NETWORK=mainnet
TRADING_NETWORK=opbnb
RPC_URL=https://opbnb-mainnet-rpc.bnbchain.org

# Security
WALLET_PRIVATE_KEY=${ENCRYPTED_PRIVATE_KEY}
API_KEY=${GENERATED_API_KEY}
JWT_SECRET=${JWT_SECRET}

# AI
OPENROUTER_API_KEY=${OPENROUTER_KEY}
AI_MODEL=openai/gpt-4o-mini

# Greenfield
GREENFIELD_BUCKET_NAME=immortal-bot-prod
GREENFIELD_ACCESS_KEY=${GREENFIELD_ACCESS}
GREENFIELD_SECRET_KEY=${GREENFIELD_SECRET}

# Trading
MAX_TRADE_AMOUNT_BNB=5.0
STOP_LOSS_PERCENTAGE=8
MIN_CONFIDENCE_THRESHOLD=0.75

# Monitoring
LOG_LEVEL=info
TELEGRAM_BOT_TOKEN=${TELEGRAM_TOKEN}
TELEGRAM_CHAT_ID=${TELEGRAM_CHAT}
```

---

## 10. Testing Strategy

### 10.1 Test Coverage

**Unit Tests:**
```typescript
// tests/ai/immortalAgent.test.ts
describe('ImmortalAIAgent', () => {
  test('loads memories correctly', async () => {
    const agent = new ImmortalAIAgent();
    await agent.loadMemories();
    expect(agent.getTotalTrades()).toBeGreaterThan(0);
  });
  
  test('makes valid decisions', async () => {
    const decision = await agent.makeDecision(token, data);
    expect(decision.confidence).toBeGreaterThanOrEqual(0);
    expect(decision.confidence).toBeLessThanOrEqual(1);
  });
});
```

**Integration Tests:**
```typescript
// tests/integration/trading.test.ts
describe('Trading Flow', () => {
  test('executes trade end-to-end', async () => {
    const result = await executeTrade({
      tokenIn: WBNB,
      tokenOut: TOKEN,
      amountIn: ethers.parseEther('0.1'),
      slippage: 2
    });
    expect(result.success).toBe(true);
    expect(result.txHash).toBeDefined();
  });
});
```

**E2E Tests:**
```typescript
// tests/e2e/bot.test.ts
describe('Bot Lifecycle', () => {
  test('discovers → decides → executes → stores', async () => {
    const tokens = await discoverTokens();
    const decision = await makeDecision(tokens[0]);
    if (decision.action === 'BUY') {
      const trade = await executeTrade(decision);
      const memory = await storeMemory(trade);
      expect(memory.id).toBeDefined();
    }
  });
});
```

### 10.2 Test Environments

**Testnet:** BNB Chain Testnet + opBNB Testnet
**Staging:** Dedicated staging environment
**Production:** Live BNB Chain mainnet

---

## 11. Roadmap & Future Enhancements

### Phase 1: Current (Q4 2025)
- [x] Core trading bot on BNB Chain
- [x] Immortal memory on Greenfield
- [x] AI decision-making
- [x] PancakeSwap integration
- [x] Basic frontend dashboard
- [x] Polymarket submodules integration

### Phase 2: Q1 2026
- [ ] Advanced strategy backtesting
- [ ] Multi-agent collaboration
- [ ] Social trading features
- [ ] Portfolio optimization
- [ ] Cross-chain trading

### Phase 3: Q2 2026
- [ ] DAO governance
- [ ] Community memory sharing
- [ ] Staking rewards distribution
- [ ] Mobile app v2.0
- [ ] AI model fine-tuning

### Phase 4: Q3 2026
- [ ] Derivatives trading
- [ ] Options strategies
- [ ] Automated market making
- [ ] Risk hedging
- [ ] Institutional features

---

## 12. Success Metrics

### Key Performance Indicators (KPIs)

**Trading Performance:**
- Win rate: Target >55%
- Average profit per trade: >5%
- Sharpe ratio: >1.5
- Maximum drawdown: <20%

**System Performance:**
- API response time: <500ms p95
- Trade execution time: <30s p95
- Memory storage success: >99%
- System uptime: >99.9%

**User Metrics:**
- Active users (monthly)
- Total value locked
- Daily active trades
- Memory contribution rate

---

## 13. Risk Assessment

### Technical Risks

**1. Smart Contract Risk**
- Mitigation: Audited contracts only
- Insurance: Consider DeFi insurance protocols

**2. AI Decision Risk**
- Mitigation: Confidence thresholds, multiple models
- Safety: Manual override capability

**3. Blockchain Risk**
- Mitigation: Multi-RPC fallbacks
- Monitoring: Real-time chain monitoring

**4. Greenfield Storage Risk**
- Mitigation: Local backups, redundant storage
- Recovery: Disaster recovery plan

### Market Risks

**1. Volatility**
- Stop-loss mechanisms
- Position sizing limits
- Diversification

**2. Liquidity**
- Minimum liquidity thresholds
- Slippage protection
- Alternative routing

**3. Market Manipulation**
- Anomaly detection
- Volume analysis
- Whale watching

---

## 14. Documentation

### For Developers
- [Architecture Guide](ARCHITECTURE.md)
- [API Documentation](docs/API.md)
- [Integration Guide](INTEGRATION_GUIDE.md)
- [Testing Guide](TESTING.md)

### For Users
- [Quick Start](QUICKSTART.md)
- [Setup Guide](SETUP_GUIDE.md)
- [Trading Guide](QUICKSTART_TRADING.md)
- [Wallet Setup](WALLET_SETUP.md)

### For Operators
- [Deployment Guide](DEPLOYMENT_GUIDE.md)
- [Docker Guide](DOCKER.md)
- [Security Audit](SECURITY_AUDIT.md)
- [Monitoring Guide](docs/MONITORING.md)

---

## 15. Appendix

### A. Technology Stack

**Backend:**
- Runtime: Bun / Node.js
- Language: TypeScript
- Framework: Express.js
- Database: PostgreSQL
- Cache: Redis
- Queue: BullMQ

**Frontend:**
- Framework: Next.js 14
- Language: TypeScript
- Styling: TailwindCSS
- Web3: Wagmi + Viem
- Wallet: RainbowKit

**Blockchain:**
- Chain: BNB Chain (BSC)
- L2: opBNB
- Storage: BNB Greenfield
- DEX: PancakeSwap
- Prediction: Polymarket

**AI/ML:**
- LLM Provider: OpenRouter
- Models: GPT-4o-mini, Claude-3.5
- Embeddings: OpenAI Ada-002

**DevOps:**
- Container: Docker
- Orchestration: Docker Compose
- CI/CD: GitHub Actions
- Monitoring: Winston + Custom

### B. Repository Structure

```
immortal-bnb-1/
├── src/                        # Backend source
│   ├── ai/                     # AI agents and LLM
│   ├── blockchain/             # Blockchain interaction
│   ├── data/                   # Market data fetchers
│   ├── middleware/             # Express middleware
│   ├── monitoring/             # Metrics and logging
│   ├── polymarket/             # Polymarket integration
│   ├── services/               # Core services
│   └── utils/                  # Utilities
├── frontend/                   # Next.js dashboard
│   ├── app/                    # App router pages
│   ├── components/             # React components
│   ├── hooks/                  # Custom hooks
│   └── lib/                    # Utilities
├── mobile/                     # React Native app
├── contracts/                  # Smart contracts
├── tests/                      # Test suites
├── scripts/                    # Utility scripts
├── docs/                       # Documentation
├── agents/                     # Polymarket agents (submodule)
├── polymarket-examples/        # Examples (submodule)
├── polymarket-realtime/        # RT client (submodule)
├── polymarket-ctf-exchange/    # CTF exchange (submodule)
├── polymarket-neg-risk-adapter/# Neg risk (submodule)
└── polymarket-uma-adapter/     # UMA adapter (submodule)
```

### C. Contact & Support

**Development Team:**
- Lead: @caelum0x
- Repository: https://github.com/caelum0x/immortal-bnb

**Community:**
- Discord: [Coming Soon]
- Telegram: [Coming Soon]
- Twitter: [Coming Soon]

---

**Document Version:** 1.0  
**Last Updated:** November 12, 2025  
**Status:** Living Document - Updated Continuously
