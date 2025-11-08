# 🚀 Smart Contract Deployment Guide

**Step-by-step guide to deploy IMMBOT Token and Staking contracts**

---

## ⚠️ Important Note

Hardhat 3.x requires ES modules, which conflicts with our Bun/CommonJS setup. You have two options:

### Option A: Deploy in Separate Terminal (Recommended)
Use a separate Node.js environment just for contract deployment.

### Option B: Use Remix IDE (Easiest)
Deploy directly through browser without any setup.

---

## 🎯 Option A: Deploy with Hardhat (Node.js)

### Step 1: Prepare Deployment Wallet

1. **Create deployment wallet in MetaMask**
2. **Export private key**:
   - MetaMask → Account Details → Export Private Key
   - Save it securely (NEVER commit to git!)

3. **Get testnet BNB**:
   - BSC Testnet Faucet: https://testnet.bnbchain.org/faucet-smart
   - You need ~0.1 tBNB for deployment

4. **Add to `.env`**:
```bash
WALLET_PRIVATE_KEY=0x...your-private-key...
```

### Step 2: Install Hardhat in Separate Directory (One-time)

```bash
# Create separate deployment folder
mkdir -p ~/contract-deployment
cd ~/contract-deployment

# Initialize Node project
npm init -y
npm pkg set type="module"

# Install dependencies
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox ethers dotenv

# Copy contracts and scripts
cp -r /home/user/immortal-bnb/contracts ./
cp -r /home/user/immortal-bnb/scripts ./
cp /home/user/immortal-bnb/hardhat.config.ts ./hardhat.config.js
cp /home/user/immortal-bnb/.env ./
```

### Step 3: Update hardhat.config.js for ESM

```javascript
// hardhat.config.js
import { config as dotenvConfig } from "dotenv";
dotenvConfig();

export default {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    bscTestnet: {
      url: process.env.BSC_TESTNET_RPC || "https://data-seed-prebsc-1-s1.binance.org:8545",
      chainId: 97,
      accounts: process.env.WALLET_PRIVATE_KEY ? [process.env.WALLET_PRIVATE_KEY] : [],
      gasPrice: 10000000000,
    },
  },
};
```

### Step 4: Deploy Token Contract

```bash
cd ~/contract-deployment

# Compile contracts
npx hardhat compile

# Deploy to BSC Testnet
npx hardhat run scripts/deploy-token.ts --network bscTestnet
```

**Expected Output**:
```
🚀 Deploying IMMBOT Token...
Deploying with account: 0x...
Account balance: 0.5 BNB

✅ IMMBotToken deployed successfully!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Contract Address: 0xABC123...
Network: bscTestnet
Chain ID: 97
Total Supply: 1000000000.0 IMMBOT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Copy the Contract Address!**

### Step 5: Update Environment Variables

```bash
# In your main project: /home/user/immortal-bnb/.env
IMMBOT_TOKEN_ADDRESS=0xABC123...  # Your deployed address

# In frontend: /home/user/immortal-bnb/apps/frontend/.env.local
NEXT_PUBLIC_IMMBOT_TOKEN_TESTNET=0xABC123...  # Same address
```

### Step 6: Deploy Staking Contract

```bash
cd ~/contract-deployment

# Deploy staking (requires token address in .env)
npx hardhat run scripts/deploy-staking.ts --network bscTestnet
```

**Expected Output**:
```
🚀 Deploying IMMBOT Staking Contract...
IMMBOT Token Address: 0xABC123...

✅ IMMBotStaking deployed successfully!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Contract Address: 0xDEF456...
Token Address: 0xABC123...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Default Staking Tiers:
  Tier 0: 30 days - 5% APY (Active)
  Tier 1: 90 days - 15% APY (Active)
  Tier 2: 180 days - 30% APY (Active)
  Tier 3: 365 days - 50% APY (Active)
```

### Step 7: Update Environment with Staking Address

```bash
# In .env
STAKING_CONTRACT_ADDRESS=0xDEF456...

# In apps/frontend/.env.local
NEXT_PUBLIC_STAKING_TESTNET=0xDEF456...
```

### Step 8: Verify Contracts (Optional but Recommended)

First, get BscScan API key: https://bscscan.com/myapikey

```bash
# Add to .env
BSCSCAN_API_KEY=your_api_key_here

# Verify token
npx hardhat verify --network bscTestnet 0xABC123... 1000000000

