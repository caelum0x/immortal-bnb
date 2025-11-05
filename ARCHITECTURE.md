# 🏗️ Architecture: Immortal AI Trading Bot

## Overview

This project is built on top of [hkirat/ai-trading-agent](https://github.com/hkirat/ai-trading-agent) and adapted specifically for **BNB Chain** with **immortal memory** capabilities.

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
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    AI DECISION LAYER                            │
│  • OpenRouter API (GPT-4o-mini)                                 │
│  • Prompt Engineering (src/prompt.ts)                           │
│  • Decision Engine (src/agent/aiDecision.ts)                    │
│  • Learning Loop (src/agent/learningLoop.ts)                    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    DATA LAYER                                   │
│  • DexScreener API (market data)                                │
│  • Price tracking, volume, liquidity                            │
│  • Token analytics (src/data/marketFetcher.ts)                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    EXECUTION LAYER                              │
│  • PancakeSwap V2 Router                                        │
│  • Ethers.js (blockchain interaction)                           │
│  • Trade Executor (src/blockchain/tradeExecutor.ts)             │
│  • Gas optimization                                             │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    IMMORTAL MEMORY LAYER                        │
│  • BNB Greenfield SDK                                           │
│  • Decentralized storage                                        │
│  • Memory Storage (src/blockchain/memoryStorage.ts)             │
│  • On-chain verification                                        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    SAFETY LAYER                                 │
│  • Stop-loss automation                                         │
│  • Position sizing                                              │
│  • Rate limiting                                                │
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

```
1. MARKET SCAN (every 5 min)
   ├─> DexScreener API
   ├─> Fetch trending tokens
   └─> Get prices, volume, liquidity

2. AI ANALYSIS
   ├─> Load past memories from Greenfield
   ├─> Format prompt with data + memories
   ├─> Call OpenRouter (GPT-4o-mini)
   └─> Get decision: buy/sell/hold

3. RISK VALIDATION
   ├─> Check balance (src/utils/safeguards.ts)
   ├─> Validate trade amount
   ├─> Ensure liquidity > $10K
   └─> Apply cooldowns

4. EXECUTION (if approved)
   ├─> PancakeSwap Router contract call
   ├─> Ethers.js signs transaction
   ├─> Monitor for confirmation
   └─> Record gas used

5. MEMORY CREATION
   ├─> Create trade memory object
   ├─> Upload to Greenfield
   ├─> Get memory ID
   └─> Track in active positions

6. MONITORING
   ├─> Check stop-loss every cycle
   ├─> If triggered → auto-sell
   ├─> Update memory with outcome
   └─> Calculate P/L

7. LEARNING
   ├─> Fetch updated memories
   ├─> Analyze patterns (win rate, etc.)
   ├─> Feed into next AI decision
   └─> Continuous improvement!
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

**"An AI that never forgets"** 🧠💾
