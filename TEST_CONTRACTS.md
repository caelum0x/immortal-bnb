# 🧪 Testing Staking UI Without Deployed Contracts

**How to test the StakingUI locally before deploying to testnet**

---

## 🎯 Quick Test Setup

You can test the StakingUI interface using example addresses. The UI will load and show the interface, but transactions won't work until you deploy real contracts.

### Step 1: Add Test Contract Addresses

Edit `apps/frontend/.env.local`:

```bash
# Example testnet addresses (for UI testing only - not real deployed contracts!)
NEXT_PUBLIC_IMMBOT_TOKEN_TESTNET=0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82
NEXT_PUBLIC_STAKING_TESTNET=0x10ED43C718714eb63d5aA57B6Da2929C30bC095c

# BSC Testnet example (CAKE token address)
# These are real contracts on testnet, but not YOUR contracts
```

### Step 2: Start Frontend

```bash
cd apps/frontend
npm run dev
```

### Step 3: Test UI

1. Open http://localhost:3000
2. Go to **Staking** tab
3. Connect wallet (switch to BSC Testnet - Chain ID 97)
4. You should see:
   - ✅ No "Contracts Not Deployed" warning
   - ✅ Staking tiers displayed
   - ✅ Your balance (if you have the test token)
   - ❌ Staking won't work (these aren't your contracts)

---

## 🚀 To Actually Deploy and Use Staking:

Follow **DEPLOY_CONTRACTS.md** guide:

### Quick Version:

1. **Get testnet BNB**:
   - https://testnet.bnbchain.org/faucet-smart
   - Request 0.1 tBNB

2. **Deploy with Remix** (easiest):
   - Go to https://remix.ethereum.org
   - Copy `contracts/IMMBotToken.sol`
   - Compile with Solidity 0.8.20
   - Deploy to BSC Testnet (MetaMask)
   - Copy deployed address

3. **Deploy Staking**:
   - Copy `contracts/Staking.sol` to Remix
   - Deploy with token address
   - Copy staking address

4. **Update .env.local**:
   ```bash
   NEXT_PUBLIC_IMMBOT_TOKEN_TESTNET=0xYOUR_TOKEN_ADDRESS
   NEXT_PUBLIC_STAKING_TESTNET=0xYOUR_STAKING_ADDRESS
   ```

5. **Restart frontend** and test!

---

## 📝 Current Status

✅ **Staking UI is fully coded and integrated**:
- Approve workflow
- Stake transaction
- Active stakes display
- Unstake functionality
- Reward calculations

❌ **Contracts need to be deployed by you**:
- Requires your wallet with testnet BNB
- Takes ~30 minutes first time
- Follow DEPLOY_CONTRACTS.md

---

## 🎓 What's Working Now?

### Frontend Features (Ready to Use):
1. **Wallet Connection**: ✅ Wagmi + RainbowKit
2. **Dashboard**: ✅ Bot control, status display
3. **Trading Stats**: ✅ Live data from backend API
4. **Memories**: ✅ Greenfield storage integration
5. **Token Discovery**: ✅ DexScreener trending tokens
6. **Staking UI**: ✅ Fully coded, needs deployed contracts

### Backend Features (Fully Functional):
1. **API Server**: ✅ All 8 endpoints working
2. **AI Trading**: ✅ OpenRouter integration
3. **Trade Execution**: ✅ PancakeSwap integration
4. **Memory Storage**: ✅ BNB Greenfield
5. **Telegram Alerts**: ✅ Ready to configure

### Smart Contracts (Ready to Deploy):
1. **IMMBotToken**: ✅ Written, tested, ready
2. **Staking**: ✅ Written, tested, ready
3. **Deployment Scripts**: ✅ Complete
4. **ABIs**: ✅ Generated and exported

---

## 🔧 Testing Checklist

### Without Deployed Contracts (UI only):
- [x] See staking interface
- [x] View staking tiers
- [x] See "Contract Not Deployed" warning (if no addresses)
- [x] Connect wallet
- [x] Switch networks

### With Deployed Contracts (Full functionality):
- [ ] Deploy token contract
- [ ] Deploy staking contract
- [ ] Update .env.local with addresses
- [ ] Restart frontend
- [ ] Approve token spending (MetaMask popup)
- [ ] Stake tokens (MetaMask popup)
- [ ] See active stakes
- [ ] Calculate rewards
- [ ] Unstake and claim rewards

---

**Next Step**: Follow DEPLOY_CONTRACTS.md to deploy your own contracts!

**Time Required**: 30-60 minutes (one-time setup)
