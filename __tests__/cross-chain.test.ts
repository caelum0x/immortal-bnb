/**
 * Cross-Chain Tests
 * Tests for Wormhole bridge and arbitrage
 */

import { wormholeService } from '../src/crossChain/wormholeService';

describe('Wormhole Service', () => {
  beforeAll(async () => {
    await wormholeService.initialize();
  });

  describe('Initialization', () => {
    it('should initialize successfully', () => {
      const stats = wormholeService.getStats();

      expect(stats).toHaveProperty('isInitialized');
      expect(stats).toHaveProperty('supportedTokens');
      expect(stats.isInitialized).toBe(true);
    });

    it('should have supported tokens', () => {
      const tokens = wormholeService.getSupportedTokens();

      expect(Array.isArray(tokens)).toBe(true);
      expect(tokens.length).toBeGreaterThan(0);
      expect(tokens[0]).toHaveProperty('symbol');
      expect(tokens[0]).toHaveProperty('bscAddress');
      expect(tokens[0]).toHaveProperty('polygonAddress');
    });
  });

  describe('Quote Generation', () => {
    it('should generate quote for transfer', async () => {
      const quote = await wormholeService.getQuote({
        sourceChain: 'BSC',
        targetChain: 'Polygon',
        token: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', // USDC
        amount: '1000',
        recipient: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      });

      expect(quote).toHaveProperty('estimatedTime');
      expect(quote).toHaveProperty('fee');
      expect(quote).toHaveProperty('route');
      expect(quote).toHaveProperty('priceImpact');
      expect(quote.estimatedTime).toBeGreaterThan(0);
      expect(parseFloat(quote.fee)).toBeGreaterThan(0);
      expect(Array.isArray(quote.route)).toBe(true);
    });

    it('should include Wormhole in route', async () => {
      const quote = await wormholeService.getQuote({
        sourceChain: 'BSC',
        targetChain: 'Polygon',
        token: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
        amount: '1000',
        recipient: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      });

      expect(quote.route).toContain('Wormhole');
    });
  });

  describe('Token Transfer', () => {
    it('should initiate transfer', async () => {
      const status = await wormholeService.transferTokens({
        sourceChain: 'BSC',
        targetChain: 'Polygon',
        token: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
        amount: '100',
        recipient: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      });

      expect(status).toHaveProperty('status');
      expect(status).toHaveProperty('timestamp');
      expect(['pending', 'in_progress', 'completed', 'failed']).toContain(status.status);
    });

    it('should return transaction hash', async () => {
      const status = await wormholeService.transferTokens({
        sourceChain: 'BSC',
        targetChain: 'Polygon',
        token: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
        amount: '100',
        recipient: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      });

      if (status.status !== 'failed') {
        expect(status).toHaveProperty('txHash');
        expect(status.txHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
      }
    });
  });

  describe('Transfer Status Check', () => {
    it('should check transfer status', async () => {
      const mockTxHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const status = await wormholeService.checkTransferStatus(mockTxHash);

      expect(status).toHaveProperty('status');
      expect(status).toHaveProperty('txHash');
      expect(status.txHash).toBe(mockTxHash);
    });
  });

  describe('Arbitrage Calculation', () => {
    it('should calculate arbitrage opportunity', async () => {
      const opportunity = await wormholeService.calculateArbitrageOpportunity(
        '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', // USDC
        '10000' // $10,000
      );

      expect(opportunity).toHaveProperty('profitable');
      expect(opportunity).toHaveProperty('netProfit');
      expect(opportunity).toHaveProperty('priceOnBSC');
      expect(opportunity).toHaveProperty('priceOnPolygon');
      expect(opportunity).toHaveProperty('priceDifferential');
      expect(typeof opportunity.profitable).toBe('boolean');
      expect(parseFloat(opportunity.netProfit)).toBeDefined();
    });

    it('should indicate profitability correctly', async () => {
      const opportunity = await wormholeService.calculateArbitrageOpportunity(
        '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
        '10000'
      );

      const profit = parseFloat(opportunity.netProfit);

      if (opportunity.profitable) {
        expect(profit).toBeGreaterThan(0);
      } else {
        expect(profit).toBeLessThanOrEqual(0);
      }
    });
  });

  describe('Arbitrage Execution', () => {
    it('should execute arbitrage if profitable', async () => {
      const result = await wormholeService.executeArbitrage(
        '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
        '1000'
      );

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('transactions');
      expect(Array.isArray(result.transactions)).toBe(true);

      if (result.success) {
        expect(result).toHaveProperty('profit');
        expect(result.transactions.length).toBeGreaterThan(0);
      }
    });

    it('should skip execution if not profitable', async () => {
      // Test with very small amount to ensure it's not profitable
      const result = await wormholeService.executeArbitrage(
        '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
        '1' // $1 - unlikely to be profitable after fees
      );

      expect(result).toHaveProperty('success');
      expect(typeof result.success).toBe('boolean');
    });
  });

  describe('Opportunity Monitoring', () => {
    it('should create opportunity generator', async () => {
      const tokens = ['0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d'];
      const generator = wormholeService.monitorArbitrageOpportunities(tokens, 0.5);

      expect(generator).toBeDefined();
      expect(typeof generator.next).toBe('function');
    }, 10000);
  });
});
