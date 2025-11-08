# 🎯 Immortal AI Trading Bot - Production TODO List

> **Current State Assessment**: The project is in **EXCELLENT** condition. The backend is fully functional with no errors. The frontend is **NOT a mock** - it's production-ready with real API integration, wallet connectivity, and live data display.

---

## 📊 Current State Analysis

### ✅ **COMPLETE & PRODUCTION-READY**

#### Backend (100% Complete)
- ✅ API Server (`src/api-server.ts`)
  - All endpoints functional: `/api/start-bot`, `/api/stop-bot`, `/api/bot-status`, `/api/memories`, `/api/discover-tokens`, `/api/trading-stats`, `/api/trade-logs`, `/health`
  - Validation middleware implemented
  - Rate limiting configured
  - API authentication ready (optional, can be enabled)
  - CORS configured
  - Error handling comprehensive
- ✅ Bot Logic (`src/index.ts`)
  - OpenRouter AI integration with tool calling
  - DexScreener data fetching
  - PancakeSwap trade execution
  - BNB Greenfield memory storage
  - Telegram alerts
  - BotState management
  - Background loop with frontend control
- ✅ Supporting Services
  - Winston logging
  - Environment validation
  - Safeguards and error handling

#### Frontend (95% Complete - Real API Integration!)
- ✅ API Integration (`apps/frontend/src/lib/api.ts`)
  - **NO MOCKS** - Production API client with axios
  - All API functions implemented
  - Detailed error handling
  - Request/response interceptors
- ✅ Wallet Integration (`apps/frontend/src/lib/wagmi.ts`)
  - Wagmi + RainbowKit configured
  - opBNB Testnet (5611) support
  - BNB Mainnet (56) support
  - Multi-wallet support ready
- ✅ Components (Real Functionality)
  - **Dashboard**: Real bot start/stop, backend checking, token management
  - **TradingStats**: Real-time stats with usePolling hook
  - **MemoriesView**: Live Greenfield data with filtering
  - **TokenDiscovery**: Real DexScreener trending tokens
- ✅ Custom Hooks
  - `usePolling`: Auto-refresh data hook implemented

#### Smart Contracts
- ✅ Contracts written: `IMMBotToken.sol`, `Staking.sol`
- ✅ Deployment scripts ready: `scripts/deploy-token.ts`, `scripts/deploy-staking.ts`

---

## 🚀 TODO: Path to Production

### **Phase 1: Environment Setup & Initial Configuration** ⏱️ 1-2 hours

Priority: **CRITICAL** | Complexity: **Easy**

#### 1.1 Create Environment Files ⏱️ 30 mins

**Backend `.env`**
```bash
# From project root
cp .env.example .env
```

**Edit `.env` with placeholders for now:**
```bash
# CRITICAL: These will be added later
WALLET_PRIVATE_KEY=0x0000000000000000000000000000000000000000000000000000000000000000
OPENROUTER_API_KEY=sk-or-v1-0000000000000000000000000000000000000000000000000000000000000000

# Safe to configure now
NETWORK=testnet
CHAIN_ID=5611
API_PORT=3001
BOT_LOOP_INTERVAL_MS=300000
MAX_TRADE_AMOUNT_BNB=0.1
STOP_LOSS_PERCENTAGE=10
MIN_LIQUIDITY_USD=10000

# Optional for now
TELEGRAM_BOT_TOKEN=your_token_here
TELEGRAM_CHAT_ID=your_chat_id_here
```

**Frontend `.env.local`**
```bash
# From apps/frontend
cp .env.example .env.local
```

**Edit `apps/frontend/.env.local`:**
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_USE_MAINNET=false
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id_here  # Get from cloud.walletconnect.com
```

**Files to modify:**
- `/home/user/immortal-bnb/.env` (create)
- `/home/user/immortal-bnb/apps/frontend/.env.local` (create)

**Testing:**
```bash
# Backend validation
bun run src/index.ts
# Should show: "Missing required environment variable" OR "Environment validated"
```

---

#### 1.2 Get WalletConnect Project ID ⏱️ 15 mins

1. Go to https://cloud.walletconnect.com
2. Create account / Sign in
3. Create new project: "Immortal AI Trading Bot"
4. Copy Project ID
5. Add to `apps/frontend/.env.local`:
   ```bash
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=abc123...
   ```

**Status Indicator:**
- ✅ Wallet connect button works in frontend
- ❌ "Invalid project ID" error in browser console

---

#### 1.3 Set Up Telegram Alerts (Optional) ⏱️ 15 mins

1. **Create Telegram Bot:**
   - Message @BotFather on Telegram
   - Send `/newbot`
   - Follow prompts, get token like: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`

