// src/blockchain/pancakeSwapIntegration.ts
// Real PancakeSwap V3 SDK integration for executing trades
// This replaces the basic router ABI approach with proper SDK usage

import { Token, CurrencyAmount, TradeType, Percent } from '@pancakeswap/swap-sdk-core';
import { Pool, FeeAmount, Trade, Route, encodeRouteToPath } from '@pancakeswap/v3-sdk';
import { ethers } from 'ethers';
import { logger, logError, logTrade } from '../utils/logger';
import { CONFIG } from '../config';

const POOL_ABI = [
  'function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)',
  'function liquidity() external view returns (uint128)',
  'function token0() external view returns (address)',
  'function token1() external view returns (address)',
];

const FACTORY_ABI = [
  'function getPool(address tokenA, address tokenB, uint24 fee) external view returns (address pool)',
];

const ROUTER_V3_ABI = [
  'function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountOut)',
  'function exactOutputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 amountOut, uint256 amountInMaximum, uint160 sqrtPriceLimitX96)) external payable returns (uint256 amountIn)',
];

const ERC20_ABI = [
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function balanceOf(address account) external view returns (uint256)',
  'function decimals() external view returns (uint8)',
  'function symbol() external view returns (string)',
  'function name() external view returns (string)',
];

export interface SwapResult {
  success: boolean;
  txHash?: string;
  amountIn: string;
  amountOut: string;
  priceImpact?: string;
  executionPrice?: string;
  gasUsed?: string;
  error?: string;
}

/**
 * PancakeSwap V3 Integration
 * Uses SDK for proper trade calculation and execution
 */
export class PancakeSwapV3 {
  private provider: ethers.Provider;
  private wallet: ethers.Wallet | null;
  private chainId: number;
  private wbnb: Token;
  private factoryAddress: string;
  private routerAddress: string;
  private hasValidWallet: boolean;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(CONFIG.RPC_URL);
    
    // Check if we have a valid private key (lazy wallet initialization)
    const privateKey = CONFIG.WALLET_PRIVATE_KEY;
    this.hasValidWallet = !!(privateKey && 
      privateKey !== 'your_test_wallet_private_key_here' &&
      privateKey !== 'your_wallet_private_key_here' &&
      privateKey.length > 20);

    // Lazy wallet initialization - only create when needed
    // This prevents errors during module load if private key is invalid
    this.wallet = null;
    
    if (!this.hasValidWallet) {
      logger.warn('⚠️  No valid wallet private key - trading disabled');
      logger.warn('   API endpoints will work, but trade execution will be simulated');
    }
    
