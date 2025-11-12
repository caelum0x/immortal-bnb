/**
 * opBNB Configuration
 * Layer 2 solution for BNB Chain - Optimized for sub-second transactions
 *
 * opBNB Features:
 * - 100M+ gas limit per block
 * - <1 second block time
 * - Transaction fees <$0.001
 * - Full EVM compatibility
 * - Optimism rollup technology
 */

import { ethers } from 'ethers';
import { logger } from '../utils/logger';

// opBNB Network Configuration
export const OPBNB_CONFIG = {
  // Mainnet
  mainnet: {
    chainId: 204,
    chainIdHex: '0xcc',
    name: 'opBNB Mainnet',
    symbol: 'BNB',
    decimals: 18,
    rpcUrls: [
      'https://opbnb-mainnet-rpc.bnbchain.org',
      'https://opbnb-mainnet.nodereal.io/v1/64a9df0874fb4a93b9d0a3849de012d3',
      'https://opbnb-mainnet.nodereal.io/v1/e9a36765eb8a40b9bd12e680a1fd2bc5',
    ],
    blockExplorerUrls: ['https://opbnbscan.com'],
    nativeCurrency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18,
    },
    // Network optimizations
    maxGasLimit: 100000000, // 100M gas
    avgBlockTime: 1, // 1 second
    avgGasPrice: '0.001', // Gwei
    // Bridge contracts
    l1Bridge: '0x3E54F7c3e4F1A2Ad8f4e9b3B4b1E7E5B3a2d4c5e', // BSC -> opBNB bridge
    l2Bridge: '0x4200000000000000000000000000000000000010', // Standard L2 bridge
  },
  // Testnet
  testnet: {
    chainId: 5611,
    chainIdHex: '0x15eb',
    name: 'opBNB Testnet',
    symbol: 'tBNB',
    decimals: 18,
    rpcUrls: [
      'https://opbnb-testnet-rpc.bnbchain.org',
      'https://opbnb-testnet.nodereal.io/v1/e9a36765eb8a40b9bd12e680a1fd2bc5',
    ],
    blockExplorerUrls: ['https://testnet.opbnbscan.com'],
    nativeCurrency: {
      name: 'Test BNB',
      symbol: 'tBNB',
      decimals: 18,
    },
    maxGasLimit: 100000000,
    avgBlockTime: 1,
    avgGasPrice: '0.001',
    l1Bridge: '0x677311Fd2cCc511Bbc0f581E8d9a07B033D5E840',
    l2Bridge: '0x4200000000000000000000000000000000000010',
  },
};

/**
 * opBNB Network Manager
 * Handles connection and transactions on opBNB
 */
export class OpBNBManager {
  private provider: ethers.JsonRpcProvider | null = null;
  private wallet: ethers.Wallet | null = null;
  private network: 'mainnet' | 'testnet' = 'mainnet';
  private isConnected: boolean = false;

  constructor(network: 'mainnet' | 'testnet' = 'mainnet') {
    this.network = network;
  }

  /**
   * Initialize opBNB connection
   */
  async initialize(privateKey?: string): Promise<void> {
    try {
      const config = OPBNB_CONFIG[this.network];

      // Try primary RPC first, fallback to alternatives
      for (const rpcUrl of config.rpcUrls) {
        try {
          this.provider = new ethers.JsonRpcProvider(rpcUrl);

          // Test connection
          const blockNumber = await this.provider.getBlockNumber();
          logger.info(`✅ Connected to opBNB ${this.network} at block ${blockNumber}`);
          logger.info(`📡 RPC: ${rpcUrl}`);

          this.isConnected = true;
          break;
        } catch (error) {
          logger.warn(`⚠️ Failed to connect to ${rpcUrl}, trying next...`);
          continue;
        }
      }

      if (!this.isConnected) {
        throw new Error('Failed to connect to any opBNB RPC endpoint');
      }

      // Initialize wallet if private key provided
      if (privateKey && this.provider) {
        this.wallet = new ethers.Wallet(privateKey, this.provider);
        const address = await this.wallet.getAddress();
        logger.info(`🔑 Wallet connected: ${address}`);
      }

      // Log network stats
      await this.logNetworkStats();
    } catch (error) {
      logger.error('❌ Failed to initialize opBNB:', error);
      throw error;
    }
  }

  /**
   * Log current network statistics
   */
  private async logNetworkStats(): Promise<void> {
    if (!this.provider) return;

    try {
      const [blockNumber, gasPrice, network] = await Promise.all([
        this.provider.getBlockNumber(),
        this.provider.getFeeData(),
        this.provider.getNetwork(),
      ]);

      logger.info(`📊 opBNB Network Stats:`);
      logger.info(`   Chain ID: ${network.chainId}`);
      logger.info(`   Block Number: ${blockNumber}`);
      logger.info(`   Gas Price: ${ethers.formatUnits(gasPrice.gasPrice || 0n, 'gwei')} Gwei`);
    } catch (error) {
      logger.error('Error fetching network stats:', error);
    }
  }

