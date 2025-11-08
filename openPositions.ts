import { ethers } from 'ethers';
import { Token, CurrencyAmount, TradeType, Percent } from '@pancakeswap/swap-sdk-core';
import { Pool, FeeAmount, Trade, Route } from '@pancakeswap/v3-sdk';
import { logger } from './src/utils/logger';
import { CONFIG } from './src/config';

const ERC20_ABI = [
  'function balanceOf(address account) external view returns (uint256)',
  'function decimals() external view returns (uint8)',
  'function symbol() external view returns (string)',
  'function name() external view returns (string)',
];

const POOL_ABI = [
  'function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)',
  'function liquidity() external view returns (uint128)',
  'function token0() external view returns (address)',
  'function token1() external view returns (address)',
];

const FACTORY_ABI = [
  'function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool)',
];

export interface Position {
  tokenAddress: string;
  tokenSymbol: string;
  tokenName: string;
  balance: string;
  balanceUSD: string;
  entryPrice?: string;
  currentPrice?: string;
  unrealizedPnl?: string;
  unrealizedPnlPercent?: string;
  poolAddress?: string;
  liquidity?: string;
  priceImpact?: string;
  tradePair?: string;
  fee?: number;
}

/**
 * Get all open positions (token balances) for the wallet
 * This shows tokens held in the wallet as "positions"
 */
export async function getOpenPositions(): Promise<Position[]> {
  try {
    const provider = new ethers.JsonRpcProvider(CONFIG.RPC_URL);
    const wallet = new ethers.Wallet(CONFIG.WALLET_PRIVATE_KEY, provider);
    
    logger.info('📊 Fetching open positions...');

    // Get BNB balance
    const bnbBalance = await provider.getBalance(wallet.address);
    const bnbBalanceFormatted = ethers.formatEther(bnbBalance);
    
    const positions: Position[] = [
      {
        tokenAddress: 'BNB',
        tokenSymbol: 'BNB',
        tokenName: 'Binance Coin',
        balance: bnbBalanceFormatted,
        balanceUSD: (parseFloat(bnbBalanceFormatted) * 300).toFixed(2), // Approximate USD value
      }
    ];

    // Get token balances from CONFIG.DEFAULT_WATCHLIST if available
    if (CONFIG.DEFAULT_WATCHLIST && CONFIG.DEFAULT_WATCHLIST.length > 0) {
      for (const tokenAddress of CONFIG.DEFAULT_WATCHLIST) {
        try {
          const position = await getTokenPosition(provider, wallet.address, tokenAddress);
          if (position && parseFloat(position.balance) > 0) {
            positions.push(position);
          }
        } catch (error) {
          logger.warn(`Could not fetch position for ${tokenAddress}: ${(error as Error).message}`);
        }
      }
    }

    logger.info(`Found ${positions.length} positions`);
    return positions;

  } catch (error) {
    logger.error(`Error fetching positions: ${(error as Error).message}`);
    return [];
  }
}

/**
 * Get position details for a specific token
 */
export async function getTokenPosition(
  provider: ethers.Provider,
  walletAddress: string,
  tokenAddress: string
): Promise<Position | null> {
  try {
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    
    if (!tokenContract.balanceOf || !tokenContract.decimals || !tokenContract.symbol || !tokenContract.name) {
      throw new Error('Invalid token contract');
    }
    
    const [balance, decimals, symbol, name] = await Promise.all([
      tokenContract.balanceOf(walletAddress),
      tokenContract.decimals(),
      tokenContract.symbol(),
      tokenContract.name(),
    ]);

    if (balance === 0n) {
      return null;
    }

    const balanceFormatted = ethers.formatUnits(balance, decimals);

    // Try to get current price and pool info
    let currentPrice: string | undefined;
    let poolAddress: string | undefined;
    let liquidity: string | undefined;
    let priceImpact: string | undefined;
    let tradePair: string | undefined;

    try {
      const poolInfo = await getPoolInfo(provider, tokenAddress);
      if (poolInfo) {
        currentPrice = poolInfo.price;
        poolAddress = poolInfo.poolAddress;
        liquidity = poolInfo.liquidity;
        priceImpact = poolInfo.priceImpact;
        tradePair = poolInfo.tradePair;
      }
    } catch (error) {
      // Pool info is optional, don't fail if we can't get it
    }

    const balanceUSD = currentPrice 
      ? (parseFloat(balanceFormatted) * parseFloat(currentPrice)).toFixed(2)
      : '0.00';

    return {
      tokenAddress,
      tokenSymbol: symbol,
      tokenName: name,
      balance: balanceFormatted,
      balanceUSD,
      currentPrice,
      poolAddress,
      liquidity,
      priceImpact,
      tradePair,
    };

  } catch (error) {
    logger.error(`Error fetching token position for ${tokenAddress}: ${(error as Error).message}`);
    return null;
  }
}

