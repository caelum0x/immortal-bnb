/**
 * Metrics Repository
 * Data access layer for performance metrics
 */

import { prisma } from '../client';
import { PerformanceMetrics } from '../generated/prisma';

export interface CreateMetricsData {
  date: Date;
  totalTrades: number;
  successfulTrades: number;
  failedTrades: number;
  totalProfitLoss: string;
  winRate: number;
  avgTradeTime?: number;
  totalVolume: string;
  platform?: string;
}

export class MetricsRepository {
  /**
   * Create or update daily metrics
   */
  async upsertDaily(data: CreateMetricsData): Promise<PerformanceMetrics> {
    return prisma.performanceMetrics.upsert({
      where: {
        date_platform: {
          date: data.date,
          platform: data.platform || 'pancakeswap',
        },
      },
      update: {
        totalTrades: data.totalTrades,
        successfulTrades: data.successfulTrades,
        failedTrades: data.failedTrades,
        totalProfitLoss: data.totalProfitLoss,
        winRate: data.winRate,
        avgTradeTime: data.avgTradeTime,
        totalVolume: data.totalVolume,
        updatedAt: new Date(),
      },
      create: {
        ...data,
        platform: data.platform || 'pancakeswap',
      },
    });
  }

  /**
   * Get metrics for date range
   */
  async getDateRange(startDate: Date, endDate: Date, platform?: string) {
    const where: any = {
      date: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (platform) {
      where.platform = platform;
    }

    return prisma.performanceMetrics.findMany({
      where,
      orderBy: { date: 'asc' },
    });
  }

  /**
   * Get latest metrics
   */
  async getLatest(platform?: string): Promise<PerformanceMetrics | null> {
    const where: any = {};
    if (platform) {
      where.platform = platform;
    }

    return prisma.performanceMetrics.findFirst({
      where,
      orderBy: { date: 'desc' },
    });
  }

  /**
   * Get aggregated metrics
   */
  async getAggregated(startDate: Date, endDate: Date, platform?: string) {
    const where: any = {
      date: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (platform) {
      where.platform = platform;
    }

    const metrics = await prisma.performanceMetrics.findMany({ where });

    const aggregated = {
      totalTrades: 0,
      successfulTrades: 0,
      failedTrades: 0,
      totalProfitLoss: '0',
      totalVolume: '0',
      avgWinRate: 0,
    };

    metrics.forEach((m) => {
      aggregated.totalTrades += m.totalTrades;
      aggregated.successfulTrades += m.successfulTrades;
      aggregated.failedTrades += m.failedTrades;
      aggregated.totalProfitLoss = (
        parseFloat(aggregated.totalProfitLoss) + parseFloat(m.totalProfitLoss)
      ).toString();
      aggregated.totalVolume = (
        parseFloat(aggregated.totalVolume) + parseFloat(m.totalVolume)
      ).toString();
      aggregated.avgWinRate += m.winRate;
    });

    if (metrics.length > 0) {
      aggregated.avgWinRate = aggregated.avgWinRate / metrics.length;
    }

    return aggregated;
  }
}

export const metricsRepository = new MetricsRepository();

