/**
 * Multi-Chain Wallet Manager
 *
 * Manages wallet operations across multiple blockchain networks:
 * - BNB Chain (BSC)
 * - opBNB (Layer 2)
 * - Polygon (for Polymarket)
 *
 * Provides unified interface for balance checks, transfers, and approvals
 */

import { ethers } from 'ethers';
import { logger } from '../utils/logger';
import { CONFIG } from '../config';

export interface ChainConfig {
  name: string;
  chainId: number;
  rpcUrl: string;
  nativeToken: string;
  explorer: string;
}

export interface WalletBalance {
  chain: string;
  nativeBalance: number; // BNB, MATIC, etc.
  nativeSymbol: string;
  usdValue?: number;
}

export interface TokenBalance {
  chain: string;
  token: string;
  symbol: string;
  balance: number;
  decimals: number;
}

export class MultiChainWalletManager {
  private wallet: ethers.Wallet;
  private providers: Map<string, ethers.JsonRpcProvider>;
  private wallets: Map<string, ethers.Wallet>;

  // Chain configurations
  private chains: Map<string, ChainConfig> = new Map([
    ['bnb', {
      name: 'BNB Chain',
      chainId: CONFIG.IS_MAINNET ? 56 : 97,
      rpcUrl: CONFIG.IS_MAINNET
        ? 'https://bsc-dataseed.bnbchain.org'
        : 'https://data-seed-prebsc-1-s1.binance.org:8545',
      nativeToken: 'BNB',
      explorer: CONFIG.IS_MAINNET ? 'https://bscscan.com' : 'https://testnet.bscscan.com',
    }],
    ['opbnb', {
      name: 'opBNB',
      chainId: CONFIG.IS_MAINNET ? 204 : 5611,
      rpcUrl: CONFIG.IS_MAINNET
        ? 'https://opbnb-mainnet-rpc.bnbchain.org'
        : 'https://opbnb-testnet-rpc.bnbchain.org',
      nativeToken: 'BNB',
      explorer: CONFIG.IS_MAINNET ? 'https://opbnbscan.com' : 'https://testnet.opbnbscan.com',
    }],
    ['polygon', {
      name: 'Polygon',
      chainId: CONFIG.IS_MAINNET ? 137 : 80001,
      rpcUrl: CONFIG.IS_MAINNET
        ? CONFIG.POLYGON_RPC
        : CONFIG.POLYGON_TESTNET_RPC,
      nativeToken: 'MATIC',
      explorer: CONFIG.IS_MAINNET ? 'https://polygonscan.com' : 'https://mumbai.polygonscan.com',
    }],
  ]);

  constructor(privateKey: string) {
    this.wallet = new ethers.Wallet(privateKey);
    this.providers = new Map();
    this.wallets = new Map();

    // Initialize providers and wallets for each chain
    for (const [chainKey, chainConfig] of this.chains) {
      const provider = new ethers.JsonRpcProvider(chainConfig.rpcUrl);
      this.providers.set(chainKey, provider);
      this.wallets.set(chainKey, this.wallet.connect(provider));
    }

    logger.info(`Multi-chain wallet initialized for address: ${this.wallet.address}`);
  }

  /**
   * Get wallet address (same across all chains)
   */
  getAddress(): string {
    return this.wallet.address;
  }

  /**
   * Get provider for a specific chain
   */
  getProvider(chain: string): ethers.JsonRpcProvider {
    const provider = this.providers.get(chain);
    if (!provider) {
      throw new Error(`Provider not found for chain: ${chain}`);
    }
    return provider;
  }

  /**
   * Get connected wallet for a specific chain
   */
  getWallet(chain: string): ethers.Wallet {
    const wallet = this.wallets.get(chain);
    if (!wallet) {
      throw new Error(`Wallet not found for chain: ${chain}`);
    }
    return wallet;
  }

  /**
   * Get chain configuration
   */
  getChainConfig(chain: string): ChainConfig {
    const config = this.chains.get(chain);
    if (!config) {
      throw new Error(`Chain configuration not found: ${chain}`);
    }
    return config;
  }