/**
 * Get pool information and current price for a token with enhanced SDK usage
 */
async function getPoolInfo(provider: ethers.Provider, tokenAddress: string): Promise<{
  price: string;
  poolAddress: string;
  liquidity: string;
  priceImpact?: string;
  tradePair?: string;
} | null> {
  try {
    const factory = new ethers.Contract(CONFIG.PANCAKE_FACTORY, FACTORY_ABI, provider);
    const wbnbAddress = CONFIG.WBNB_ADDRESS;

    if (!factory.getPool) {
      return null;
    }

    // Try different fee tiers
    const feeTiers = [FeeAmount.MEDIUM, FeeAmount.LOW, FeeAmount.HIGH];
    
    for (const fee of feeTiers) {
      const poolAddress = await factory.getPool(tokenAddress, wbnbAddress, fee);
      
      if (poolAddress !== ethers.ZeroAddress) {
        const poolContract = new ethers.Contract(poolAddress, POOL_ABI, provider);
        
        if (!poolContract.slot0 || !poolContract.liquidity) {
          continue;
        }
        
        const [slot0, liquidity] = await Promise.all([
          poolContract.slot0(),
          poolContract.liquidity(),
        ]);

        if (liquidity > 0) {
          // Create tokens for price calculation
          const token0 = new Token(CONFIG.CHAIN_ID, tokenAddress as `0x${string}`, 18, 'TOKEN', 'Token');
          const token1 = new Token(CONFIG.CHAIN_ID, wbnbAddress as `0x${string}`, 18, 'WBNB', 'Wrapped BNB');
          
          // Sort tokens
          const [sortedToken0, sortedToken1] = tokenAddress.toLowerCase() < wbnbAddress.toLowerCase()
            ? [token0, token1]
            : [token1, token0];

          // Create pool
          const pool = new Pool(
            sortedToken0,
            sortedToken1,
            fee,
            slot0.sqrtPriceX96.toString(),
            liquidity.toString(),
            slot0.tick
          );

          // Create a sample trade to calculate price impact
          const amountIn = CurrencyAmount.fromRawAmount(token1, '1000000000000000000'); // 1 WBNB
          const route = new Route([pool], token1, token0);
          
          const trade = Trade.createUncheckedTrade({
            route,
            inputAmount: amountIn,
            outputAmount: CurrencyAmount.fromRawAmount(token0, 0),
            tradeType: TradeType.EXACT_INPUT,
          });

          // Calculate price impact
          const priceImpact = trade.priceImpact;
          const priceImpactPercent = new Percent(priceImpact.numerator, priceImpact.denominator);

          // Get price (token per BNB)
          const price = pool.token0Price.toSignificant(6);
          
          return {
            price,
            poolAddress,
            liquidity: liquidity.toString(),
            priceImpact: priceImpactPercent.toFixed(2),
            tradePair: `${sortedToken0.symbol}/${sortedToken1.symbol}`,
          };
        }
      }
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Analyze a position with detailed trading information using PancakeSwap SDK
 */
export async function analyzePosition(
  tokenAddress: string,
  amountToAnalyze: string = '1000000000000000000' // 1 BNB default
): Promise<{
  bestBuyRoute?: Route<Token, Token>;
  bestSellRoute?: Route<Token, Token>;
  buyPriceImpact?: string;
  sellPriceImpact?: string;
  liquidity?: string;
  optimalTradeSize?: string;
  slippageTolerance?: string;
} | null> {
  try {
    const provider = new ethers.JsonRpcProvider(CONFIG.RPC_URL);
    const factory = new ethers.Contract(CONFIG.PANCAKE_FACTORY, FACTORY_ABI, provider);
    const wbnbAddress = CONFIG.WBNB_ADDRESS;

    // Create tokens
    const targetToken = new Token(CONFIG.CHAIN_ID, tokenAddress as `0x${string}`, 18, 'TOKEN', 'Target Token');
    const wbnb = new Token(CONFIG.CHAIN_ID, wbnbAddress as `0x${string}`, 18, 'WBNB', 'Wrapped BNB');

    // Find best pools across different fee tiers
    const feeTiers = [FeeAmount.LOW, FeeAmount.MEDIUM, FeeAmount.HIGH];
    const pools: Pool[] = [];

    for (const fee of feeTiers) {
      try {
        const poolAddress = await factory.getPool?.(tokenAddress, wbnbAddress, fee);
        
        if (poolAddress && poolAddress !== ethers.ZeroAddress) {
          const poolContract = new ethers.Contract(poolAddress, POOL_ABI, provider);
          
          if (poolContract.slot0 && poolContract.liquidity) {
            const [slot0, liquidity] = await Promise.all([
              poolContract.slot0(),
              poolContract.liquidity(),
            ]);

            if (liquidity > 0) {
              // Sort tokens properly
              const [token0, token1] = targetToken.address.toLowerCase() < wbnb.address.toLowerCase()
                ? [targetToken, wbnb]
                : [wbnb, targetToken];

              const pool = new Pool(
                token0,
                token1,
                fee,
                slot0.sqrtPriceX96.toString(),
                liquidity.toString(),
                slot0.tick
              );

              pools.push(pool);
            }
          }
        }
      } catch (error) {
        // Skip failed pools
        continue;
      }
    }

    if (pools.length === 0) {
      return null;
    }

    // Create buy and sell routes
    const buyRoutes = pools.map(pool => new Route([pool], wbnb, targetToken));
    const sellRoutes = pools.map(pool => new Route([pool], targetToken, wbnb));

    // Find best buy route (WBNB -> Token)
    let bestBuyRoute: Route<Token, Token> | undefined;
    let bestBuyTrade: Trade<Token, Token, TradeType> | undefined;
    let bestBuyPriceImpact = '100'; // Start with high impact

    const amountIn = CurrencyAmount.fromRawAmount(wbnb, amountToAnalyze);

    for (const route of buyRoutes) {
      try {
        const trade = Trade.createUncheckedTrade({
          route,
          inputAmount: amountIn,
          outputAmount: CurrencyAmount.fromRawAmount(targetToken, 0),
          tradeType: TradeType.EXACT_INPUT,
        });

        const priceImpact = trade.priceImpact.toFixed(2);
        
        if (parseFloat(priceImpact) < parseFloat(bestBuyPriceImpact)) {
          bestBuyRoute = route;
          bestBuyTrade = trade;
          bestBuyPriceImpact = priceImpact;
        }
      } catch (error) {
        continue;
      }
    }

    // Find best sell route (Token -> WBNB)
    let bestSellRoute: Route<Token, Token> | undefined;
    let bestSellTrade: Trade<Token, Token, TradeType> | undefined;
    let bestSellPriceImpact = '100';

    // Estimate token amount for sell analysis
    const estimatedTokenAmount = bestBuyTrade?.outputAmount.quotient.toString() || '1000000000000000000';
    const sellAmountIn = CurrencyAmount.fromRawAmount(targetToken, estimatedTokenAmount);

    for (const route of sellRoutes) {
      try {
        const trade = Trade.createUncheckedTrade({
          route,
          inputAmount: sellAmountIn,
          outputAmount: CurrencyAmount.fromRawAmount(wbnb, 0),
          tradeType: TradeType.EXACT_INPUT,
        });

        const priceImpact = trade.priceImpact.toFixed(2);
        
        if (parseFloat(priceImpact) < parseFloat(bestSellPriceImpact)) {
          bestSellRoute = route;
          bestSellTrade = trade;
          bestSellPriceImpact = priceImpact;
        }
      } catch (error) {
        continue;
      }
    }

    // Calculate optimal trade size and slippage tolerance
    const totalLiquidity = pools.reduce((sum, pool) => {
      return sum + parseInt(pool.liquidity.toString());
    }, 0);

    // Suggest slippage tolerance based on price impact
    const avgPriceImpact = (parseFloat(bestBuyPriceImpact) + parseFloat(bestSellPriceImpact)) / 2;
    let slippageTolerance = '0.5'; // 0.5% default
    
    if (avgPriceImpact > 5) {
      slippageTolerance = '2.0'; // 2% for high impact
    } else if (avgPriceImpact > 2) {
      slippageTolerance = '1.0'; // 1% for medium impact
    }

    return {
      bestBuyRoute,
      bestSellRoute,
      buyPriceImpact: bestBuyPriceImpact,
      sellPriceImpact: bestSellPriceImpact,
      liquidity: totalLiquidity.toString(),
      optimalTradeSize: ethers.formatEther(amountToAnalyze),
      slippageTolerance,
    };

  } catch (error) {
    logger.error(`Error analyzing position for ${tokenAddress}: ${(error as Error).message}`);
    return null;
  }
}

/**
 * Calculate position unrealized P&L using current market prices
 */
export async function calculateUnrealizedPnL(
  tokenAddress: string,
  entryPrice: number,
  currentBalance: string
): Promise<{
  unrealizedPnl: string;
  unrealizedPnlPercent: string;
  currentPrice: string;
} | null> {
  try {
    const provider = new ethers.JsonRpcProvider(CONFIG.RPC_URL);
    const poolInfo = await getPoolInfo(provider, tokenAddress);

    if (!poolInfo || !poolInfo.price) {
      return null;
    }

    const currentPrice = parseFloat(poolInfo.price);
    const balance = parseFloat(currentBalance);
    
    // Calculate P&L
    const currentValue = balance * currentPrice;
    const entryValue = balance * entryPrice;
    const unrealizedPnl = currentValue - entryValue;
    const unrealizedPnlPercent = entryValue > 0 ? ((unrealizedPnl / entryValue) * 100) : 0;

    return {
      unrealizedPnl: unrealizedPnl.toFixed(6),
      unrealizedPnlPercent: unrealizedPnlPercent.toFixed(2),
      currentPrice: currentPrice.toFixed(6),
    };

  } catch (error) {
    logger.error(`Error calculating P&L for ${tokenAddress}: ${(error as Error).message}`);
    return null;
  }
}

/**
 * Create a new position by buying tokens with BNB
 * This is a wrapper around the PancakeSwap integration
 */
export async function createPosition(
  tokenAddress: string,
  amountBNB: number,
  slippageBps: number = 50
): Promise<{
  success: boolean;
  txHash?: string;
  error?: string;
  position?: Position;
  tradeAnalysis?: {
    route?: Route<Token, Token>;
    priceImpact?: string;
    slippageUsed?: string;
    executionPrice?: string;
  };
}> {
  try {
    logger.info(`\n🏗️ Creating position: ${amountBNB} BNB → ${tokenAddress}`);

    // Analyze position first to get optimal parameters
    const analysis = await analyzePosition(
      tokenAddress,
      ethers.parseEther(amountBNB.toString()).toString()
    );

    let finalSlippage = slippageBps;
    if (analysis?.slippageTolerance) {
      finalSlippage = Math.max(slippageBps, parseFloat(analysis.slippageTolerance) * 100);
      logger.info(`📊 Adjusted slippage to ${finalSlippage / 100}% based on analysis`);
    }

    // Import PancakeSwap integration
    const { default: PancakeSwapV3 } = await import('./src/blockchain/pancakeSwapIntegration');
    const pancakeSwap = new PancakeSwapV3();

    // Execute buy trade
    const result = await pancakeSwap.buyTokenWithBNB(tokenAddress, amountBNB, finalSlippage);

    if (!result.success) {
      return {
        success: false,
        error: result.error,
      };
    }

    // Get the new position
    const provider = new ethers.JsonRpcProvider(CONFIG.RPC_URL);
    const wallet = new ethers.Wallet(CONFIG.WALLET_PRIVATE_KEY, provider);
    const position = await getTokenPosition(provider, wallet.address, tokenAddress);

    logger.info(`✅ Position created successfully!`);
    logger.info(`  TX: ${result.txHash}`);
    logger.info(`  Token Balance: ${position?.balance} ${position?.tokenSymbol}`);
    if (analysis) {
      logger.info(`  Price Impact: ${analysis.buyPriceImpact}%`);
      logger.info(`  Slippage Used: ${finalSlippage / 100}%`);
    }

    return {
      success: true,
      txHash: result.txHash,
      position: position || undefined,
      tradeAnalysis: analysis ? {
        route: analysis.bestBuyRoute,
        priceImpact: analysis.buyPriceImpact,
        slippageUsed: (finalSlippage / 100).toFixed(2),
        executionPrice: result.executionPrice,
      } : undefined,
    };

  } catch (error) {
    logger.error(`Error creating position: ${(error as Error).message}`);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Close a position by selling all tokens for BNB with enhanced analysis
 */
export async function closePosition(
  tokenAddress: string,
  slippageBps: number = 50
): Promise<{
  success: boolean;
  txHash?: string;
  error?: string;
  bnbReceived?: string;
  tradeAnalysis?: {
    route?: Route<Token, Token>;
    priceImpact?: string;
    slippageUsed?: string;
    unrealizedPnl?: string;
    unrealizedPnlPercent?: string;
  };
}> {
  try {
    logger.info(`\n🔄 Closing position: ${tokenAddress}`);

    // Get current token balance
    const provider = new ethers.JsonRpcProvider(CONFIG.RPC_URL);
    const wallet = new ethers.Wallet(CONFIG.WALLET_PRIVATE_KEY, provider);
    const position = await getTokenPosition(provider, wallet.address, tokenAddress);

    if (!position || parseFloat(position.balance) === 0) {
      return {
        success: false,
        error: 'No position found or zero balance',
      };
    }

    // Analyze position before closing
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    const decimals = await tokenContract.decimals?.() || 18;
    const balanceInWei = ethers.parseUnits(position.balance, decimals).toString();
    
    const analysis = await analyzePosition(tokenAddress, balanceInWei);

    let finalSlippage = slippageBps;
    if (analysis?.slippageTolerance) {
      finalSlippage = Math.max(slippageBps, parseFloat(analysis.slippageTolerance) * 100);
      logger.info(`📊 Adjusted slippage to ${finalSlippage / 100}% based on analysis`);
    }

    // Calculate P&L if we have entry price
    let pnlInfo: {
      unrealizedPnl: string;
      unrealizedPnlPercent: string;
      currentPrice: string;
    } | null = null;

    if (position.entryPrice) {
      pnlInfo = await calculateUnrealizedPnL(
        tokenAddress,
        parseFloat(position.entryPrice),
        position.balance
      );
    }

    // Import PancakeSwap integration
    const { default: PancakeSwapV3 } = await import('./src/blockchain/pancakeSwapIntegration');
    const pancakeSwap = new PancakeSwapV3();

    // Execute sell trade
    const result = await pancakeSwap.sellTokenForBNB(tokenAddress, position.balance, finalSlippage);

    if (!result.success) {
      return {
        success: false,
        error: result.error,
      };
    }

    logger.info(`✅ Position closed successfully!`);
    logger.info(`  TX: ${result.txHash}`);
    logger.info(`  BNB Received: ${result.amountOut}`);
    if (analysis) {
      logger.info(`  Price Impact: ${analysis.sellPriceImpact}%`);
      logger.info(`  Slippage Used: ${finalSlippage / 100}%`);
    }
    if (pnlInfo) {
      logger.info(`  P&L: ${pnlInfo.unrealizedPnl} BNB (${pnlInfo.unrealizedPnlPercent}%)`);
    }

    return {
      success: true,
      txHash: result.txHash,
      bnbReceived: result.amountOut,
      tradeAnalysis: {
        route: analysis?.bestSellRoute,
        priceImpact: analysis?.sellPriceImpact,
        slippageUsed: (finalSlippage / 100).toFixed(2),
        unrealizedPnl: pnlInfo?.unrealizedPnl,
        unrealizedPnlPercent: pnlInfo?.unrealizedPnlPercent,
      },
    };

  } catch (error) {
    logger.error(`Error closing position: ${(error as Error).message}`);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Get optimal trading parameters using Percent class for precise calculations
 */
export async function getOptimalTradingParams(
  tokenAddress: string,
  tradeAmountBNB: number
): Promise<{
  maxSlippage: Percent;
  priceImpactTolerance: Percent;
  recommendedSlippage: Percent;
  liquidityDepth: string;
  optimalTradeSize: CurrencyAmount<Token>;
  feeEstimate: Percent;
} | null> {
  try {
    const analysis = await analyzePosition(
      tokenAddress,
      ethers.parseEther(tradeAmountBNB.toString()).toString()
    );

    if (!analysis) {
      return null;
    }

    // Create Percent objects for precise calculations
    const buyImpact = new Percent(Math.floor(parseFloat(analysis.buyPriceImpact || '0') * 100), 10000);
    const sellImpact = new Percent(Math.floor(parseFloat(analysis.sellPriceImpact || '0') * 100), 10000);
    
    // Calculate optimal slippage (price impact + buffer)
    const impactBuffer = new Percent(50, 10000); // 0.5% buffer
    const recommendedSlippage = buyImpact.add(impactBuffer);
    
    // Set maximum acceptable slippage
    const maxSlippage = new Percent(500, 10000); // 5% max
    
    // Price impact tolerance (should be lower than slippage)
    const priceImpactTolerance = new Percent(300, 10000); // 3% tolerance
    
    // Fee estimate (pool fees + gas estimate)
    const poolFee = analysis.bestBuyRoute?.pools[0]?.fee || FeeAmount.MEDIUM;
    const feePercent = new Percent(poolFee, 1000000); // Fee is in basis points
    const gasEstimate = new Percent(10, 10000); // ~0.1% gas estimate
    const totalFeeEstimate = feePercent.add(gasEstimate);
    
    // Create optimal trade size as CurrencyAmount
    const wbnbAddress = CONFIG.WBNB_ADDRESS;
    const wbnb = new Token(CONFIG.CHAIN_ID, wbnbAddress as `0x${string}`, 18, 'WBNB', 'Wrapped BNB');
    const optimalTradeSize = CurrencyAmount.fromRawAmount(
      wbnb,
      ethers.parseEther(tradeAmountBNB.toString()).toString()
    );

    logger.info(`🎯 Optimal Trading Parameters:`);
    logger.info(`  Recommended Slippage: ${recommendedSlippage.toFixed(2)}%`);
    logger.info(`  Max Slippage: ${maxSlippage.toFixed(2)}%`);
    logger.info(`  Price Impact Tolerance: ${priceImpactTolerance.toFixed(2)}%`);
    logger.info(`  Fee Estimate: ${totalFeeEstimate.toFixed(4)}%`);
    logger.info(`  Trade Size: ${optimalTradeSize.toSignificant(6)} WBNB`);

    return {
      maxSlippage,
      priceImpactTolerance,
      recommendedSlippage,
      liquidityDepth: analysis.liquidity || '0',
      optimalTradeSize,
      feeEstimate: totalFeeEstimate,
    };

  } catch (error) {
    logger.error(`Error calculating optimal trading params: ${(error as Error).message}`);
    return null;
  }
}
