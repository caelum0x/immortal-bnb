/**
 * Trade Repository
 * Data access layer for trade history
 */

import { prisma } from '../client';
import { Trade } from '../generated/prisma';

export interface CreateTradeData {
  tokenAddress: string;
  tokenSymbol: string;
  action: 'buy' | 'sell';
  amountBNB: string;
  amountTokens: string;
  entryPrice: string;
  actualPrice?: string;
  txHash?: string;
  gasUsed?: string;
  slippagePercent?: number;
  outcome?: 'profit' | 'loss' | 'pending' | 'failed';
  profitLoss?: string;
  confidence?: number;
  strategy?: string;
  riskLevel?: string;
  aiReasoning?: string;
  marketConditions?: any;
  memoryId?: string;
  platform?: string;
  chain?: string;
}

export interface TradeQuery {
  tokenAddress?: string;
  outcome?: string;
  platform?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export class TradeRepository {
  /**
   * Create a new trade record
   */
  async create(data: CreateTradeData): Promise<Trade> {
    return prisma.trade.create({
      data: {
        ...data,
        marketConditions: data.marketConditions ? JSON.stringify(data.marketConditions) : null,
      },
    });
  }

  /**
   * Update trade with outcome
   */
  async updateOutcome(
    txHash: string,
    outcome: 'profit' | 'loss' | 'pending' | 'failed',
    exitPrice?: string,
    profitLoss?: string
  ): Promise<Trade> {
    return prisma.trade.update({
      where: { txHash },
      data: {
        outcome,
        exitPrice,
        profitLoss,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Find trade by transaction hash
   */
  async findByTxHash(txHash: string): Promise<Trade | null> {
    return prisma.trade.findUnique({
      where: { txHash },
    });
  }

  /**
   * Query trades with filters
   */
  async query(query: TradeQuery): Promise<Trade[]> {
    const where: any = {};

    if (query.tokenAddress) {
      where.tokenAddress = query.tokenAddress;
    }

    if (query.outcome) {
      where.outcome = query.outcome;
    }

    if (query.platform) {
      where.platform = query.platform;
    }

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        where.createdAt.gte = query.startDate;
      }
      if (query.endDate) {
        where.createdAt.lte = query.endDate;
      }
    }

    return prisma.trade.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: query.limit || 100,
      skip: query.offset || 0,
    });
  }

  /**
   * Get trade statistics
   */
  async getStatistics(platform?: string, startDate?: Date, endDate?: Date) {
    const where: any = {};

    if (platform) {
      where.platform = platform;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = startDate;
      }
      if (endDate) {
        where.createdAt.lte = endDate;
      }
    }

    const [total, successful, failed, totalProfitLoss] = await Promise.all([
      prisma.trade.count({ where }),
      prisma.trade.count({
        where: { ...where, outcome: 'profit' },
      }),
      prisma.trade.count({
        where: { ...where, outcome: 'loss' },
      }),
      prisma.trade.aggregate({
        where: { ...where, profitLoss: { not: null } },
        _sum: {
          profitLoss: true,
        },
      }),
    ]);

    const winRate = total > 0 ? (successful / total) * 100 : 0;

    return {
      totalTrades: total,
      successfulTrades: successful,
      failedTrades: failed,
      winRate,
      totalProfitLoss: totalProfitLoss._sum.profitLoss || '0',
    };
  }

  /**
   * Get recent trades
   */
  async getRecent(limit: number = 10): Promise<Trade[]> {
    return prisma.trade.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}

export const tradeRepository = new TradeRepository();

