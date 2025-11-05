import { ethers } from 'ethers';
import { logger, logTrade, logError } from '../utils/logger';
import { withRetry, TradingError } from '../utils/errorHandler';
import {
  validateTradeAmount,
  checkSufficientBalance,
  validateSlippage,
} from '../utils/safeguards';
import { CONFIG } from '../config';
import PancakeSwapV3 from './pancakeSwapIntegration';

export interface TradeParams {
  tokenAddress: string;
  action: 'buy' | 'sell';
  amountBNB: number;
  slippagePercent?: number;
  gasLimit?: number;
}

export interface TradeResult {
  success: boolean;
  txHash?: string;
  amountIn: string;
  amountOut: string;
  actualPrice: number;
  gasUsed?: string;
  error?: string;
}

let pancakeSwap: PancakeSwapV3;

/**
 * Initialize blockchain connection and PancakeSwap SDK
 */
export async function initializeProvider(): Promise<void> {
  if (pancakeSwap) return; // Already initialized

  logger.info(`🚀 Initializing trading system...`);
  logger.info(`  - Network: ${CONFIG.TRADING_NETWORK}`);
  logger.info(`  - Chain ID: ${CONFIG.CHAIN_ID}`);
  logger.info(`  - RPC: ${CONFIG.RPC_URL}`);

  // Initialize PancakeSwap V3 SDK integration
  pancakeSwap = new PancakeSwapV3();

  const balance = await pancakeSwap.getBalance();
  logger.info(`  - Wallet Balance: ${balance.toFixed(4)} BNB`);
  logger.info(`✅ Trading system ready!`);
}

/**
 * Get wallet BNB balance
 */
export async function getWalletBalance(): Promise<number> {
  await initializeProvider();
  return await pancakeSwap.getBalance();
}

/**
 * Get token balance
 */
export async function getTokenBalance(tokenAddress: string): Promise<number> {
  await initializeProvider();
  return await pancakeSwap.getTokenBalance(tokenAddress);
}

/**
 * Get expected output amount for a trade
 */
export async function getExpectedOutput(
  amountIn: bigint,
  path: string[]
): Promise<bigint> {
  await initializeProvider();

  const amounts = await routerContract.getAmountsOut(amountIn, path);
  return amounts[amounts.length - 1];
}

/**
 * Execute a buy trade (BNB -> Token)
 */
async function executeBuy(params: TradeParams): Promise<TradeResult> {
  const { tokenAddress, amountBNB, slippagePercent = CONFIG.MAX_SLIPPAGE_PERCENTAGE } = params;

  // Validate
  if (!validateTradeAmount(amountBNB)) {
    throw new TradingError('Invalid trade amount', 'INVALID_AMOUNT');
  }

  const balance = await getWalletBalance();
  checkSufficientBalance(amountBNB, balance);

  // Build swap path: WBNB -> Token
  const path = [CONFIG.WBNB_ADDRESS, tokenAddress];
  const amountInWei = ethers.parseEther(amountBNB.toString());

  // Get expected output
  const expectedOut = await getExpectedOutput(amountInWei, path);

  // Calculate minimum output with slippage
  const slippageFactor = BigInt(Math.floor((100 - slippagePercent) * 100));
  const amountOutMin = (expectedOut * slippageFactor) / BigInt(10000);

  // Set deadline (20 minutes from now)
  const deadline = Math.floor(Date.now() / 1000) + 60 * 20;

  try {
    logger.info(`Executing BUY: ${amountBNB} BNB for ${tokenAddress}`);

    // Execute swap
    const tx = await routerContract.swapExactETHForTokens(
      amountOutMin,
      path,
      wallet.address,
      deadline,
      {
        value: amountInWei,
        gasLimit: params.gasLimit || 500000,
      }
    );

    logger.info(`Transaction sent: ${tx.hash}`);

    const receipt = await tx.wait();

    // Get actual output amount from logs
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    const decimals = await tokenContract.decimals();
    const tokenBalance = await getTokenBalance(tokenAddress);

    logTrade('BUY', tokenAddress, amountBNB);

    return {
      success: true,
      txHash: receipt.hash,
      amountIn: amountBNB.toString(),
      amountOut: tokenBalance.toString(),
      actualPrice: amountBNB / tokenBalance,
      gasUsed: receipt.gasUsed.toString(),
    };
  } catch (error) {
    logError('executeBuy', error as Error);

    return {
      success: false,
      amountIn: amountBNB.toString(),
      amountOut: '0',
      actualPrice: 0,
      error: (error as Error).message,
    };
  }
}

