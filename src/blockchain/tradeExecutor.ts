import { ethers } from 'ethers';
import { logger, logTrade, logError } from '../utils/logger';
import { withRetry, TradingError } from '../utils/errorHandler';
import {
  validateTradeAmount,
  checkSufficientBalance,
  validateSlippage,
} from '../utils/safeguards';
import { CONFIG } from '../config';

// PancakeSwap V2 Router ABI (simplified - only functions we need)
const ROUTER_ABI = [
  'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)',
  'function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
  'function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)',
];

// ERC20 ABI (for token approvals)
const ERC20_ABI = [
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
  'function balanceOf(address account) external view returns (uint256)',
  'function decimals() external view returns (uint8)',
  'function symbol() external view returns (string)',
];

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

let provider: ethers.JsonRpcProvider;
let wallet: ethers.Wallet;
let routerContract: ethers.Contract;

/**
 * Initialize blockchain connection
 */
export function initializeProvider(): void {
  if (provider) return; // Already initialized

  provider = new ethers.JsonRpcProvider(CONFIG.BNB_RPC);
  wallet = new ethers.Wallet(CONFIG.WALLET_PRIVATE_KEY, provider);
  routerContract = new ethers.Contract(
    CONFIG.PANCAKE_ROUTER_V2,
    ROUTER_ABI,
    wallet
  );

  logger.info(`Blockchain initialized - Wallet: ${wallet.address}`);
}

/**
 * Get wallet BNB balance
 */
export async function getWalletBalance(): Promise<number> {
  initializeProvider();

  const balance = await provider.getBalance(wallet.address);
  return parseFloat(ethers.formatEther(balance));
}

/**
 * Get token balance
 */
export async function getTokenBalance(tokenAddress: string): Promise<number> {
  initializeProvider();

  const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
  const balance = await tokenContract.balanceOf(wallet.address);
  const decimals = await tokenContract.decimals();

  return parseFloat(ethers.formatUnits(balance, decimals));
}

/**
 * Get expected output amount for a trade
 */
export async function getExpectedOutput(
  amountIn: bigint,
  path: string[]
): Promise<bigint> {
  initializeProvider();

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
  const allowance = await tokenContract.allowance(wallet.address, CONFIG.PANCAKE_ROUTER_V2);

  if (allowance < amountIn) {
    logger.info('Approving token spend...');
    const approveTx = await tokenContract.approve(
      CONFIG.PANCAKE_ROUTER_V2,
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
 * Main trade execution function
 */
export async function executeTrade(params: TradeParams): Promise<TradeResult> {
  initializeProvider();

  const result = await withRetry(
    async () => {
      if (params.action === 'buy') {
        return await executeBuy(params);
      } else if (params.action === 'sell') {
        return await executeSell(params);
      } else {
        throw new TradingError('Invalid action', 'INVALID_ACTION');
      }
    },
    2, // Retry twice for network issues
    3000,
    `Trade ${params.action}`
  );

  return result;
}

/**
 * Estimate gas for a trade
 */
export async function estimateTradeGas(params: TradeParams): Promise<bigint> {
  initializeProvider();

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
