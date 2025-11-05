### Immortal AI Trading Bot Project Architecture and Folder Plan

Based on our fork of https://github.com/hkirat/ai-trading-agent (a lightweight TS/Bun repo for LLM-based trading), we'll build a modular, end-to-end architecture for the bot. The core flow:
- **Data Ingestion**: Fetch market data from DexScreener API (free, no auth needed for basic queries).
- **AI Decision Engine**: Use OpenRouter (affordable LLM router) to analyze data and decide trades (buy/sell/hold).
- **Trade Execution**: Interact with PancakeSwap on BNB Chain using Ethers.js (non-custodial, user-signed).
- **Immortal Memory**: Store trade outcomes on BNB Greenfield (decentralized storage) for learning (fetch past memories to refine prompts).
- **Cross-Chain (Optional)**: Bridge to Solana via Wormhole if arb opportunities detected.
- **Token Integration**: $IMMBOT BEP-20 token for staking/governance, deployed via Remix.
- **Frontend/Dashboard**: Simple Next.js UI for user interaction (wallet connect, settings).
- **Alerts**: Telegram bot for notifications.

**Architecture Overview** (High-Level):
- **Backend (Node.js/TS with Bun)**: Handles AI, data, execution, memory. Run as a service (e.g., `bun run start`).
- **Blockchain Layer**: Smart contracts in Solidity (token + staking) deployed to BNB testnet/mainnet.
- **Frontend**: Next.js app for UI, integrated with backend via API.
- **Deployment**: Docker for local/prod; test on opBNB testnet.
- **Security**: Env vars for keys; basic rate-limiting; no real funds in MVP.
- **Tech Stack**:
  - Runtime: Bun (fast JS/TS: https://bun.sh/docs).
  - Backend: Node.js/TS, Ethers.js (BNB interactions: https://docs.ethers.org/v6/), @pancakeswap/sdk (DEX: https://docs.pancakeswap.finance/developers/smart-contracts/v2-contracts).
  - AI: OpenRouter (LLM: https://openrouter.ai/docs).
  - Storage: @bnb-chain/greenfield-js-sdk (decentralized memory: https://docs.bnbchain.org/greenfield-docs/).
  - Cross-Chain: wormhole-sdk (bridges: https://docs.wormhole.com/wormhole/quick-start/sdk).
  - Data: DexScreener API (market data: https://docs.dexscreener.com/api/reference).
  - Frontend: Next.js (https://nextjs.org/docs), Wagmi/Web3Modal for wallet (https://wagmi.sh/docs).
  - Alerts: Telegraf.js (Telegram: https://telegraf.js.org/).
  - Token/Contracts: Solidity with OpenZeppelin (https://docs.openzeppelin.com/contracts/5.x/), Remix IDE (https://remix.ethereum.org/).
  - Testing: Mocha/Chai (or Bun's built-in).
  - Env: dotenv for .env (https://www.npmjs.com/package/dotenv).

**End-to-End Workflow**:
1. User connects wallet via dashboard, sets params (e.g., tokens to watch: $GIGGLE, risk level).
2. Bot loop: Fetch data → AI decides → Execute trade if approved → Store memory → Alert user.
3. Learning: Append fetched memories to LLM prompts for evolution.
4. Token: Users stake $IMMBOT to unlock features; bot fees reward holders.

**Project Folder Structure Plan**
We'll modify the forked repo's root (assuming it has `index.ts`, `package.json`, `.gitignore`). Add modular folders for scalability. New files/folders in **bold**; modifications noted.

- **Root (/)**
  - `README.md` (Modified: Add project overview, setup instructions, hackathon notes).
  - `package.json` (Modified: Add deps like "ethers": "^6.13.4", "@pancakeswap/sdk": "^5.0.0", "@bnb-chain/greenfield-js-sdk": "^1.0.0", "wormhole-sdk": "^0.0.9", "telegraf": "^4.16.3", "next": "^14.2.15", "wagmi": "^2.12.18", "web3modal": "^4.2.5". Scripts: "start": "bun index.ts", "dev:frontend": "bun --cwd apps/frontend dev").
  - `.env.example` (**New**: Template for keys: OPENROUTER_API_KEY, BNB_RPC, WALLET_PRIVATE_KEY, TELEGRAM_BOT_TOKEN).
  - `.gitignore` (Modified: Add /dist, /node_modules, .env).
  - `tsconfig.json` (Modified: Add paths for aliases, e.g., "@utils/*": ["src/utils/*"]).
  - `bun.lockb` (Generated via `bun install`).
  - `docker-compose.yml` (**New**: For local setup with Redis if needed for queues; basic services for backend/frontend).
  - `Dockerfile` (**New**: Multi-stage for build/deploy).

- **src/ (Modified: If not present, create as main code dir)**
  - `index.ts` (Modified: Main entry—import and run bot loop: data fetch → AI → execute → memory → alert. Add cron-like loop with setInterval for periodic runs).
  - `config.ts` (**New**: Constants like Pancake router address, token watchlist array, risk thresholds).

- **src/agent/ (**New: AI core folder)**
  - `aiDecision.ts` (**New**: Functions for fetchData (DexScreener) and getAIDecision (OpenRouter prompt/parsing)).
  - `learningLoop.ts` (**New**: Fetch memories from Greenfield, append to prompts for evolution).

- **src/blockchain/ (**New: BNB interactions)**
  - `tradeExecutor.ts` (**New**: executeTrade function with PancakeSwap swaps via Ethers.js).
  - `memoryStorage.ts` (**New**: storeMemory and fetchMemory with Greenfield SDK).
  - `crossChain.ts` (**New**: bridgeToSolana with Wormhole SDK—optional, trigger if AI detects arb).
  - `contracts/ (**New subfolder: Solidity files)**`
    - `IMMBotToken.sol` (**New**: BEP-20 token with tax using OpenZeppelin—deploy via Remix**.
    - `Staking.sol` (**New**: Simple staking contract for $IMMBOT rewards).

- **src/data/ (**New: Data handling)**
  - `marketFetcher.ts` (**New**: API calls to DexScreener—e.g., async function getTokenData(tokenAddress: string)).

- **src/utils/ (**New: Helpers)**
  - `logger.ts` (**New**: Console/winston logging for trades/errors).
  - `errorHandler.ts` (**New**: Try-catch wrappers, e.g., for gas failures).
  - `safeguards.ts` (**New**: Functions for stop-loss, max amount checks).

- **src/alerts/ (**New: Notification system)**
  - `telegramBot.ts` (**New**: Telegraf setup—send messages on trades: bot.launch() in index.ts).

- **apps/frontend/ (**New: Next.js app for dashboard—cd here and bun dev)**
  - `package.json` (**New**: Sub-package with Next.js deps).
  - `next.config.mjs` (**New**: Basic config).
  - `src/app/page.tsx` (**New**: Main page—wallet connect button, form for params).
  - `src/components/Dashboard.tsx` (**New**: UI for token list, risk slider, trade logs).
  - `src/components/WalletConnect.tsx` (**New**: Wagmi/Web3Modal for BNB chain).
  - `src/lib/api.ts` (**New**: Fetch backend endpoints, e.g., startBot).

- **tests/ (**New: Unit/integration tests)**
  - `aiDecision.test.ts` (**New**: Mock DexScreener, test LLM parsing).
  - `tradeExecutor.test.ts` (**New**: Simulate trades on testnet).
  - `memoryStorage.test.ts` (**New**: Greenfield upload/fetch mocks).

**Setup and Run Instructions (Add to README)**
1. `bun install` (root and frontend).
2. Copy `.env.example` to `.env` and fill keys.
3. Deploy contracts: Use Remix—copy IMMBotToken.sol, deploy to testnet, note addresses.
4. Run backend: `bun run index.ts` (starts bot loop).
5. Run frontend: `cd apps/frontend && bun dev` (localhost:3000).
6. Test: Input token address in dashboard → bot runs → check console/Telegram.

**Modifications to Existing Files (From Fork)**
- If repo has `index.ts`: Expand to orchestrate all modules (import agent, blockchain, etc.).
- If it has any trading logic: Replace with our PancakeSwap executor.
- No major conflicts assumed—repo is sparse, so mostly additions.

This structure is modular (easy to hackathon-submit), scalable, and BNB-focused. Total files: ~15-20 new. If perpetuals, add Aster API in tradeExecutor (https://docs.asterdex.com/api-reference). Let's code aiDecision.ts first?### Building the Immortal AI Trading Bot for BNB Hackathon

Based on our previous discussions, the "Immortal AI Trading Bot" is an autonomous AI agent that trades on PancakeSwap (or similar BNB DEXs like Aster for perpetuals), learns from past trades using decentralized "memory" (e.g., BNB Greenfield/IPFS), and evolves strategies over time. This directly targets the Unibase sponsor challenge in the BNB Hack ($500K for on-chain immortal AI agents with decentralized memory and interoperability). Recent examples like MAIGA (a decentralized AI agent for trading on BNB, with Proof-of-Trading and 850K+ users) show this is a hot space—your bot can differentiate by focusing on spot/perp trades with cross-chain (e.g., BNB-Solana arb).

We'll fork the simpler hkirat/ai-trading-agent repo (LLM-based for decisions) as the base, since it's AI-native and easier than the perpetual-trading one (which is more infra-heavy). If you prefer perpetuals, we can adapt later with Aster integrations. This guide assumes basic dev skills (Node.js/TS, Git). Timeline: 1-2 weeks for MVP. Total cost: Low (~$10-20 in testnet gas + API keys).

#### Prerequisites
- **Tools/Setup**:
  - Node.js 18+ and Bun (fast runtime: `curl -fsSL https://bun.sh/install | bash`).
  - GitHub account: Fork https://github.com/hkirat/ai-trading-agent.
  - BNB Chain wallet (e.g., MetaMask with BNB testnet: faucet.bnbchain.org).
  - API Keys: OpenRouter (free tier for LLMs like GPT-4o/Claude), DexScreener (for on-chain data), optional X API for sentiment.
  - Libraries: We'll add via Bun (e.g., ethers.js for BNB, IPFS for memory).
- **Test Environment**: Use opBNB testnet for fast/low-cost testing (docs.bnbchain.org/opbnb-testnet).
- **Security Note**: Use test wallets; add stop-loss in code to avoid real losses. This is educational—deploy at own risk.

#### Step-by-Step Implementation
1. **Fork and Setup the Base Repo (1 Day)**:
   - Fork the repo to your GitHub.
   - Clone: `git clone https://github.com/YOUR_USERNAME/ai-trading-agent.git && cd ai-trading-agent`.
   - Install deps: `bun install`.
   - Add BNB-specific deps: `bun add ethers @pancakeswap/sdk @bnb-chain/greenfield-js-sdk wormhole-sdk`.
   - Run base: `bun run index.ts` (assuming it has a basic LLM trader—adapt if sparse).
   - Config: Create `.env` with keys (e.g., `OPENROUTER_API_KEY=your-key`, `BNB_RPC=https://bsc-testnet.bnbchain.org`, `WALLET_PRIVATE_KEY=your-test-key`).

2. **Integrate AI Decision-Making (2-3 Days)**:
   - Use OpenRouter for LLM prompts to analyze data and decide trades (e.g., buy/sell on memes like $GIGGLE).
   - Add data fetching: On-chain volumes from DexScreener API, sentiment from X (simple scraper or API).
   - Code in `agent.ts` (or index.ts):
     ```typescript
     import fetch from 'node-fetch'; // For APIs

     const OPENROUTER_API = process.env.OPENROUTER_API_KEY;

     async function fetchData(token: string) {
       const dexResponse = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${token}`);
       const dexData = await dexResponse.json(); // Get volume, price
       // Add X sentiment: e.g., fetch recent posts (use X API if key available)
       return { volume: dexData.pairs[0].volume.h24, price: dexData.pairs[0].priceUsd };
     }

     async function getAIDecision(token: string) {
       const data = await fetchData(token);
       const prompt = `Analyze BNB token ${token}: Volume $${data.volume}, Price $${data.price}. Predict trend and suggest buy/sell with amount (0-1 BNB). Output JSON: {action: "buy/sell/hold", amount: number, reason: string}`;
       const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
         method: 'POST',
         headers: { 'Authorization': `Bearer ${OPENROUTER_API}`, 'Content-Type': 'application/json' },
         body: JSON.stringify({
           model: 'gpt-4o-mini', // Cheap and fast
           messages: [{ role: 'user', content: prompt }]
         })
       });
       const { choices } = await response.json();
       return JSON.parse(choices[0].message.content); // {action: 'buy', amount: 0.1, reason: '...'}
     }

     // Example run: const decision = await getAIDecision('0x...GIGGLE_ADDRESS');
     ```

3. **Add Trading Execution on PancakeSwap (2-3 Days)**:
   - Swap the original executor for PancakeSwap V2/V3 (spot trades; for perpetuals, integrate Aster API later).
   - Use ethers.js for on-chain calls. Non-custodial: Bot proposes, wallet signs.
   - Code in `tradeExecutor.ts`:
     ```typescript
     import { ethers } from 'ethers';
     import { PancakeRouter } from '@pancakeswap/sdk';

     const provider = new ethers.JsonRpcProvider(process.env.BNB_RPC);
     const wallet = new ethers.Wallet(process.env.WALLET_PRIVATE_KEY, provider);

     async function executeTrade(tokenAddress: string, action: 'buy' | 'sell', amountBNB: number) {
       const routerAddress = '0x10ED43C718714eb63d5aA57Df2dCfe90d5D2d0'; // Pancake V2 on BNB
       const routerAbi = [ /* ABI from Pancake docs */ ]; // Copy from https://docs.pancakeswap.finance/developers/smart-contracts/v2-contracts
       const router = new ethers.Contract(routerAddress, routerAbi, wallet);

       const path = [ethers.getAddress('0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c'), tokenAddress]; // WBNB to token
       const deadline = Math.floor(Date.now() / 1000) + 60 * 20;

       if (action === 'buy') {
         const tx = await router.swapExactETHForTokens(0, path, wallet.address, deadline, { value: ethers.parseEther(amountBNB.toString()) });
         await tx.wait();
         console.log(`Bought ${amountBNB} BNB worth of token`);
       } else if (action === 'sell') {
         // First approve token, then swapTokensForExactETH
         // Similar logic...
       }
     }

     // Tie to AI: if (decision.action === 'buy') await executeTrade('0x...TOKEN', 'buy', decision.amount);
     ```
   - Test: Run on testnet with fake tokens (e.g., from Pancake test pools).

4. **Implement "Immortality" with Decentralized Memory (1-2 Days)**:
   - After each trade, store strategy/outcome on BNB Greenfield (decentralized storage) for the bot to "learn" (e.g., fine-tune prompts with past data).
   - Code:
     ```typescript
     import { createGreenfieldClient } from '@bnb-chain/greenfield-js-sdk'; // Setup with your BNB wallet

     const client = createGreenfieldClient({ /* config with wallet */ });

     async function storeMemory(tradeData: { token: string, action: string, outcome: number, reason: string }) {
       const memoryJson = JSON.stringify(tradeData);
       const uploadRes = await client.object.uploadObject({
         bucketName: 'your-bucket', // Create via BNB docs
         objectName: `trade_${Date.now()}.json`,
         body: memoryJson,
         txnOption: { /* gas, etc. */ }
       });
       console.log(`Memory stored at: ${uploadRes.objectInfo.id}`);
       return uploadRes.objectInfo.id; // Use in future prompts: "Learn from past: [fetch memory]"
     }

     // After trade: await storeMemory({ token: 'GIGGLE', action: decision.action, outcome: profit, reason: decision.reason });
     ```
   - Learning Loop: In future decisions, fetch/retrieve memories to append to prompts (e.g., "Based on past trades: [memory1, memory2]").

5. **Add Cross-Chain Interoperability (Optional, 1 Day)**:
   - For arb (e.g., BNB to Solana): Use Wormhole SDK.
   - Code snippet:
     ```typescript
     import { Wormhole } from 'wormhole-sdk';

     // Init Wormhole with BNB/Solana chains
     async function bridgeToSolana(amount: number) {
       // Logic to bridge if AI detects opportunity (e.g., price diff)
     }
     ```

6. **Integrate Token ($IMMBOT) and DAO (1 Day)**:
   - Deploy BEP-20 token via Remix (remix.ethereum.org): Use OpenZeppelin template with 2% tax (1% liquidity, 1% burn).
   - Staking Contract: Simple Solidity for holders to stake and earn from bot fees.
   - In bot: Require staking $IMMBOT for premium runs (check balance via contract call).

7. **Frontend Dashboard and Alerts (2 Days)**:
   - Use Next.js (add to repo): Wallet connect, set token watchlist/risk, view trades/memories.
   - Alerts: Telegram bot (Telegraf.js) for trade notifications.

8. **Testing, Demo, and Submission (1-2 Days)**:
   - Test: Simulate trades on testnet (e.g., buy/sell test meme tokens).
   - Demo: Record video of bot analyzing $COAI, trading, storing memory, and evolving (e.g., better decision after "learning").
   - Submit: Via bnbchain.org/en/hackathons/bnb-ai-hack (bi-weekly). Highlight Unibase fit, open-source repo, and MAIGA-like economy.
   - Distribution: Post on X (@arhansubasi0): "Building Immortal AI Bot for #BNBHack – Trades on PancakeSwap, learns forever! Fork here: [link]".

#### Tips and Resources
- Tutorials: Follow Medium's "AI-powered bot for PancakeSwap Prediction" for prediction logic; YouTube "Trading Bot For PancakeSwap" for basics; GitHub PancakeSwap-Trading-Bot for snippets.
- Costs/Risks: Testnet free; mainnet gas ~$0.01/trade. Add safeguards (e.g., max loss 5%).
- Scaling: If perpetuals, integrate Aster API (asterdex.com/dev-docs) for leveraged trades.
- Help: If stuck, share errors—I can debug. Let's code the token contract next if ready!  

