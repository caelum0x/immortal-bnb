# IMMBOT Smart Contracts

This directory contains the smart contracts for the Immortal AI Trading Bot ecosystem.

## Contracts

### 1. IMMBotToken.sol
**Immortal Bot Token (IMMBOT)** - ERC20 utility token with:
- 1 billion initial supply
- 2% transaction tax (1% burn, 1% to liquidity)
- Tax exemptions for staking contract and owner
- Burnable tokens
- Ownable for governance

**Use cases:**
- Governance voting
- Staking for rewards
- Access to premium bot features
- Liquidity provision

### 2. Staking.sol
**IMMBOT Staking Contract** - Stake IMMBOT tokens to earn rewards:
- 4 default staking tiers (30, 90, 180, 365 days)
- APY ranging from 5% to 50% based on tier
- Rewards from bot trading fees
- Early withdrawal penalty (50% reward reduction)
- Minimum stake: 1000 IMMBOT

**Staking tiers:**
- Tier 0: 30 days - 5% APY
- Tier 1: 90 days - 15% APY
- Tier 2: 180 days - 30% APY
- Tier 3: 365 days - 50% APY

## Prerequisites

1. **Node.js 18+** or **Bun**
2. **Hardhat** development environment
3. **BNB** for gas fees (testnet or mainnet)
4. **BscScan API key** for contract verification

## Setup

### 1. Install Dependencies

```bash
# Run the setup script
bash scripts/setup-contracts.sh

# Or manually install
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox @openzeppelin/contracts
```

### 2. Configure Environment

Update `.env` with required variables:

```bash
# Required for deployment
WALLET_PRIVATE_KEY=0x...  # Your deployer wallet private key
BSCSCAN_API_KEY=...       # For contract verification

# Optional (uses defaults if not set)
BSC_TESTNET_RPC=https://data-seed-prebsc-1-s1.binance.org:8545
BSC_MAINNET_RPC=https://bsc-dataseed.binance.org/
```

**⚠️ Security Warning:**
- Never commit your private key to git
- Use a separate deployment wallet with limited funds
- Keep private keys encrypted and secure

### 3. Compile Contracts

```bash
npx hardhat compile
```

This will:
- Compile all Solidity files
- Generate TypeScript types
- Create artifacts in `artifacts/` directory

## Deployment

### Deploy to Testnet (Recommended First)

#### Step 1: Deploy IMMBOT Token

```bash
npx hardhat run scripts/deploy-token.ts --network bscTestnet
```

**Output:**
```
✅ IMMBotToken deployed successfully!
Contract Address: 0x...
Total Supply: 1000000000.0 IMMBOT
```

**Save the contract address** and add to `.env`:
```bash
IMMBOT_TOKEN_ADDRESS=0x...
```

#### Step 2: Deploy Staking Contract

```bash
npx hardhat run scripts/deploy-staking.ts --network bscTestnet
```

**Output:**
```
✅ IMMBotStaking deployed successfully!
Contract Address: 0x...
```

**Save the contract address** and add to `.env`:
```bash
STAKING_CONTRACT_ADDRESS=0x...
```

### Verify Contracts on BscScan

```bash
# Verify token
npx hardhat verify --network bscTestnet <TOKEN_ADDRESS> 1000000000

# Verify staking
npx hardhat verify --network bscTestnet <STAKING_ADDRESS> <TOKEN_ADDRESS>
```

