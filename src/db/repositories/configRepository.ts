/**
 * Configuration Repository
 * Data access layer for bot configuration and state
 */

// Optional Prisma import
let prisma: any;
try {
  prisma = require('../client').prisma;
} catch {
  prisma = { botState: { findUnique: () => Promise.resolve(null), upsert: () => Promise.resolve({}) } };
}
// BotState type - will be available after Prisma client generation
type BotState = any;

export interface BotConfigData {
  isRunning?: boolean;
  riskLevel?: number;
  maxTradeAmount?: number;
  stopLoss?: number;
  interval?: number;
  network?: string;
  watchlist?: string[];
  lastCycleAt?: Date;
}

export class ConfigRepository {
  /**
   * Get current bot state
   */
  async getCurrent(): Promise<BotState | null> {
    return prisma.botState.findFirst({
      orderBy: { updatedAt: 'desc' },
    });
  }

  /**
   * Update bot state
   */
  async update(data: BotConfigData): Promise<BotState> {
    const current = await this.getCurrent();

    if (current) {
      return prisma.botState.update({
        where: { id: current.id },
        data: {
          ...data,
          updatedAt: new Date(),
        },
      });
    } else {
      return prisma.botState.create({
        data: {
          isRunning: data.isRunning || false,
          riskLevel: data.riskLevel || 5,
          maxTradeAmount: data.maxTradeAmount || 0.1,
          stopLoss: data.stopLoss || 10.0,
          interval: data.interval || 300000,
          network: data.network || 'testnet',
          watchlist: data.watchlist || [],
          lastCycleAt: data.lastCycleAt,
        },
      });
    }
  }

  /**
   * Set bot running state
   */
  async setRunning(isRunning: boolean): Promise<BotState> {
    return this.update({ isRunning });
  }

  /**
   * Update last cycle time
   */
  async updateLastCycle(): Promise<BotState> {
    return this.update({ lastCycleAt: new Date() });
  }
}

export const configRepository = new ConfigRepository();

