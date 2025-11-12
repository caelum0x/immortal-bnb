/**
 * Unified Polymarket Wallet Manager
 * Manages both Proxy and Safe wallet types
 */

import { ProxyWalletClient } from './proxyWalletClient';
import { SafeWalletClient } from './safeWalletClient';
import { logger } from '../utils/logger';
import { CONFIG } from '../config';

export type WalletType = 'proxy' | 'safe';

interface BetParams {
  marketId: string;
  outcome: 'YES' | 'NO';
  amount: number;
  price?: number;
}

export class UnifiedPolymarketWallet {
  private walletType: WalletType;
  private proxyClient: ProxyWalletClient | null = null;
  private safeClient: SafeWalletClient | null = null;

  constructor(walletType: WalletType = 'proxy') {
    this.walletType = walletType;
  }

  /**
   * Initialize wallet based on type
   */
  async initialize(): Promise<void> {
    try {
      if (this.walletType === 'proxy') {
        await this.initializeProxyWallet();
      } else {
        await this.initializeSafeWallet();
      }

      logger.info(`✅ Unified Polymarket wallet initialized (${this.walletType})`);
    } catch (error) {
      logger.error('❌ Failed to initialize wallet:', error);
      throw error;
    }
  }

  /**
   * Initialize Proxy wallet (email-based)
   */
  private async initializeProxyWallet(): Promise<void> {
    const email = CONFIG.POLYMARKET_EMAIL;
    const privateKey = CONFIG.POLYMARKET_PROXY_PRIVATE_KEY;

    if (!email || !privateKey) {
      throw new Error('Proxy wallet credentials not configured');
    }

    this.proxyClient = new ProxyWalletClient();
    await this.proxyClient.initialize({ email, privateKey });
  }

  /**
   * Initialize Safe wallet (browser wallet)
   */
  private async initializeSafeWallet(): Promise<void> {
    const safeAddress = CONFIG.POLYMARKET_SAFE_ADDRESS;
    const ownerPrivateKey = CONFIG.POLYMARKET_SAFE_PRIVATE_KEY;

    if (!safeAddress || !ownerPrivateKey) {
      throw new Error('Safe wallet credentials not configured');
    }

    this.safeClient = new SafeWalletClient();
    await this.safeClient.initialize({ safeAddress, ownerPrivateKey });
  }

  /**
   * Switch wallet type
   */
  async switchWalletType(newType: WalletType): Promise<void> {
    logger.info(`🔄 Switching wallet type from ${this.walletType} to ${newType}`);

    this.walletType = newType;

    // Re-initialize with new type
    await this.initialize();
  }

  /**
   * Get wallet balance
   */
  async getBalance(): Promise<{ usdc: number; matic: number }> {
    const client = this.getActiveClient();
    return await client.getBalance();
  }

  /**
   * Place a bet
   */
  async placeBet(params: BetParams): Promise<{ success: boolean; orderId?: string; txHash?: string }> {
    const client = this.getActiveClient();

    logger.info(`📊 Placing bet using ${this.walletType} wallet`);

    return await client.placeBet(params);
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: string): Promise<{ success: boolean; txHash?: string }> {
    const client = this.getActiveClient();

    logger.info(`🚫 Canceling order using ${this.walletType} wallet`);

    return await client.cancelOrder(orderId);
  }

  /**
   * Get open positions
   */
  async getPositions(): Promise<any[]> {
    const client = this.getActiveClient();
    return await client.getPositions();
  }

  /**
   * Get open orders
   */
  async getOpenOrders(): Promise<any[]> {
    const client = this.getActiveClient();
    return await client.getOpenOrders();
  }

  /**
   * Get wallet info
   */
  getInfo(): {
    walletType: WalletType;
    isInitialized: boolean;
    details: any;
  } {
    const client = this.getActiveClient();

    return {
      walletType: this.walletType,
      isInitialized: client.isInitialized(),
      details: client.getInfo(),
    };
  }

  /**
   * Get current wallet type
   */
  getWalletType(): WalletType {
    return this.walletType;
  }

  /**
   * Check if wallet is initialized
   */
  isInitialized(): boolean {
    try {
      const client = this.getActiveClient();
      return client.isInitialized();
    } catch {
      return false;
    }
  }

  /**
   * Get active client based on wallet type
   */
  private getActiveClient(): ProxyWalletClient | SafeWalletClient {
    if (this.walletType === 'proxy') {
      if (!this.proxyClient) {
        throw new Error('Proxy wallet not initialized');
      }
      return this.proxyClient;
    } else {
      if (!this.safeClient) {
        throw new Error('Safe wallet not initialized');
      }
      return this.safeClient;
    }
  }

  /**
   * Get recommended wallet type based on use case
   */
  static getRecommendedWalletType(useCase: 'simple' | 'advanced' | 'security'): WalletType {
    switch (useCase) {
      case 'simple':
        return 'proxy'; // Email-based, easier onboarding
      case 'advanced':
        return 'safe'; // Browser wallet, more control
      case 'security':
        return 'safe'; // Gnosis Safe, battle-tested security
      default:
        return 'proxy';
    }
  }

  /**
   * Compare wallet types
   */
  static compareWalletTypes(): {
    proxy: { pros: string[]; cons: string[] };
    safe: { pros: string[]; cons: string[] };
  } {
    return {
      proxy: {
        pros: [
          'Simple email-based setup',
          'No browser wallet required',
          'Easy onboarding for new users',
          'Mobile-friendly',
        ],
        cons: [
          'Less control over private keys',
          'Depends on Polymarket infrastructure',
          'Single point of failure (email account)',
        ],
      },
      safe: {
        pros: [
          'Full control with browser wallet',
          'Battle-tested Gnosis Safe security',
          'Compatible with hardware wallets',
          'Self-custody',
        ],
        cons: [
          'Requires browser wallet (MetaMask, etc.)',
          'More complex setup',
          'Higher gas costs for transactions',
        ],
      },
    };
  }
}

// Singleton instance
let walletInstance: UnifiedPolymarketWallet | null = null;

/**
 * Get or create wallet instance
 */
export function getPolymarketWallet(walletType?: WalletType): UnifiedPolymarketWallet {
  if (!walletInstance) {
    walletInstance = new UnifiedPolymarketWallet(walletType);
  }
  return walletInstance;
}

/**
 * Reset wallet instance (for testing)
 */
export function resetPolymarketWallet(): void {
  walletInstance = null;
}

export default UnifiedPolymarketWallet;
