/**
 * Telegram Bot API Routes
 * Manage telegram notifications and settings
 */

import express from 'express';
import { telegramBotManager } from '../alerts/telegramBot';
import { logger } from '../utils/logger';

const router = express.Router();

/**
 * GET /api/telegram/status
 * Get telegram bot status
 */
router.get('/status', (req, res) => {
  try {
    const stats = telegramBotManager.getStats();
    const subscribedChats = telegramBotManager.getSubscribedChats();

    res.json({
      success: true,
      data: {
        ...stats,
        subscribedChatIds: subscribedChats,
      },
    });
  } catch (error) {
    logger.error('Error getting telegram status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get telegram status',
    });
  }
});

/**
 * POST /api/telegram/verify-chat
 * Verify a chat ID is valid
 */
router.post('/verify-chat', async (req, res) => {
  try {
    const { chatId } = req.body;

    if (!chatId) {
      return res.status(400).json({
        success: false,
        error: 'Chat ID is required',
      });
    }

    const isValid = await telegramBotManager.verifyChatId(chatId);

    res.json({
      success: true,
      data: {
        chatId,
        isValid,
      },
    });
  } catch (error) {
    logger.error('Error verifying chat ID:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify chat ID',
    });
  }
});

/**
 * POST /api/telegram/subscribe
 * Subscribe a chat ID to receive alerts
 */
router.post('/subscribe', async (req, res) => {
  try {
    const { chatId } = req.body;

    if (!chatId) {
      return res.status(400).json({
        success: false,
        error: 'Chat ID is required',
      });
    }

    // Verify chat ID first
    const isValid = await telegramBotManager.verifyChatId(chatId);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid chat ID. Please start the bot first by sending /start',
      });
    }

    // Subscribe the chat
    telegramBotManager.subscribeChatId(chatId);

    // Send test message
    const testMessage = `✅ *Successfully Connected!*

You will now receive trading alerts from Immortal AI Bot.

🔔 *Alert Types:*
• AI trading decisions
• Trade executions
• Position updates
• Market alerts
• Daily summaries

Use /settings to customize your preferences.`;

    await telegramBotManager.sendToChat(chatId, testMessage);

    res.json({
      success: true,
      data: {
        chatId,
        subscribed: true,
      },
    });
  } catch (error) {
    logger.error('Error subscribing chat:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to subscribe chat ID',
    });
  }
});

/**
 * POST /api/telegram/unsubscribe
 * Unsubscribe a chat ID from alerts
 */
router.post('/unsubscribe', (req, res) => {
  try {
    const { chatId } = req.body;

    if (!chatId) {
      return res.status(400).json({
        success: false,
        error: 'Chat ID is required',
      });
    }

    telegramBotManager.unsubscribeChatId(chatId);

    res.json({
      success: true,
      data: {
        chatId,
        subscribed: false,
      },
    });
  } catch (error) {
    logger.error('Error unsubscribing chat:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unsubscribe chat ID',
    });
  }
});

/**
 * POST /api/telegram/test-alert
 * Send a test alert to verify configuration
 */
router.post('/test-alert', async (req, res) => {
  try {
    const { chatId } = req.body;

    if (!chatId) {
      return res.status(400).json({
        success: false,
        error: 'Chat ID is required',
      });
    }

    const testMessage = `🧪 *Test Alert*

This is a test message from Immortal AI Bot.

If you received this message, your Telegram notifications are configured correctly! 🎉

🕐 Time: ${new Date().toLocaleString()}`;

    const sent = await telegramBotManager.sendToChat(chatId, testMessage);

    res.json({
      success: sent,
      data: {
        chatId,
        sent,
      },
    });
  } catch (error) {
    logger.error('Error sending test alert:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send test alert',
    });
  }
});

/**
 * POST /api/telegram/send-position-update
 * Send a position update alert (for internal use)
 */
router.post('/send-position-update', async (req, res) => {
  try {
    const { position } = req.body;

    if (!position) {
      return res.status(400).json({
        success: false,
        error: 'Position data is required',
      });
    }

    await telegramBotManager.sendPositionUpdate(position);

    res.json({
      success: true,
      data: {
        sent: true,
      },
    });
  } catch (error) {
    logger.error('Error sending position update:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send position update',
    });
  }
});

/**
 * POST /api/telegram/send-market-alert
 * Send a market alert (for internal use)
 */
router.post('/send-market-alert', async (req, res) => {
  try {
    const { alert } = req.body;

    if (!alert) {
      return res.status(400).json({
        success: false,
        error: 'Alert data is required',
      });
    }

    await telegramBotManager.sendMarketAlert(alert);

    res.json({
      success: true,
      data: {
        sent: true,
      },
    });
  } catch (error) {
    logger.error('Error sending market alert:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send market alert',
    });
  }
});

/**
 * POST /api/telegram/send-trade-alert
 * Send a trade execution alert (for internal use)
 */
router.post('/send-trade-alert', async (req, res) => {
  try {
    const { action, token, amount, price, success } = req.body;

    if (!action || !token || !amount) {
      return res.status(400).json({
        success: false,
        error: 'Trade data is required',
      });
    }

    await telegramBotManager.sendTradeAlert(action, token, amount, price, success);

    res.json({
      success: true,
      data: {
        sent: true,
      },
    });
  } catch (error) {
    logger.error('Error sending trade alert:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send trade alert',
    });
  }
});

export default router;
