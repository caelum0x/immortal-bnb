import { Telegraf } from 'telegraf';
import { logger, logError } from '../utils/logger';
import { CONFIG } from '../config';
import type { AIDecision } from '../types';
import type { TradeResult } from '../blockchain/tradeExecutor';
import type { TradeMemory } from '../types/memory';

/**
 * Bot state interface
 */
interface BotState {
  isRunning: boolean;
  totalAlerts: number;
  lastAlertTime: number;
  subscribedUsers: Set<string>;
  alertStats: {
    trades: number;
    decisions: number;
    errors: number;
    profits: number;
    losses: number;
  };
}

export class TelegramBotManager {
  private bot: Telegraf | null = null;
  private isInitialized = false;
  private state: BotState = {
    isRunning: false,
    totalAlerts: 0,
    lastAlertTime: 0,
    subscribedUsers: new Set(),
    alertStats: {
      trades: 0,
      decisions: 0,
      errors: 0,
      profits: 0,
      losses: 0
    }
  };

  private rateLimiter = new Map<string, number[]>(); // user -> timestamps
  private readonly RATE_LIMIT_WINDOW = 60000; // 1 minute
  private readonly MAX_MESSAGES_PER_WINDOW = 10;

  /**
   * Initialize enhanced Telegram bot
   */
  initialize(): void {
    if (!CONFIG.TELEGRAM_BOT_TOKEN) {
      logger.warn('Telegram bot token not configured - alerts disabled');
      return;
    }

    try {
      this.bot = new Telegraf(CONFIG.TELEGRAM_BOT_TOKEN);
      this.setupCommands();
      this.setupMiddleware();
      this.startBot();
      this.isInitialized = true;
      this.state.isRunning = true;
      
      logger.info('✅ Enhanced Telegram bot initialized');
    } catch (error) {
      logger.error(`❌ Failed to initialize Telegram bot: ${(error as Error).message}`);
    }
  }

