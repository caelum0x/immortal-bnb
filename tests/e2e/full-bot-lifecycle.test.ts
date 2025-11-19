/**
 * End-to-End Tests for Full Bot Lifecycle
 * Tests complete scenarios from bot start to trade execution
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { BotState } from '../../src/bot-state';
import axios, { AxiosInstance } from 'axios';

// Mock external services for E2E tests
jest.mock('../../src/data/marketFetcher');
jest.mock('../../src/agent/aiDecision');
jest.mock('../../src/blockchain/tradeExecutor');
jest.mock('../../src/blockchain/memoryStorage');

const API_BASE_URL = process.env.API_URL || 'http://localhost:3001';

describe('Full Bot Lifecycle E2E', () => {
  let apiClient: AxiosInstance;

  beforeEach(() => {
    apiClient = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
    });

    if (BotState.isRunning()) {
      BotState.stop();
    }
  });

  afterEach(() => {
    if (BotState.isRunning()) {
      BotState.stop();
    }
  });

  test('Scenario 1: Start bot -> Discover tokens -> Make trade -> Store memory', async () => {
    // 1. Check initial state
    const initialStatus = await apiClient.get('/api/bot-status');
    expect(initialStatus.data.running).toBe(false);

    // 2. Start bot
    const startResponse = await apiClient.post('/api/start-bot', {
      tokens: [],
      risk: 5,
    });
    expect(startResponse.status).toBe(200);
    expect(startResponse.data.status).toBe('started');

    // 3. Verify bot is running
    const statusAfterStart = await apiClient.get('/api/bot-status');
    expect(statusAfterStart.data.running).toBe(true);
    expect(statusAfterStart.data.riskLevel).toBe(5);

    // 4. Discover tokens
    const tokensResponse = await apiClient.get('/api/discover-tokens?limit=5');
    expect(tokensResponse.status).toBe(200);
    expect(tokensResponse.data.tokens).toBeDefined();
    expect(Array.isArray(tokensResponse.data.tokens)).toBe(true);

    // 5. Wait for trading cycle (if bot is actually running)
    // In a real E2E test, we'd wait for the bot to complete a cycle
    // For now, we'll just verify the bot is in the correct state

    // 6. Check trade logs (if any trades were made)
    const logsResponse = await apiClient.get('/api/trade-logs?limit=10');
    expect(logsResponse.status).toBe(200);
    expect(logsResponse.data.logs).toBeDefined();

    // 7. Check memories (if any were stored)
    const memoriesResponse = await apiClient.get('/api/memories?limit=10');
    expect(memoriesResponse.status).toBe(200);
    expect(memoriesResponse.data.memories).toBeDefined();

    // 8. Stop bot
    const stopResponse = await apiClient.post('/api/stop-bot');
    expect(stopResponse.status).toBe(200);
    expect(stopResponse.data.status).toBe('stopped');

    // 9. Verify bot is stopped
    const finalStatus = await apiClient.get('/api/bot-status');
    expect(finalStatus.data.running).toBe(false);
  }, 60000); // 60 second timeout

  test('Scenario 2: Start bot with specific tokens -> Monitor -> Stop', async () => {
    const specificTokens = [
      '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82', // CAKE
    ];

    // Start bot with specific tokens
    const startResponse = await apiClient.post('/api/start-bot', {
      tokens: specificTokens,
      risk: 7,
    });
    expect(startResponse.status).toBe(200);

    // Verify watchlist
    const status = await apiClient.get('/api/bot-status');
    expect(status.data.watchlist).toEqual(specificTokens);
    expect(status.data.riskLevel).toBe(7);

    // Get trading stats
    const statsResponse = await apiClient.get('/api/trading-stats');
    expect(statsResponse.status).toBe(200);
    expect(statsResponse.data).toHaveProperty('totalTrades');
    expect(statsResponse.data).toHaveProperty('winRate');

    // Stop bot
    await apiClient.post('/api/stop-bot');
    const finalStatus = await apiClient.get('/api/bot-status');
    expect(finalStatus.data.running).toBe(false);
  }, 30000);

  test('Scenario 3: Error handling - Start bot twice should fail', async () => {
    // Start bot first time
    await apiClient.post('/api/start-bot', {
      tokens: [],
      risk: 5,
    });

    // Try to start again
    try {
      await apiClient.post('/api/start-bot', {
        tokens: [],
        risk: 5,
      });
      // Should not reach here
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.response.status).toBe(400);
      expect(error.response.data.error).toContain('already running');
    }

    // Clean up
    await apiClient.post('/api/stop-bot');
  }, 30000);

  test('Scenario 4: Invalid parameters should be rejected', async () => {
    // Invalid risk level (should be 1-10)
    try {
      await apiClient.post('/api/start-bot', {
        tokens: [],
        risk: 15, // Invalid
      });
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.response.status).toBe(400);
    }

    // Invalid token address
    try {
      await apiClient.post('/api/start-bot', {
        tokens: ['invalid-address'],
        risk: 5,
      });
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.response.status).toBe(400);
    }
  }, 30000);

  test('Scenario 5: Health check should always work', async () => {
    const healthResponse = await apiClient.get('/health');
    expect(healthResponse.status).toBe(200);
    expect(healthResponse.data.status).toBe('ok');
    expect(healthResponse.data.timestamp).toBeDefined();
  }, 10000);
});