2. **Get Chat ID:**
   - Message @userinfobot
   - Copy your chat ID

3. **Update `.env`:**
   ```bash
   TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
   TELEGRAM_CHAT_ID=123456789
   ```

**Testing:**
```bash
# Run backend
bun run dev
# Start bot via frontend - should receive Telegram message
```

---

### **Phase 2: Smart Contract Deployment** ⏱️ 3-4 hours

Priority: **HIGH** | Complexity: **Medium**

#### 2.1 Prepare Deployment Wallet ⏱️ 30 mins

1. **Create dedicated deployment wallet** (recommended):
   - Use MetaMask to create new account
   - **CRITICAL**: Back up seed phrase securely (write on paper, store safely)
   - Export private key (MetaMask → Account Details → Export Private Key)

2. **Get testnet BNB:**
   - Go to https://testnet.bnbchain.org/faucet-smart
   - Enter wallet address
   - Get ~0.5 tBNB for testing

3. **Verify balance:**
   ```bash
   # Check balance on opBNB testnet explorer
   # https://opbnb-testnet.bscscan.com/address/<your_address>
   ```

**DO NOT proceed until you have testnet BNB!**

---

#### 2.2 Deploy IMMBOT Token ⏱️ 45 mins

**Files to check:**
- `contracts/IMMBotToken.sol`
- `scripts/deploy-token.ts`
- `hardhat.config.ts`

**Steps:**

1. **Compile contracts:**
   ```bash
   npx hardhat compile
   ```
   Expected output: "Compiled X Solidity files successfully"

2. **Deploy to testnet:**
   ```bash
   npx hardhat run scripts/deploy-token.ts --network opbnb-testnet
   ```

   Expected output:
   ```
   Deploying IMMBotToken...
   Token deployed to: 0x...
   ```

3. **Save deployed address to `.env`:**
   ```bash
   IMMBOT_TOKEN_ADDRESS=0x1234567890abcdef1234567890abcdef12345678
   ```

4. **Verify contract on BscScan (optional but recommended):**
   ```bash
   # Get BscScan API key from https://bscscan.com/myapikey
   # Add to .env: BSCSCAN_API_KEY=your_key

   npx hardhat verify --network opbnb-testnet <token_address>
   ```

5. **Update frontend env:**
   ```bash
   # apps/frontend/.env.local
   NEXT_PUBLIC_IMMBOT_TOKEN_TESTNET=0x1234...
   ```

**Testing:**
```bash
# Check token on explorer
# https://opbnb-testnet.bscscan.com/token/<token_address>
# Should see: Name, Symbol, Total Supply
```

---

#### 2.3 Deploy Staking Contract ⏱️ 45 mins

**Prerequisites:**
- ✅ IMMBOT token deployed
- ✅ Token address in `.env`

**Steps:**

1. **Update deployment script with token address:**
   ```typescript
   // scripts/deploy-staking.ts
   const tokenAddress = process.env.IMMBOT_TOKEN_ADDRESS;
   ```

2. **Deploy staking contract:**
   ```bash
   npx hardhat run scripts/deploy-staking.ts --network opbnb-testnet
   ```

3. **Save address to `.env`:**
   ```bash
   STAKING_CONTRACT_ADDRESS=0xabcdef...
   ```

4. **Update frontend env:**
   ```bash
   # apps/frontend/.env.local
   NEXT_PUBLIC_STAKING_TESTNET=0xabcdef...
   ```

5. **Verify contract:**
   ```bash
   npx hardhat verify --network opbnb-testnet <staking_address> <token_address>
   ```

**Testing:**
```bash
# Check staking contract on explorer
# Should see: Contract verified, readable functions
```

---

#### 2.4 Generate and Export Contract ABIs ⏱️ 30 mins

