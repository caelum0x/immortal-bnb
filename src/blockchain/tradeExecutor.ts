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
  hash?: string; // Alias for txHash
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

/**
 * Enhanced TradeExecutor class with improved error handling and validation
 */
export class TradeExecutor {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private pancakeSwap: PancakeSwapV3;
  private isInitialized = false;

  constructor() {
    // Initialize provider
    this.provider = new ethers.JsonRpcProvider(CONFIG.RPC_URL);
    
    if (!CONFIG.WALLET_PRIVATE_KEY) {
      throw new Error('WALLET_PRIVATE_KEY not found in environment variables');
    }

    this.wallet = new ethers.Wallet(CONFIG.WALLET_PRIVATE_KEY, this.provider);
    this.pancakeSwap = new PancakeSwapV3();
    
    logger.info(`🔧 Enhanced TradeExecutor initialized for ${CONFIG.TRADING_NETWORK} network`);
  }

  /**
   * Initialize the executor
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    await initializeProvider();
    this.isInitialized = true;
  }

  /**
   * Execute a trade with enhanced error handling
   */
  async executeTrade(params: TradeParams): Promise<TradeResult> {
    await this.initialize();
    
    try {
      // Run pre-trade validation
      await this.validateTrade(params);
      
      // Get trade quote
      const quote = await this.getTradeQuote(params);
      logger.info(`📊 Quote: ${params.amountBNB} BNB → ${quote.expectedTokens.toFixed(6)} tokens`);
      
      // Execute using existing PancakeSwap integration
      const result = await executeTrade(params);
      
      // Post-trade validation
      if (result.success) {
        await this.validateTradeResult(result, quote);
      }
      
      return result;
      
    } catch (error) {
      const errorMessage = (error as Error).message;
      logger.error(`❌ Enhanced trade execution failed: ${errorMessage}`);
      
      return {
        success: false,
        amountIn: params.amountBNB.toString(),
        amountOut: '0',
        actualPrice: 0,
        error: errorMessage
      };
    }
  }

  /**
   * Get trade quote
   */
  async getTradeQuote(params: TradeParams): Promise<any> {
    await this.initialize();
    return await this.pancakeSwap.getQuote(params.tokenAddress, params.amountBNB);
  }

  /**
   * Simulate a trade without executing
   */
  async simulateTrade(params: TradeParams): Promise<{ success: boolean; error?: string; quote?: any }> {
    try {
      await this.initialize();
      await this.validateTrade(params);
      const quote = await this.getTradeQuote(params);
      
      return { success: true, quote };
      
    } catch (error) {
      return { 
        success: false, 
        error: (error as Error).message 
      };
    }
  }

  /**
   * Validate trade parameters
   */
  private async validateTrade(params: TradeParams): Promise<void> {
    // Check network connection
    try {
      await this.provider.getBlockNumber();
    } catch (error) {
      throw new TradingError('Network connection failed', 'NETWORK_ERROR');
    }

    // Validate amount
    if (!validateTradeAmount(params.amountBNB)) {
      throw new TradingError('Invalid trade amount', 'INVALID_AMOUNT');
    }

    // Check wallet balance
    const balance = await getWalletBalance();
    checkSufficientBalance(params.amountBNB, balance);

    // Validate token address
    if (!ethers.isAddress(params.tokenAddress)) {
      throw new TradingError('Invalid token address', 'INVALID_ADDRESS');
    }

    // Check if token contract exists
    const code = await this.provider.getCode(params.tokenAddress);
    if (code === '0x') {
      throw new TradingError('Token contract not found', 'CONTRACT_NOT_FOUND');
    }

    logger.info('✅ Enhanced trade validation passed');
  }

  /**
   * Validate trade result
   */
  private async validateTradeResult(result: TradeResult, expectedQuote: any): Promise<void> {
    if (!result.success) {
      throw new TradingError('Trade execution failed', 'EXECUTION_FAILED');
    }

    // Additional result validation can be added here
    logger.info('✅ Trade result validation passed');
  }

  /**
   * Get wallet address
   */
  getWalletAddress(): string {
    return this.wallet.address;
  }

  /**
   * Get current balance
   */
  async getBalance(): Promise<number> {
    await this.initialize();
    return await getWalletBalance();
  }

  /**
   * Get token balance
   */
  async getTokenBalance(tokenAddress: string): Promise<number> {
    await this.initialize();
    return await getTokenBalance(tokenAddress);
  }

  /**
   * Get network info
   */
  getNetworkInfo() {
    return {
      chainId: CONFIG.CHAIN_ID,
      network: CONFIG.TRADING_NETWORK,
      rpcUrl: CONFIG.RPC_URL,
      explorerUrl: CONFIG.EXPLORER_URL
    };
  }
}

// Export singleton instance
export const tradeExecutorInstance = new TradeExecutor();

export default {
  initializeProvider,
  getWalletBalance,
  getTokenBalance,
  executeTrade,
};
