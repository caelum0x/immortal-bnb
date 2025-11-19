/**
 * Secure Wallet Manager
 * Handles wallet operations with security best practices
 */

import { ethers } from 'ethers';
import { logger } from '../utils/logger';
import { CONFIG } from '../config';
import { getSecret } from '../config/secrets';

export interface WalletConfig {
  privateKey?: string;
  mnemonic?: string;
  hardwareWallet?: boolean;
  maxTransactionAmount?: number; // In BNB
  dailyLimit?: number; // In BNB
}

export class SecureWalletManager {
  private wallet: ethers.Wallet | null = null;
  private provider: ethers.JsonRpcProvider;
  private config: WalletConfig;
  private dailySpent: number = 0;
  private lastResetDate: string = new Date().toDateString();

  constructor(config: WalletConfig = {}) {
    this.config = {
      maxTransactionAmount: config.maxTransactionAmount || 1.0, // 1 BNB default
      dailyLimit: config.dailyLimit || 5.0, // 5 BNB daily limit
      ...config,
    };

    this.provider = new ethers.JsonRpcProvider(CONFIG.RPC_URL);
    this.initializeWallet();
  }

  /**
   * Initialize wallet from private key or mnemonic
   */
  private initializeWallet(): void {
    if (this.config.hardwareWallet) {
      logger.info('Hardware wallet mode - transactions must be signed externally');
      return;
    }

    try {
      const privateKey = this.config.privateKey || getSecret('WALLET_PRIVATE_KEY');
      if (!privateKey) {
        throw new Error('No private key provided');
      }

      this.wallet = new ethers.Wallet(privateKey, this.provider);
      logger.info(`Wallet initialized: ${this.wallet.address}`);
    } catch (error) {
      logger.error('Failed to initialize wallet:', error);
      throw error;
    }
  }

  /**
   * Get wallet address
   */
  getAddress(): string {
    if (!this.wallet) {
      throw new Error('Wallet not initialized');
    }
    return this.wallet.address;
  }

  /**
   * Get wallet balance
   */
  async getBalance(): Promise<number> {
    if (!this.wallet) {
      throw new Error('Wallet not initialized');
    }

    const balance = await this.provider.getBalance(this.wallet.address);
    return parseFloat(ethers.formatEther(balance));
  }

  /**
   * Validate transaction amount
   */
  private validateTransactionAmount(amountBNB: number): void {
    // Reset daily spent if new day
    const today = new Date().toDateString();
    if (today !== this.lastResetDate) {
      this.dailySpent = 0;
      this.lastResetDate = today;
    }

    // Check per-transaction limit
    if (amountBNB > (this.config.maxTransactionAmount || 1.0)) {
      throw new Error(
        `Transaction amount ${amountBNB} BNB exceeds maximum ${this.config.maxTransactionAmount} BNB`
      );
    }

    // Check daily limit
    if (this.dailySpent + amountBNB > (this.config.dailyLimit || 5.0)) {
      throw new Error(
        `Daily limit would be exceeded. Spent: ${this.dailySpent} BNB, Limit: ${this.config.dailyLimit} BNB`
      );
    }
  }

  /**
   * Sign transaction (with validation)
   */
  async signTransaction(transaction: ethers.TransactionRequest): Promise<string> {
    if (!this.wallet) {
      throw new Error('Wallet not initialized');
    }

    // Extract amount from transaction
    const value = transaction.value;
    if (value) {
      const amountBNB = parseFloat(ethers.formatEther(value));
      this.validateTransactionAmount(amountBNB);
    }

    // Sign transaction
    const signedTx = await this.wallet.signTransaction(transaction);

    // Update daily spent
    if (value) {
      const amountBNB = parseFloat(ethers.formatEther(value));
      this.dailySpent += amountBNB;
    }

    return signedTx;
  }

  /**
   * Emergency pause - revoke wallet access
   */
  pause(): void {
    logger.warn('⚠️  Wallet paused - all transactions blocked');
    this.wallet = null;
  }

  /**
   * Resume wallet operations
   */
  resume(): void {
    this.initializeWallet();
    logger.info('✅ Wallet resumed');
  }

  /**
   * Get transaction limits
   */
  getLimits(): { maxTransaction: number; dailyLimit: number; dailySpent: number } {
    return {
      maxTransaction: this.config.maxTransactionAmount || 1.0,
      dailyLimit: this.config.dailyLimit || 5.0,
      dailySpent: this.dailySpent,
    };
  }
}

// Singleton instance
let walletManager: SecureWalletManager | null = null;

export function getWalletManager(): SecureWalletManager {
  if (!walletManager) {
    walletManager = new SecureWalletManager({
      privateKey: getSecret('WALLET_PRIVATE_KEY'),
      maxTransactionAmount: parseFloat(process.env.MAX_TRADE_AMOUNT_BNB || '1.0'),
      dailyLimit: parseFloat(process.env.DAILY_TRADE_LIMIT_BNB || '5.0'),
    });
  }
  return walletManager;
}

