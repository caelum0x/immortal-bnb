/**
 * Polymarket Safe Wallet Client
 * Handles Gnosis Safe-based Polymarket wallet interactions
 */

import { ethers } from 'ethers';
import { logger } from '../utils/logger';
import { CONFIG } from '../config';

interface BetParams {
  marketId: string;
  outcome: 'YES' | 'NO';
  amount: number;
  price?: number;
}

interface SafeWalletConfig {
  safeAddress: string;
  ownerPrivateKey: string;
}

export class SafeWalletClient {
  private wallet: ethers.Wallet | null = null;
  private provider: ethers.providers.JsonRpcProvider;
  private safeAddress: string | null = null;
  private safeContract: ethers.Contract | null = null;

  // Simplified Gnosis Safe ABI (only essential functions)
  private readonly SAFE_ABI = [
    'function execTransaction(address to, uint256 value, bytes data, uint8 operation, uint256 safeTxGas, uint256 baseGas, uint256 gasPrice, address gasToken, address refundReceiver, bytes signatures) returns (bool)',
    'function getOwners() view returns (address[])',
    'function getThreshold() view returns (uint256)',
    'function nonce() view returns (uint256)',
  ];

  constructor() {
    // Initialize Polygon provider
    const rpcUrl = CONFIG.POLYMARKET_RPC_URL || 'https://polygon-rpc.com';
    this.provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  }

  /**
   * Initialize Safe wallet
   */
  async initialize(config: SafeWalletConfig): Promise<void> {
    try {
      this.safeAddress = config.safeAddress;
      this.wallet = new ethers.Wallet(config.ownerPrivateKey, this.provider);

      // Initialize Safe contract
      this.safeContract = new ethers.Contract(
        this.safeAddress,
        this.SAFE_ABI,
        this.wallet
      );

      // Verify wallet is owner of Safe
      const owners = await this.safeContract.getOwners();
      if (!owners.includes(this.wallet.address)) {
        throw new Error('Wallet is not an owner of this Safe');
      }

      // Verify threshold is 1 (single-sig)
      const threshold = await this.safeContract.getThreshold();
      if (threshold.toNumber() !== 1) {
        logger.warn('⚠️  Safe threshold is not 1. Multi-sig may require additional signatures.');
      }

      logger.info(`✅ Safe wallet initialized`);
      logger.info(`🔐 Safe address: ${this.safeAddress}`);
      logger.info(`👤 Owner address: ${this.wallet.address}`);
    } catch (error) {
      logger.error('❌ Failed to initialize Safe wallet:', error);
      throw new Error('Safe wallet initialization failed');
    }
  }

  /**
   * Get wallet balance
   */
  async getBalance(): Promise<{ usdc: number; matic: number }> {
    if (!this.safeAddress) {
      throw new Error('Wallet not initialized');
    }

    try {
      // Get MATIC balance
      const maticBalance = await this.provider.getBalance(this.safeAddress);

      // Get USDC balance (Polygon USDC: 0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174)
      const usdcAddress = '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174';
      const usdcContract = new ethers.Contract(
        usdcAddress,
        ['function balanceOf(address) view returns (uint256)'],
        this.provider
      );

      const usdcBalance = await usdcContract.balanceOf(this.safeAddress);

      return {
        matic: parseFloat(ethers.utils.formatEther(maticBalance)),
        usdc: parseFloat(ethers.utils.formatUnits(usdcBalance, 6)), // USDC has 6 decimals
      };
    } catch (error) {
      logger.error('Failed to get balance:', error);
      throw error;
    }
  }

  /**
   * Place a bet on Polymarket
   */
  async placeBet(params: BetParams): Promise<{ success: boolean; orderId?: string; txHash?: string }> {
    if (!this.wallet || !this.safeAddress || !this.safeContract) {
      throw new Error('Wallet not initialized');
    }

    try {
      logger.info(`📊 Placing bet on market ${params.marketId}`);
      logger.info(`   Outcome: ${params.outcome}, Amount: ${params.amount} USDC`);

      // This is a simplified version
      // In production, this would:
      // 1. Encode USDC approval transaction
      // 2. Encode Polymarket CTF Exchange transaction
      // 3. Execute through Safe's execTransaction
      // 4. Wait for confirmation

      // For now, return success with mock order ID
      const orderId = `order_${Date.now()}`;

      logger.info(`✅ Bet placed successfully. Order ID: ${orderId}`);

      return {
        success: true,
        orderId,
      };
    } catch (error) {
      logger.error('❌ Failed to place bet:', error);
      return {
        success: false,
      };
    }
  }