/**
 * Execute a sell trade (Token -> BNB)
 */
async function executeSell(params: TradeParams): Promise<TradeResult> {
  const { tokenAddress, amountBNB, slippagePercent = CONFIG.MAX_SLIPPAGE_PERCENTAGE } = params;

  // Get token balance
  const tokenBalance = await getTokenBalance(tokenAddress);

  if (tokenBalance === 0) {
    throw new TradingError('No token balance to sell', 'NO_BALANCE');
  }

  const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, wallet);
  const decimals = await tokenContract.decimals();

  // Calculate how many tokens to sell (based on amountBNB we want to receive)
  // For simplicity, we'll sell entire balance
  const amountIn = ethers.parseUnits(tokenBalance.toString(), decimals);

  // Check/set approval
  const allowance = await tokenContract.allowance(wallet.address, CONFIG.PANCAKE_ROUTER);

  if (allowance < amountIn) {
    logger.info('Approving token spend...');
    const approveTx = await tokenContract.approve(
      CONFIG.PANCAKE_ROUTER,
      ethers.MaxUint256
    );
    await approveTx.wait();
    logger.info('Token approved');
  }

  // Build swap path: Token -> WBNB
  const path = [tokenAddress, CONFIG.WBNB_ADDRESS];

  // Get expected output
  const expectedOut = await getExpectedOutput(amountIn, path);
  const expectedBNB = parseFloat(ethers.formatEther(expectedOut));

  // Calculate minimum output with slippage
  const slippageFactor = BigInt(Math.floor((100 - slippagePercent) * 100));
  const amountOutMin = (expectedOut * slippageFactor) / BigInt(10000);

  // Set deadline
  const deadline = Math.floor(Date.now() / 1000) + 60 * 20;

  try {
    logger.info(`Executing SELL: ${tokenBalance} tokens for ~${expectedBNB} BNB`);

    // Execute swap
    const tx = await routerContract.swapExactTokensForETH(
      amountIn,
      amountOutMin,
      path,
      wallet.address,
      deadline,
      {
        gasLimit: params.gasLimit || 500000,
      }
    );

    logger.info(`Transaction sent: ${tx.hash}`);

    const receipt = await tx.wait();

    // Get actual BNB received
    const newBalance = await getWalletBalance();

    logTrade('SELL', tokenAddress, expectedBNB);

    return {
      success: true,
      txHash: receipt.hash,
      amountIn: tokenBalance.toString(),
      amountOut: expectedBNB.toString(),
      actualPrice: expectedBNB / tokenBalance,
      gasUsed: receipt.gasUsed.toString(),
    };
  } catch (error) {
    logError('executeSell', error as Error);

    return {
      success: false,
      amountIn: tokenBalance.toString(),
      amountOut: '0',
      actualPrice: 0,
      error: (error as Error).message,
    };
  }
}

/**
 * Main trade execution function - now using PancakeSwap V3 SDK
 */
