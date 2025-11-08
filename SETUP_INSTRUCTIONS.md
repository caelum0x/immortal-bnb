# 🚀 Immortal AI Trading Bot - Setup Instructions

**Quick start guide to get your bot running in under 30 minutes!**

---

## ✅ Prerequisites

Before starting, ensure you have:

- [x] **Bun runtime** installed (for backend)
- [x] **Node.js 18+** installed (for frontend)
- [x] **Git** installed
- [x] **MetaMask** or compatible Web3 wallet

---

## 📋 Step-by-Step Setup

### 1️⃣ Get Required API Keys (15 minutes)

#### A. WalletConnect Project ID (Required for wallet connection)

1. Go to **https://cloud.walletconnect.com**
2. Sign up / Log in
3. Click **"Create New Project"**
4. Name: `Immortal AI Trading Bot`
5. Copy the **Project ID** (looks like: `a1b2c3d4e5f6...`)
6. Add to `apps/frontend/.env.local`:
   ```bash
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=a1b2c3d4e5f6...
   ```

#### B. OpenRouter API Key (Required for AI trading decisions)

1. Go to **https://openrouter.ai**
2. Sign up / Log in
3. Go to **Keys** section
4. Click **"Create Key"**
5. Name: `Immortal Bot`
6. Set usage limit: **$10/month** (recommended for testing)
7. Copy the API key (starts with `sk-or-v1-...`)
8. Add to `.env`:
   ```bash
   OPENROUTER_API_KEY=sk-or-v1-...
   ```

⚠️ **Important**: This key costs money! Set usage limits.

#### C. Create/Configure Trading Wallet (Required)

**Option A: Create Dedicated Trading Wallet (RECOMMENDED)**

1. Open MetaMask
2. Click account icon → **"Create Account"**
3. Name: `Immortal Bot Trading`
4. Switch to **opBNB Testnet**:
   - Network Name: `opBNB Testnet`
   - RPC URL: `https://opbnb-testnet-rpc.bnbchain.org`
   - Chain ID: `5611`
   - Currency: `tBNB`
   - Explorer: `https://opbnb-testnet.bscscan.com`
5. Get testnet BNB:
   - Go to **https://testnet.bnbchain.org/faucet-smart**
   - Enter your wallet address
   - Get ~0.5 tBNB
6. Export private key:
   - MetaMask → Account Details → **Export Private Key**
   - Enter password
   - Copy private key (starts with `0x...`)
7. Add to `.env`:
   ```bash
   WALLET_PRIVATE_KEY=0x...your-private-key...
   ```

⚠️ **CRITICAL SECURITY**:
- Only fund this wallet with testnet tokens initially
- Never commit your private key to git
- Never share your private key

---

### 2️⃣ Configure Environment Files (5 minutes)

The `.env` and `apps/frontend/.env.local` files have been created with templates.

**Edit `.env` and add:**
```bash
# From step 1B
OPENROUTER_API_KEY=sk-or-v1-...

# From step 1C
WALLET_PRIVATE_KEY=0x...

# Optional: Telegram alerts
TELEGRAM_BOT_TOKEN=  # From @BotFather
TELEGRAM_CHAT_ID=    # From @userinfobot
```

**Edit `apps/frontend/.env.local` and add:**
```bash
# From step 1A
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=...
```

---

### 3️⃣ Install Dependencies (2 minutes)

```bash
# Backend (from project root)
bun install

# Frontend
cd apps/frontend
npm install
cd ../..
```

---

### 4️⃣ Test Local Setup (5 minutes)

**Terminal 1 - Start Backend:**
```bash
bun run dev
```

Expected output:
```
🌟 Immortal AI Trading Bot - Production Mode
✅ All API keys validated
🌐 API Server running on http://localhost:3001
💰 Wallet Balance: 0.5000 tBNB
🤖 Bot is ready - use the frontend to start trading
```

**Terminal 2 - Start Frontend:**
```bash
cd apps/frontend
npm run dev
```

Expected output:
```
▲ Next.js 14.x.x
- Local:        http://localhost:3000
- ready started server on 0.0.0.0:3000
```

**Terminal 3 - Test API:**
```bash
# Health check
curl http://localhost:3001/health

# Should return:
# {"status":"ok","timestamp":...,"botRunning":false}
```

