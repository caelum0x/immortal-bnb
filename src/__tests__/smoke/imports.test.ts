/**
 * Smoke Test: Import Validation
 * Ensures all modules can be imported without errors
 */

import { describe, test, expect } from 'bun:test';

describe('Module Import Smoke Tests', () => {
  test('should import validation middleware', async () => {
    const validation = await import('../../middleware/validation');

    expect(validation.validateStartBot).toBeDefined();
    expect(validation.validateTradeLogsQuery).toBeDefined();
    expect(validation.validateMemoriesQuery).toBeDefined();
    expect(validation.validateDiscoverTokensQuery).toBeDefined();
    expect(validation.handleValidationErrors).toBeDefined();
    expect(validation.sanitizeRequest).toBeDefined();
  });

  test('should import rate limiting middleware', async () => {
    const rateLimiting = await import('../../middleware/rateLimiting');

    expect(rateLimiting.apiLimiter).toBeDefined();
    expect(rateLimiting.botControlLimiter).toBeDefined();
    expect(rateLimiting.readLimiter).toBeDefined();
    expect(rateLimiting.healthCheckLimiter).toBeDefined();
    expect(rateLimiting.strictLimiter).toBeDefined();
    expect(rateLimiting.createCustomLimiter).toBeDefined();
  });

  test('should import auth middleware', async () => {
    const auth = await import('../../middleware/auth');

    expect(auth.generateApiKey).toBeDefined();
    expect(auth.getApiKey).toBeDefined();
    expect(auth.requireApiKey).toBeDefined();
    expect(auth.optionalApiKey).toBeDefined();
    expect(auth.restrictToIPs).toBeDefined();
    expect(auth.combineAuth).toBeDefined();
  });

  test('should import API server', async () => {
    const apiServer = await import('../../api-server');

    expect(apiServer.app).toBeDefined();
    expect(apiServer.startAPIServer).toBeDefined();
  });

  test('should import BotState', async () => {
    const { BotState } = await import('../../bot-state');

    expect(BotState).toBeDefined();
    expect(BotState.start).toBeDefined();
    expect(BotState.stop).toBeDefined();
    expect(BotState.isRunning).toBeDefined();
    expect(BotState.getStatus).toBeDefined();
    expect(BotState.getStats).toBeDefined();
  });

  test('should import config', async () => {
    const { CONFIG } = await import('../../config');

    expect(CONFIG).toBeDefined();
    expect(CONFIG.NETWORK).toBeDefined();
    expect(CONFIG.BNB_RPC).toBeDefined();
  });
});
