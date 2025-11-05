# 🔌 External Resources Integration Guide

Complete guide for integrating all external components, APIs, and services for the Immortal AI Trading Bot.

## 📋 Table of Contents

1. [Blockchain & DEX Integration](#1-blockchain--dex-integration)
2. [Data APIs](#2-data-apis)
3. [AI Services](#3-ai-services)
4. [Notification Services](#4-notification-services)
5. [Frontend & Wallet Tools](#5-frontend--wallet-tools)
6. [Development Tools](#6-development-tools)
7. [Installation Checklist](#7-installation-checklist)

---

## 1. Blockchain & DEX Integration

### 🔗 BNB Chain RPC Endpoint

**Purpose**: Interact with BNB Chain blockchain (read state, send transactions)

**Links**:
- Testnet: `https://bsc-testnet.bnbchain.org`
- Mainnet: `https://bsc-dataseed.bnbchain.org`
- Docs: https://docs.bnbchain.org/docs/rpc

**Integration** (`src/blockchain/tradeExecutor.ts`):
```typescript
import { ethers } from 'ethers';

const provider = new ethers.JsonRpcProvider(
  process.env.NETWORK === 'mainnet'
    ? 'https://bsc-dataseed.bnbchain.org'
    : 'https://bsc-testnet.bnbchain.org'
);

const wallet = new ethers.Wallet(process.env.WALLET_PRIVATE_KEY, provider);
```

**Status**: ✅ Implemented

---

### 🥞 PancakeSwap SDK & Router

**Purpose**: Execute spot trades on BNB's largest DEX

**Links**:
- SDK: https://www.npmjs.com/package/@pancakeswap/sdk
- Docs: https://docs.pancakeswap.finance/developers/smart-contracts
- Router V2: `0x10ED43C718714eb63d5aA57B6Da2929C30bC095c`
- Router V3: `0x1b81D678ffb9C0263b24A97847620C99d213eB14`

**Installation**:
```bash
npm install @pancakeswap/sdk
```

**Integration** (`src/blockchain/tradeExecutor.ts`):
```typescript
const ROUTER_ABI = [
  'function swapExactETHForTokens(uint amountOutMin, address[] path, address to, uint deadline) payable returns (uint[] amounts)',
  'function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] path, address to, uint deadline) returns (uint[] amounts)',
  'function getAmountsOut(uint amountIn, address[] path) view returns (uint[] amounts)'
];

const router = new ethers.Contract(ROUTER_ADDRESS, ROUTER_ABI, wallet);

// Execute swap
const tx = await router.swapExactETHForTokens(
  minOut,
  [WBNB_ADDRESS, tokenAddress],
  wallet.address,
  deadline,
  { value: ethers.parseEther('0.1') }
);
```

**Status**: ✅ Implemented

---

### 🌿 BNB Greenfield SDK

**Purpose**: Decentralized storage for "immortal" trade memories

**Links**:
- SDK: https://www.npmjs.com/package/@bnb-chain/greenfield-js-sdk
- Docs: https://docs.bnbchain.org/greenfield-docs/guide/sdk/js-sdk
- Explorer: https://greenfieldscan.com
- RPC: `https://greenfield-chain.bnbchain.org`

**Installation**:
```bash
npm install @bnb-chain/greenfield-js-sdk
```

**Integration** (`src/blockchain/memoryStorage.ts`):
```typescript
import { Client } from '@bnb-chain/greenfield-js-sdk';

// Note: SDK requires specific setup with Greenfield account
// For hackathon, we use local fallback with plan to integrate
const client = await Client.create(
  'https://greenfield-chain.bnbchain.org',
  '1017' // Greenfield chain ID
);

// Upload memory
const result = await client.object.uploadObject({
  bucketName: 'immortal-bot-memory',
  objectName: `trade_${Date.now()}.json`,
  body: JSON.stringify(tradeMemory),
  txnOption: {
    gasLimit: '300000',
    gasPrice: '5000000000'
  }
});
```

**Current Status**: ⚠️ Stub implementation (local fallback for dev)
**Production TODO**:
1. Create Greenfield account
2. Create bucket via CLI or SDK
3. Fund with BNB for storage fees
4. Update `memoryStorage.ts` with real client

---

## 2. Data APIs

### 📊 DexScreener API

**Purpose**: Real-time market data for BNB Chain tokens

**Links**:
- API Docs: https://docs.dexscreener.com/api/reference
- Explorer: https://dexscreener.com/bsc
- Base URL: `https://api.dexscreener.com/latest/dex`

**Endpoints Used**:
- `/tokens/{address}` - Get token data by address
- `/pairs/{chainId}/{pairAddress}` - Get specific pair info

**Integration** (`src/data/marketFetcher.ts`):
```typescript
import fetch from 'node-fetch';

async function getTokenData(tokenAddress: string) {
  const response = await fetch(
    `https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`
  );

  const data = await response.json();
  const mainPair = data.pairs[0]; // Most liquid pair

  return {
    symbol: mainPair.baseToken.symbol,
    priceUsd: mainPair.priceUsd,
    volume24h: mainPair.volume.h24,
    liquidity: mainPair.liquidity.usd,
    priceChange24h: mainPair.priceChange.h24,
    txns24h: mainPair.txns.h24
  };
}
```

**Rate Limits**: ~100 requests/minute (no auth needed)

**Status**: ✅ Implemented

---

## 3. AI Services

### 🤖 OpenRouter API

**Purpose**: LLM routing for AI trading decisions (GPT-4o-mini, Claude, etc.)

**Links**:
- Website: https://openrouter.ai
- Docs: https://openrouter.ai/docs
- Pricing: https://openrouter.ai/docs#models (GPT-4o-mini ~$0.0001/token)

**Setup**:
1. Sign up at https://openrouter.ai/signup
2. Get API key from dashboard
3. Add credits (free tier available)
4. Add to `.env`: `OPENROUTER_API_KEY=sk-or-xxx`

**Integration** (`src/agent/aiDecision.ts`):
```typescript
const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': 'https://github.com/YOUR_REPO'
  },
  body: JSON.stringify({
    model: 'openai/gpt-4o-mini', // Or 'anthropic/claude-3-haiku'
    messages: [
      { role: 'system', content: 'You are an expert crypto trader...' },
      { role: 'user', content: enrichedPrompt }
    ],
    temperature: 0.7,
    max_tokens: 500
  })
});

const data = await response.json();
const decision = JSON.parse(data.choices[0].message.content);
```

**Models Available**:
- `openai/gpt-4o-mini` (recommended: fast, cheap)
- `anthropic/claude-3-haiku` (alternative)
- `meta-llama/llama-3-8b` (free tier)

**Status**: ✅ Implemented

---

## 4. Notification Services

### 📱 Telegram Bot API

**Purpose**: Real-time trading alerts and notifications

**Links**:
- SDK: https://www.npmjs.com/package/telegraf
- Docs: https://telegraf.js.org
- Bot creation: Talk to @BotFather on Telegram

**Setup**:
1. Open Telegram, search @BotFather
2. Send `/newbot` and follow prompts
3. Get token: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`
4. Get your chat ID:
   - Send message to your bot
   - Visit: `https://api.telegram.org/bot<TOKEN>/getUpdates`
   - Find `"chat":{"id": 123456789}`
5. Add to `.env`:
   ```
   TELEGRAM_BOT_TOKEN=1234567890:ABC...
   TELEGRAM_CHAT_ID=123456789
   ```

**Installation**:
```bash
npm install telegraf
```

**Integration** (`src/alerts/telegramBot.ts`):
```typescript
import { Telegraf } from 'telegraf';

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Set up commands
bot.command('start', ctx => ctx.reply('Bot started!'));
bot.command('status', ctx => ctx.reply('Bot is running...'));

// Launch
bot.launch();

// Send alerts
export async function alertTrade(message: string) {
  await bot.telegram.sendMessage(
    process.env.TELEGRAM_CHAT_ID,
    message,
    { parse_mode: 'Markdown' }
  );
}
```

**Status**: ✅ Implemented

---

## 5. Frontend & Wallet Tools

### 🌐 Wagmi + RainbowKit

**Purpose**: Wallet connection for Next.js dashboard

**Links**:
- Wagmi: https://wagmi.sh/docs
- RainbowKit: https://www.rainbowkit.com/docs
- Web3Modal: https://docs.walletconnect.com/web3modal

**Installation**:
```bash
cd apps/frontend
npm install wagmi @rainbow-me/rainbowkit viem
```

**Integration** (`apps/frontend/src/app/page.tsx`):
```typescript
import { WagmiConfig, createConfig } from 'wagmi';
import { bscTestnet, bsc } from 'wagmi/chains';
import { RainbowKitProvider, connectorsForWallets } from '@rainbow-me/rainbowkit';

const config = createConfig({
  chains: [bscTestnet, bsc],
  transports: {
    [bscTestnet.id]: http('https://bsc-testnet.bnbchain.org'),
    [bsc.id]: http('https://bsc-dataseed.bnbchain.org')
  }
});

export default function App() {
  return (
    <WagmiConfig config={config}>
      <RainbowKitProvider>
        <Dashboard />
      </RainbowKitProvider>
    </WagmiConfig>
  );
}
```

**Status**: ⏳ Planned (frontend TODO)

---

## 6. Development Tools

### 🔨 Remix IDE

**Purpose**: Deploy smart contracts (no local setup needed)

**Link**: https://remix.ethereum.org

**Usage**:
1. Open Remix
2. Create new file: `IMMBotToken.sol`
3. Copy contract from `contracts/IMMBotToken.sol`
4. Install OpenZeppelin: Settings → Add `@openzeppelin/contracts`
5. Compile: Solidity Compiler (0.8.20+)
6. Deploy:
   - Environment: Injected Provider (MetaMask)
   - Network: BNB Testnet
   - Constructor: Enter initial supply (e.g., `1000000000`)
   - Deploy & confirm in MetaMask
7. Copy deployed address to `.env`

**Status**: 📝 Ready to use

---

### 📦 OpenZeppelin Contracts

**Purpose**: Secure, audited smart contract templates

**Link**: https://docs.openzeppelin.com/contracts/5.x

**Used In**:
- `contracts/IMMBotToken.sol` (ERC20, Ownable, Burnable)
- `contracts/Staking.sol` (SafeERC20, ReentrancyGuard)

**Import in Remix**:
```solidity
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
```

**Status**: ✅ Used in contracts

---

### 🌐 Vercel (Deployment)

**Purpose**: Host Next.js frontend

**Link**: https://vercel.com/docs

**Setup**:
1. Push code to GitHub
2. Go to vercel.com
3. Import repository
4. Deploy (auto-detects Next.js)

**Status**: ⏳ Ready when frontend complete

---

### 🔍 BscScan (Verification)

**Purpose**: Verify deployed contracts

**Links**:
- Testnet: https://testnet.bscscan.com
- Mainnet: https://bscscan.com

**Verify Contract**:
1. After deployment, go to BscScan
2. Find contract address
3. Click "Verify and Publish"
4. Select compiler version (0.8.20)
5. Paste source code
6. Submit

**Status**: ⏳ After contract deployment

---

## 7. Installation Checklist

### ✅ Complete Setup (Step-by-Step)

#### A. Environment Setup
```bash
# 1. Clone repo
git clone https://github.com/caelum0x/immortal-bnb.git
cd immortal-bnb

# 2. Install dependencies
npm install

# 3. Copy environment template
cp .env.example .env
```

#### B. Get API Keys

**OpenRouter** (Required):
1. Visit: https://openrouter.ai/signup
2. Sign up with email
3. Go to Keys tab
4. Create new key
5. Copy to `.env`: `OPENROUTER_API_KEY=sk-or-xxx`
6. Add credits: Dashboard → Billing (free tier available)

**Telegram** (Optional but recommended):
1. Open Telegram
2. Search: @BotFather
3. Send: `/newbot`
4. Follow prompts to name bot
5. Copy token to `.env`: `TELEGRAM_BOT_TOKEN=xxx`
6. Message your bot
7. Get chat ID: `https://api.telegram.org/bot<TOKEN>/getUpdates`
8. Copy to `.env`: `TELEGRAM_CHAT_ID=xxx`

**BNB Testnet** (Required):
1. Create MetaMask wallet (or use existing)
2. Add BNB Testnet:
   - Network: BNB Smart Chain Testnet
   - RPC: https://bsc-testnet.bnbchain.org
   - Chain ID: 97
   - Symbol: BNB
   - Explorer: https://testnet.bscscan.com
3. Get test BNB: https://testnet.bnbchain.org/faucet-smart
4. Export private key (MetaMask → Account → Export)
5. Copy to `.env`: `WALLET_PRIVATE_KEY=0x...`

#### C. Configure Settings

Edit `.env`:
```bash
# Set network
NETWORK=testnet

# Set trading limits
MAX_TRADE_AMOUNT_BNB=0.05  # Start small!
STOP_LOSS_PERCENTAGE=5
MAX_SLIPPAGE_PERCENTAGE=2

# Set bot interval
BOT_LOOP_INTERVAL_MS=300000  # 5 minutes
```

#### D. Run Bot

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start

# Monitor logs
tail -f logs/combined.log
```

#### E. Deploy Contracts (Optional)

1. Open https://remix.ethereum.org
2. Create `IMMBotToken.sol`, paste from `contracts/`
3. Compile with Solidity 0.8.20+
4. Connect MetaMask (BNB Testnet)
5. Deploy with initial supply (e.g., 1000000000)
6. Copy address to `.env`: `IMMBOT_TOKEN_ADDRESS=0x...`
7. Repeat for `Staking.sol`

---

## 📊 Cost Estimates

| Service | Type | Cost |
|---------|------|------|
| OpenRouter | AI | ~$0.01 per 100 trades |
| BNB Testnet | Gas | FREE (faucet) |
| BNB Mainnet | Gas | ~$0.10-0.50 per trade |
| Telegram | Alerts | FREE |
| DexScreener | Data | FREE |
| Greenfield | Storage | ~$0.001 per memory |
| **Total/month** | | **~$5-20** (mainnet) |

---

## 🆘 Troubleshooting

### Common Issues

**1. "OPENROUTER_API_KEY not set"**
- Solution: Add key to `.env` and restart bot

**2. "Insufficient funds"**
- Solution: Get testnet BNB from faucet or check balance

**3. "Rate limit exceeded" (DexScreener)**
- Solution: Increase `BOT_LOOP_INTERVAL_MS` or cache data

**4. "Transaction failed"**
- Solution: Check gas, slippage settings, token liquidity

**5. "Greenfield upload failed"**
- Solution: Currently uses local fallback (expected for dev)

---

## 📚 Additional Resources

- **BNB Chain Docs**: https://docs.bnbchain.org
- **PancakeSwap Docs**: https://docs.pancakeswap.finance
- **Ethers.js Docs**: https://docs.ethers.org
- **Telegram Bot API**: https://core.telegram.org/bots/api
- **OpenRouter Models**: https://openrouter.ai/docs#models

---

## 🎯 Production Readiness

Before mainnet deployment:

- [ ] Test thoroughly on testnet (minimum 24 hours)
- [ ] Verify all API keys are production-ready
- [ ] Deploy contracts to mainnet
- [ ] Update `.env` with mainnet addresses
- [ ] Set conservative trade limits
- [ ] Enable all monitoring/alerts
- [ ] Have emergency stop mechanism
- [ ] Document incident response plan

---

**Last Updated**: November 5, 2025
**Status**: All core integrations implemented ✅
**Hackathon Ready**: Yes 🎉
