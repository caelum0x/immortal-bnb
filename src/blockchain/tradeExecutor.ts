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

    // Get quote to determine expected price for slippage validation
    const quote = await pancakeSwap.getQuote(params.tokenAddress, params.amountBNB);
    const expectedPrice = quote.pricePerToken;
    
    // Validate slippage tolerance
    const slippage = params.slippagePercent || CONFIG.MAX_SLIPPAGE_PERCENTAGE;
    if (slippage < 0.1 || slippage > 50) {
      throw new TradingError('Invalid slippage percentage', 'INVALID_SLIPPAGE');
    }

    logger.info(`\n📊 Executing ${params.action.toUpperCase()} trade`);
    logger.info(`  Token: ${params.tokenAddress}`);
    logger.info(`  Amount: ${params.amountBNB} BNB`);
    logger.info(`  Slippage: ${slippage}%`);
    logger.info(`  Expected price: ${expectedPrice.toFixed(8)} BNB per token`);
    logger.info(`  Expected tokens: ${quote.expectedTokens.toFixed(6)}`);

    let result;

    if (params.action === 'buy') {
      // Use PancakeSwap SDK to buy tokens
      const swapResult = await pancakeSwap.buyTokenWithBNB(
        params.tokenAddress,
        params.amountBNB,
        slippage * 100 // Convert to basis points (0.5% = 50 bps)
      );

      // Validate actual execution price against expected price
      if (swapResult.success && swapResult.executionPrice) {
        const actualPrice = parseFloat(swapResult.executionPrice);
        validateSlippage(expectedPrice, actualPrice);
        logger.info(`  Price validation passed - Expected: ${expectedPrice.toFixed(6)}, Actual: ${actualPrice.toFixed(6)}`);
      }

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

      // For sell orders, get the current token price to validate execution
      const currentTokenPrice = await pancakeSwap.getTokenPrice(params.tokenAddress);

      // Use PancakeSwap SDK to sell tokens
      const swapResult = await pancakeSwap.sellTokenForBNB(
        params.tokenAddress,
        tokenBalance.toString(),
        slippage * 100
      );

      // Validate actual execution price against current market price
      if (swapResult.success && swapResult.executionPrice) {
        const actualPrice = parseFloat(swapResult.executionPrice);
        validateSlippage(currentTokenPrice, actualPrice);
        logger.info(`  Price validation passed - Expected: ${currentTokenPrice.toFixed(6)}, Actual: ${actualPrice.toFixed(6)}`);
      }

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

export default {
  initializeProvider,
  getWalletBalance,
  getTokenBalance,
  executeTrade,
};
