# 🛠️ CLI Tools & Commands

Complete guide to using the Immortal AI Trading Bot CLI tools.

## 📦 Available Scripts

```bash
# Quick commands (via package.json)
bun start              # Start bot with health checks
bun run dev            # Development mode (auto-reload)
bun test               # Run unit tests
bun test:integration   # Run integration tests
bun test:trade         # Test a single trade
bun cli                # Run CLI tool
bun status             # Quick status check
bun balance            # Quick balance check
bun trades             # View recent trades
bun stats              # View trading stats
```

## 🚀 Start Bot Script

Comprehensive startup with pre-flight checks:

```bash
bun start-bot.ts
```

**Features:**
- ✅ Validates all environment variables
- ✅ Tests blockchain connection
- ✅ Verifies Greenfield storage
- ✅ Checks market data API
- ✅ Tests OpenRouter AI
- ✅ Initializes Telegram bot
- ✅ Starts API server
- ✅ Displays configuration summary
- ✅ Shows helpful error messages

**Output:**
```
═══════════════════════════════════════════════════════════════════
                    IMMORTAL AI TRADING BOT
                  BNB Chain • PancakeSwap V3
═══════════════════════════════════════════════════════════════════

  Version: 1.0.0
  Mode: TESTNET
  Network: OPBNB

🔍 Running Pre-flight Checks...

📦 Environment Configuration
──────────────────────────────────────────────────────────────────
  ✓ Wallet Private Key configured
  ✓ OpenRouter API Key configured
  ✓ Greenfield RPC configured
  ✓ Greenfield Bucket configured
  ⚠ Telegram Bot Token not configured (optional)
  ℹ Trading Network: opbnb
  ℹ Chain ID: 5611
  ℹ Network Mode: testnet

📦 Blockchain Connection
──────────────────────────────────────────────────────────────────
  ℹ Connecting to blockchain...
  ✓ PancakeSwap SDK initialized
  ✓ Wallet connected: 1.2500 BNB
  ✓ Sufficient balance for trading

... (continues with all checks)

✅ All systems ready!

🚀 STARTING TRADING BOT
```

## 🎮 CLI Tool

Interactive command-line interface for bot management:

```bash
bun cli.ts <command> [options]
```

### Commands

#### `status` - Bot Status

```bash
bun cli.ts status
```

Shows:
- Bot running status
- Network and chain ID
- Current balance
- Total trades
- Last check timestamp
- API endpoint

Example output:
```
═══════════════════════════════════════════════════════════════
  Bot Status
═══════════════════════════════════════════════════════════════

  ✓ Bot is running

  Status        : running
  Network       : opbnb (Chain ID: 5611)
  Balance       : 1.2500 BNB
  Total Trades  : 15
  Last Check    : 11/5/2025, 2:30:15 PM

  API: http://localhost:3001
```

#### `balance` - Wallet Balance

```bash
bun cli.ts balance
```

Shows:
- Current BNB balance
- Network
- Estimated USD value
- Balance warnings

Example output:
```
═══════════════════════════════════════════════════════════════
  Wallet Balance
═══════════════════════════════════════════════════════════════

  Balance       : 1.250000 BNB
  Network       : opbnb
  USD Value (est.): $375.00

  ✓ Sufficient balance for trading
```

#### `trades` - Recent Trades

```bash
bun cli.ts trades [limit]

# Examples
bun cli.ts trades       # Last 10 trades
bun cli.ts trades 20    # Last 20 trades
bun cli.ts trades 50    # Last 50 trades
```

Shows:
- Token symbol
- Action (BUY/SELL)
- Amount
- Entry price
- Outcome (profit/loss/pending)
- P/L percentage
- Timestamp
- AI reasoning

Example output:
```
═══════════════════════════════════════════════════════════════
  Recent Trades (Last 10)
═══════════════════════════════════════════════════════════════

  Showing 10 of 15 total trades

  1. CAKE
     Action:  BUY
     Amount:  0.0500 BNB
     Entry:   $1.234567
     Outcome: ↑ profit
     P/L:     +12.50%
     Time:    11/5/2025, 10:15:30 AM
     Reason:  Strong buy pressure and increasing volume suggest...

  2. USDT
     Action:  SELL
     Amount:  0.0300 BNB
     Entry:   $0.999123
     Outcome: ↓ loss
     P/L:     -3.20%
     Time:    11/5/2025, 9:45:20 AM
     Reason:  Stop loss triggered due to downward trend...
```