**After verification:**
- View contract on [BscScan Testnet](https://testnet.bscscan.com/)
- Interact with contract functions
- View source code and ABI

### Deploy to Mainnet

**⚠️ Only deploy to mainnet after thorough testing on testnet!**

```bash
# Deploy token
npx hardhat run scripts/deploy-token.ts --network bscMainnet

# Deploy staking
npx hardhat run scripts/deploy-staking.ts --network bscMainnet

# Verify contracts
npx hardhat verify --network bscMainnet <TOKEN_ADDRESS> 1000000000
npx hardhat verify --network bscMainnet <STAKING_ADDRESS> <TOKEN_ADDRESS>
```

## Testing

### Run Unit Tests

```bash
npx hardhat test
```

### Run Integration Tests

```bash
npx hardhat test test/contracts/integration/*.test.ts
```

### Test Coverage

```bash
npx hardhat coverage
```

## Interacting with Deployed Contracts

### View Contract Information

```bash
npx hardhat run scripts/interact-contracts.ts --network bscTestnet
```

**Output:**
```
📊 Token Information
Name: Immortal Bot Token
Symbol: IMMBOT
Total Supply: 1000000000.0 IMMBOT
Your Balance: 1000000000.0 IMMBOT

🏦 Staking Information
Total Staked: 0.0 IMMBOT
Reward Pool: 0.0 IMMBOT
Minimum Stake: 1000.0 IMMBOT

Staking Tiers:
  Tier 0: 30 days - 5% APY ✅
  Tier 1: 90 days - 15% APY ✅
  Tier 2: 180 days - 30% APY ✅
  Tier 3: 365 days - 50% APY ✅
```

### Common Operations

#### 1. Approve Staking Contract

```bash
# Using Hardhat console
npx hardhat console --network bscTestnet

const token = await ethers.getContractAt("IMMBotToken", "TOKEN_ADDRESS");
const tx = await token.approve("STAKING_ADDRESS", ethers.parseEther("10000"));
await tx.wait();
```

#### 2. Stake Tokens

```bash
const staking = await ethers.getContractAt("IMMBotStaking", "STAKING_ADDRESS");
const tx = await staking.stake(ethers.parseEther("5000"), 1); // 5000 IMMBOT, Tier 1 (90 days)
await tx.wait();
```

#### 3. Check Pending Rewards

```bash
const rewards = await staking.getPendingRewards("YOUR_ADDRESS");
console.log(`Pending rewards: ${ethers.formatEther(rewards)} IMMBOT`);
```

#### 4. Unstake Tokens

```bash
const tx = await staking.unstake(0); // Unstake first stake
await tx.wait();
```

#### 5. Add Rewards (Bot Owner)

```bash
// First approve tokens
await token.approve("STAKING_ADDRESS", ethers.parseEther("1000"));

// Add rewards to pool
await staking.addRewards(ethers.parseEther("1000"));
```

## Frontend Integration

### Update Frontend Environment

Add deployed contract addresses to `apps/frontend/.env`:

```bash
# Testnet
NEXT_PUBLIC_IMMBOT_TOKEN_TESTNET=0x...
NEXT_PUBLIC_STAKING_TESTNET=0x...

# Mainnet (when ready)
NEXT_PUBLIC_IMMBOT_TOKEN_MAINNET=0x...
NEXT_PUBLIC_STAKING_MAINNET=0x...
```

### Contract ABIs

After compilation, ABIs are available at:
```
artifacts/contracts/IMMBotToken.sol/IMMBotToken.json
artifacts/contracts/Staking.sol/IMMBotStaking.json
```

Copy to frontend:
```bash
cp artifacts/contracts/IMMBotToken.sol/IMMBotToken.json apps/frontend/src/contracts/
cp artifacts/contracts/Staking.sol/IMMBotStaking.json apps/frontend/src/contracts/
```

## Security Considerations

### Before Deployment

- [ ] Audit smart contracts (use tools like Slither, Mythril)
- [ ] Test all functions on testnet
- [ ] Verify tax calculations are correct
- [ ] Test staking rewards calculations
- [ ] Check for reentrancy vulnerabilities
- [ ] Verify access control (onlyOwner functions)
- [ ] Test emergency withdrawal scenarios

### After Deployment

- [ ] Verify contract source code on BscScan
- [ ] Renounce ownership if applicable (after setup complete)
- [ ] Monitor contract for suspicious activity
- [ ] Set up alerts for large transactions
- [ ] Keep deployment wallet secure

### Best Practices

1. **Use a hardware wallet** for mainnet deployments
2. **Test thoroughly** on testnet before mainnet
3. **Start with small amounts** for initial testing
4. **Monitor gas prices** to optimize deployment costs
5. **Keep private keys encrypted** and never share them
6. **Use multi-sig wallets** for contract ownership on mainnet

## Troubleshooting

### Deployment Fails

**Error: insufficient funds**
```
Solution: Add more BNB to your deployer wallet
```

**Error: nonce too low**
```bash
Solution: Reset MetaMask or wait for pending transactions
```

**Error: contract creation code storage out of gas**
```
Solution: Increase gas limit in hardhat.config.ts
```

### Verification Fails

**Error: already verified**
```
Solution: Contract is already verified, no action needed
```

**Error: constructor arguments mismatch**
```bash
Solution: Ensure you're passing correct constructor arguments
Example: npx hardhat verify <ADDRESS> 1000000000 (for token)
```

## Gas Optimization

### Deployment Costs (Approximate)

**BSC Testnet:**
- Token deployment: ~0.01 BNB
- Staking deployment: ~0.015 BNB
- Total: ~0.025 BNB

**BSC Mainnet:**
- Token deployment: ~0.02-0.03 BNB (depends on gas price)
- Staking deployment: ~0.03-0.04 BNB
- Total: ~0.05-0.07 BNB

**Tips to reduce costs:**
1. Deploy during low network activity
2. Use optimizer settings in hardhat.config.ts
3. Batch transactions when possible

## Upgrades and Migrations

### Contract Upgrades

The current contracts are **not upgradeable** by design for security and transparency.

If you need to upgrade:
1. Deploy new contract versions
2. Migrate user balances (if applicable)
3. Update frontend to point to new addresses
4. Communicate changes to users

### Migration Process

If migrating to new contracts:
```bash
# 1. Deploy new contracts
npx hardhat run scripts/deploy-token.ts --network bscMainnet

# 2. Pause old staking contract (if applicable)
# 3. Allow users to withdraw from old contract
# 4. Update frontend to new addresses
# 5. Announce migration deadline
```

## Resources

- [Hardhat Documentation](https://hardhat.org/docs)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts)
- [BscScan Contract Verification](https://docs.bscscan.com/tutorials/verifying-contracts)
- [BNB Chain Documentation](https://docs.bnbchain.org/)
- [Solidity Documentation](https://docs.soliditylang.org/)

## Support

For contract-related issues:
1. Check Hardhat console output for errors
2. Review BscScan for transaction details
3. Verify contract parameters match expected values
4. Test on testnet before mainnet deployment

## License

MIT License - See LICENSE file for details
