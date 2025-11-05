import winston from 'winston';

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Custom log format
const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

// Create logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    // Console transport with colors
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        logFormat
      ),
    }),
    // File transport for errors
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // File transport for all logs
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Structured logging helpers
export const logTrade = (action: string, token: string, amount: number, price?: number) => {
  logger.info(`Trade ${action.toUpperCase()}: ${amount} BNB for ${token}${price ? ` @ $${price}` : ''}`);
};

export const logAIDecision = (decision: any, token: string) => {
  logger.info(`AI Decision for ${token}: ${JSON.stringify(decision)}`);
};

export const logMemory = (memoryId: string, action: 'store' | 'fetch') => {
  logger.info(`Memory ${action}: ${memoryId}`);
};

export const logError = (context: string, error: Error) => {
  logger.error(`[${context}] ${error.message}`, { stack: error.stack });
};

export default logger;