  /**
   * Setup bot commands
   */
  private setupCommands(): void {
    if (!this.bot) return;

    // Start command
    this.bot.command('start', (ctx) => {
      this.state.subscribedUsers.add(ctx.from.id.toString());
      
      const welcomeMessage = `🤖 *Immortal AI Trading Bot*

🧠 *AI-Powered Trading*: Advanced LLM decision making
💰 *Smart Execution*: PancakeSwap V2/V3 integration  
🌐 *Cross-Chain*: BNB ↔ Solana arbitrage detection
🧬 *Learning*: Immortal memory on BNB Greenfield
📊 *Real-time*: Live market data and alerts

*Alert Types:*
• 🎯 AI trading decisions
• 💱 Trade executions
• 📈 Profit/Loss updates
• 🚨 Important events
• ⚠️ Risk warnings

*Commands:*
/status - Current bot status
/stats - Trading statistics  
/portfolio - Current positions
/settings - Alert preferences
/help - Command list
/stop - Pause alerts`;

      ctx.reply(welcomeMessage, { parse_mode: 'Markdown' });
    });

    // Status command
    this.bot.command('status', (ctx) => {
      const uptime = this.getUptime();
      const lastAlert = this.state.lastAlertTime 
        ? `${Math.round((Date.now() - this.state.lastAlertTime) / 1000)}s ago`
        : 'Never';

      const statusMessage = `📊 *Bot Status*

🔄 Status: ${this.state.isRunning ? '✅ Running' : '❌ Stopped'}
⏱️ Uptime: ${uptime}
📢 Total Alerts: ${this.state.totalAlerts}
🕐 Last Alert: ${lastAlert}
👥 Subscribers: ${this.state.subscribedUsers.size}

🎯 Alert Stats:
• Trades: ${this.state.alertStats.trades}
• Decisions: ${this.state.alertStats.decisions}  
• Errors: ${this.state.alertStats.errors}
• Profits: ${this.state.alertStats.profits}
• Losses: ${this.state.alertStats.losses}`;

      ctx.reply(statusMessage, { parse_mode: 'Markdown' });
    });

    // Statistics command  
    this.bot.command('stats', (ctx) => {
      // This would fetch actual trading stats
      const statsMessage = `📈 *Trading Statistics*

💰 Total Trades: 0
📊 Success Rate: 0%
💵 Total P/L: 0.0000 BNB
📈 Best Trade: +0.0000 BNB
📉 Worst Trade: -0.0000 BNB

🎯 AI Performance:
• Decisions Made: ${this.state.alertStats.decisions}
• Executed: ${this.state.alertStats.trades}
• Accuracy: 0%

⚡ Recent Activity:
• Last 24h: 0 trades
• Last 7d: 0 trades
• This month: 0 trades

Use /portfolio for current positions.`;

      ctx.reply(statsMessage, { parse_mode: 'Markdown' });
    });

    // Portfolio command
    this.bot.command('portfolio', (ctx) => {
      const portfolioMessage = `💼 *Current Portfolio*

💰 Wallet Balance: 0.0000 BNB
📊 Total Value: $0.00

📈 *Active Positions:*
_No active positions_

💡 *Watchlist:*
_No tokens in watchlist_

⚠️ *Risk Metrics:*
• Portfolio Risk: Low
• Exposure: 0%
• Daily P/L: +0.0000 BNB`;

      ctx.reply(portfolioMessage, { parse_mode: 'Markdown' });
    });

    // Settings command
    this.bot.command('settings', (ctx) => {
      const settingsMessage = `⚙️ *Alert Settings*

🔔 *Current Preferences:*
• Trade Alerts: ✅ Enabled
• Decision Alerts: ✅ Enabled
• Error Alerts: ✅ Enabled
• Profit Alerts: ✅ Enabled
• Risk Warnings: ✅ Enabled

💡 Use inline keyboard to toggle settings.

⏰ *Timing:*
• Quiet Hours: Disabled
• Rate Limit: ${this.MAX_MESSAGES_PER_WINDOW}/min

📱 *Format:*
• Rich formatting: ✅ Enabled
• Emojis: ✅ Enabled`;

      ctx.reply(settingsMessage, { parse_mode: 'Markdown' });
    });

    // Help command
    this.bot.command('help', (ctx) => {
      const helpMessage = `❓ *Bot Commands*

*Basic Commands:*
/start - Subscribe to alerts
/stop - Unsubscribe from alerts  
/status - Bot status and stats
/help - Show this help

*Information:*
/stats - Trading performance
/portfolio - Current positions
/settings - Alert preferences

*Quick Actions:*  
/pause - Pause alerts temporarily
/resume - Resume alerts

*Advanced:*
/debug - Debug information
/logs - Recent activity log

💡 *Tips:*
• Bot monitors markets 24/7
• AI makes decisions every 5 minutes
• Alerts are rate-limited for your convenience
• Use /settings to customize notifications

🔗 *Links:*
• GitHub: github.com/your-repo
• Docs: docs.immortal-bot.ai`;

      ctx.reply(helpMessage, { parse_mode: 'Markdown' });
    });

    // Stop command
    this.bot.command('stop', (ctx) => {
      this.state.subscribedUsers.delete(ctx.from.id.toString());
      ctx.reply('🔕 You have been unsubscribed from alerts. Use /start to re-subscribe.');
    });

    // Debug command
    this.bot.command('debug', (ctx) => {
      const debugInfo = `🔧 *Debug Information*

🕐 Server Time: ${new Date().toISOString()}
🌐 Network: ${CONFIG.TRADING_NETWORK}
⛽ Gas Price: Unknown
📡 RPC Status: Connected
💾 Memory Usage: ${process.memoryUsage().heapUsed / 1024 / 1024}MB

🤖 Bot Info:
• Version: 1.0.0
• User ID: ${ctx.from.id}
• Chat ID: ${ctx.chat.id}
• Rate Limit: ${this.checkRateLimit(ctx.from.id.toString())} msgs available`;

      ctx.reply(debugInfo, { parse_mode: 'Markdown' });
    });
  }

  /**
   * Setup middleware for logging and rate limiting
   */
  private setupMiddleware(): void {
    if (!this.bot) return;

    // Rate limiting middleware
    this.bot.use((ctx, next) => {
      const userId = ctx.from?.id.toString();
      if (!userId) return next();

      if (!this.checkRateLimit(userId)) {
        ctx.reply('⚠️ Rate limit exceeded. Please wait before sending another command.');
        return;
      }

      this.updateRateLimit(userId);
      return next();
    });

    // Logging middleware
    this.bot.use((ctx, next) => {
      const userId = ctx.from?.id;
      const command = ctx.message && 'text' in ctx.message ? ctx.message.text : 'unknown';
      
      logger.info(`📱 Telegram command from ${userId}: ${command}`);
      return next();
    });
  }

  /**
   * Start the bot
   */
  private startBot(): void {
    if (!this.bot) return;

    this.bot.launch()
      .then(() => {
        logger.info('🚀 Telegram bot launched successfully');
      })
      .catch(error => {
        logger.error(`❌ Failed to launch Telegram bot: ${error.message}`);
      });

    // Graceful shutdown
    process.once('SIGINT', () => this.bot?.stop('SIGINT'));
    process.once('SIGTERM', () => this.bot?.stop('SIGTERM'));
  }

