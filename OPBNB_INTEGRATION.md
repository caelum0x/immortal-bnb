# ⚡ opBNB Integration Guide

**Making the Immortal AI Trading Bot Faster & Cheaper with Layer 2**

---

## What is opBNB?

opBNB is BNB Chain's Layer 2 scaling solution built on the OP Stack (Optimism). It provides:

- **⚡ Speed**: Sub-second block times (average 1 second vs ~3 seconds on BNB Chain L1)
- **💰 Low Cost**: Gas fees as low as $0.001 per transaction (10-100x cheaper than L1)
- **🔗 EVM Compatible**: Works seamlessly with existing Ethereum tools (Ethers.js, MetaMask)
- **🥞 PancakeSwap V3**: Fully deployed with concentrated liquidity pools
- **🌉 Bridging**: Native bridge for moving assets between BNB Chain and opBNB

---

## Why Use opBNB for AI Trading Bots?

### Benefits for High-Frequency Trading

1. **Faster Execution**: 1-second blocks mean your AI can react to market conditions almost instantly
2. **More Trades**: Lower gas costs allow for more frequent trading loops without draining funds
3. **Better Arbitrage**: Speed advantage for cross-DEX arbitrage opportunities
4. **Meme Token Sniping**: Quick entry/exit on trending tokens
5. **Risk Management**: Faster stop-loss execution protects profits

### Cost Comparison

| Operation | BNB Chain L1 | opBNB L2 | Savings |
|-----------|--------------|----------|---------|
| Simple Swap | ~$0.10 | ~$0.001 | **99%** |
| Complex Swap (Multi-hop) | ~$0.30 | ~$0.003 | **99%** |
| Token Approval | ~$0.05 | ~$0.0005 | **99%** |
| **100 Trades/Day** | **$10-30** | **$0.10-0.30** | **99%** |

---

## Quick Start

### 1. Switch to opBNB (Testnet)

Edit your `.env` file:

```bash
# Change this line:
TRADING_NETWORK=opbnb

# Ensure opBNB RPC is set (already in .env.example):
OPBNB_RPC=https://opbnb-testnet-rpc.bnbchain.org
OPBNB_CHAIN_ID=5611
```

**That's it!** The bot will automatically use opBNB for all trades.

### 2. Get Testnet BNB on opBNB

1. Go to the opBNB faucet: https://opbnb-testnet-bridge.bnbchain.org/faucet
2. Enter your wallet address
3. Receive 0.5 test BNB (enough for thousands of trades)

Alternatively, bridge from BNB Testnet:
- Go to https://opbnb-testnet-bridge.bnbchain.org
- Connect MetaMask
- Bridge test BNB from BNB Testnet to opBNB Testnet

### 3. Verify Configuration

Run the bot:
```bash
bun run dev
```

You should see:
```
🌐 Network Configuration:
  - Trading Network: opBNB (L2 - Fast & Cheap)
  - Environment: TESTNET
  - Chain ID: 5611
  - RPC: https://opbnb-testnet-rpc.bnbchain.org
  - Explorer: https://testnet.opbnbscan.com
  ⚡ Benefits: ~1s blocks, $0.001 gas, 10-100x cheaper than L1
```

### 4. Run Your First opBNB Trade

The bot will now execute all trades on opBNB automatically. Monitor transactions on:
- **Testnet Explorer**: https://testnet.opbnbscan.com
- **Mainnet Explorer**: https://opbnbscan.com

---

## Mainnet Deployment

### Switch to opBNB Mainnet

1. Update `.env`:
```bash
TRADING_NETWORK=opbnb
NETWORK=mainnet

# Mainnet RPC (auto-selected when NETWORK=mainnet):
# OPBNB_RPC=https://opbnb-mainnet-rpc.bnbchain.org
# OPBNB_CHAIN_ID=204
```