#### `stats` - Trading Statistics

```bash
bun cli.ts stats
```

Shows:
- Total trades
- Completed vs pending
- Win rate
- Total P/L
- Best and worst trades

Example output:
```
═══════════════════════════════════════════════════════════════
  Trading Statistics
═══════════════════════════════════════════════════════════════

  Total Trades    : 15
  Completed       : 12
  Pending         : 3
  Profitable      : 9
  Losing          : 3
  Win Rate        : 75.0%
  Total P/L       : +45.60%

  Best Trade:
    CAKE - +25.30%

  Worst Trade:
    TOKEN - -8.50%
```

#### `memory` - Greenfield Memories

```bash
bun cli.ts memory [limit]

# Examples
bun cli.ts memory       # Last 5 memories
bun cli.ts memory 10    # Last 10 memories
```

Shows:
- Total memories stored
- Recent memory details
- Immortal storage confirmation

Example output:
```
═══════════════════════════════════════════════════════════════
  Immortal Memory (BNB Greenfield)
═══════════════════════════════════════════════════════════════

  Fetching memories from Greenfield...

  Total memories: 15
  Showing last 5:

  CAKE
    ID:      mem_abc123...
    Action:  buy
    Outcome: profit
    Time:    11/5/2025, 10:15:30 AM

  ... (continues)

  ✓ Memories are immortal on Greenfield
```

#### `test` - Test Trade Decision

```bash
bun cli.ts test <token-address>

# Example
bun cli.ts test 0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82
```

Analyzes a token without executing trades:
- Fetches token data
- Shows market metrics
- Loads historical memories
- Simulates AI decision (no execution)

Example output:
```
═══════════════════════════════════════════════════════════════
  Test Trade Decision (No Execution)
═══════════════════════════════════════════════════════════════

  Analyzing 0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82...

  Token: CAKE
  Price         : $1.234567
  24h Change    : +5.67%
  Volume        : $12,345,678
  Liquidity     : $45,678,901
  Buys/Sells    : 1234/567

  Historical memories: 15

  ℹ This is a simulation - no actual trade will be executed
  To execute real trades, run: bun run dev
```

#### `config` - Configuration

```bash
bun cli.ts config
```

Shows complete bot configuration:
- Network settings
- Trading parameters
- PancakeSwap addresses
- Greenfield configuration
- API key status

Example output:
```
═══════════════════════════════════════════════════════════════
  Bot Configuration
═══════════════════════════════════════════════════════════════

  Network           : opbnb
  Chain ID          : 5611
  RPC URL           : https://opbnb-testnet-rpc.bnbchain.org
  Environment       : testnet
  Max Trade Amount  : 0.1 BNB
  Stop Loss         : 5%
  Max Slippage      : 2%
  Loop Interval     : 5 minutes
  PancakeSwap Router: 0x1b81D678ffb9C0263b24A97847620C99d213eB14
  WBNB Address      : 0x4200000000000000000000000000000000000006

  Greenfield:
    RPC       : https://gnfd-testnet-fullnode-tendermint-ap.bnbchain.org
    Chain ID  : 5600
    Bucket    : immortal-bot-memory

  API Keys:
    OpenRouter: ✓ Configured
    Telegram  : ⚠ Not configured
```

#### `help` - Show Help

```bash
bun cli.ts help
# or
bun cli.ts --help
```

## 🧪 Testing Scripts

### Integration Tests

```bash
bun test-integration.ts
```

Runs comprehensive end-to-end tests:
1. Configuration validation
2. Blockchain connection
3. Market data API
4. Greenfield storage
5. PancakeSwap SDK
6. API server endpoints

### Trade Test

```bash
bun test-trade.ts [token-address]

# Examples
bun test-trade.ts                              # Balance check only
bun test-trade.ts 0x...                        # Test with token
```

Tests PancakeSwap SDK integration:
- Wallet balance check
- Token info fetching
- Simulated trade (commented by default)

