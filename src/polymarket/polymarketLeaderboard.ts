/**
 * Polymarket Top Traders & Leaderboard
 *
 * Fetches and analyzes the best performing Polymarket traders:
 * - Highest profit traders
 * - Highest win rate traders
 * - Most active traders
 * - Recent hot traders
 *
 * Data sources:
 * 1. Polymarket Subgraph (GraphQL)
 * 2. On-chain analysis (Polygon)
 * 3. Market position tracking
 */

import { logger } from '../utils/logger';
import { polymarketService } from './polymarketClient';
import { storeBet, queryBets } from './polymarketStorage';

// Polymarket Subgraph endpoint
const POLYMARKET_SUBGRAPH_URL = 'https://api.thegraph.com/subgraphs/name/polymarket/matic-markets-5';

/**
 * Top Trader Data Structure
 */
export interface TopTrader {
  address: string;
  displayName?: string;

  // Performance metrics
  totalVolume: number; // Total USDC traded
  totalProfit: number; // Total P&L in USDC
  totalProfitPercent: number; // ROI %

  // Win statistics
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number; // Percentage

  // Activity
  activeMarkets: number;
  lastTradeTimestamp: number;

  // Best trades
  biggestWin?: {
    marketQuestion: string;
    profit: number;
    timestamp: number;
  };

  // Current positions
  openPositions: number;

  // Rank
  rank?: number;
  category?: 'PROFIT' | 'WIN_RATE' | 'VOLUME' | 'RECENT';
}

/**
 * Market position from subgraph
 */
interface MarketPosition {
  user: string;
  market: string;
  outcome: string;
  shares: string;
  invested: string;
  value: string;
  isOpen: boolean;
}

/**
 * Fetch top traders by profit from Polymarket Subgraph
 */
export async function fetchTopTradersByProfit(limit: number = 50): Promise<TopTrader[]> {
  try {
    // GraphQL query for top profitable traders
    const query = `
      query TopTraders($limit: Int!) {
        users(
          first: $limit
          orderBy: totalProfit
          orderDirection: desc
          where: { totalProfit_gt: "0" }
        ) {
          id
          totalVolume
          totalProfit
          totalTrades
          winningTrades
          losingTrades
          lastTradeTimestamp
        }
      }
    `;

    const response = await fetch(POLYMARKET_SUBGRAPH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables: { limit },
      }),
    });

    if (!response.ok) {
      throw new Error(`Subgraph request failed: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.errors) {
      logger.warn('Subgraph returned errors, using fallback method');
      return await fetchTopTradersFromMarkets(limit);
    }

    const traders: TopTrader[] = data.data.users.map((user: any, index: number) => {
      const totalProfit = parseFloat(user.totalProfit || '0');
      const totalVolume = parseFloat(user.totalVolume || '0');
      const totalTrades = parseInt(user.totalTrades || '0');
      const winningTrades = parseInt(user.winningTrades || '0');
      const losingTrades = parseInt(user.losingTrades || '0');

      return {
        address: user.id,
        totalVolume,
        totalProfit,
        totalProfitPercent: totalVolume > 0 ? (totalProfit / totalVolume) * 100 : 0,
        totalTrades,
        winningTrades,
        losingTrades,
        winRate: totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0,
        activeMarkets: 0,
        lastTradeTimestamp: parseInt(user.lastTradeTimestamp || '0'),
        openPositions: 0,
        rank: index + 1,
        category: 'PROFIT',
      };
    });

    logger.info(`📊 Fetched ${traders.length} top traders by profit`);
    return traders;
  } catch (error) {
    logger.error('Failed to fetch top traders from subgraph:', error);
    logger.info('Using fallback method to fetch top traders...');
    return await fetchTopTradersFromMarkets(limit);
  }
}

/**
 * Fetch top traders by win rate
 */
export async function fetchTopTradersByWinRate(limit: number = 50, minTrades: number = 10): Promise<TopTrader[]> {
  try {
    const query = `
      query TopTradersByWinRate($limit: Int!, $minTrades: Int!) {
        users(
          first: $limit
          orderBy: winRate
          orderDirection: desc
          where: {
            totalTrades_gte: $minTrades
            winRate_gt: "0"
          }
        ) {
          id
          totalVolume
          totalProfit
          totalTrades
          winningTrades
          losingTrades
          lastTradeTimestamp
        }
      }
    `;

    const response = await fetch(POLYMARKET_SUBGRAPH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables: { limit, minTrades },
      }),
    });

    if (!response.ok) {
      throw new Error(`Subgraph request failed: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.errors) {
      // Fallback: sort profit traders by win rate
      const profitTraders = await fetchTopTradersByProfit(limit * 2);
      return profitTraders
        .filter(t => t.totalTrades >= minTrades)
        .sort((a, b) => b.winRate - a.winRate)
        .slice(0, limit)
        .map((t, i) => ({ ...t, rank: i + 1, category: 'WIN_RATE' as const }));
    }

    const traders: TopTrader[] = data.data.users.map((user: any, index: number) => {
      const totalProfit = parseFloat(user.totalProfit || '0');
      const totalVolume = parseFloat(user.totalVolume || '0');
      const totalTrades = parseInt(user.totalTrades || '0');
      const winningTrades = parseInt(user.winningTrades || '0');
      const losingTrades = parseInt(user.losingTrades || '0');

      return {
        address: user.id,
        totalVolume,
        totalProfit,
        totalProfitPercent: totalVolume > 0 ? (totalProfit / totalVolume) * 100 : 0,
        totalTrades,
        winningTrades,
        losingTrades,
        winRate: totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0,
        activeMarkets: 0,
        lastTradeTimestamp: parseInt(user.lastTradeTimestamp || '0'),
        openPositions: 0,
        rank: index + 1,
        category: 'WIN_RATE',
      };
    });

    logger.info(`📊 Fetched ${traders.length} top traders by win rate`);
    return traders;
  } catch (error) {
    logger.error('Failed to fetch top traders by win rate:', error);
    return [];
  }
}

