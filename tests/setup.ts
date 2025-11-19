/**
 * Test setup file
 * Runs before all tests to configure test environment
 */

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.WALLET_PRIVATE_KEY = '0x0000000000000000000000000000000000000000000000000000000000000001';
process.env.OPENROUTER_API_KEY = 'sk-or-v1-test-key';
process.env.RPC_URL = 'https://bsc-testnet.bnbchain.org';
process.env.CHAIN_ID = '97';
process.env.NETWORK = 'testnet';
process.env.GREENFIELD_BUCKET_NAME = 'test-bucket';
process.env.GREENFIELD_RPC_URL = 'https://gnfd-testnet-fullnode-tendermint-us.bnbchain.org';

// Increase timeout for integration tests
jest.setTimeout(30000);

// Global test utilities
global.console = {
  ...console,
  // Suppress console logs during tests unless DEBUG is set
  log: process.env.DEBUG ? console.log : jest.fn(),
  debug: process.env.DEBUG ? console.debug : jest.fn(),
  info: process.env.DEBUG ? console.info : jest.fn(),
  warn: console.warn,
  error: console.error,
};