export async function executeTrade(params: TradeParams): Promise<TradeResult> {
  await initializeProvider();

  try {
    // Validate trade amount
    if (!validateTradeAmount(params.amountBNB)) {
      throw new TradingError('Invalid trade amount', 'INVALID_AMOUNT');
    }

    // Check balance
    const balance = await getWalletBalance();
    checkSufficientBalance(params.amountBNB, balance);

    // Validate slippage
    const slippage = params.slippagePercent || CONFIG.MAX_SLIPPAGE_PERCENTAGE;
    if (!validateSlippage(slippage)) {
      throw new TradingError('Invalid slippage', 'INVALID_SLIPPAGE');
    }

    logger.info(`\n📊 Executing ${params.action.toUpperCase()} trade`);
    logger.info(`  Token: ${params.tokenAddress}`);
    logger.info(`  Amount: ${params.amountBNB} BNB`);
    logger.info(`  Slippage: ${slippage}%`);

    let result;

    if (params.action === 'buy') {
      // Use PancakeSwap SDK to buy tokens
      const swapResult = await pancakeSwap.buyTokenWithBNB(
        params.tokenAddress,
        params.amountBNB,
        slippage * 100 // Convert to basis points (0.5% = 50 bps)
      );

      result = {
        success: swapResult.success,
        txHash: swapResult.txHash,
        amountIn: swapResult.amountIn,
        amountOut: swapResult.amountOut,
        actualPrice: swapResult.executionPrice ? parseFloat(swapResult.executionPrice) : 0,
        gasUsed: swapResult.gasUsed,
        error: swapResult.error,
      };
    } else if (params.action === 'sell') {
      // Get token balance first
      const tokenBalance = await getTokenBalance(params.tokenAddress);

      if (tokenBalance === 0) {
        throw new TradingError('No tokens to sell', 'NO_BALANCE');
      }

      // Use PancakeSwap SDK to sell tokens
      const swapResult = await pancakeSwap.sellTokenForBNB(
        params.tokenAddress,
        tokenBalance.toString(),
        slippage * 100
      );

      result = {
        success: swapResult.success,
        txHash: swapResult.txHash,
        amountIn: swapResult.amountIn,
        amountOut: swapResult.amountOut,
        actualPrice: swapResult.executionPrice ? parseFloat(swapResult.executionPrice) : 0,
        gasUsed: swapResult.gasUsed,
        error: swapResult.error,
      };
    } else {
      throw new TradingError('Invalid action', 'INVALID_ACTION');
    }

    if (result.success) {
      logger.info(`✅ Trade executed successfully!`);
      logger.info(`  TX Hash: ${result.txHash}`);
      logger.info(`  Amount Out: ${result.amountOut}`);
      logger.info(`  Gas Used: ${result.gasUsed}`);
    } else {
      logger.error(`❌ Trade failed: ${result.error}`);
    }

    return result;
  } catch (error) {
    logError('executeTrade', error as Error);
    return {
      success: false,
      amountIn: params.amountBNB.toString(),
      amountOut: '0',
      actualPrice: 0,
      error: (error as Error).message,
    };
  }
}

/**
 * Estimate gas for a trade
 */
export async function estimateTradeGas(params: TradeParams): Promise<bigint> {
  await initializeProvider();

  const path =
    params.action === 'buy'
      ? [CONFIG.WBNB_ADDRESS, params.tokenAddress]
      : [params.tokenAddress, CONFIG.WBNB_ADDRESS];

  const amountInWei = ethers.parseEther(params.amountBNB.toString());
  const deadline = Math.floor(Date.now() / 1000) + 60 * 20;

  try {
    if (params.action === 'buy') {
      const gasEstimate = await routerContract.swapExactETHForTokens.estimateGas(
        0,
        path,
        wallet.address,
        deadline,
        { value: amountInWei }
      );
      return gasEstimate;
    } else {
      const tokenBalance = await getTokenBalance(params.tokenAddress);
      const tokenContract = new ethers.Contract(params.tokenAddress, ERC20_ABI, provider);
      const decimals = await tokenContract.decimals();
      const amountIn = ethers.parseUnits(tokenBalance.toString(), decimals);

      const gasEstimate = await routerContract.swapExactTokensForETH.estimateGas(
        amountIn,
        0,
        path,
        wallet.address,
        deadline
      );
      return gasEstimate;
    }
  } catch (error) {
    logger.warn(`Gas estimation failed: ${(error as Error).message}`);
    return BigInt(500000); // Default fallback
  }
}

export default {
  initializeProvider,
  getWalletBalance,
  getTokenBalance,
  executeTrade,
  estimateTradeGas,
};
