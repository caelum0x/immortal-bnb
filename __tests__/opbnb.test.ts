/**
 * opBNB Tests
 * Tests for opBNB L2 integration
 */

import { OpBNBManager, OPBNB_CONFIG } from '../src/config/opbnb';
import { ethers } from 'ethers';

describe('opBNB Manager', () => {
  let opbnb: OpBNBManager;

  beforeAll(() => {
    opbnb = new OpBNBManager('testnet');
  });

  describe('Configuration', () => {
    it('should have mainnet configuration', () => {
      expect(OPBNB_CONFIG.mainnet).toBeDefined();
      expect(OPBNB_CONFIG.mainnet).toHaveProperty('chainId');
      expect(OPBNB_CONFIG.mainnet).toHaveProperty('rpcUrls');
      expect(OPBNB_CONFIG.mainnet).toHaveProperty('blockExplorerUrls');
      expect(OPBNB_CONFIG.mainnet.chainId).toBe(204);
    });

    it('should have testnet configuration', () => {
      expect(OPBNB_CONFIG.testnet).toBeDefined();
      expect(OPBNB_CONFIG.testnet).toHaveProperty('chainId');
      expect(OPBNB_CONFIG.testnet.chainId).toBe(5611);
    });

    it('should have correct network optimizations', () => {
      const config = OPBNB_CONFIG.mainnet;

      expect(config.maxGasLimit).toBe(100000000); // 100M gas
      expect(config.avgBlockTime).toBe(1); // 1 second
      expect(parseFloat(config.avgGasPrice)).toBeLessThan(1); // Very low gas
    });

    it('should have bridge contract addresses', () => {
      const config = OPBNB_CONFIG.mainnet;

      expect(config).toHaveProperty('l1Bridge');
      expect(config).toHaveProperty('l2Bridge');
      expect(config.l1Bridge).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(config.l2Bridge).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });
  });

  describe('Initialization', () => {
    it('should initialize successfully', async () => {
      await expect(opbnb.initialize()).resolves.not.toThrow();
    }, 30000);

    it('should be ready after initialization', async () => {
      await opbnb.initialize();
      expect(opbnb.isReady()).toBe(true);
    }, 30000);

    it('should have provider after initialization', async () => {
      await opbnb.initialize();
      const provider = opbnb.getProvider();

      expect(provider).not.toBeNull();
      expect(provider).toBeInstanceOf(ethers.JsonRpcProvider);
    }, 30000);
  });

  describe('Gas Settings', () => {
    beforeAll(async () => {
      await opbnb.initialize();
    }, 30000);

    it('should get optimal gas settings', async () => {
      const gasSettings = await opbnb.getOptimalGasSettings();

      expect(gasSettings).toHaveProperty('maxFeePerGas');
      expect(gasSettings).toHaveProperty('maxPriorityFeePerGas');
      expect(gasSettings).toHaveProperty('gasLimit');
      expect(gasSettings.maxFeePerGas).toBeGreaterThan(0n);
      expect(gasSettings.gasLimit).toBeGreaterThan(0n);
    });

    it('should have very low gas prices', async () => {
      const gasSettings = await opbnb.getOptimalGasSettings();
      const maxFeeGwei = Number(gasSettings.maxFeePerGas) / 1e9;

      // opBNB has extremely low gas prices (< 0.01 Gwei)
      expect(maxFeeGwei).toBeLessThan(0.1);
    });
  });

  describe('Network Info', () => {
    it('should return network parameters', () => {
      const params = opbnb.getNetworkParams();

      expect(params).toHaveProperty('chainId');
      expect(params).toHaveProperty('chainName');
      expect(params).toHaveProperty('nativeCurrency');
      expect(params).toHaveProperty('rpcUrls');
      expect(params).toHaveProperty('blockExplorerUrls');
      expect(Array.isArray(params.rpcUrls)).toBe(true);
    });

    it('should return network config', () => {
      const config = opbnb.getNetworkConfig();

      expect(config).toHaveProperty('chainId');
      expect(config).toHaveProperty('name');
      expect(config).toHaveProperty('avgBlockTime');
      expect(config.avgBlockTime).toBe(1); // 1 second blocks
    });
  });

  describe('Transaction Management', () => {
    beforeAll(async () => {
      // Initialize with a test private key
      const testKey = '0x' + '1'.repeat(64);
      await opbnb.initialize(testKey);
    }, 30000);

    it('should have wallet after initialization with private key', () => {
      const wallet = opbnb.getWallet();
      expect(wallet).not.toBeNull();
    });

    it('should prepare optimized transaction', async () => {
      const gasSettings = await opbnb.getOptimalGasSettings();

      const tx = {
        to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        value: ethers.parseEther('0.01'),
        ...gasSettings,
      };

      expect(tx).toHaveProperty('to');
      expect(tx).toHaveProperty('value');
      expect(tx).toHaveProperty('maxFeePerGas');
      expect(tx).toHaveProperty('gasLimit');
    });
  });

  describe('Balance Queries', () => {
    beforeAll(async () => {
      await opbnb.initialize();
    }, 30000);

    it('should get balance for an address', async () => {
      const balance = await opbnb.getBalance('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');

      expect(typeof balance).toBe('string');
      expect(parseFloat(balance)).toBeGreaterThanOrEqual(0);
    }, 15000);
  });

  describe('Bridge Operations', () => {
    beforeAll(async () => {
      const testKey = '0x' + '1'.repeat(64);
      await opbnb.initialize(testKey);
    }, 30000);

    it('should initiate bridge to opBNB', async () => {
      const txHash = await opbnb.bridgeToOpBNB('0.1', 'BNB');

      expect(typeof txHash).toBe('string');
      expect(txHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
    });

    it('should initiate bridge from opBNB', async () => {
      const txHash = await opbnb.bridgeFromOpBNB('0.1', 'BNB');

      expect(typeof txHash).toBe('string');
      expect(txHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
    });
  });

  describe('Performance Optimization', () => {
    beforeAll(async () => {
      await opbnb.initialize();
    }, 30000);

    it('should support 1-second block time', () => {
      const config = opbnb.getNetworkConfig();
      expect(config.avgBlockTime).toBe(1);
    });

    it('should support high gas limit', () => {
      const config = opbnb.getNetworkConfig();
      expect(config.maxGasLimit).toBe(100000000); // 100M gas per block
    });

    it('should have minimal transaction fees', async () => {
      const gasSettings = await opbnb.getOptimalGasSettings();
      const estimatedFee =
        (gasSettings.maxFeePerGas * gasSettings.gasLimit) / BigInt(1e18);

      // Estimate should be less than 0.001 BNB
      expect(Number(estimatedFee)).toBeLessThan(0.001);
    });
  });
});