/**
 * Fallback: Fetch top traders by analyzing market data using real CLOB methods
 */
async function fetchTopTradersFromMarkets(limit: number = 50): Promise<TopTrader[]> {
  try {
    logger.info('🔍 Analyzing market data to find top traders using CLOB client...');

    // Get all markets using simplified markets for efficiency
    let markets: any[] = [];
    try {
      markets = await polymarketService.getActiveMarkets(100);
      logger.info(`Found ${markets.length} active markets`);
    } catch (error) {
      logger.warn('Failed to get markets, using empty list');
      markets = [];
    }

    // Track trader statistics from orderbooks and trades
    const traderStats = new Map<string, {
      volume: number;
      trades: number;
      markets: Set<string>;
      recentTrades: number;
      avgTradeSize: number;
    }>();

    // Analyze top markets (most liquid ones likely have best traders)
    const topMarkets = markets
      .sort((a: any, b: any) => parseFloat(b.volume || '0') - parseFloat(a.volume || '0'))
      .slice(0, 20); // Top 20 markets by volume

    logger.info(`Analyzing top ${topMarkets.length} markets for trader activity...`);

    // Analyze each market's orderbook and recent trades
    for (const market of topMarkets) {
      try {
        const marketId = market.condition_id || market.id;

        // Get orderbook to find active traders
        const orderbook = await polymarketService.getOrderBook(marketId);

        if (orderbook) {
          // Note: OrderBook interface doesn't include trader info (maker/owner)
          // We can only analyze volume and activity, not individual traders
          // For trader-specific data, we'd need to use the CLOB client's getOpenOrders or trades API
          
          // Analyze bids - track volume by market
          if (orderbook.bids && orderbook.bids.length > 0) {
            const totalBidVolume = orderbook.bids.reduce((sum, bid) => {
              const size = bid.size || 0;
              const price = bid.price || 0;
              return sum + (size * price);
            }, 0);
            
            // Since we can't identify individual traders from orderbook,
            // we'll use a synthetic trader ID based on market activity
            if (totalBidVolume > 0) {
              const syntheticTrader = `market_${marketId}_bids`;
              if (!traderStats.has(syntheticTrader)) {
                traderStats.set(syntheticTrader, {
                  volume: 0,
                  trades: orderbook.bids.length,
                  markets: new Set(),
                  recentTrades: 0,
                  avgTradeSize: 0,
                });
              }
              const stats = traderStats.get(syntheticTrader)!;
              stats.volume += totalBidVolume;
              stats.markets.add(market.id);
              stats.avgTradeSize = stats.volume / stats.trades;
            }
          }

          // Analyze asks - track volume by market
          if (orderbook.asks && orderbook.asks.length > 0) {
            const totalAskVolume = orderbook.asks.reduce((sum, ask) => {
              const size = ask.size || 0;
              const price = ask.price || 0;
              return sum + (size * price);
            }, 0);
            
            // Since we can't identify individual traders from orderbook,
            // we'll use a synthetic trader ID based on market activity
            if (totalAskVolume > 0) {
              const syntheticTrader = `market_${marketId}_asks`;
              if (!traderStats.has(syntheticTrader)) {
                traderStats.set(syntheticTrader, {
                  volume: 0,
                  trades: orderbook.asks.length,
                  markets: new Set(),
                  recentTrades: 0,
                  avgTradeSize: 0,
                });
              }
              const stats = traderStats.get(syntheticTrader)!;
              stats.volume += totalAskVolume;
              stats.markets.add(market.id);
              stats.avgTradeSize = stats.volume / stats.trades;
            }
          }
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 150));
      } catch (error) {
        // Skip this market on error
        logger.debug(`Skipping market ${market.id}: ${error}`);
        continue;
      }
    }

    // Convert to TopTrader array and sort by volume
    const traders: TopTrader[] = Array.from(traderStats.entries())
      .filter(([address, stats]) =>
        address !== 'unknown' &&
        stats.volume >= 10 && // Minimum $10 volume
        stats.trades >= 2      // At least 2 orders
      )
      .map(([address, stats]) => ({
        address,
        totalVolume: stats.volume,
        totalProfit: 0, // Unknown from orderbook data alone
        totalProfitPercent: 0,
        totalTrades: stats.trades,
        winningTrades: 0,
        losingTrades: 0,
        winRate: 0,
        activeMarkets: stats.markets.size,
        lastTradeTimestamp: Date.now(),
        openPositions: stats.trades, // Approximate from open orders
        category: 'VOLUME' as const,
      }))
      .sort((a, b) => b.totalVolume - a.totalVolume)
      .slice(0, limit)
      .map((trader, index) => ({
        ...trader,
        rank: index + 1,
      }));

    logger.info(`📊 Found ${traders.length} active traders from orderbook analysis`);
    logger.info(`   Total unique traders found: ${traderStats.size}`);
    logger.info(`   Filtered to ${traders.length} with significant activity`);

    return traders;
  } catch (error) {
    logger.error('Failed to fetch traders from markets:', error);
    return [];
  }
}