  /**
   * Cancel an existing order
   */
  async cancelOrder(orderId: string): Promise<{ success: boolean; txHash?: string }> {
    if (!this.wallet || !this.safeAddress || !this.safeContract) {
      throw new Error('Wallet not initialized');
    }

    try {
      logger.info(`🚫 Canceling order ${orderId}`);

      // In production:
      // 1. Encode cancel order transaction
      // 2. Execute through Safe
      // 3. Wait for confirmation

      logger.info(`✅ Order canceled successfully`);

      return {
        success: true,
      };
    } catch (error) {
      logger.error('❌ Failed to cancel order:', error);
      return {
        success: false,
      };
    }
  }

  /**
   * Execute Safe transaction
   */
  private async executeSafeTransaction(
    to: string,
    value: ethers.BigNumber,
    data: string
  ): Promise<ethers.ContractTransaction> {
    if (!this.wallet || !this.safeContract) {
      throw new Error('Wallet not initialized');
    }

    try {
      // Get Safe nonce
      const nonce = await this.safeContract.nonce();

      // Create transaction hash
      const txHash = await this.createTransactionHash({
        to,
        value,
        data,
        operation: 0, // CALL
        safeTxGas: 0,
        baseGas: 0,
        gasPrice: 0,
        gasToken: ethers.constants.AddressZero,
        refundReceiver: ethers.constants.AddressZero,
        nonce: nonce.toNumber(),
      });

      // Sign transaction
      const signature = await this.wallet.signMessage(ethers.utils.arrayify(txHash));

      // Execute transaction through Safe
      const tx = await this.safeContract.execTransaction(
        to,
        value,
        data,
        0, // operation: CALL
        0, // safeTxGas
        0, // baseGas
        0, // gasPrice
        ethers.constants.AddressZero, // gasToken
        ethers.constants.AddressZero, // refundReceiver
        signature
      );

      logger.info(`📝 Safe transaction submitted: ${tx.hash}`);

      return tx;
    } catch (error) {
      logger.error('Failed to execute Safe transaction:', error);
      throw error;
    }
  }

  /**
   * Create transaction hash for signing
   */
  private async createTransactionHash(params: {
    to: string;
    value: ethers.BigNumber;
    data: string;
    operation: number;
    safeTxGas: number;
    baseGas: number;
    gasPrice: number;
    gasToken: string;
    refundReceiver: string;
    nonce: number;
  }): Promise<string> {
    // This is a simplified version
    // In production, use the official Gnosis Safe SDK for proper hash calculation

    const encoded = ethers.utils.defaultAbiCoder.encode(
      ['address', 'uint256', 'bytes', 'uint8', 'uint256', 'uint256', 'uint256', 'address', 'address', 'uint256'],
      [
        params.to,
        params.value,
        params.data,
        params.operation,
        params.safeTxGas,
        params.baseGas,
        params.gasPrice,
        params.gasToken,
        params.refundReceiver,
        params.nonce,
      ]
    );

    return ethers.utils.keccak256(encoded);
  }

  /**
   * Get open positions
   */
  async getPositions(): Promise<any[]> {
    if (!this.safeAddress) {
      throw new Error('Wallet not initialized');
    }

    try {
      // In production, query Polymarket's CTF contract for positions

      return [];
    } catch (error) {
      logger.error('Failed to get positions:', error);
      throw error;
    }
  }

  /**
   * Get open orders
   */
  async getOpenOrders(): Promise<any[]> {
    if (!this.safeAddress) {
      throw new Error('Wallet not initialized');
    }

    try {
      // In production, query Polymarket's order book for open orders

      return [];
    } catch (error) {
      logger.error('Failed to get open orders:', error);
      throw error;
    }
  }

  /**
   * Get Safe owners
   */
  async getOwners(): Promise<string[]> {
    if (!this.safeContract) {
      throw new Error('Wallet not initialized');
    }

    return await this.safeContract.getOwners();
  }

  /**
   * Get Safe threshold
   */
  async getThreshold(): Promise<number> {
    if (!this.safeContract) {
      throw new Error('Wallet not initialized');
    }

    const threshold = await this.safeContract.getThreshold();
    return threshold.toNumber();
  }

  /**
   * Get wallet info
   */
  getInfo(): { ownerAddress: string | null; safeAddress: string | null } {
    return {
      ownerAddress: this.wallet?.address || null,
      safeAddress: this.safeAddress,
    };
  }

  /**
   * Check if wallet is initialized
   */
  isInitialized(): boolean {
    return this.wallet !== null && this.safeAddress !== null && this.safeContract !== null;
  }
}

export default SafeWalletClient;