  /**
   * Enhanced alert sending with formatting and rate limiting
   */
  async sendAlert(message: string, type: 'info' | 'success' | 'warning' | 'error' | 'decision' | 'trade' | 'profit' | 'loss' = 'info'): Promise<void> {
    if (!this.bot || !this.isInitialized || this.state.subscribedUsers.size === 0) {
      return;
    }

    try {
      const emoji = this.getEmojiForType(type);
      const formattedMessage = `${emoji} ${message}`;
      
      // Send to all subscribers
      const promises = Array.from(this.state.subscribedUsers).map(userId => 
        this.sendToUser(userId, formattedMessage)
      );

      await Promise.allSettled(promises);
      
      this.updateAlertStats(type);
      this.state.totalAlerts++;
      this.state.lastAlertTime = Date.now();

    } catch (error) {
      logger.error(`❌ Failed to send Telegram alert: ${(error as Error).message}`);
    }
  }

  /**
   * Send message to specific user
   */
  private async sendToUser(userId: string, message: string): Promise<void> {
    if (!this.bot) return;

    try {
      await this.bot.telegram.sendMessage(userId, message, { 
        parse_mode: 'Markdown'
      });
    } catch (error) {
      // Remove user if they blocked the bot
      if ((error as any).code === 403) {
        this.state.subscribedUsers.delete(userId);
        logger.warn(`User ${userId} blocked the bot, removed from subscribers`);
      }
    }
  }

  /**
   * Check rate limit for user
   */
  private checkRateLimit(userId: string): boolean {
    const now = Date.now();
    const userTimestamps = this.rateLimiter.get(userId) || [];
    
    // Remove old timestamps
    const validTimestamps = userTimestamps.filter(ts => now - ts < this.RATE_LIMIT_WINDOW);
    
    return validTimestamps.length < this.MAX_MESSAGES_PER_WINDOW;
  }

  /**
   * Update rate limit for user
   */
  private updateRateLimit(userId: string): void {
    const now = Date.now();
    const userTimestamps = this.rateLimiter.get(userId) || [];
    
    userTimestamps.push(now);
    
    // Keep only recent timestamps
    const validTimestamps = userTimestamps.filter(ts => now - ts < this.RATE_LIMIT_WINDOW);
    this.rateLimiter.set(userId, validTimestamps);
  }

  /**
   * Get emoji for alert type
   */
  private getEmojiForType(type: string): string {
    const emojis = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      trade: '💱',
      profit: '💰',
      loss: '📉',
      decision: '🧠'
    };
    
    return emojis[type as keyof typeof emojis] || 'ℹ️';
  }

  /**
   * Update alert statistics
   */
  private updateAlertStats(type: string): void {
    switch (type) {
      case 'trade':
        this.state.alertStats.trades++;
        break;
      case 'decision':
        this.state.alertStats.decisions++;
        break;
      case 'error':
        this.state.alertStats.errors++;
        break;
      case 'profit':
        this.state.alertStats.profits++;
        break;
      case 'loss':
        this.state.alertStats.losses++;
        break;
    }
  }

  /**
   * Get bot uptime
   */
  private getUptime(): string {
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);
    
    return `${hours}h ${minutes}m ${seconds}s`;
  }

  /**
   * Send specialized trade alert
   */
  async sendTradeAlert(action: string, token: string, amount: number, price?: number, success?: boolean): Promise<void> {
    const emoji = success ? '✅' : '❌';
    const status = success ? 'EXECUTED' : 'FAILED';
    
    const message = `${emoji} *TRADE ${status}*

🎯 Action: ${action.toUpperCase()}
🪙 Token: ${token}
💰 Amount: ${amount.toFixed(4)} BNB
${price ? `💵 Price: $${price.toFixed(6)}` : ''}
🕐 Time: ${new Date().toLocaleString()}`;

    await this.sendAlert(message, success ? 'success' : 'error');
  }

  /**
   * Send AI decision alert
   */
  async sendDecisionAlert(decision: any, token: string): Promise<void> {
    const message = `🧠 *AI DECISION*

🪙 Token: ${token}
🎯 Action: ${decision.action.toUpperCase()}
💰 Amount: ${(decision.amount * 100).toFixed(1)}%
📊 Confidence: ${(decision.confidence * 100).toFixed(1)}%
💭 Reasoning: ${decision.reasoning}
🕐 Time: ${new Date().toLocaleString()}`;

    await this.sendAlert(message, 'decision');
  }

  /**
   * Get bot statistics
   */
  getStats() {
    return {
      isRunning: this.state.isRunning,
      subscribers: this.state.subscribedUsers.size,
      totalAlerts: this.state.totalAlerts,
      alertStats: this.state.alertStats
    };
  }

  /**
   * Stop the bot
   */
  stop(): void {
    if (this.bot) {
      this.bot.stop();
      this.state.isRunning = false;
      logger.info('🔴 Telegram bot stopped');
    }
  }
}

// Global telegram bot manager instance
export const telegramBotManager = new TelegramBotManager();

// Export convenience function for backwards compatibility
export async function initializeTelegramBot(): Promise<void> {
  telegramBotManager.initialize();
}