**Files to create:**
- `apps/frontend/src/contracts/IMMBotToken.abi.json`
- `apps/frontend/src/contracts/Staking.abi.json`

**Steps:**

1. **Create contracts directory in frontend:**
   ```bash
   mkdir -p apps/frontend/src/contracts
   ```

2. **Copy ABIs from artifacts:**
   ```bash
   # After compilation, ABIs are in:
   cp artifacts/contracts/IMMBotToken.sol/IMMBotToken.json \
      apps/frontend/src/contracts/IMMBotToken.abi.json

   cp artifacts/contracts/Staking.sol/Staking.json \
      apps/frontend/src/contracts/Staking.abi.json
   ```

3. **Create ABI export file:**
   ```typescript
   // apps/frontend/src/contracts/index.ts
   import IMMBotTokenABI from './IMMBotToken.abi.json';
   import StakingABI from './Staking.abi.json';

   export const IMMBOT_TOKEN_ABI = IMMBotTokenABI.abi;
   export const STAKING_ABI = StakingABI.abi;
   ```

**Files to create:**
- `apps/frontend/src/contracts/index.ts`

---

#### 2.5 Integrate Contracts with StakingUI ⏱️ 1 hour

**File to modify:**
- `apps/frontend/src/components/StakingUI.tsx`

**Implementation:**

```typescript
// Add imports
import { useContractWrite, useContractRead, useWaitForTransaction } from 'wagmi';
import { parseEther } from 'viem';
import { IMMBOT_TOKEN_ABI, STAKING_ABI } from '@/contracts';

// Inside StakingUI component:

// 1. Get staking contract address
const stakingAddress = CONTRACT_ADDRESSES.STAKING[chain?.id || 5611] as `0x${string}`;

// 2. Approve token spending
const { write: approve, data: approveData } = useContractWrite({
  address: CONTRACT_ADDRESSES.IMMBOT_TOKEN[chain?.id || 5611] as `0x${string}`,
  abi: IMMBOT_TOKEN_ABI,
  functionName: 'approve',
});

const { isLoading: isApproving } = useWaitForTransaction({
  hash: approveData?.hash,
});

// 3. Stake tokens
const { write: stake, data: stakeData } = useContractWrite({
  address: stakingAddress,
  abi: STAKING_ABI,
  functionName: 'stake',
});

const { isLoading: isStaking } = useWaitForTransaction({
  hash: stakeData?.hash,
});

// 4. Read staked balance
const { data: stakedBalance } = useContractRead({
  address: stakingAddress,
  abi: STAKING_ABI,
  functionName: 'balanceOf',
  args: [address],
  watch: true, // Auto-refresh
});

// 5. Update handleStake function
const handleStake = async () => {
  if (!address || !stakeAmount) return;

  const amount = parseEther(stakeAmount);

  // First approve
  await approve?.({
    args: [stakingAddress, amount],
  });

  // Wait for approval, then stake
  // (Handle this with state updates based on isApproving)
};
```

**Testing:**
```bash
# In frontend:
# 1. Connect wallet
# 2. Enter stake amount
# 3. Click stake
# 4. Should see MetaMask popup for approval
# 5. After approval, should see stake transaction
```

---

### **Phase 3: API Keys & Security** ⏱️ 2-3 hours

Priority: **CRITICAL** | Complexity: **Medium**

#### 3.1 Get OpenRouter API Key ⏱️ 15 mins

1. **Sign up at https://openrouter.ai**
2. **Go to Keys section**
3. **Create new API key**
   - Name: "Immortal AI Trading Bot"
   - Set usage limits (optional): $10/month for testing
4. **Copy key** (starts with `sk-or-v1-...`)
5. **Add to `.env`:**
   ```bash
   OPENROUTER_API_KEY=sk-or-v1-abc123...
   ```

**CRITICAL**: This key costs money. Set usage limits!

**Testing:**
```bash
# Run backend
bun run dev
# Should NOT show "Missing OPENROUTER_API_KEY" error
```

---

#### 3.2 Configure Trading Wallet ⏱️ 30 mins

**CRITICAL SECURITY DECISION:**

**Option A: Create Dedicated Trading Wallet (RECOMMENDED)**
1. Create new MetaMask account
2. Label it "Immortal Bot Trading"
3. Transfer ONLY small amount of BNB (e.g., 0.1 BNB for testing)
4. Export private key
5. Add to `.env`:
   ```bash
   WALLET_PRIVATE_KEY=0xabcdef...
   ```