2. Fund your wallet with BNB on opBNB:
   - **Option A**: Bridge from BNB Chain L1
     - Go to https://opbnb.bnbchain.org/bridge
     - Connect wallet (make sure it's on BNB Chain)
     - Enter amount to bridge (e.g., 0.1 BNB)
     - Confirm transaction (~5 min for bridge)

   - **Option B**: Buy directly on an exchange that supports opBNB withdrawals

3. Deploy contracts (if needed):
   - Use Remix IDE: https://remix.ethereum.org
   - Connect MetaMask to opBNB network
   - Deploy $IMMBOT token and staking contracts
   - Update `IMMBOT_TOKEN_ADDRESS` in `.env`

---

## Network Configuration Details

### Testnet Configuration

```env
OPBNB_RPC=https://opbnb-testnet-rpc.bnbchain.org
OPBNB_WSS=wss://opbnb-testnet-rpc.bnbchain.org
OPBNB_CHAIN_ID=5611

# Contract Addresses (already configured)
OPBNB_PANCAKE_FACTORY=0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865
OPBNB_PANCAKE_ROUTER=0x1b81D678ffb9C0263b24A97847620C99d213eB14
OPBNB_PANCAKE_SMART_ROUTER=0x678Aa4bF4E210cf2166753e054d5b7c31cc7fa86
OPBNB_WBNB_ADDRESS=0x4200000000000000000000000000000000000006
```

### Mainnet Configuration

```env
OPBNB_RPC=https://opbnb-mainnet-rpc.bnbchain.org
OPBNB_WSS=wss://opbnb-mainnet-rpc.bnbchain.org
OPBNB_CHAIN_ID=204

# Addresses (same as testnet for PancakeSwap contracts)
```

### Add opBNB to MetaMask

**Testnet:**
- Network Name: opBNB Testnet
- RPC URL: https://opbnb-testnet-rpc.bnbchain.org
- Chain ID: 5611
- Currency Symbol: BNB
- Block Explorer: https://testnet.opbnbscan.com

**Mainnet:**
- Network Name: opBNB Mainnet
- RPC URL: https://opbnb-mainnet-rpc.bnbchain.org
- Chain ID: 204
- Currency Symbol: BNB
- Block Explorer: https://opbnbscan.com

---

## Architecture Changes

### Before (BNB Chain L1)

```
AI Bot → BNB Chain RPC → PancakeSwap Router → 3s block time → Trade Confirmed
```

### After (opBNB L2)

```
AI Bot → opBNB RPC → PancakeSwap Router → 1s block time → Trade Confirmed ⚡
```

### Code Changes

The bot automatically detects the network from your config:

```typescript
// src/config.ts
const TRADING_NETWORK = process.env.TRADING_NETWORK || 'opbnb';
const IS_OPBNB = TRADING_NETWORK === 'opbnb';

// Automatically selects:
// - opBNB RPC if IS_OPBNB = true
// - BNB Chain RPC if IS_OPBNB = false
```

---

## Switching Between Networks

### Switch from opBNB to BNB Chain L1

Edit `.env`:
```bash
TRADING_NETWORK=bnb
```

Restart the bot. It will now use BNB Chain L1 RPCs and addresses.

### Use Both Networks (Advanced)

Run two bot instances:
1. **Instance 1** (opBNB): `.env` with `TRADING_NETWORK=opbnb`
2. **Instance 2** (BNB L1): Separate `.env.mainnet` with `TRADING_NETWORK=bnb`

```bash
# Terminal 1: opBNB bot
bun run dev

# Terminal 2: BNB L1 bot
NODE_ENV=mainnet bun run dev
```

---

## Performance Optimization

### 1. Use WebSocket for Real-Time Events

Update `src/blockchain/tradeExecutor.ts`:

```typescript
import { ethers } from 'ethers';
import { CONFIG } from '../config';

// Use WebSocket provider for faster event detection
const wsProvider = new ethers.WebSocketProvider(CONFIG.WSS_URL);

// Listen for new blocks
wsProvider.on('block', async (blockNumber) => {
  console.log(`New block: ${blockNumber}`);
  // Trigger AI analysis on new blocks
});
```

### 2. Optimize Gas Settings

opBNB has very low gas prices, so you can set lower limits:

```typescript
// In executeTrade
const tx = await router.swap(..., {
  gasLimit: 300000, // Lower than L1 (500000)
  gasPrice: ethers.parseUnits('0.001', 'gwei'), // Very low on opBNB
});
```

### 3. Reduce Loop Interval

Since gas is cheaper, run the bot loop more frequently:

```env
# .env
BOT_LOOP_INTERVAL_MS=60000  # 1 minute instead of 5 minutes
```

---

## Troubleshooting

### Issue: "Wrong network" error

**Solution**: Check your `.env`:
```bash
TRADING_NETWORK=opbnb  # Make sure this is set
OPBNB_CHAIN_ID=5611   # Testnet
```

Verify MetaMask is on opBNB network.

### Issue: Insufficient funds

**Solution**:
- **Testnet**: Get more from faucet
- **Mainnet**: Bridge BNB from L1

### Issue: RPC errors

**Solution**: Try alternative RPC endpoints:
```env
# Backup opBNB RPC
OPBNB_RPC=https://opbnb-rpc.publicnode.com
```

### Issue: Token not found on opBNB

**Problem**: Some tokens only exist on BNB Chain L1, not opBNB.

**Solution**:
1. Check if token has liquidity on opBNB: https://dexscreener.com (filter by opBNB)
2. If not, switch back to BNB L1 for that token:
   ```bash
   TRADING_NETWORK=bnb
   ```

---

## Liquidity Considerations

### opBNB Liquidity vs BNB Chain

- **opBNB**: Growing ecosystem, newer pairs, lower TVL
- **BNB Chain L1**: Established, high liquidity, more pairs

### Recommended Strategy

1. **High-Volume Tokens**: Trade on BNB Chain L1 (better liquidity)
2. **Meme Tokens / New Launches**: Trade on opBNB (speed advantage)
3. **Test Trades**: Always use opBNB testnet first

Check liquidity before trading:
```typescript
// In marketFetcher.ts
const pair = await DexScreener.getPair(tokenAddress);
if (pair.liquidity.usd < 10000) {
  console.warn('Low liquidity - consider switching to L1');
}
```

---

## Cross-Chain Arbitrage (Future)

### Wormhole Integration

opBNB + Solana arbitrage is possible with Wormhole:

```typescript
import { Wormhole } from 'wormhole-sdk';

// Detect price difference
const opBNBPrice = await getPriceOnOpBNB(token);
const solanaPrice = await getPriceOnSolana(token);

if (opBNBPrice < solanaPrice * 0.98) {
  // Buy on opBNB, bridge & sell on Solana
  await executeCrossChainArbitrage();
}
```

---

## Monitoring and Analytics

### Track opBNB Performance

All trades are logged with network info:

```
✓ Connected to opbnb (Chain ID: 5611)
Executing BUY: 0.05 BNB for 0x123...
Transaction sent: 0xabc... (opBNBscan: https://testnet.opbnbscan.com/tx/0xabc...)
✓ Trade confirmed in 1.2s (vs ~3s on L1)
Gas used: $0.0008 (vs ~$0.15 on L1)
```

### Dashboard Metrics

Add to your frontend dashboard:
- Network indicator (opBNB vs BNB)
- Gas savings counter
- Average confirmation time
- Total fees saved

---

## Security Considerations

### Same Security as BNB Chain

- opBNB inherits security from BNB Chain L1 (data availability)
- Same wallet keys work on both networks
- Transactions are backed by L1 finality

### Best Practices

1. **Test on Testnet First**: Always test new strategies on opBNB testnet
2. **Monitor Bridge**: If bridging funds, wait for full confirmation (~5 min)
3. **Separate Wallets**: Use different wallets for testnet vs mainnet
4. **Gas Monitoring**: Even though cheap, monitor for spam attacks

---

## Resources

### Official Links

- **opBNB Homepage**: https://opbnb.bnbchain.org
- **Bridge**: https://opbnb.bnbchain.org/bridge
- **Docs**: https://docs.bnbchain.org/opbnb-docs/
- **Testnet Faucet**: https://opbnb-testnet-bridge.bnbchain.org/faucet

### Explorers

- **Testnet**: https://testnet.opbnbscan.com
- **Mainnet**: https://opbnbscan.com

### PancakeSwap on opBNB

- **Swap Interface**: https://pancakeswap.finance/?chain=opBNB
- **Developer Docs**: https://docs.pancakeswap.finance/developers/smart-contracts/v3-contracts

### DexScreener (opBNB Pairs)

- https://dexscreener.com/opbnb

---

## FAQ

**Q: Will my old trades on BNB Chain still work after switching to opBNB?**

A: Yes, but they're on different networks. Your BNB Chain trades are on L1, opBNB trades are on L2. You can switch back anytime by changing `TRADING_NETWORK` in `.env`.

**Q: Can I use the same wallet on both networks?**

A: Yes! Your wallet address is the same on both. Just make sure you have BNB on the specific network you're trading on (bridge if needed).

**Q: Is opBNB as secure as BNB Chain?**

A: Yes, opBNB is a Layer 2 that settles to BNB Chain L1, providing the same security guarantees with better performance.

**Q: What about Greenfield storage - does it work with opBNB?**

A: Yes! Greenfield is separate from the trading network. Your immortal memories are stored on Greenfield regardless of whether you trade on opBNB or BNB Chain.

**Q: Can I bridge my $IMMBOT token to opBNB?**

A: If you deploy $IMMBOT on opBNB (separate deployment), users can bridge using the official opBNB bridge. Alternatively, deploy a cross-chain bridge contract.

---

## Conclusion

opBNB provides a **10-100x performance improvement** for the Immortal AI Trading Bot with minimal code changes. For high-frequency AI trading, it's a game-changer:

- ⚡ **Faster**: 1s vs 3s blocks
- 💰 **Cheaper**: $0.001 vs $0.10+ gas
- 🔄 **Compatible**: Same code, same tools
- 🚀 **Better UX**: Near-instant trades

**Recommendation**: Use opBNB for all bot trading unless specific tokens lack liquidity on L2.

---

## Next Steps

1. ✅ Test on opBNB testnet (get free BNB from faucet)
2. ✅ Monitor gas savings and speed improvements
3. ✅ Deploy to opBNB mainnet when ready
4. 🚀 Optimize AI loop interval (take advantage of speed)
5. 📊 Add opBNB metrics to your dashboard
6. 🌉 Explore cross-chain arbitrage opportunities

---

**Built with ❤️ for the BNB Hackathon**

*"Trade faster, cheaper, smarter with opBNB"* ⚡