  /**
   * Get native token balance for a specific chain
   */
  async getNativeBalance(chain: string): Promise<number> {
    try {
      const provider = this.getProvider(chain);
      const balance = await provider.getBalance(this.wallet.address);
      return parseFloat(ethers.formatEther(balance));
    } catch (error) {
      logger.error(`Error fetching ${chain} native balance:`, error);
      return 0;
    }
  }

  /**
   * Get all native balances across chains
   */
  async getAllNativeBalances(): Promise<WalletBalance[]> {
    const balances: WalletBalance[] = [];

    for (const [chainKey, chainConfig] of this.chains) {
      const balance = await this.getNativeBalance(chainKey);
      balances.push({
        chain: chainConfig.name,
        nativeBalance: balance,
        nativeSymbol: chainConfig.nativeToken,
      });
    }

    return balances;
  }

  /**
   * Get ERC20 token balance
   */
  async getTokenBalance(chain: string, tokenAddress: string, decimals: number = 18): Promise<number> {
    try {
      const provider = this.getProvider(chain);
      const tokenAbi = ['function balanceOf(address) view returns (uint256)'];
      const tokenContract = new ethers.Contract(tokenAddress, tokenAbi, provider);

      const balance = await tokenContract.balanceOf(this.wallet.address);
      return parseFloat(ethers.formatUnits(balance, decimals));
    } catch (error) {
      logger.error(`Error fetching token balance on ${chain}:`, error);
      return 0;
    }
  }

  /**
   * Get USDC balance on Polygon (for Polymarket)
   */
  async getUSDCBalance(): Promise<number> {
    const usdcAddress = CONFIG.IS_MAINNET
      ? '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174' // Polygon mainnet
      : '0x0FA8781a83E46826621b3BC094Ea2A0212e71B23'; // Mumbai testnet

    return await this.getTokenBalance('polygon', usdcAddress, 6);
  }

  /**
   * Approve token spending
   */
  async approveToken(
    chain: string,
    tokenAddress: string,
    spender: string,
    amount: string
  ): Promise<string | null> {
    try {
      const wallet = this.getWallet(chain);
      const tokenAbi = ['function approve(address spender, uint256 amount) returns (bool)'];
      const tokenContract = new ethers.Contract(tokenAddress, tokenAbi, wallet);

      logger.info(`Approving ${amount} tokens for ${spender} on ${chain}...`);

      const tx = await tokenContract.approve(spender, ethers.parseUnits(amount, 18));
      await tx.wait();

      logger.info(`Approval successful: ${tx.hash}`);
      return tx.hash;
    } catch (error) {
      logger.error(`Error approving token on ${chain}:`, error);
      return null;
    }
  }

  /**
   * Transfer native tokens
   */
  async transferNative(chain: string, to: string, amount: string): Promise<string | null> {
    try {
      const wallet = this.getWallet(chain);
      const chainConfig = this.getChainConfig(chain);

      logger.info(`Transferring ${amount} ${chainConfig.nativeToken} to ${to} on ${chain}...`);

      const tx = await wallet.sendTransaction({
        to,
        value: ethers.parseEther(amount),
      });

      await tx.wait();

      logger.info(`Transfer successful: ${tx.hash}`);
      return tx.hash;
    } catch (error) {
      logger.error(`Error transferring native tokens on ${chain}:`, error);
      return null;
    }
  }

  /**
   * Transfer ERC20 tokens
   */
  async transferToken(
    chain: string,
    tokenAddress: string,
    to: string,
    amount: string,
    decimals: number = 18
  ): Promise<string | null> {
    try {
      const wallet = this.getWallet(chain);
      const tokenAbi = ['function transfer(address to, uint256 amount) returns (bool)'];
      const tokenContract = new ethers.Contract(tokenAddress, tokenAbi, wallet);

      logger.info(`Transferring ${amount} tokens to ${to} on ${chain}...`);

      const tx = await tokenContract.transfer(to, ethers.parseUnits(amount, decimals));
      await tx.wait();

      logger.info(`Token transfer successful: ${tx.hash}`);
      return tx.hash;
    } catch (error) {
      logger.error(`Error transferring tokens on ${chain}:`, error);
      return null;
    }
  }