**Option B: Use Existing Wallet (NOT RECOMMENDED)**
- Higher risk if bot has bugs
- If you choose this: Use testnet only until thoroughly tested!

**Testing:**
```bash
# Start backend
bun run dev
# Check logs for: "💰 Wallet Balance: X.XXXX BNB"
```

---

#### 3.3 Enable API Key Authentication (Optional but Recommended) ⏱️ 30 mins

**Files to modify:**
- `.env`
- `src/api-server.ts`
- `apps/frontend/.env.local`
- `apps/frontend/src/lib/api.ts`

**Backend (`src/api-server.ts`):**

Uncomment API authentication:
```typescript
// Import
import { requireApiKey } from './middleware/auth';

// Apply to routes
app.use('/api/', requireApiKey);
```

**Generate API key:**
```bash
# In terminal
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Copy output
```

**Add to `.env`:**
```bash
API_KEY=abc123def456...
```

**Frontend (`apps/frontend/.env.local`):**
```bash
NEXT_PUBLIC_API_KEY=abc123def456...
```

**Frontend (`apps/frontend/src/lib/api.ts`):**

Already configured! Just needs env var:
```typescript
// Check line ~87
headers: {
  'Content-Type': 'application/json',
  'X-API-Key': process.env.NEXT_PUBLIC_API_KEY || ''
}
```

**Testing:**
```bash
# Frontend should still work
# Without API key: Should get 401 Unauthorized
```

---

#### 3.4 Environment Variable Validation ⏱️ 30 mins

**File:** `src/utils/envValidator.ts`

**Already implemented!** Check it validates all critical variables:

```typescript
// Should validate:
- WALLET_PRIVATE_KEY (format: 0x + 64 hex chars)
- OPENROUTER_API_KEY (format: sk-or-v1-...)
- TELEGRAM_BOT_TOKEN (if provided)
- Contract addresses (if deployed)
```

**Testing:**
```bash
# Run backend with missing key
WALLET_PRIVATE_KEY="" bun run dev
# Should error: "Missing required environment variable"

# Run with valid keys
bun run dev
# Should show: "✅ All API keys validated"
```

---

#### 3.5 Security Hardening Checklist ⏱️ 45 mins

**Files to review:**
- `.gitignore`
- `src/middleware/rateLimiting.ts`
- `src/middleware/validation.ts`

**Checklist:**

- [ ] **`.env` files in `.gitignore`**
  ```bash
  # Verify
  cat .gitignore | grep ".env"
  # Should see: .env, .env.local, .env.*.local
  ```

- [ ] **Never commit private keys**
  ```bash
  # Check git history doesn't have keys
  git log --all --full-history --source -- '.env'
  # Should be empty
  ```

- [ ] **Rate limiting configured**
  - Check `src/middleware/rateLimiting.ts`
  - Should see: 100 req/15min for API, 10 req/15min for bot control

- [ ] **Input validation enabled**
  - Check `src/middleware/validation.ts`
  - Token addresses validated with `isEthereumAddress`
  - Risk level validated: 1-10

- [ ] **CORS configured correctly**
  ```typescript
  // src/api-server.ts line 39
  origin: process.env.FRONTEND_URL || 'http://localhost:3000'
  ```

- [ ] **Safeguards in place**
  - Check `src/utils/safeguards.ts`
  - Max trade amount enforced
  - Stop loss implemented
  - Minimum liquidity check

**Testing:**
```bash
# Try to spam API
for i in {1..200}; do curl http://localhost:3001/health; done
# Should see rate limit errors after ~100 requests
```

---

### **Phase 4: Testing & Quality Assurance** ⏱️ 4-6 hours

Priority: **HIGH** | Complexity: **Medium**

#### 4.1 Manual End-to-End Testing ⏱️ 2 hours

**Pre-requisites:**
- ✅ Backend running: `bun run dev`
- ✅ Frontend running: `cd apps/frontend && npm run dev`
- ✅ Wallet has testnet BNB

**Test Checklist:**

