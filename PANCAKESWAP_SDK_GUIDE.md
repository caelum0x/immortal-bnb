# 🥞 PancakeSwap SDK Integration Guide

Complete guide for integrating PancakeSwap V2 and V3 SDKs into the Immortal AI Trading Bot.

---

## Overview

PancakeSwap provides SDKs for both V2 (AMM with constant product formula) and V3 (concentrated liquidity). We use:
- **V3 for most trades**: Better capital efficiency, lower slippage on popular pairs
- **V2 as fallback**: When V3 pools don't exist or have low liquidity

---

## Installation

```bash
# Core PancakeSwap SDKs
bun add @pancakeswap/sdk @pancakeswap/v3-sdk @pancakeswap/swap-sdk-core

# Required peer dependencies
bun add ethers@^6 tiny-invariant@^1.3.0

# For smart routing (optional)
bun add @pancakeswap/smart-router
```

---

## SDK Components

### 1. `@pancakeswap/sdk` (V2)
- **Purpose**: AMM math, token utilities, route calculation
- **Use Cases**: V2 swaps, price quotes, simple routing
- **Key Classes**: `Token`, `Pair`, `Route`, `Trade`

### 2. `@pancakeswap/v3-sdk` (V3)
- **Purpose**: Concentrated liquidity pools
- **Use Cases**: V3 swaps, tick math, position management
- **Key Classes**: `Pool`, `RouteV3`, `TradeV3`, `Position`

### 3. `@pancakeswap/smart-router`
- **Purpose**: Multi-hop routing, split trades
- **Use Cases**: Finding best prices across V2/V3/multiple pools
- **Key Classes**: `SmartRouter`, `QuoteProvider`

---

## Configuration

### Network Setup

```typescript
// src/utils/pancakeswap.ts
import { ChainId } from '@pancakeswap/sdk';

export const NETWORK_CONFIG = {
  opBNB_Testnet: {
    chainId: 5611,
    wbnb: '0x4200000000000000000000000000000000000006',
    factoryV2: '0x...',
    factoryV3: '0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865',
    routerV2: '0x...',
    routerV3: '0x1b81D678ffb9C0263b24A97847620C99d213eB14',
    smartRouter: '0x678Aa4bF4E210cf2166753e054d5b7c31cc7fa86',
  },
  opBNB_Mainnet: {
    chainId: 204,
    // Same addresses as testnet for opBNB
  },
  BNB_Testnet: {
    chainId: 97,
    wbnb: '0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd',
    // ...
  },
  BNB_Mainnet: {
    chainId: 56,
    wbnb: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
    factoryV3: '0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865',
    routerV3: '0x1b81D678ffb9C0263b24A97847620C99d213eB14',
    smartRouter: '0x13f4EA83D0bd40E75C8222255bc855a974568Dd4',
  },
};
```

---

## Step-by-Step Integration

### Step 1: Token Definition

```typescript
import { Token } from '@pancakeswap/sdk';
import { ethers } from 'ethers';

// Define WBNB
const WBNB = new Token(
  5611, // opBNB Testnet
  '0x4200000000000000000000000000000000000006',
  18,
  'WBNB',
  'Wrapped BNB'
);

// Define target token (fetch decimals from chain)
async function createToken(address: string, provider: ethers.Provider): Promise<Token> {
  const contract = new ethers.Contract(
    address,
    ['function decimals() view returns (uint8)', 'function symbol() view returns (string)'],
    provider
  );

  const [decimals, symbol] = await Promise.all([
    contract.decimals(),
    contract.symbol(),
  ]);

  return new Token(5611, address, decimals, symbol);
}
```

### Step 2: Fetch V3 Pool Data

```typescript
import { Pool, FeeAmount } from '@pancakeswap/v3-sdk';
import { Token } from '@pancakeswap/sdk';

const POOL_ABI = [
  'function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)',
  'function liquidity() external view returns (uint128)',
  'function token0() external view returns (address)',
  'function token1() external view returns (address)',
  'function fee() external view returns (uint24)',
];

const FACTORY_ABI = [
  'function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool)',
];

async function getV3Pool(
  tokenA: Token,
  tokenB: Token,
  fee: FeeAmount = FeeAmount.MEDIUM, // 0.3% = 3000
  provider: ethers.Provider
): Promise<Pool | null> {
  const factoryAddress = '0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865';
  
  const factory = new ethers.Contract(factoryAddress, FACTORY_ABI, provider);
  const poolAddress = await factory.getPool(tokenA.address, tokenB.address, fee);

  if (poolAddress === ethers.ZeroAddress) {
    console.log(`No V3 pool found for fee tier ${fee}`);
    return null;
  }

  // Fetch pool state
  const poolContract = new ethers.Contract(poolAddress, POOL_ABI, provider);
  const [slot0, liquidity] = await Promise.all([
    poolContract.slot0(),
    poolContract.liquidity(),
  ]);

  // Sort tokens (Pool requires token0 < token1 by address)
  const [token0, token1] = tokenA.address.toLowerCase() < tokenB.address.toLowerCase()
    ? [tokenA, tokenB]
    : [tokenB, tokenA];

  return new Pool(
    token0,
    token1,
    fee,
    slot0.sqrtPriceX96.toString(),
    liquidity.toString(),
    slot0.tick
  );
}
```