    this.chainId = CONFIG.CHAIN_ID;
  }

  /**
   * Get or create wallet instance (lazy initialization)
   */
  private getWallet(): ethers.Wallet {
    if (!this.hasValidWallet) {
      throw new Error('Cannot get wallet - no valid private key configured');
    }
    
    if (!this.wallet) {
      try {
        const privateKey = CONFIG.WALLET_PRIVATE_KEY;
        if (!privateKey) {
          throw new Error('WALLET_PRIVATE_KEY not set in environment');
        }
        // Normalize private key (ensure 0x prefix)
        const normalizedKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
        this.wallet = new ethers.Wallet(normalizedKey, this.provider);
        logger.info(`✅ PancakeSwap wallet initialized: ${this.wallet.address}`);
      } catch (error: any) {
        logger.error(`❌ Failed to create PancakeSwap wallet: ${error.message}`);
        throw new Error(`PancakeSwap wallet initialization failed: ${error.message}`);
      }
    }
    return this.wallet;

    // WBNB token
    const wbnbAddress = CONFIG.WBNB_ADDRESS as `0x${string}`;
    this.wbnb = new Token(this.chainId, wbnbAddress, 18, 'WBNB', 'Wrapped BNB');

    this.factoryAddress = CONFIG.PANCAKE_FACTORY;
    this.routerAddress = CONFIG.PANCAKE_ROUTER;

    logger.info('🥞 PancakeSwap V3 initialized');
    logger.info(`  Chain ID: ${this.chainId}`);
    logger.info(`  Factory: ${this.factoryAddress}`);
    logger.info(`  Router: ${this.routerAddress}`);
  }

  /**
   * Buy tokens with BNB
   */
  async buyTokenWithBNB(
    tokenAddress: string,
    amountBNB: number,
    slippageBps: number = 50 // 0.5% default
  ): Promise<SwapResult> {
    try {
      logger.info(`\n💰 Buying token ${tokenAddress} with ${amountBNB} BNB...`);

      // Create token instance
      const targetToken = await this.createTokenFromAddress(tokenAddress);
      logger.info(`  Token: ${targetToken.symbol} (${targetToken.decimals} decimals)`);

      // Find best pool
      const pool = await this.findBestPool(this.wbnb, targetToken);
      if (!pool) {
        throw new Error('No liquidity pool found for this token');
      }

      const feePercent = pool.fee / 10000;
      logger.info(`  Pool found with ${feePercent}% fee`);
      logger.info(`  Pool liquidity: ${pool.liquidity.toString()}`);

      // Create trade with SDK
      const amountIn = CurrencyAmount.fromRawAmount(
        this.wbnb,
        ethers.parseEther(amountBNB.toString()).toString()
      );

      const route = new Route([pool], this.wbnb, targetToken);
      const trade = Trade.createUncheckedTrade({
        route,
        inputAmount: amountIn,
        outputAmount: CurrencyAmount.fromRawAmount(targetToken, 0),
        tradeType: TradeType.EXACT_INPUT,
      });

      // Get quote
      const outputAmount = trade.outputAmount;
      const executionPrice = trade.executionPrice;
      const priceImpact = trade.priceImpact;

      logger.info(`  Expected output: ${outputAmount.toSignificant(6)} ${targetToken.symbol}`);
      logger.info(`  Execution price: ${executionPrice.toSignificant(6)}`);
      logger.info(`  Price impact: ${priceImpact.toSignificant(2)}%`);

      // Calculate minimum output with slippage
      const slippageTolerance = new Percent(slippageBps, 10000);
      const amountOutMin = trade.minimumAmountOut(slippageTolerance);

      logger.info(`  Min output (with ${slippageBps / 100}% slippage): ${amountOutMin.toSignificant(6)}`);

      // Execute swap
      const txReceipt = await this.executeSwap({
        tokenIn: this.wbnb.address,
        tokenOut: targetToken.address,
        fee: pool.fee,
        amountIn: amountIn.quotient.toString(),
        amountOutMinimum: amountOutMin.quotient.toString(),
        isExactInput: true,
        isBuyingWithBNB: true,
      });

      logger.info(`✅ Swap successful! TX: ${txReceipt.hash}`);

      // Log trade
      logTrade('BUY', tokenAddress, amountBNB);

      return {
        success: true,
        txHash: txReceipt.hash,
        amountIn: amountBNB.toString(),
        amountOut: outputAmount.toSignificant(6),
        priceImpact: priceImpact.toSignificant(2),
        executionPrice: executionPrice.toSignificant(6),
        gasUsed: txReceipt.gasUsed?.toString(),
      };
    } catch (error) {
      logError('buyTokenWithBNB', error as Error);
      return {
        success: false,
        amountIn: amountBNB.toString(),
        amountOut: '0',
        error: (error as Error).message,
      };
    }
  }

  /**
   * Sell tokens for BNB
   */
  async sellTokenForBNB(
    tokenAddress: string,
    amountTokens: string,
    slippageBps: number = 50
  ): Promise<SwapResult> {
    try {
      logger.info(`\n💸 Selling ${amountTokens} of token ${tokenAddress}...`);

      const targetToken = await this.createTokenFromAddress(tokenAddress);
      logger.info(`  Token: ${targetToken.symbol}`);

      // Approve token if needed
      await this.approveTokenIfNeeded(targetToken.address, amountTokens, targetToken.decimals);

      // Find pool
      const pool = await this.findBestPool(targetToken, this.wbnb);
      if (!pool) {
        throw new Error('No liquidity pool found');
      }

      // Create trade
      const amountIn = CurrencyAmount.fromRawAmount(
        targetToken,
        ethers.parseUnits(amountTokens, targetToken.decimals).toString()
      );

      const route = new Route([pool], targetToken, this.wbnb);
      const trade = Trade.createUncheckedTrade({
        route,
        inputAmount: amountIn,
        outputAmount: CurrencyAmount.fromRawAmount(this.wbnb, 0),
        tradeType: TradeType.EXACT_INPUT,
      });

      const outputAmount = trade.outputAmount;
      logger.info(`  Expected BNB output: ${outputAmount.toSignificant(6)} BNB`);

      const slippageTolerance = new Percent(slippageBps, 10000);
      const amountOutMin = trade.minimumAmountOut(slippageTolerance);

      // Execute swap
      const txReceipt = await this.executeSwap({
        tokenIn: targetToken.address,
        tokenOut: this.wbnb.address,
        fee: pool.fee,
        amountIn: amountIn.quotient.toString(),
        amountOutMinimum: amountOutMin.quotient.toString(),
        isExactInput: true,
        isBuyingWithBNB: false,
      });

      logger.info(`✅ Sell successful! TX: ${txReceipt.hash}`);

      logTrade('SELL', tokenAddress, parseFloat(outputAmount.toSignificant(6)));

      return {
        success: true,
        txHash: txReceipt.hash,
        amountIn: amountTokens,
        amountOut: outputAmount.toSignificant(6),
        priceImpact: trade.priceImpact.toSignificant(2),
        executionPrice: trade.executionPrice.toSignificant(6),
        gasUsed: txReceipt.gasUsed?.toString(),
      };
    } catch (error) {
      logError('sellTokenForBNB', error as Error);
      return {
        success: false,
        amountIn: amountTokens,
        amountOut: '0',
        error: (error as Error).message,
      };
    }
  }

  /**
   * Create Token instance from address
   */
  private async createTokenFromAddress(address: string): Promise<Token> {
    const contract = new ethers.Contract(address, ERC20_ABI, this.provider);

    const [decimals, symbol, name] = await Promise.all([
      contract.decimals?.() || 18,
      contract.symbol?.() || 'UNKNOWN',
      contract.name?.() || 'Unknown Token',
    ]);

    return new Token(this.chainId, address as `0x${string}`, decimals, symbol, name);
  }

  /**
   * Find best pool by trying different fee tiers
   */
  private async findBestPool(tokenA: Token, tokenB: Token): Promise<Pool | null> {
    // Try fee tiers in order: MEDIUM (most common) > LOW > HIGH
    const feeTiers = [
      FeeAmount.MEDIUM, // 3000 = 0.3%
      FeeAmount.LOW,    // 500 = 0.05%
      FeeAmount.HIGH,   // 10000 = 1%
    ];

    for (const fee of feeTiers) {
      const pool = await this.getPool(tokenA, tokenB, fee);
      if (pool && pool.liquidity.toString() !== '0') {
        return pool;
      }
    }

    return null;
  }

  /**
   * Get pool for specific fee tier
   */
  private async getPool(tokenA: Token, tokenB: Token, fee: number): Promise<Pool | null> {
    try {
      const factory = new ethers.Contract(this.factoryAddress, FACTORY_ABI, this.provider);

      const poolAddress = await factory.getPool?.(tokenA.address, tokenB.address, fee);
      if (!poolAddress || poolAddress === ethers.ZeroAddress) {
        return null;
      }

      const poolContract = new ethers.Contract(poolAddress, POOL_ABI, this.provider);
      const [slot0, liquidity] = await Promise.all([
        poolContract.slot0?.(),
        poolContract.liquidity?.(),
      ]);

      if (!slot0 || !liquidity) {
        return null;
      }

      // Sort tokens (Pool requires token0 < token1)
      const [token0, token1] =
        tokenA.address.toLowerCase() < tokenB.address.toLowerCase()
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
    } catch (error) {
      // Pool doesn't exist
      return null;
    }
  }

  /**
   * Execute swap on-chain
   */
  private async executeSwap(params: {
    tokenIn: string;
    tokenOut: string;
    fee: number;
    amountIn: string;
    amountOutMinimum: string;
    isExactInput: boolean;
    isBuyingWithBNB: boolean;
  }): Promise<ethers.ContractTransactionReceipt> {
    if (!this.hasValidWallet) {
      throw new Error('Cannot execute swap - no wallet configured');
    }
    
    const wallet = this.getWallet();
    const router = new ethers.Contract(this.routerAddress, ROUTER_V3_ABI, wallet);

    const swapParams = {
      tokenIn: params.tokenIn,
      tokenOut: params.tokenOut,
      fee: params.fee,
      recipient: wallet.address,
      amountIn: params.amountIn,
      amountOutMinimum: params.amountOutMinimum,
      sqrtPriceLimitX96: 0,
    };

    const value = params.isBuyingWithBNB ? params.amountIn : '0';

    logger.info('  Executing swap on-chain...');

    if (!router.exactInputSingle) {
      throw new Error('Router contract method exactInputSingle not available');
    }

    const tx = await router.exactInputSingle(swapParams, {
      value,
      gasLimit: 500000,
    });

    logger.info(`  TX sent: ${tx.hash}`);
    logger.info('  Waiting for confirmation...');

    const receipt = await tx.wait();
    return receipt;
  }

  /**
   * Approve token for router
   */
  private async approveTokenIfNeeded(
    tokenAddress: string,
    amount: string,
    decimals: number
  ): Promise<void> {
    if (!this.hasValidWallet) {
      throw new Error('Cannot approve token - no wallet configured');
    }
    
    const wallet = this.getWallet();
    const token = new ethers.Contract(tokenAddress, ERC20_ABI, wallet);

    if (!token.allowance || !token.approve) {
      throw new Error('Token contract methods not available');
    }

    const allowance = await token.allowance(wallet.address, this.routerAddress);
    const required = ethers.parseUnits(amount, decimals);

    if (allowance < required) {
      logger.info('  Approving token...');
      const approveTx = await token.approve(this.routerAddress, ethers.MaxUint256);
      await approveTx.wait();
      logger.info('  Token approved ✓');
    }
  }

  /**
   * Get wallet balance
   */
  async getBalance(): Promise<number> {
    if (!this.hasValidWallet) {
      logger.warn('🚨 Cannot get balance - no wallet configured');
      return 0;
    }
    const wallet = this.getWallet();
    const balance = await this.provider.getBalance(wallet.address);
    return parseFloat(ethers.formatEther(balance));
  }

  /**
   * Get token balance
   */
  async getTokenBalance(tokenAddress: string): Promise<number> {
    if (!this.hasValidWallet) {
      logger.warn('🚨 Cannot get token balance - no wallet configured');
      return 0;
    }
    
    const wallet = this.getWallet();
    const token = new ethers.Contract(tokenAddress, ERC20_ABI, this.provider);
    
    if (!token.balanceOf || !token.decimals) {
      throw new Error('Token contract methods not available');
    }
    
    const balance = await token.balanceOf(wallet.address);
    const decimals = await token.decimals();
    return parseFloat(ethers.formatUnits(balance, decimals));
  }

  /**
   * Get token price in BNB
   */
  async getTokenPrice(tokenAddress: string): Promise<number> {
    try {
      const targetToken = await this.createTokenFromAddress(tokenAddress);
      const pool = await this.findBestPool(this.wbnb, targetToken);
      
      if (!pool) {
        throw new Error('No liquidity pool found for price calculation');
      }

      // Calculate price using pool sqrtPriceX96
      const token0IsWBNB = pool.token0.address.toLowerCase() === this.wbnb.address.toLowerCase();
      const price = parseFloat(pool.token0Price.toSignificant(6));
      
      // If WBNB is token0, return price directly, otherwise return inverse
      return token0IsWBNB ? 1 / price : price;
    } catch (error) {
      logger.error(`Failed to get token price: ${error}`);
      throw error;
    }
  }

  /**
   * Get quote for a specific amount (for price validation)
   */
  async getQuote(tokenAddress: string, amountBNB: number): Promise<{ expectedTokens: number; pricePerToken: number }> {
    try {
      const targetToken = await this.createTokenFromAddress(tokenAddress);
      const pool = await this.findBestPool(this.wbnb, targetToken);
      
      if (!pool) {
        throw new Error('No liquidity pool found for quote');
      }

      const amountIn = CurrencyAmount.fromRawAmount(
        this.wbnb,
        ethers.parseEther(amountBNB.toString()).toString()
      );

      const route = new Route([pool], this.wbnb, targetToken);
      const trade = Trade.createUncheckedTrade({
        route,
        inputAmount: amountIn,
        outputAmount: CurrencyAmount.fromRawAmount(targetToken, 0),
        tradeType: TradeType.EXACT_INPUT,
      });

      const expectedTokens = parseFloat(trade.outputAmount.toSignificant(6));
      const pricePerToken = amountBNB / expectedTokens;

      return {
        expectedTokens,
        pricePerToken
      };
    } catch (error) {
      logger.error(`Failed to get quote: ${error}`);
      throw error;
    }
  }
}

export default PancakeSwapV3;