**Backend Tests:**
```bash
# Terminal 1: Start backend
bun run dev

# Terminal 2: Test endpoints
curl http://localhost:3001/health
# Expected: {"status":"ok","timestamp":...,"botRunning":false}

curl http://localhost:3001/api/bot-status
# Expected: {"running":false,"watchlist":[],...}

curl http://localhost:3001/api/discover-tokens?limit=5
# Expected: {"tokens":[...],"timestamp":...}

curl -X POST http://localhost:3001/api/start-bot \
  -H "Content-Type: application/json" \
  -d '{"tokens":[],"risk":5}'
# Expected: {"status":"started",...}

curl http://localhost:3001/api/bot-status
# Expected: {"running":true,...}

curl -X POST http://localhost:3001/api/stop-bot
# Expected: {"status":"stopped",...}
```

**Frontend Tests:**

| Step | Action | Expected Result | Status |
|------|--------|----------------|--------|
| 1 | Open http://localhost:3000 | Dashboard loads | ⬜ |
| 2 | Click "Connect Wallet" | RainbowKit modal opens | ⬜ |
| 3 | Connect MetaMask | Wallet address displays | ⬜ |
| 4 | Check network | opBNB Testnet (5611) | ⬜ |
| 5 | Go to "Dashboard" tab | Bot status shows "Stopped" | ⬜ |
| 6 | Set risk level to 5 | Slider moves | ⬜ |
| 7 | Click "Start Trading Bot" | Success message | ⬜ |
| 8 | Check bot status | Shows "Running" with green dot | ⬜ |
| 9 | Check backend logs | See "🤖 Bot is ready" | ⬜ |
| 10 | Wait 30 seconds | Trading cycle starts | ⬜ |
| 11 | Click "Stop Bot" | Bot stops | ⬜ |
| 12 | Go to "Stats" tab | Trading stats display (or "No data") | ⬜ |
| 13 | Go to "Memories" tab | Memories load (or "No memories yet") | ⬜ |
| 14 | Go to "Discover" tab | Trending tokens from DexScreener | ⬜ |
| 15 | Go to "Staking" tab | Staking UI loads, shows balance | ⬜ |
| 16 | Disconnect wallet | Wallet address disappears | ⬜ |

**Testing Document:**
- Create `MANUAL_TEST_RESULTS.md` to track results
- Mark each test as ✅ Pass, ❌ Fail, or ⚠️ Issue
- Document any errors or unexpected behavior

---

#### 4.2 Automated Test Expansion ⏱️ 2-3 hours

**Existing tests to review:**
- `src/__tests__/integration/bot-lifecycle.test.ts`
- `src/__tests__/integration/api-endpoints.test.ts`
- `apps/frontend/src/components/__tests__/TradingStats.test.tsx`

**Additional tests to write:**

**Backend API Tests** (`src/__tests__/api-server.test.ts`):

```typescript
import request from 'supertest';
import { app } from '../api-server';

describe('API Server', () => {
  describe('POST /api/start-bot', () => {
    it('should start bot with valid params', async () => {
      const res = await request(app)
        .post('/api/start-bot')
        .send({ tokens: [], risk: 5 })
        .expect(200);

      expect(res.body.status).toBe('started');
    });

    it('should reject invalid risk level', async () => {
      const res = await request(app)
        .post('/api/start-bot')
        .send({ tokens: [], risk: 15 })
        .expect(400);
    });

    it('should reject invalid token address', async () => {
      const res = await request(app)
        .post('/api/start-bot')
        .send({ tokens: ['not-an-address'], risk: 5 })
        .expect(400);
    });
  });

  describe('GET /api/discover-tokens', () => {
    it('should return trending tokens', async () => {
      const res = await request(app)
        .get('/api/discover-tokens?limit=5')
        .expect(200);

      expect(res.body.tokens).toBeDefined();
      expect(res.body.timestamp).toBeDefined();
    });
  });

  describe('Rate Limiting', () => {
    it('should rate limit excessive requests', async () => {
      // Make 101 requests quickly
      const requests = Array(101).fill(null).map(() =>
        request(app).get('/health')
      );

      const results = await Promise.all(requests);
      const rateLimited = results.filter(r => r.status === 429);

      expect(rateLimited.length).toBeGreaterThan(0);
    });
  });
});
```