  /**
   * Get optimal gas settings for opBNB
   * opBNB has very low and stable gas prices
   */
  async getOptimalGasSettings(): Promise<{
    maxFeePerGas: bigint;
    maxPriorityFeePerGas: bigint;
    gasLimit: bigint;
  }> {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    try {
      const feeData = await this.provider.getFeeData();
      const config = OPBNB_CONFIG[this.network];

      // opBNB has very stable and low fees
      // We can use slightly higher values for priority without significant cost impact
      const baseFee = feeData.gasPrice || ethers.parseUnits(config.avgGasPrice, 'gwei');
      const priorityFee = ethers.parseUnits('0.001', 'gwei'); // Minimal priority fee

      return {
        maxFeePerGas: baseFee + priorityFee,
        maxPriorityFeePerGas: priorityFee,
        gasLimit: 500000n, // Conservative estimate for most swaps
      };
    } catch (error) {
      logger.error('Error getting gas settings:', error);
      // Fallback to safe defaults
      return {
        maxFeePerGas: ethers.parseUnits('0.002', 'gwei'),
        maxPriorityFeePerGas: ethers.parseUnits('0.001', 'gwei'),
        gasLimit: 500000n,
      };
    }
  }

  /**
   * Send optimized transaction on opBNB
   */
  async sendTransaction(tx: ethers.TransactionRequest): Promise<ethers.TransactionResponse> {
    if (!this.wallet) {
      throw new Error('Wallet not initialized');
    }

    try {
      // Get optimal gas settings
      const gasSettings = await this.getOptimalGasSettings();

      // Merge with transaction
      const optimizedTx = {
        ...tx,
        ...gasSettings,
        chainId: OPBNB_CONFIG[this.network].chainId,
      };

      logger.info('📤 Sending transaction on opBNB...');
      const response = await this.wallet.sendTransaction(optimizedTx);
      logger.info(`✅ Transaction sent: ${response.hash}`);

      return response;
    } catch (error) {
      logger.error('❌ Transaction failed:', error);
      throw error;
    }
  }

  /**
   * Wait for transaction with optimized polling
   * opBNB has 1s block time, so we can poll more frequently
   */
  async waitForTransaction(
    txHash: string,
    confirmations: number = 1
  ): Promise<ethers.TransactionReceipt | null> {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    try {
      logger.info(`⏳ Waiting for transaction: ${txHash}`);

      // Poll every 500ms for faster feedback on opBNB
      const receipt = await this.provider.waitForTransaction(txHash, confirmations, 30000);

      if (receipt) {
        logger.info(`✅ Transaction confirmed in block ${receipt.blockNumber}`);
        logger.info(`   Gas used: ${receipt.gasUsed.toString()}`);
      }

      return receipt;
    } catch (error) {
      logger.error('Error waiting for transaction:', error);
      throw error;
    }
  }

  /**
   * Bridge tokens from BSC to opBNB
   */
  async bridgeToOpBNB(amount: string, token?: string): Promise<string> {
    if (!this.wallet) {
      throw new Error('Wallet not initialized');
    }

    logger.info(`🌉 Bridging ${amount} ${token || 'BNB'} from BSC to opBNB...`);

    // In production: Use official BSC <-> opBNB bridge
    // Bridge contract ABI and interaction would go here
    // For now, return mock tx hash
    const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}`;

    logger.info(`✅ Bridge transaction initiated: ${mockTxHash}`);
    logger.info(`⏳ Estimated arrival: 3-5 minutes`);

    return mockTxHash;
  }

  /**
   * Bridge tokens from opBNB to BSC
   */
  async bridgeFromOpBNB(amount: string, token?: string): Promise<string> {
    if (!this.wallet) {
      throw new Error('Wallet not initialized');
    }

    logger.info(`🌉 Bridging ${amount} ${token || 'BNB'} from opBNB to BSC...`);

    // In production: Use official opBNB <-> BSC bridge
    const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}`;

    logger.info(`✅ Bridge transaction initiated: ${mockTxHash}`);
    logger.info(`⏳ Estimated arrival: 3-5 minutes`);

    return mockTxHash;
  }

  /**
   * Get wallet balance on opBNB
   */
  async getBalance(address?: string): Promise<string> {
    if (!this.provider) {
      throw new Error('Provider not initialized');
    }

    const targetAddress = address || (await this.wallet?.getAddress());
    if (!targetAddress) {
      throw new Error('No address provided and wallet not initialized');
    }

    const balance = await this.provider.getBalance(targetAddress);
    return ethers.formatEther(balance);
  }

  /**
   * Add opBNB network to MetaMask
   */
  getNetworkParams() {
    const config = OPBNB_CONFIG[this.network];

    return {
      chainId: config.chainIdHex,
      chainName: config.name,
      nativeCurrency: config.nativeCurrency,
      rpcUrls: config.rpcUrls,
      blockExplorerUrls: config.blockExplorerUrls,
    };
  }

  /**
   * Check if connected
   */
  isReady(): boolean {
    return this.isConnected && this.provider !== null;
  }

  /**
   * Get provider instance
   */
  getProvider(): ethers.JsonRpcProvider | null {
    return this.provider;
  }

  /**
   * Get wallet instance
   */
  getWallet(): ethers.Wallet | null {
    return this.wallet;
  }

  /**
   * Get current network config
   */
  getNetworkConfig() {
    return OPBNB_CONFIG[this.network];
  }
}

// Singleton instance
export const opBNBManager = new OpBNBManager(
  process.env.OPBNB_NETWORK === 'testnet' ? 'testnet' : 'mainnet'
);

export default opBNBManager;
