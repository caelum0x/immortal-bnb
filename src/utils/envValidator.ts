/**
 * Environment Variable Validation Utility
 * Validates required configuration on startup to prevent runtime errors
 */

import { CONFIG } from '../config';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ValidationRule {
  name: string;
  value: any;
  required: boolean;
  validate?: (value: any) => boolean;
  errorMessage?: string;
  warningMessage?: string;
}

/**
 * Validates a single configuration value
 */
function validateRule(rule: ValidationRule): { error?: string; warning?: string } {
  const { name, value, required, validate, errorMessage, warningMessage } = rule;

  // Check if required value is missing
  if (required && (!value || value === '')) {
    return {
      error: errorMessage || `${name} is required but not set`,
    };
  }

  // Run custom validation if provided
  if (validate && value && !validate(value)) {
    return {
      warning: warningMessage || `${name} validation failed`,
    };
  }

  return {};
}

/**
 * Comprehensive environment validation
 */
export function validateEnvironment(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Define validation rules
  const rules: ValidationRule[] = [
    // ===== Critical - Bot won't work without these =====
    {
      name: 'OPENROUTER_API_KEY',
      value: CONFIG.OPENROUTER_API_KEY,
      required: true,
      validate: (val) => val.startsWith('sk-or-v1-'),
      errorMessage: 'OPENROUTER_API_KEY is required. Get one from https://openrouter.ai',
      warningMessage: 'OPENROUTER_API_KEY format looks invalid (should start with sk-or-v1-)',
    },
    {
      name: 'WALLET_PRIVATE_KEY',
      value: CONFIG.WALLET_PRIVATE_KEY,
      required: true,
      validate: (val) => val.startsWith('0x') && val.length === 66 && !val.startsWith('0x00000000'),
      errorMessage: 'WALLET_PRIVATE_KEY is required for executing trades',
      warningMessage: 'WALLET_PRIVATE_KEY format looks invalid or is a placeholder (0x + 64 hex chars)',
    },
    {
      name: 'RPC_URL',
      value: CONFIG.BNB_RPC,
      required: true,
      validate: (val) => val.startsWith('http'),
      errorMessage: 'RPC_URL is required for blockchain connection',
      warningMessage: 'RPC_URL should start with http:// or https://',
    },

    // ===== Important - Features won't work without these =====
    {
      name: 'GREENFIELD_BUCKET_NAME',
      value: CONFIG.GREENFIELD_BUCKET_NAME,
      required: false,
      validate: (val) => val !== 'immortal-bot-memories' || CONFIG.GREENFIELD_ACCESS_KEY !== '',
      warningMessage: 'GREENFIELD_BUCKET_NAME is set but GREENFIELD_ACCESS_KEY is missing',
    },

    // ===== Optional - Bot works but with reduced functionality =====
    {
      name: 'TELEGRAM_BOT_TOKEN',
      value: CONFIG.TELEGRAM_BOT_TOKEN,
      required: false,
      validate: (val) => !val || val.includes(':'),
      warningMessage: 'TELEGRAM_BOT_TOKEN set but no alerts configured (missing TELEGRAM_CHAT_ID)',
    },

    // ===== Configuration Validation =====
    {
      name: 'MAX_TRADE_AMOUNT_BNB',
      value: CONFIG.MAX_TRADE_AMOUNT_BNB,
      required: false,
      validate: (val) => val > 0 && val <= 100,
      warningMessage: 'MAX_TRADE_AMOUNT_BNB should be between 0 and 100 BNB',
    },
    {
      name: 'STOP_LOSS_PERCENTAGE',
      value: CONFIG.STOP_LOSS_PERCENTAGE,
      required: false,
      validate: (val) => val > 0 && val <= 100,
      warningMessage: 'STOP_LOSS_PERCENTAGE should be between 0 and 100',
    },
    {
      name: 'MAX_SLIPPAGE_PERCENTAGE',
      value: CONFIG.MAX_SLIPPAGE_PERCENTAGE,
      required: false,
      validate: (val) => val > 0 && val <= 50,
      warningMessage: 'MAX_SLIPPAGE_PERCENTAGE should be between 0 and 50',
    },
    {
      name: 'BOT_LOOP_INTERVAL_MS',
      value: CONFIG.BOT_LOOP_INTERVAL_MS,
      required: false,
      validate: (val) => val >= 60000, // At least 1 minute
      warningMessage: 'BOT_LOOP_INTERVAL_MS should be at least 60000ms (1 minute)',
    },
  ];

  // Validate all rules
  for (const rule of rules) {
    const result = validateRule(rule);

    if (result.error) {
      errors.push(result.error);
    }

    if (result.warning) {
      warnings.push(result.warning);
    }
  }

  // Network-specific warnings
  if (CONFIG.NETWORK === 'mainnet') {
    warnings.push('⚠️  MAINNET MODE ACTIVE - Real funds at risk! Double-check all settings.');
  }

  // Telegram alerts check
  if (CONFIG.TELEGRAM_BOT_TOKEN && !CONFIG.TELEGRAM_CHAT_ID) {
    warnings.push('TELEGRAM_BOT_TOKEN is set but TELEGRAM_CHAT_ID is missing - alerts won\'t be sent');
  }

  // Greenfield check
  if (CONFIG.GREENFIELD_BUCKET_NAME && (!CONFIG.GREENFIELD_ACCESS_KEY || !CONFIG.GREENFIELD_SECRET_KEY)) {
    warnings.push('GREENFIELD_BUCKET_NAME is set but access keys are missing - memory storage may fail');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate and exit if critical errors found
 */
export function validateOrExit(): void {
  const result = validateEnvironment();

  // Print warnings
  if (result.warnings.length > 0) {
    console.log('\n⚠️  Configuration Warnings:');
    result.warnings.forEach((warning) => {
      console.log(`   - ${warning}`);
    });
    console.log('');
  }

  // Print errors and exit if invalid
  if (!result.valid) {
    console.error('\n❌ Configuration Errors:');
    result.errors.forEach((error) => {
      console.error(`   - ${error}`);
    });
    console.error('\n💡 Fix these errors in your .env file before starting the bot.');
    console.error('   Copy .env.example to .env and fill in your actual values.\n');
    process.exit(1);
  }

  console.log('✅ Environment validation passed\n');
}

/**
 * Get a summary of current configuration
 */
export function getConfigSummary(): string {
  const lines = [
    '📋 Current Configuration:',
    '',
    `Network: ${CONFIG.NETWORK.toUpperCase()}`,
    `Chain ID: ${CONFIG.CHAIN_ID}`,
    `RPC: ${CONFIG.BNB_RPC.substring(0, 50)}...`,
    `Wallet: ${CONFIG.WALLET_PRIVATE_KEY ? CONFIG.WALLET_PRIVATE_KEY.substring(0, 10) + '...' : 'NOT SET'}`,
    '',
    '💰 Trading Parameters:',
    `  Max Trade: ${CONFIG.MAX_TRADE_AMOUNT_BNB} BNB`,
    `  Stop Loss: ${CONFIG.STOP_LOSS_PERCENTAGE}%`,
    `  Slippage: ${CONFIG.MAX_SLIPPAGE_PERCENTAGE}%`,
    `  Interval: ${CONFIG.BOT_LOOP_INTERVAL_MS / 1000}s`,
    '',
    '🔌 Integrations:',
    `  OpenRouter: ${CONFIG.OPENROUTER_API_KEY ? '✅ Configured' : '❌ Missing'}`,
    `  Telegram: ${CONFIG.TELEGRAM_BOT_TOKEN ? '✅ Configured' : '⚪ Optional'}`,
    `  Greenfield: ${CONFIG.GREENFIELD_ACCESS_KEY ? '✅ Configured' : '⚪ Optional'}`,
    '',
  ];

  return lines.join('\n');
}

export default {
  validateEnvironment,
  validateOrExit,
  getConfigSummary,
};