### Step 3: Calculate Trade with SDK

```typescript
import { CurrencyAmount, TradeType, Percent } from '@pancakeswap/sdk';
import { Trade as TradeV3 } from '@pancakeswap/v3-sdk';

async function calculateV3Trade(
  pool: Pool,
  amountInBNB: number,
  inputToken: Token, // WBNB
  outputToken: Token // Target token
) {
  // Create amount
  const amountIn = CurrencyAmount.fromRawAmount(
    inputToken,
    ethers.parseEther(amountInBNB.toString()).toString()
  );

  // Create route
  const route = new Route([pool], inputToken, outputToken);

  // Create trade (this calculates the output automatically)
  const trade = await TradeV3.fromRoute(
    route,
    amountIn,
    TradeType.EXACT_INPUT
  );

  // Calculate minimum output with slippage
  const slippageTolerance = new Percent(50, 10000); // 0.5%
  const amountOutMin = trade.minimumAmountOut(slippageTolerance);

  return {
    trade,
    inputAmount: amountIn.quotient.toString(),
    outputAmount: trade.outputAmount.quotient.toString(),
    outputAmountMin: amountOutMin.quotient.toString(),
    executionPrice: trade.executionPrice.toSignificant(6),
    priceImpact: trade.priceImpact.toSignificant(2),
  };
}
```

### Step 4: Execute Trade on-chain

```typescript
const ROUTER_V3_ABI = [
  'function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)',
];

async function executeV3Swap(
  trade: any,
  wallet: ethers.Wallet
) {
  const routerAddress = '0x1b81D678ffb9C0263b24A97847620C99d213eB14';
  const router = new ethers.Contract(routerAddress, ROUTER_V3_ABI, wallet);

  const params = {
    tokenIn: trade.route.tokenPath[0].address,
    tokenOut: trade.route.tokenPath[trade.route.tokenPath.length - 1].address,
    fee: trade.route.pools[0].fee,
    recipient: wallet.address,
    amountIn: trade.inputAmount,
    amountOutMinimum: trade.outputAmountMin,
    sqrtPriceLimitX96: 0, // No price limit
  };

  // For WBNB → Token, send BNB value
  const value = params.tokenIn === WBNB.address ? params.amountIn : 0;

  const tx = await router.exactInputSingle(params, {
    value,
    gasLimit: 500000,
  });

  const receipt = await tx.wait();
  console.log(`✅ Swap executed: ${tx.hash}`);

  return receipt;
}
```

---

## Complete Trading Function