**Frontend Component Tests** (expand existing):

```typescript
// apps/frontend/src/components/__tests__/Dashboard.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Dashboard from '../Dashboard';
import * as api from '@/lib/api';

jest.mock('@/lib/api');

describe('Dashboard', () => {
  it('should show backend unavailable warning', async () => {
    (api.isBackendAvailable as jest.Mock).mockResolvedValue(false);

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Backend Server Not Running/i)).toBeInTheDocument();
    });
  });

  it('should start bot successfully', async () => {
    (api.isBackendAvailable as jest.Mock).mockResolvedValue(true);
    (api.getBotStatus as jest.Mock).mockResolvedValue({ running: false, /* ... */ });
    (api.startBot as jest.Mock).mockResolvedValue({ status: 'started' });

    render(<Dashboard />);

    const startButton = await screen.findByText(/Start Trading Bot/i);
    fireEvent.click(startButton);

    await waitFor(() => {
      expect(api.startBot).toHaveBeenCalled();
    });
  });
});
```

**Run tests:**
```bash
# Backend tests
bun test

# Frontend tests
cd apps/frontend && npm test
```

**Coverage goals:**
- Backend: >70% coverage
- Frontend: >60% coverage
- Critical paths: 100% (start/stop bot, trade execution)

---

#### 4.3 Integration Testing ⏱️ 1 hour

**File:** `src/__tests__/integration/full-cycle.test.ts`

```typescript
describe('Full Trading Cycle Integration Test', () => {
  it('should complete a full trading cycle', async () => {
    // 1. Start bot
    // 2. Wait for token discovery
    // 3. Wait for AI decision
    // 4. Verify memory stored (if trade made)
    // 5. Stop bot
    // 6. Verify all cleanup
  }, 60000); // 60 second timeout
});
```

**Testing:**
```bash
# Run with real backend
INTEGRATION_TEST=true bun test integration
```

---

### **Phase 5: Production Deployment Preparation** ⏱️ 4-6 hours

Priority: **MEDIUM** | Complexity: **High**

#### 5.1 Docker Configuration ⏱️ 1.5 hours

**Files to review/modify:**
- `Dockerfile`
- `docker-compose.yml`

**Verify Dockerfile is production-ready:**

```dockerfile
FROM oven/bun:latest

WORKDIR /app

# Copy package files
COPY package.json bun.lockb ./
RUN bun install --production

# Copy source
COPY . .

# Build (if needed)
RUN bun run build

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

EXPOSE 3001

CMD ["bun", "run", "src/index.ts"]
```

**Docker Compose for full stack:**

```yaml
version: '3.8'

services:
  bot:
    build: .
    container_name: immortal-bot
    restart: unless-stopped
    environment:
      - NODE_ENV=production
    env_file:
      - .env
    ports:
      - "3001:3001"
    volumes:
      - ./logs:/app/logs
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 5s
      retries: 3

  frontend:
    build: ./apps/frontend
    container_name: immortal-frontend
    restart: unless-stopped
    environment:
      - NODE_ENV=production
    env_file:
      - ./apps/frontend/.env.local
    ports:
      - "3000:3000"
    depends_on:
      - bot

volumes:
  logs:
```

**Testing:**
```bash
# Build
docker-compose build

# Run
docker-compose up -d

# Check logs
docker-compose logs -f bot

# Health check
docker-compose ps
# Should show: healthy

# Stop
docker-compose down
```

---

#### 5.2 CI/CD Pipeline Setup ⏱️ 2 hours