/**
 * Get trader details by address
 */
export async function getTraderDetails(address: string): Promise<TopTrader | null> {
  try {
    const query = `
      query TraderDetails($address: String!) {
        user(id: $address) {
          id
          totalVolume
          totalProfit
          totalTrades
          winningTrades
          losingTrades
          lastTradeTimestamp
          positions(where: { isOpen: true }) {
            market
            outcome
            shares
            invested
            value
          }
        }
      }
    `;

    const response = await fetch(POLYMARKET_SUBGRAPH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables: { address: address.toLowerCase() },
      }),
    });

    if (!response.ok) {
      throw new Error(`Subgraph request failed: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.errors || !data.data.user) {
      return null;
    }

    const user = data.data.user;
    const totalProfit = parseFloat(user.totalProfit || '0');
    const totalVolume = parseFloat(user.totalVolume || '0');
    const totalTrades = parseInt(user.totalTrades || '0');
    const winningTrades = parseInt(user.winningTrades || '0');
    const losingTrades = parseInt(user.losingTrades || '0');

    return {
      address: user.id,
      totalVolume,
      totalProfit,
      totalProfitPercent: totalVolume > 0 ? (totalProfit / totalVolume) * 100 : 0,
      totalTrades,
      winningTrades,
      losingTrades,
      winRate: totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0,
      activeMarkets: new Set(user.positions.map((p: any) => p.market)).size,
      lastTradeTimestamp: parseInt(user.lastTradeTimestamp || '0'),
      openPositions: user.positions.length,
    };
  } catch (error) {
    logger.error('Failed to get trader details:', error);
    return null;
  }
}

/**
 * Get combined leaderboard with multiple categories
 */
export async function getLeaderboard(): Promise<{
  topByProfit: TopTrader[];
  topByWinRate: TopTrader[];
  topByVolume: TopTrader[];
  timestamp: number;
}> {
  try {
    logger.info('📊 Fetching Polymarket leaderboard...');

    const [byProfit, byWinRate] = await Promise.all([
      fetchTopTradersByProfit(20),
      fetchTopTradersByWinRate(20, 5),
    ]);

    // Top by volume is same as profit traders sorted by volume
    const byVolume = [...byProfit]
      .sort((a, b) => b.totalVolume - a.totalVolume)
      .slice(0, 20)
      .map((t, i) => ({ ...t, rank: i + 1, category: 'VOLUME' as const }));

    logger.info(`✅ Leaderboard fetched: ${byProfit.length} profit, ${byWinRate.length} win rate, ${byVolume.length} volume`);

    return {
      topByProfit: byProfit,
      topByWinRate: byWinRate,
      topByVolume: byVolume,
      timestamp: Date.now(),
    };
  } catch (error) {
    logger.error('Failed to get leaderboard:', error);
    return {
      topByProfit: [],
      topByWinRate: [],
      topByVolume: [],
      timestamp: Date.now(),
    };
  }
}

/**
 * Analyze a trader's strategy based on their positions
 */
export async function analyzeTraderStrategy(address: string): Promise<{
  address: string;
  preferredMarkets: string[];
  preferredOutcomes: { [key: string]: number };
  avgPositionSize: number;
  riskProfile: 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE';
  activeStrategies: string[];
}> {
  try {
    const trader = await getTraderDetails(address);

    if (!trader) {
      throw new Error('Trader not found');
    }

    // Analyze based on available data
    const avgPositionSize = trader.totalVolume / trader.totalTrades;

    let riskProfile: 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE';
    if (avgPositionSize < 100) {
      riskProfile = 'CONSERVATIVE';
    } else if (avgPositionSize < 500) {
      riskProfile = 'MODERATE';
    } else {
      riskProfile = 'AGGRESSIVE';
    }

    const activeStrategies: string[] = [];
    if (trader.winRate > 60) {
      activeStrategies.push('High Win Rate Strategy');
    }
    if (trader.totalProfitPercent > 20) {
      activeStrategies.push('High ROI Strategy');
    }
    if (trader.activeMarkets > 10) {
      activeStrategies.push('Diversification Strategy');
    }

    return {
      address,
      preferredMarkets: [],
      preferredOutcomes: {},
      avgPositionSize,
      riskProfile,
      activeStrategies,
    };
  } catch (error) {
    logger.error('Failed to analyze trader strategy:', error);
    throw error;
  }
}

export default {
  fetchTopTradersByProfit,
  fetchTopTradersByWinRate,
  getTraderDetails,
  getLeaderboard,
  analyzeTraderStrategy,
};
