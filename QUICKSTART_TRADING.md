# 🚀 Quick Start: Real Trading with PancakeSwap SDK

This guide shows you how to use the Immortal AI Trading Bot with real PancakeSwap V3 integration and BNB Greenfield memory storage.

---

## Prerequisites

1. **Bun** installed: `curl -fsSL https://bun.sh/install | bash`
2. **Testnet BNB**: Get from https://testnet.bnbchain.org/faucet-smart
3. **OpenRouter API Key**: Sign up at https://openrouter.ai
4. **Telegram Bot** (optional): Create via @BotFather

---

## Step 1: Install Dependencies

```bash
cd immortal-bnb
bun install
```

This installs:
- `@pancakeswap/v3-sdk` - V3 concentrated liquidity pools
- `@pancakeswap/swap-sdk-core` - Core SDK utilities
- `@bnb-chain/greenfield-js-sdk` - Immortal memory storage
- `ethers` - Blockchain interaction
- `ai` + `@openrouter/ai-sdk-provider` - AI decision making
- `telegraf` - Telegram alerts

---

## Step 2: Configure Environment

Copy the example and edit:

```bash
cp .env.example .env
```

Edit `.env`:

```bash
# AI
OPENROUTER_API_KEY=sk-or-v1-xxxxx

# Blockchain (opBNB Testnet - fast & cheap!)
TRADING_NETWORK=opbnb
NETWORK=testnet
OPBNB_RPC=https://opbnb-testnet-rpc.bnbchain.org
OPBNB_CHAIN_ID=5611

# Your wallet (TESTNET wallet only!)
WALLET_PRIVATE_KEY=0xyour_testnet_private_key_here

# Greenfield (for immortal memory)
GREENFIELD_RPC_URL=https://gnfd-testnet-fullnode-tendermint-ap.bnbchain.org
GREENFIELD_CHAIN_ID=5600
GREENFIELD_BUCKET_NAME=immortal-bot-memory

# Telegram (optional)
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id

# Trading limits
MAX_TRADE_AMOUNT_BNB=0.05
STOP_LOSS_PERCENTAGE=5
MAX_SLIPPAGE_PERCENTAGE=0.5
```

---

## Step 3: Get Testnet BNB

Get free testnet BNB for opBNB:

1. Go to: https://opbnb-testnet-bridge.bnbchain.org/faucet
2. Enter your wallet address
3. Request 0.5 BNB (enough for hundreds of trades!)

Verify balance:
```bash
bun run -e "
import { ethers } from 'ethers';
const provider = new ethers.JsonRpcProvider('https://opbnb-testnet-rpc.bnbchain.org');
const balance = await provider.getBalance('YOUR_ADDRESS');
console.log('Balance:', ethers.formatEther(balance), 'BNB');
"
```

---

## Step 4: Run the Bot

### Test Mode (Manual Trade)

Test a single trade first:

```typescript
// test-trade.ts
import PancakeSwapV3 from './src/blockchain/pancakeSwapIntegration';

const pancake = new PancakeSwapV3();

// Buy a test token (replace with real token address)
const result = await pancake.buyTokenWithBNB(
  '0xTokenAddressHere',
  0.01, // 0.01 BNB
  50    // 0.5% slippage (50 basis points)
);

console.log('Trade result:', result);
```

Run:
```bash
bun test-trade.ts
```

### Production Mode (AI-Powered)

Run the full AI bot:

```bash
bun run dev
```

The bot will:
1. ✅ Initialize PancakeSwap V3 SDK
2. ✅ Connect to BNB Greenfield for memory
3. ✅ Fetch market data from DexScreener
4. ✅ Load past trade memories
5. ✅ Ask AI for trading decision
6. ✅ Execute trades if confidence > 70%
7. ✅ Store outcomes in immortal memory
8. ✅ Send Telegram alerts
9. ✅ Repeat every 5 minutes

---

## Step 5: Monitor Trades

### View Transaction

After a trade executes, view it on:
- **opBNB Testnet**: https://testnet.opbnbscan.com/tx/YOUR_TX_HASH
- **BNB Testnet**: https://testnet.bscscan.com/tx/YOUR_TX_HASH

### Check Greenfield Memory

View stored memories:
- **Explorer**: https://testnet.greenfieldscan.com
- Search for your bucket: `immortal-bot-memory`

### Telegram Alerts

If configured, you'll receive:
```
🤖 AI Decision: BUY
Token: GIGGLE
Amount: 0.05 BNB
Confidence: 85%
Reason: Strong buy pressure, high volume

✅ Trade Executed
TX: 0x123...
Output: 1234.56 GIGGLE
Price Impact: 0.8%
```

