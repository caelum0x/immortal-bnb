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

# Install dependencies
bun install

# Copy environment template
cp .env.example .env
```

### 2. Configuration

Edit `.env` with your credentials:

```bash
# OpenRouter API Key (get from https://openrouter.ai/signup)
OPENROUTER_API_KEY=your_key_here

# BNB Chain RPC (testnet for development)
BNB_RPC=https://bsc-testnet.bnbchain.org

# Your wallet private key (NEVER share this!)
WALLET_PRIVATE_KEY=your_test_wallet_private_key

# Telegram (optional)
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id

# Network
NETWORK=testnet
```

### 3. Get Testnet BNB

Get free testnet BNB from the faucet:
- https://testnet.bnbchain.org/faucet-smart

### 4. Run the Bot

```bash
# Start bot in development mode (auto-reload)
bun run dev

# Or run production mode
bun run start
```

## 🎯 How It Works

### Trading Loop (Every 5 Minutes)

1. **Fetch Market Data**: Gets token prices, volume, liquidity from DexScreener
2. **Fetch Memories**: Retrieves past trade outcomes from Greenfield storage
3. **AI Decision**: Analyzes data + memories to decide: buy/sell/hold
4. **Execute Trade**: If confidence > 50%, executes on PancakeSwap
5. **Store Memory**: Records trade details in immortal storage
6. **Alert User**: Sends Telegram notification

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

1. Open **Remix IDE**: https://remix.ethereum.org
2. Copy `contracts/IMMBotToken.sol` and `contracts/Staking.sol`
3. Install OpenZeppelin:
   ```
   npm install @openzeppelin/contracts
   ```
4. Compile with Solidity 0.8.20+
5. Deploy to BNB Testnet via MetaMask
6. Update `.env` with deployed addresses:
   ```
   IMMBOT_TOKEN_ADDRESS=0x...
   ```

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

```bash
# Run unit tests
bun test

# Test specific module
bun test src/agent/aiDecision.test.ts
```

## 📱 Telegram Setup

1. Create bot: Talk to @BotFather on Telegram
2. Get token: `/newbot` → Follow prompts
3. Get chat ID: Send message to bot, then:
   ```
   https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates
   ```
4. Add to `.env`

## 🛡️ Safety Features

- **Stop-Loss**: Auto-sells at configured loss threshold
- **Position Sizing**: Limits based on account balance
- **Cooldowns**: Prevents over-trading same token
- **Rate Limiting**: Respects API limits
- **Gas Estimation**: Checks costs before execution
- **Slippage Protection**: Rejects unfavorable prices

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

## 🌐 Frontend Dashboard (Optional)

```bash
cd apps/frontend
bun install
bun dev
```

Access at: http://localhost:3000

Features:
- Connect wallet
- View active positions
- See trade history
- Monitor bot status

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