```typescript
// src/blockchain/pancakeswapTrader.ts
import { Token, CurrencyAmount, TradeType, Percent } from '@pancakeswap/sdk';
import { Pool, FeeAmount, Trade as TradeV3, Route } from '@pancakeswap/v3-sdk';
import { ethers } from 'ethers';

export class PancakeSwapTrader {
  private provider: ethers.Provider;
  private wallet: ethers.Wallet;
  private chainId: number;
  private wbnb: Token;

  constructor(rpcUrl: string, privateKey: string, chainId: number) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.wallet = new ethers.Wallet(privateKey, this.provider);
    this.chainId = chainId;
    
    // Initialize WBNB token
    const wbnbAddress = chainId === 5611 || chainId === 204
      ? '0x4200000000000000000000000000000000000006' // opBNB
      : '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c'; // BNB Chain
    
    this.wbnb = new Token(chainId, wbnbAddress, 18, 'WBNB', 'Wrapped BNB');
  }

  /**
   * Buy tokens with BNB
   */
  async buyToken(
    tokenAddress: string,
    amountBNB: number,
    slippagePercent: number = 0.5
  ) {
    console.log(`🔄 Buying ${amountBNB} BNB worth of ${tokenAddress}...`);

    // 1. Create token instance
    const targetToken = await this.createToken(tokenAddress);

    // 2. Try to get V3 pool (try different fee tiers)
    let pool = await this.getV3Pool(this.wbnb, targetToken, FeeAmount.MEDIUM);
    
    if (!pool) {
      pool = await this.getV3Pool(this.wbnb, targetToken, FeeAmount.LOW);
    }
    
    if (!pool) {
      pool = await this.getV3Pool(this.wbnb, targetToken, FeeAmount.HIGH);
    }

    if (!pool) {
      throw new Error('No V3 pool found for this token');
    }

    // 3. Calculate trade
    const amountIn = CurrencyAmount.fromRawAmount(
      this.wbnb,
      ethers.parseEther(amountBNB.toString()).toString()
    );

    const route = new Route([pool], this.wbnb, targetToken);
    const trade = await TradeV3.fromRoute(route, amountIn, TradeType.EXACT_INPUT);

    // 4. Calculate slippage
    const slippageTolerance = new Percent(
      Math.floor(slippagePercent * 100),
      10000
    );
    const amountOutMin = trade.minimumAmountOut(slippageTolerance);

    console.log(`  Expected output: ${trade.outputAmount.toSignificant(6)} ${targetToken.symbol}`);
    console.log(`  Minimum output: ${amountOutMin.toSignificant(6)} ${targetToken.symbol}`);
    console.log(`  Price impact: ${trade.priceImpact.toSignificant(2)}%`);

    // 5. Execute swap
    const receipt = await this.executeSwap(trade, amountOutMin.quotient.toString());

    return {
      success: true,
      txHash: receipt.hash,
      amountIn: amountBNB.toString(),
      amountOut: trade.outputAmount.toSignificant(6),
      priceImpact: trade.priceImpact.toSignificant(2),
    };
  }

  private async createToken(address: string): Promise<Token> {
    const contract = new ethers.Contract(
      address,
      ['function decimals() view returns (uint8)', 'function symbol() view returns (string)'],
      this.provider
    );

    const [decimals, symbol] = await Promise.all([
      contract.decimals(),
      contract.symbol(),
    ]);

    return new Token(this.chainId, address, decimals, symbol);
  }

  private async getV3Pool(
    tokenA: Token,
    tokenB: Token,
    fee: FeeAmount
  ): Promise<Pool | null> {
    try {
      const factoryAddress = '0x0BFbCF9fa4f9C56B0F40a671Ad40E0805A091865';
      const factory = new ethers.Contract(
        factoryAddress,
        ['function getPool(address, address, uint24) view returns (address)'],
        this.provider
      );

      const poolAddress = await factory.getPool(tokenA.address, tokenB.address, fee);

      if (poolAddress === ethers.ZeroAddress) {
        return null;
      }

      const poolContract = new ethers.Contract(
        poolAddress,
        [
          'function slot0() view returns (uint160, int24, uint16, uint16, uint16, uint8, bool)',
          'function liquidity() view returns (uint128)',
        ],
        this.provider
      );

      const [slot0, liquidity] = await Promise.all([
        poolContract.slot0(),
        poolContract.liquidity(),
      ]);

      const [token0, token1] = tokenA.address.toLowerCase() < tokenB.address.toLowerCase()
        ? [tokenA, tokenB]
        : [tokenB, tokenA];

      return new Pool(
        token0,
        token1,
        fee,
        slot0[0].toString(),
        liquidity.toString(),
        slot0[1]
      );
    } catch (error) {
      console.error(`Error fetching pool with fee ${fee}:`, error);
      return null;
    }
  }

  private async executeSwap(trade: TradeV3<Token, Token, TradeType>, amountOutMin: string) {
    const routerAddress = '0x1b81D678ffb9C0263b24A97847620C99d213eB14';
    const router = new ethers.Contract(
      routerAddress,
      [
        'function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256)',
      ],
      this.wallet
    );

    const params = {
      tokenIn: trade.route.tokenPath[0].address,
      tokenOut: trade.route.tokenPath[trade.route.tokenPath.length - 1].address,
      fee: trade.route.pools[0].fee,
      recipient: this.wallet.address,
      amountIn: trade.inputAmount.quotient.toString(),
      amountOutMinimum: amountOutMin,
      sqrtPriceLimitX96: 0,
    };

    const value = params.tokenIn === this.wbnb.address ? params.amountIn : '0';

    const tx = await router.exactInputSingle(params, {
      value,
      gasLimit: 500000,
    });

    return await tx.wait();
  }
}
```

---

## Usage in Bot

```typescript
// In src/index.ts or tradeExecutor.ts
import { PancakeSwapTrader } from './blockchain/pancakeswapTrader';

const trader = new PancakeSwapTrader(
  CONFIG.RPC_URL,
  CONFIG.WALLET_PRIVATE_KEY,
  CONFIG.CHAIN_ID
);

// Execute buy trade
const result = await trader.buyToken(
  '0xTokenAddress',
  0.05, // 0.05 BNB
  0.5   // 0.5% slippage
);

console.log(`Trade hash: ${result.txHash}`);
```

---

## Best Practices

1. **Fee Tier Selection**: Try MEDIUM (3000) first, then LOW (500), then HIGH (10000)
2. **Price Impact Check**: Reject trades with >5% impact
3. **Liquidity Validation**: Ensure pool liquidity > $10k
4. **Slippage**: Use 0.5% for stablecoins, 1-2% for volatile tokens
5. **Gas Estimation**: Always estimate before sending
6. **Error Handling**: Wrap all SDK calls in try-catch

---

## Troubleshooting

### "Pool not found"
- Token may not have V3 pool
- Try V2 instead
- Check if token exists on your network

### "Insufficient liquidity"
- Pool exists but has low liquidity
- Increase slippage or reduce trade size

### "Price impact too high"
- Trade size too large for pool
- Split into smaller trades
- Use Smart Router for better routing

---

## Resources

- **PancakeSwap Docs**: https://docs.pancakeswap.finance/developers
- **V3 SDK GitHub**: https://github.com/pancakeswap/pancake-v3-sdk
- **Contract Addresses**: https://docs.pancakeswap.finance/developers/smart-contracts
- **SDK Examples**: https://github.com/pancakeswap/pancake-frontend/tree/develop/apps/web/src/utils

---

**Built for opBNB & BNB Chain** 🥞⚡