---

### 5️⃣ Test Frontend (3 minutes)

1. **Open browser**: http://localhost:3000
2. **Connect wallet**:
   - Click "Connect Wallet"
   - Select MetaMask
   - Approve connection
   - Ensure network is **opBNB Testnet (5611)**
3. **Test Dashboard**:
   - Go to "Dashboard" tab
   - Should show: Bot Status (Stopped)
   - Should show: Backend connection (green)
4. **Test Token Discovery**:
   - Go to "Discover" tab
   - Should load trending tokens from DexScreener

✅ **If all tests pass, your basic setup is complete!**

---

## 🎯 Next Steps

### Deploy Smart Contracts (1-2 hours)

Follow the contract deployment guide:

```bash
# Compile contracts
npx hardhat compile

# Deploy IMMBOT token to testnet
npx hardhat run scripts/deploy-token.ts --network opbnb-testnet

# Deploy Staking contract
npx hardhat run scripts/deploy-staking.ts --network opbnb-testnet

# Update .env with deployed addresses
```

See [DEPLOYMENT.md](./docs/DEPLOYMENT.md) for detailed instructions.

---

### Start Trading on Testnet

1. **Add tokens to watchlist** (or leave empty for auto-discovery)
2. **Set risk level** (1-10, recommended: 5 for testing)
3. **Click "Start Trading Bot"**
4. **Monitor logs** in backend terminal
5. **Check Memories tab** after trades

---

## 🆘 Troubleshooting

### Backend won't start

**Error: "Missing required environment variable"**
```bash
# Check .env file exists and has required keys
cat .env | grep OPENROUTER_API_KEY
cat .env | grep WALLET_PRIVATE_KEY

# Verify format
# WALLET_PRIVATE_KEY should be: 0x + 64 hex characters
# OPENROUTER_API_KEY should start with: sk-or-v1-
```

**Error: "Insufficient balance"**
```bash
# Get more testnet BNB
# https://testnet.bnbchain.org/faucet-smart
```

### Frontend shows "Backend Not Running"

```bash
# Check backend is running
curl http://localhost:3001/health

# If not responding, restart backend:
bun run dev
```

### Wallet won't connect

1. **Check WalletConnect Project ID**:
   ```bash
   cat apps/frontend/.env.local | grep WALLETCONNECT
   ```
   Should not be empty.

2. **Try different wallet**: Trust Wallet, Rainbow, etc.

3. **Check network**: Must be opBNB Testnet (5611)

4. **Clear browser cache** and retry

### DexScreener API fails

This is usually temporary. The API is free and may have rate limits.

**Workaround**: Add specific token addresses to watchlist instead of auto-discovery.

---

## 📊 Verify Setup Checklist

Use this to confirm everything is working:

- [ ] `.env` file created with all required keys
- [ ] `apps/frontend/.env.local` created with WalletConnect ID
- [ ] Dependencies installed (backend and frontend)
- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] `/health` endpoint returns 200 OK
- [ ] Wallet connects in frontend
- [ ] Token Discovery tab shows tokens
- [ ] Bot Status shows "Stopped" with green backend indicator

---

## 🔒 Security Checklist

Before going to production:

- [ ] `.env` files in `.gitignore`
- [ ] Never committed private keys to git
- [ ] Using dedicated trading wallet (not main wallet)
- [ ] Wallet only has small amount of BNB (testnet)
- [ ] OpenRouter usage limits set
- [ ] API key authentication enabled (optional)
- [ ] Rate limiting tested and working

---

## 📞 Getting Help

- **Documentation**: See `docs/` folder
- **API Reference**: See `docs/API.md`
- **Deployment**: See `DEPLOYMENT.md`
- **Issues**: Create GitHub issue with:
  - Error message
  - Relevant logs from `logs/combined.log`
  - Steps to reproduce

---

## ⏭️ What's Next?

After basic setup:

1. **Deploy Contracts** → Enable staking functionality
2. **Run Tests** → Ensure everything works
3. **Set up Monitoring** → Telegram alerts, logging
4. **Production Deployment** → Docker, CI/CD
5. **Mainnet Deployment** → When confident!

---

**Setup Time**: ~30 minutes
**Status**: Ready for testnet trading
**Last Updated**: 2025-11-08