## 📊 API Endpoints

When bot is running, access via:

```bash
# Health check
curl http://localhost:3001/api/health

# Bot status
curl http://localhost:3001/api/status

# Wallet balance
curl http://localhost:3001/api/wallet/balance

# Recent trades
curl http://localhost:3001/api/trades?limit=10

# Statistics
curl http://localhost:3001/api/stats

# Token data
curl http://localhost:3001/api/token/0x...

# Token balance
curl http://localhost:3001/api/token/0x.../balance
```

## 🔧 Development Workflow

### Typical Development Session

```bash
# 1. Pull latest changes
git pull

# 2. Install dependencies
bun install

# 3. Configure environment
cp .env.example .env
nano .env

# 4. Run integration tests
bun test:integration

# 5. Start bot in dev mode
bun run dev

# In another terminal:
# 6. Monitor status
watch -n 5 "bun cli.ts status"

# 7. Check trades
bun cli.ts trades

# 8. View stats
bun cli.ts stats
```

### Testing New Features

```bash
# 1. Test specific token
bun cli.ts test 0x...

# 2. Run unit tests
bun test

# 3. Run integration tests
bun test:integration

# 4. Start bot and monitor
bun run dev
# Watch logs in real-time
```

## 📝 Logs

View logs:

```bash
# Application logs
tail -f logs/app.log

# With colors
tail -f logs/app.log | bunyan

# Filter errors only
tail -f logs/app.log | grep ERROR

# Follow bot output
bun run dev | tee logs/session-$(date +%Y%m%d).log
```

## 🚀 Production Usage

### Start in Production

```bash
# With PM2
pm2 start start-bot.ts --name immortal-bot
pm2 logs immortal-bot
pm2 monit

# With Docker
docker-compose up -d
docker-compose logs -f bot

# Monitor with CLI
bun cli.ts status
bun cli.ts balance
bun cli.ts stats
```

### Monitoring Loop

```bash
# Create a monitoring script
cat > monitor.sh << 'EOF'
#!/bin/bash
while true; do
  clear
  echo "=== Bot Status ==="
  bun cli.ts status
  echo ""
  echo "=== Recent Trades ==="
  bun cli.ts trades 5
  echo ""
  echo "=== Statistics ==="
  bun cli.ts stats
  sleep 60
done
EOF

chmod +x monitor.sh
./monitor.sh
```

## 📱 Telegram Commands

If Telegram is configured:

```
Bot sends alerts for:
✅ Bot started/stopped
✅ Trade executed
✅ Profit/loss updates
✅ Balance warnings
✅ Errors and failures

No commands needed - just monitor!
```

## 🎯 Quick Reference

| Task | Command |
|------|---------|
| Start bot | `bun start` |
| Dev mode | `bun run dev` |
| Check status | `bun status` |
| View balance | `bun balance` |
| Recent trades | `bun trades` |
| Statistics | `bun stats` |
| Test token | `bun cli.ts test 0x...` |
| View memories | `bun cli.ts memory` |
| Run tests | `bun test:integration` |
| Show config | `bun cli.ts config` |
| View help | `bun cli.ts help` |

## 🔗 Related Documentation

- [INTEGRATION_COMPLETE.md](INTEGRATION_COMPLETE.md) - Full integration guide
- [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Production deployment
- [QUICKSTART_TRADING.md](QUICKSTART_TRADING.md) - Trading guide
- [PANCAKESWAP_SDK_GUIDE.md](PANCAKESWAP_SDK_GUIDE.md) - SDK reference
- [OPBNB_INTEGRATION.md](OPBNB_INTEGRATION.md) - L2 integration
- [EXTERNAL_RESOURCES.md](EXTERNAL_RESOURCES.md) - API references

---

**Pro Tip**: Add these to your shell aliases:

```bash
# Add to ~/.bashrc or ~/.zshrc
alias ibot='bun cli.ts'
alias ibot-status='bun cli.ts status'
alias ibot-trades='bun cli.ts trades'
alias ibot-stats='bun cli.ts stats'
alias ibot-start='bun start'
```

Now use: `ibot status`, `ibot trades`, etc. 🚀