# Verify staking
npx hardhat verify --network bscTestnet 0xDEF456... 0xABC123...
```

---

## 🌐 Option B: Deploy with Remix IDE (Easiest!)

### Step 1: Open Remix

Go to: https://remix.ethereum.org

### Step 2: Create Contract Files

1. **Create `IMMBotToken.sol`**:
   - Copy from `/home/user/immortal-bnb/contracts/IMMBotToken.sol`
   - Paste into Remix

2. **Install OpenZeppelin**:
   - Remix auto-imports from GitHub
   - Contracts already have correct imports

### Step 3: Compile

1. Go to "Solidity Compiler" tab
2. Select compiler version: `0.8.20`
3. Enable optimization: 200 runs
4. Click "Compile IMMBotToken.sol"

### Step 4: Deploy Token

1. Go to "Deploy & Run Transactions" tab
2. Environment: **Injected Provider - MetaMask**
3. Connect MetaMask (BSC Testnet - Chain ID 97)
4. Select contract: **IMMBotToken**
5. Constructor args:
   - `initialSupply`: `1000000000` (1 billion)
6. Click "Deploy"
7. Confirm in MetaMask

**Copy the deployed contract address!**

### Step 5: Deploy Staking

1. **Create `Staking.sol`**:
   - Copy from `/home/user/immortal-bnb/contracts/Staking.sol`

2. **Compile Staking.sol**

3. **Deploy**:
   - Constructor args:
     - `_stakingToken`: `0xABC...` (your token address)
   - Click "Deploy"
   - Confirm in MetaMask

**Copy the staking contract address!**

### Step 6: Link Contracts

1. In Remix, load your deployed **IMMBotToken**:
   - "At Address" → paste token address

2. Call `setStakingContract`:
   - `_stakingContract`: `0xDEF...` (your staking address)
   - Click "Transact"
   - Confirm in MetaMask

### Step 7: Verify on BscScan

1. Go to: https://testnet.bscscan.com/address/YOUR_TOKEN_ADDRESS
2. Click "Contract" tab → "Verify and Publish"
3. Select:
   - Compiler: `v0.8.20`
   - Optimization: Yes (200 runs)
   - License: MIT
4. Paste contract code
5. Add constructor args (encoded)

**Or use Hardhat verify** (Option A, Step 8)

---

## ✅ Verification Checklist

After deployment:

- [ ] Token contract deployed and address copied
- [ ] Staking contract deployed and address copied
- [ ] `setStakingContract()` called on token
- [ ] Addresses added to `.env`
- [ ] Addresses added to `apps/frontend/.env.local`
- [ ] Contracts verified on BscScan (optional)
- [ ] Backend restarted: `bun run dev`
- [ ] Frontend restarted: `cd apps/frontend && npm run dev`

---

## 🧪 Test Deployment

### Check Token

```bash
# In Remix or via ethers.js
token.totalSupply()  # Should return: 1000000000000000000000000000 (1B * 10^18)
token.symbol()       # Should return: "IMMBOT"
token.name()         # Should return: "Immortal Bot Token"
```

### Check Staking

```bash
staking.stakingToken()  # Should return: your token address
staking.tiers(0)        # Should return: (2592000, 500, true) = 30 days, 5%, active
```

### Test Frontend

1. Open: http://localhost:3000
2. Go to **Staking** tab
3. Connect wallet
4. Should show:
   - Your IMMBOT balance
   - Staking tiers
   - No warning about "Contracts Not Deployed"

---

## 🆘 Troubleshooting

### "Deployer account has no BNB"
- Get testnet BNB: https://testnet.bnbchain.org/faucet-smart
- Wait 1-2 minutes after requesting

### "Cannot find module 'hardhat/config'"
- You're in the wrong directory
- Make sure you're in `~/contract-deployment` (Option A)

### "Network request failed"
- Check internet connection
- Try different RPC: https://bsc-testnet.public.blastapi.io

### "Transaction underpriced"
- Increase gas price in hardhat.config.js:
  ```javascript
  gasPrice: 20000000000  // 20 gwei
  ```

### Contracts deployed but StakingUI shows warning
- Check addresses in `apps/frontend/.env.local`
- Restart frontend: `npm run dev`
- Clear browser cache

---

## 📊 Gas Estimates

| Contract | Estimated Gas | Cost (at 10 gwei) |
|----------|---------------|-------------------|
| IMMBotToken | ~2,000,000 | ~0.02 tBNB |
| Staking | ~1,500,000 | ~0.015 tBNB |
| **Total** | **~3,500,000** | **~0.035 tBNB** |

Always get extra testnet BNB (request 0.1 tBNB) for safety.

---

## 🎯 After Deployment

1. **Test staking flow**:
   - Approve IMMBOT spending
   - Stake 1000 IMMBOT
   - Check active stakes
   - Unstake and claim rewards

2. **Monitor contracts**:
   - BscScan: https://testnet.bscscan.com
   - Watch for transactions

3. **Share addresses** (optional):
   - Token on testnet for others to test
   - Add to project README

---

## 📝 Deployment Checklist Summary

```bash
# 1. Get testnet BNB
✓ Funded wallet with 0.1 tBNB

# 2. Deploy token
✓ Token deployed: 0xABC...
✓ Added to .env and frontend/.env.local

# 3. Deploy staking
✓ Staking deployed: 0xDEF...
✓ Added to .env and frontend/.env.local
✓ Called setStakingContract() on token

# 4. Verify (optional)
✓ Token verified on BscScan
✓ Staking verified on BscScan

# 5. Test
✓ Frontend shows contracts
✓ Can approve tokens
✓ Can stake tokens
✓ Can see active stakes
```

---

**Deployment Time**: 30-60 minutes (first time)
**Next Time**: 10-15 minutes

Good luck! 🚀