---

## How It Works

### 1. Market Data Fetch

```typescript
// From DexScreener API
{
  symbol: "GIGGLE",
  priceUsd: 0.00123,
  volume24h: 50000,
  liquidity: 25000,
  buyPressure: 0.65,
  priceChange24h: 15.5
}
```

### 2. AI Analysis

The AI receives:
- Current market data
- Past trade memories from Greenfield
- Wallet balance
- Risk parameters

And decides:
```json
{
  "action": "buy",
  "amount": 0.05,
  "confidence": 0.85,
  "reasoning": "High buy pressure (65%) with strong volume. Similar to profitable memory #12."
}
```

### 3. PancakeSwap V3 Execution

```typescript
// SDK finds best pool
Pool: WBNB/GIGGLE
Fee Tier: 0.3%
Liquidity: $25,000

// Calculates optimal trade
Expected Output: 1234.56 GIGGLE
Price Impact: 0.8%
Min Output (0.5% slippage): 1228.38 GIGGLE

// Executes on-chain
TX: 0x123...
Gas: 0.0008 BNB (~$0.001)
Status: Success ✅
```

### 4. Memory Storage (Greenfield)

```json
{
  "id": "memory_1699200000_abc123",
  "timestamp": 1699200000000,
  "tokenSymbol": "GIGGLE",
  "action": "buy",
  "entryPrice": 0.00123,
  "amount": 0.05,
  "outcome": "pending",
  "aiReasoning": "High buy pressure...",
  "marketConditions": {
    "volume24h": 50000,
    "liquidity": 25000,
    "buyPressure": 0.65
  }
}
```

Stored permanently on BNB Greenfield!

---

## Configuration Options

### Trading Parameters

```env
# Max BNB per trade
MAX_TRADE_AMOUNT_BNB=0.1

# Auto-sell if price drops 5%
STOP_LOSS_PERCENTAGE=5

# Max price slippage allowed
MAX_SLIPPAGE_PERCENTAGE=0.5

# Bot loop interval (5 minutes)
BOT_LOOP_INTERVAL_MS=300000
```

### Token Watchlist

Edit `src/config.ts`:

```typescript
DEFAULT_WATCHLIST: [
  '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb', // Example token 1
  '0x...', // Example token 2
]
```

Or leave empty to auto-detect trending tokens!

---

## Troubleshooting

### "No pool found"

Token may not have liquidity on opBNB. Try:
1. Check on DexScreener: https://dexscreener.com/opbnb
2. Switch to BNB Chain L1: `TRADING_NETWORK=bnb`

### "Insufficient funds"

Get more testnet BNB from faucet or reduce `MAX_TRADE_AMOUNT_BNB`

### "Price impact too high"

Trade size too large for pool. Reduce amount or find token with more liquidity.

### "Greenfield error"

Make sure you have testnet BNB for Greenfield gas fees (very small)

---

## Real Money (Mainnet)

⚠️ **WARNING**: Only use mainnet after extensive testnet testing!

To switch to mainnet:

```env
NETWORK=mainnet
TRADING_NETWORK=opbnb

# opBNB Mainnet
OPBNB_RPC=https://opbnb-mainnet-rpc.bnbchain.org
OPBNB_CHAIN_ID=204

# Greenfield Mainnet
GREENFIELD_RPC_URL=https://greenfield-chain.bnbchain.org
GREENFIELD_CHAIN_ID=1017
```

Start small and monitor closely!

---

## Performance Benefits

### opBNB vs BNB Chain L1

| Metric | BNB L1 | opBNB L2 | Improvement |
|--------|--------|----------|-------------|
| Block Time | ~3s | ~1s | **3x faster** |
| Gas Cost | $0.10+ | $0.001 | **99% cheaper** |
| Confirmations | Slower | Instant | **Better UX** |

**Recommendation**: Use opBNB for all trading! 🚀

---

## Next Steps

1. ✅ Test on opBNB testnet
2. ✅ Monitor AI decisions in logs
3. ✅ Check trades on explorer
4. ✅ View memories on Greenfield
5. ✅ Adjust risk parameters
6. ✅ Add your own tokens to watchlist
7. ✅ Deploy to production when ready

---

## Support

- **Issues**: https://github.com/caelum0x/immortal-bnb/issues
- **Docs**: See README.md and PANCAKESWAP_SDK_GUIDE.md
- **opBNB Docs**: https://docs.bnbchain.org/opbnb-docs/
- **PancakeSwap**: https://docs.pancakeswap.finance/

---

**Built for BNB Hackathon 2024** 🏆

*"An AI that never forgets, trading on opBNB"* ⚡🥞