  /**
   * Estimate gas for a transaction
   */
  async estimateGas(chain: string, tx: ethers.TransactionRequest): Promise<bigint> {
    try {
      const provider = this.getProvider(chain);
      return await provider.estimateGas(tx);
    } catch (error) {
      logger.error(`Error estimating gas on ${chain}:`, error);
      return BigInt(0);
    }
  }

  /**
   * Get current gas price
   */
  async getGasPrice(chain: string): Promise<bigint> {
    try {
      const provider = this.getProvider(chain);
      const feeData = await provider.getFeeData();
      return feeData.gasPrice || BigInt(0);
    } catch (error) {
      logger.error(`Error fetching gas price on ${chain}:`, error);
      return BigInt(0);
    }
  }

  /**
   * Get transaction count (nonce)
   */
  async getTransactionCount(chain: string): Promise<number> {
    try {
      const provider = this.getProvider(chain);
      return await provider.getTransactionCount(this.wallet.address);
    } catch (error) {
      logger.error(`Error fetching transaction count on ${chain}:`, error);
      return 0;
    }
  }

  /**
   * Wait for transaction confirmation
   */
  async waitForTransaction(chain: string, txHash: string, confirmations: number = 1): Promise<ethers.TransactionReceipt | null> {
    try {
      const provider = this.getProvider(chain);
      return await provider.waitForTransaction(txHash, confirmations);
    } catch (error) {
      logger.error(`Error waiting for transaction on ${chain}:`, error);
      return null;
    }
  }

  /**
   * Get block number
   */
  async getBlockNumber(chain: string): Promise<number> {
    try {
      const provider = this.getProvider(chain);
      return await provider.getBlockNumber();
    } catch (error) {
      logger.error(`Error fetching block number on ${chain}:`, error);
      return 0;
    }
  }

  /**
   * Get comprehensive wallet status across all chains
   */
  async getWalletStatus(): Promise<{
    address: string;
    balances: WalletBalance[];
    totalValueUSD?: number;
  }> {
    const balances = await this.getAllNativeBalances();

    // Add USDC balance on Polygon
    const usdcBalance = await this.getUSDCBalance();
    if (usdcBalance > 0) {
      balances.push({
        chain: 'Polygon',
        nativeBalance: usdcBalance,
        nativeSymbol: 'USDC',
        usdValue: usdcBalance,
      });
    }

    return {
      address: this.wallet.address,
      balances,
    };
  }

  /**
   * Check if wallet has sufficient balance for a transaction
   */
  async hasSufficientBalance(chain: string, amount: number, token?: string): Promise<boolean> {
    try {
      if (token) {
        const balance = await this.getTokenBalance(chain, token);
        return balance >= amount;
      } else {
        const balance = await this.getNativeBalance(chain);
        return balance >= amount;
      }
    } catch (error) {
      logger.error(`Error checking balance on ${chain}:`, error);
      return false;
    }
  }

  /**
   * Get explorer URL for a transaction
   */
  getExplorerTxUrl(chain: string, txHash: string): string {
    const chainConfig = this.getChainConfig(chain);
    return `${chainConfig.explorer}/tx/${txHash}`;
  }

  /**
   * Get explorer URL for an address
   */
  getExplorerAddressUrl(chain: string, address?: string): string {
    const chainConfig = this.getChainConfig(chain);
    const addr = address || this.wallet.address;
    return `${chainConfig.explorer}/address/${addr}`;
  }
}

// Singleton instance
let multiChainWalletManager: MultiChainWalletManager | null = null;

export function getMultiChainWallet(): MultiChainWalletManager {
  if (!multiChainWalletManager) {
    if (!CONFIG.WALLET_PRIVATE_KEY) {
      throw new Error('Wallet private key not configured');
    }
    multiChainWalletManager = new MultiChainWalletManager(CONFIG.WALLET_PRIVATE_KEY);
  }
  return multiChainWalletManager;
}

export { multiChainWalletManager };
