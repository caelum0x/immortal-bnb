import { Telegraf } from 'telegraf';
import { logger, logError } from '../utils/logger';
import { CONFIG } from '../config';
import { AIDecision } from '../types';
import { TradeResult } from '../blockchain/tradeExecutor';
import { TradeMemory } from '../agent/learningLoop';

let bot: Telegraf | null = null;
let isInitialized = false;

/**
 * Initialize Telegram bot
 */
export function initializeTelegramBot(): void {
  if (!CONFIG.TELEGRAM_BOT_TOKEN) {
    logger.warn('Telegram bot token not configured - alerts disabled');
    return;
  }

  try {
    bot = new Telegraf(CONFIG.TELEGRAM_BOT_TOKEN);

    // Set up bot commands
    bot.command('start', ctx => {
      ctx.reply(
        '🤖 *Immortal AI Trading Bot*\n\n' +
          'I will send you alerts for:\n' +
          '• AI trading decisions\n' +
          '• Trade executions\n' +
          '• Important events\n\n' +
          'Commands:\n' +
          '/status - Get current bot status\n' +
          '/stats - View trading statistics\n' +
          '/help - Show help',
        { parse_mode: 'Markdown' }
      );
    });

    bot.command('status', ctx => {
      ctx.reply('✅ Bot is running and monitoring markets...');
    });

    bot.command('help', ctx => {
      ctx.reply(
        '*Available Commands:*\n\n' +
          '/start - Start receiving alerts\n' +
          '/status - Check bot status\n' +
          '/stats - View trading stats\n' +
          '/help - Show this help message',
        { parse_mode: 'Markdown' }
      );
    });

    // Launch bot
    bot.launch();
    isInitialized = true;

    logger.info('Telegram bot initialized and running');

    // Graceful shutdown
    process.once('SIGINT', () => bot?.stop('SIGINT'));
    process.once('SIGTERM', () => bot?.stop('SIGTERM'));
  } catch (error) {
    logError('initializeTelegramBot', error as Error);
    logger.warn('Telegram bot initialization failed - continuing without alerts');
  }
}

/**
 * Send a message to configured chat
 */
async function sendMessage(text: string, parse_mode: 'Markdown' | 'HTML' = 'Markdown'): Promise<void> {
  if (!bot || !isInitialized) {
    logger.warn('Telegram bot not initialized - skipping alert');
    return;
  }

  if (!CONFIG.TELEGRAM_CHAT_ID) {
    logger.warn('Telegram chat ID not configured - skipping alert');
    return;
  }

  try {
    await bot.telegram.sendMessage(CONFIG.TELEGRAM_CHAT_ID, text, {
      parse_mode,
      disable_web_page_preview: true,
    });
  } catch (error) {
    logError('sendTelegramMessage', error as Error);
  }
}

/**
 * Alert: AI Decision made
 */
export async function alertAIDecision(
  decision: AIDecision,
  tokenSymbol: string,
  tokenAddress: string
): Promise<void> {
  const actionEmoji = {
    buy: '🟢',
    sell: '🔴',
    hold: '⚪️',
  }[decision.action];

  const confidenceBar = '█'.repeat(Math.floor(decision.confidence * 10));
  const riskEmoji = {
    low: '🟢',
    medium: '🟡',
    high: '🔴',
  }[decision.riskLevel];

  const message = `
${actionEmoji} *AI Decision: ${decision.action.toUpperCase()}*

*Token:* ${tokenSymbol}
*Amount:* ${decision.amount} BNB
*Confidence:* ${confidenceBar} ${(decision.confidence * 100).toFixed(0)}%
*Risk:* ${riskEmoji} ${decision.riskLevel.toUpperCase()}

*Reasoning:*
${decision.reason}

${decision.targetPrice ? `*Target:* $${decision.targetPrice}\n` : ''}${decision.stopLoss ? `*Stop Loss:* $${decision.stopLoss}\n` : ''}
\`${tokenAddress}\`
  `.trim();

  await sendMessage(message);
}

/**
 * Alert: Trade executed
 */