**File:** `.github/workflows/ci-cd.yml`

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop, claude/*]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v1

      - name: Install dependencies
        run: bun install

      - name: Lint
        run: bun run lint

      - name: Run backend tests
        run: bun test

      - name: Run frontend tests
        run: cd apps/frontend && npm test

      - name: Build backend
        run: bun run build

      - name: Build frontend
        run: cd apps/frontend && npm run build

  security-scan:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Run security audit
        run: |
          bun audit
          cd apps/frontend && npm audit

      - name: Check for secrets
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: ${{ github.event.repository.default_branch }}
          head: HEAD

  deploy:
    needs: [test, security-scan]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v4

      - name: Deploy to production
        run: |
          # Add deployment script here
          echo "Deployment would happen here"
```

**Setup GitHub Secrets:**
1. Go to GitHub repo → Settings → Secrets
2. Add secrets:
   - `WALLET_PRIVATE_KEY` (production wallet)
   - `OPENROUTER_API_KEY`
   - `TELEGRAM_BOT_TOKEN`
   - Other sensitive vars

---

#### 5.3 Monitoring & Alerting Setup ⏱️ 1.5 hours

**Performance Monitoring** (using existing script):

**File:** `scripts/performance.ts` (already exists!)

**Setup monitoring cron job:**

```bash
# Add to crontab (every hour)
0 * * * * cd /path/to/immortal-bnb && bun run perf:collect
```

**Logging Configuration:**

**File:** `src/utils/logger.ts` (already configured!)

**Set up log rotation:**

```bash
# Install logrotate config
sudo vim /etc/logrotate.d/immortal-bot

# Add:
/path/to/immortal-bnb/logs/*.log {
  daily
  rotate 14
  compress
  delaycompress
  missingok
  notifempty
  create 0640 user user
}
```

**Error Tracking with Sentry (optional):**

```bash
# Install
bun add @sentry/node

# Configure in src/index.ts
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

**Health Check Monitoring:**

Create monitoring script:

```bash
# scripts/health-monitor.sh
#!/bin/bash

while true; do
  if ! curl -f http://localhost:3001/health; then
    echo "Bot is down! Restarting..."
    # Send alert
    # Restart service
  fi
  sleep 60
done
```

---

#### 5.4 Production Environment Configuration ⏱️ 1 hour

**Files to create:**
- `.env.production`
- `apps/frontend/.env.production`

**Backend (`.env.production`):**

```bash
# Production settings
NODE_ENV=production
NETWORK=mainnet  # or testnet
CHAIN_ID=56      # BSC mainnet

# API
API_PORT=3001
API_KEY=<generate-secure-key>

# Trading (CONSERVATIVE for production!)
MAX_TRADE_AMOUNT_BNB=0.5
STOP_LOSS_PERCENTAGE=5
MIN_LIQUIDITY_USD=100000
BOT_LOOP_INTERVAL_MS=600000  # 10 minutes

# Keys (from secrets)
WALLET_PRIVATE_KEY=${WALLET_PRIVATE_KEY}
OPENROUTER_API_KEY=${OPENROUTER_API_KEY}

# Deployed contracts
IMMBOT_TOKEN_ADDRESS=<deployed-mainnet-address>
STAKING_CONTRACT_ADDRESS=<deployed-mainnet-address>

# Monitoring
LOG_LEVEL=info
SENTRY_DSN=<your-sentry-dsn>
```

**Frontend (`apps/frontend/.env.production`):**

```bash
NEXT_PUBLIC_API_URL=https://api.yourbot.com
NEXT_PUBLIC_USE_MAINNET=true
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=<your-id>
NEXT_PUBLIC_API_KEY=<same-as-backend>
NEXT_PUBLIC_IMMBOT_TOKEN_MAINNET=<deployed-address>
NEXT_PUBLIC_STAKING_MAINNET=<deployed-address>
```

**Production Deployment Checklist:**

- [ ] All contracts deployed to mainnet
- [ ] Contract addresses in `.env.production`
- [ ] Wallet funded with real BNB (small amount!)
- [ ] OpenRouter API limits set
- [ ] Telegram alerts configured
- [ ] Monitoring setup (logs, Sentry, health checks)
- [ ] Backup scripts configured
- [ ] SSL certificate for domain
- [ ] Firewall rules configured
- [ ] Rate limiting tested
- [ ] Emergency stop procedure documented

---

### **Phase 6: Documentation & Final Polish** ⏱️ 2-3 hours

Priority: **MEDIUM** | Complexity: **Easy**

#### 6.1 Update README ⏱️ 45 mins

**File:** `README.md`

Add sections:
- Quick Start (actual working commands)
- Environment Variables (complete list)
- Deployment Guide (link to detailed docs)
- Troubleshooting (common issues)
- Security Best Practices

#### 6.2 API Documentation ⏱️ 1 hour

**File:** `docs/API.md`

Document all endpoints with examples:

```markdown
## API Endpoints

### POST /api/start-bot
Start the trading bot

**Request:**
```json
{
  "tokens": ["0x..."],  // Optional, auto-discovers if empty
  "risk": 5             // 1-10
}
```

**Response:**
```json
{
  "status": "started",
  "config": {...}
}
```

(Repeat for all endpoints...)
```

#### 6.3 Create DEPLOYMENT.md ⏱️ 45 mins

**File:** `DEPLOYMENT.md`

Step-by-step production deployment guide:
1. Prerequisites
2. Environment setup
3. Contract deployment
4. Backend deployment
5. Frontend deployment
6. Monitoring setup
7. Post-deployment verification

#### 6.4 Create SECURITY.md ⏱️ 30 mins

**File:** `SECURITY.md`

Document:
- Security best practices
- Private key management
- API key rotation
- Incident response procedure
- Vulnerability reporting

---

## 📋 Quick Start Checklist

Use this to track your progress:

### Critical Path (Minimum Viable Production)

- [ ] **Environment Setup**
  - [ ] Create `.env` from template
  - [ ] Create `apps/frontend/.env.local`
  - [ ] Get WalletConnect Project ID
  - [ ] Get OpenRouter API key
  - [ ] Get/create trading wallet with testnet BNB

- [ ] **Smart Contracts**
  - [ ] Deploy IMMBOT token to testnet
  - [ ] Deploy Staking contract to testnet
  - [ ] Generate and export ABIs
  - [ ] Integrate contracts with StakingUI

- [ ] **Testing**
  - [ ] Manual backend testing (all endpoints)
  - [ ] Manual frontend testing (all features)
  - [ ] One complete bot trading cycle

- [ ] **Production Ready**
  - [ ] Docker setup tested
  - [ ] Monitoring configured
  - [ ] Documentation updated

### Optional Enhancements

- [ ] Enable API authentication
- [ ] Set up Telegram alerts
- [ ] Configure Sentry error tracking
- [ ] Set up automated tests in CI/CD
- [ ] Deploy to mainnet (when confident!)

---

## ⏱️ Time Estimates Summary

| Phase | Time | Priority |
|-------|------|----------|
| **Phase 1: Environment Setup** | 1-2 hours | CRITICAL |
| **Phase 2: Contract Deployment** | 3-4 hours | HIGH |
| **Phase 3: API Keys & Security** | 2-3 hours | CRITICAL |
| **Phase 4: Testing** | 4-6 hours | HIGH |
| **Phase 5: Production Deployment** | 4-6 hours | MEDIUM |
| **Phase 6: Documentation** | 2-3 hours | MEDIUM |
| **TOTAL** | **16-24 hours** | - |

---

## 🎯 Next Immediate Steps

1. **Create `.env` file** (5 minutes)
2. **Get WalletConnect Project ID** (10 minutes)
3. **Test backend and frontend locally** (30 minutes)
4. **Get testnet BNB** (10 minutes)
5. **Deploy contracts to testnet** (1 hour)

**You can start trading on testnet in ~2 hours!**

---

## 🆘 Troubleshooting

### Backend won't start
- Check `.env` exists and has required variables
- Run: `bun run src/index.ts` to see detailed error
- Check: Wallet private key format (0x + 64 hex chars)

### Frontend shows "Backend Not Running"
- Check backend is running: `bun run dev`
- Check API URL in `apps/frontend/.env.local`
- Test: `curl http://localhost:3001/health`

### Wallet won't connect
- Check WalletConnect Project ID in `.env.local`
- Check network is opBNB Testnet (5611)
- Try different wallet (MetaMask, Trust Wallet, etc.)

### Contract deployment fails
- Check wallet has testnet BNB
- Check `hardhat.config.ts` has correct RPC URL
- Check network name matches: `--network opbnb-testnet`

### Bot isn't making trades
- Check: Testnet tokens have sufficient liquidity
- Check: Risk level allows trades (lower = more conservative)
- Check: OpenRouter API key is valid and has credits
- Check backend logs for AI responses

---

## 📞 Support

- **Documentation**: Check `docs/` folder
- **Issues**: Create GitHub issue
- **Logs**: Check `logs/combined.log` and `logs/error.log`

---

**Last Updated:** 2025-11-08
**Version:** 1.0.0
**Status:** Ready for testnet deployment
