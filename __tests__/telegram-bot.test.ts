/**
 * Telegram Bot Tests
 * Tests for Telegram notification system
 */

import { TelegramBotManager } from '../src/alerts/telegramBot';

describe('Telegram Bot Manager', () => {
  let telegramBot: TelegramBotManager;

  beforeAll(() => {
    telegramBot = new TelegramBotManager();
  });

  describe('Initialization', () => {
    it('should initialize without throwing', () => {
      expect(() => telegramBot.initialize()).not.toThrow();
    });

    it('should return stats after initialization', () => {
      const stats = telegramBot.getStats();

      expect(stats).toHaveProperty('isRunning');
      expect(stats).toHaveProperty('subscribers');
      expect(stats).toHaveProperty('totalAlerts');
      expect(stats).toHaveProperty('alertStats');
    });
  });

  describe('Chat Management', () => {
    const testChatId = '123456789';

    it('should subscribe a chat ID', () => {
      telegramBot.subscribeChatId(testChatId);
      const chats = telegramBot.getSubscribedChats();

      expect(chats).toContain(testChatId);
    });

    it('should unsubscribe a chat ID', () => {
      telegramBot.subscribeChatId(testChatId);
      telegramBot.unsubscribeChatId(testChatId);
      const chats = telegramBot.getSubscribedChats();

      expect(chats).not.toContain(testChatId);
    });

    it('should return list of subscribed chats', () => {
      telegramBot.subscribeChatId('111');
      telegramBot.subscribeChatId('222');

      const chats = telegramBot.getSubscribedChats();

      expect(Array.isArray(chats)).toBe(true);
      expect(chats.length).toBeGreaterThan(0);
    });
  });

  describe('Alert Sending', () => {
    it('should send trade alert without throwing', async () => {
      await expect(
        telegramBot.sendTradeAlert('BUY', 'BTC', 0.1, 50000, true)
      ).resolves.not.toThrow();
    });

    it('should send position update without throwing', async () => {
      const position = {
        tokenSymbol: 'ETH',
        tokenAddress: '0x...',
        entryPrice: 3000,
        currentPrice: 3100,
        amountBNB: 1.5,
        pnl: 0.05,
        pnlPercent: 3.33,
      };

      await expect(telegramBot.sendPositionUpdate(position)).resolves.not.toThrow();
    });

    it('should send market alert without throwing', async () => {
      const alert = {
        type: 'price_spike' as const,
        token: 'BNB',
        details: 'Price increased by 10% in the last hour',
        severity: 'medium' as const,
      };

      await expect(telegramBot.sendMarketAlert(alert)).resolves.not.toThrow();
    });

    it('should send Polymarket alert without throwing', async () => {
      const analysis = {
        marketQuestion: 'Will Bitcoin reach $100k?',
        predictedOutcome: 'Yes',
        recommendation: 'BUY',
        confidence: 0.75,
        reasoning: 'Strong bullish indicators in the market',
      };

      await expect(telegramBot.sendPolymarketAlert(analysis)).resolves.not.toThrow();
    });

    it('should send risk warning without throwing', async () => {
      const warning = {
        level: 'high' as const,
        title: 'High Volatility Detected',
        description: 'Market showing extreme volatility',
        action: 'Consider reducing position sizes',
      };

      await expect(telegramBot.sendRiskWarning(warning)).resolves.not.toThrow();
    });

    it('should send daily summary without throwing', async () => {
      const summary = {
        totalTrades: 10,
        successfulTrades: 8,
        totalPnL: 0.5,
        winRate: 80,
        bestTrade: '+0.15 BNB on ETH',
        worstTrade: '-0.05 BNB on DOGE',
      };

      await expect(telegramBot.sendDailySummary(summary)).resolves.not.toThrow();
    });
  });

  describe('Statistics', () => {
    it('should track alert statistics', () => {
      const initialStats = telegramBot.getStats();
      const initialCount = initialStats.totalAlerts;

      // Send some alerts
      telegramBot.sendAlert('Test alert', 'info');

      const updatedStats = telegramBot.getStats();

      expect(updatedStats.totalAlerts).toBeGreaterThanOrEqual(initialCount);
    });
  });
});