export async function alertTradeExecution(
  result: TradeResult,
  tokenSymbol: string,
  action: 'buy' | 'sell'
): Promise<void> {
  const emoji = result.success ? '✅' : '❌';
  const actionEmoji = action === 'buy' ? '🟢 BUY' : '🔴 SELL';

  if (result.success) {
    const message = `
${emoji} *Trade Executed: ${actionEmoji}*

*Token:* ${tokenSymbol}
*Amount In:* ${result.amountIn}
*Amount Out:* ${result.amountOut}
*Price:* ${result.actualPrice.toFixed(8)}
${result.gasUsed ? `*Gas Used:* ${result.gasUsed}\n` : ''}
*Tx:* \`${result.txHash}\`

[View on BscScan](https://bscscan.com/tx/${result.txHash})
    `.trim();

    await sendMessage(message);
  } else {
    const message = `
${emoji} *Trade Failed: ${actionEmoji}*

*Token:* ${tokenSymbol}
*Error:* ${result.error}

Please check logs for details.
    `.trim();

    await sendMessage(message);
  }
}

/**
 * Alert: Trade outcome (profit/loss)
 */
export async function alertTradeOutcome(memory: TradeMemory): Promise<void> {
  if (!memory.outcome || memory.outcome === 'pending') {
    return;
  }

  const emoji = memory.outcome === 'profit' ? '💰' : '📉';
  const plEmoji = (memory.profitLossPercentage || 0) > 0 ? '📈' : '📉';
  const plSign = (memory.profitLossPercentage || 0) > 0 ? '+' : '';

  const message = `
${emoji} *Trade Completed*

*Token:* ${memory.tokenSymbol}
*Action:* ${memory.action.toUpperCase()}
*Entry:* $${memory.entryPrice}
*Exit:* $${memory.exitPrice}

${plEmoji} *P/L:* ${plSign}${memory.profitLoss?.toFixed(4)} BNB (${plSign}${memory.profitLossPercentage?.toFixed(2)}%)
*Outcome:* ${memory.outcome === 'profit' ? '✅ PROFIT' : '❌ LOSS'}

${memory.lessons ? `*Lesson:* ${memory.lessons}` : ''}
  `.trim();

  await sendMessage(message);
}

/**
 * Alert: Bot status update
 */
export async function alertBotStatus(
  status: 'started' | 'stopped' | 'error',
  message?: string
): Promise<void> {
  const emoji = {
    started: '🚀',
    stopped: '⏸',
    error: '⚠️',
  }[status];

  const text = `
${emoji} *Bot ${status.toUpperCase()}*

${message || `Bot is now ${status}`}

Time: ${new Date().toLocaleString()}
  `.trim();

  await sendMessage(text);
}

/**
 * Alert: Daily summary
 */
export async function alertDailySummary(stats: {
  trades: number;
  wins: number;
  losses: number;
  totalPL: number;
  bestTrade: string;
  worstTrade: string;
}): Promise<void> {
  const winRate = stats.trades > 0 ? (stats.wins / stats.trades) * 100 : 0;
  const plEmoji = stats.totalPL >= 0 ? '📈' : '📉';

  const message = `
📊 *Daily Trading Summary*

*Trades:* ${stats.trades}
*Wins:* ${stats.wins} | *Losses:* ${stats.losses}
*Win Rate:* ${winRate.toFixed(1)}%

${plEmoji} *Total P/L:* ${stats.totalPL >= 0 ? '+' : ''}${stats.totalPL.toFixed(4)} BNB

*Best Trade:* ${stats.bestTrade}
*Worst Trade:* ${stats.worstTrade}

Keep trading! 🚀
  `.trim();

  await sendMessage(message);
}

/**
 * Alert: Error notification
 */
export async function alertError(context: string, error: Error): Promise<void> {
  const message = `
⚠️ *Error Alert*

*Context:* ${context}
*Error:* ${error.message}

Time: ${new Date().toLocaleString()}
  `.trim();

  await sendMessage(message);
}

/**
 * Stop bot
 */
export function stopTelegramBot(): void {
  if (bot && isInitialized) {
    bot.stop();
    isInitialized = false;
    logger.info('Telegram bot stopped');
  }
}

export default {
  initializeTelegramBot,
  alertAIDecision,
  alertTradeExecution,
  alertTradeOutcome,
  alertBotStatus,
  alertDailySummary,
  alertError,
  stopTelegramBot,
};
