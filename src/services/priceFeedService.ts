/**
 * Price Feed Service
 *
 * Real-time price feed system that:
 * - Fetches prices from multiple sources (Polymarket, DexScreener, etc.)
 * - Maintains price history for charting
 * - Broadcasts updates via WebSocket
 * - Updates order monitoring service automatically
 * - Supports OHLCV (candlestick) data generation
 */

import { EventEmitter } from 'events';
import { logger } from '../utils/logger';
import { metricsService } from './metricsService';
import { getOrderMonitoringService } from './orderMonitoringService';
import webSocketManager from './webSocketManager';

export interface PriceData {
  tokenId: string;
  price: number;
  volume24h?: number;
  priceChange24h?: number;
  timestamp: number;
  source: 'polymarket' | 'dexscreener' | 'manual';
}

export interface OHLCVData {
  tokenId: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp: number;
  interval: '1m' | '5m' | '15m' | '1h' | '4h' | '1d';
}

interface PriceHistoryEntry {
  price: number;
  volume?: number;
  timestamp: number;
}

class PriceFeedService extends EventEmitter {
  private fetchInterval: NodeJS.Timeout | null = null;
  private priceHistory: Map<string, PriceHistoryEntry[]> = new Map();
  private currentPrices: Map<string, PriceData> = new Map();
  private watchlist: Set<string> = new Set();

  // Configuration
  private readonly FETCH_INTERVAL_MS = 10000; // 10 seconds
  private readonly HISTORY_RETENTION_MS = 24 * 60 * 60 * 1000; // 24 hours
  private readonly MAX_HISTORY_ENTRIES = 10000;

  /**
   * Start price feed service
   */
  start(): void {
    if (this.fetchInterval) {
      logger.warn('⚠️  Price feed already running');
      return;
    }

    logger.info('📡 Starting real-time price feed service...');
    logger.info(`  - Fetch interval: ${this.FETCH_INTERVAL_MS}ms`);
    logger.info(`  - History retention: ${this.HISTORY_RETENTION_MS / 1000}s`);

    this.fetchInterval = setInterval(async () => {
      await this.fetchAllPrices();
    }, this.FETCH_INTERVAL_MS);

    // Initial fetch
    this.fetchAllPrices();

    // Clean up old history every hour
    setInterval(() => {
      this.cleanupOldHistory();
    }, 60 * 60 * 1000);
  }

  /**
   * Stop price feed service
   */
  stop(): void {
    if (this.fetchInterval) {
      clearInterval(this.fetchInterval);
      this.fetchInterval = null;
      logger.info('⏸️  Price feed service stopped');
    }
  }

  /**
   * Add token/market to watchlist
   */
  addToWatchlist(tokenId: string): void {
    this.watchlist.add(tokenId);
    logger.info(`➕ Added ${tokenId} to price watchlist`);
  }

  /**
   * Remove token/market from watchlist
   */
  removeFromWatchlist(tokenId: string): void {
    this.watchlist.delete(tokenId);
    logger.info(`➖ Removed ${tokenId} from price watchlist`);
  }

  /**
   * Get current price for a token
   */
  getCurrentPrice(tokenId: string): PriceData | null {
    return this.currentPrices.get(tokenId) || null;
  }

  /**
   * Get price history for a token
   */
  getPriceHistory(tokenId: string, limit?: number): PriceHistoryEntry[] {
    const history = this.priceHistory.get(tokenId) || [];
    if (limit) {
      return history.slice(-limit);
    }
    return history;
  }

  /**
   * Get OHLCV data for charting
   */
  getOHLCV(tokenId: string, interval: OHLCVData['interval'], limit: number = 100): OHLCVData[] {
    const history = this.getPriceHistory(tokenId);
    if (history.length === 0) return [];

    const intervalMs = this.getIntervalMs(interval);
    const ohlcvData: OHLCVData[] = [];

    // Group prices into intervals
    const now = Date.now();
    const startTime = now - (limit * intervalMs);

    for (let i = 0; i < limit; i++) {
      const intervalStart = startTime + (i * intervalMs);
      const intervalEnd = intervalStart + intervalMs;

      const intervalPrices = history.filter(
        (entry) => entry.timestamp >= intervalStart && entry.timestamp < intervalEnd
      );

      if (intervalPrices.length > 0) {
        const open = intervalPrices[0].price;
        const close = intervalPrices[intervalPrices.length - 1].price;
        const high = Math.max(...intervalPrices.map((p) => p.price));
        const low = Math.min(...intervalPrices.map((p) => p.price));
        const volume = intervalPrices.reduce((sum, p) => sum + (p.volume || 0), 0);

        ohlcvData.push({
          tokenId,
          open,
          high,
          low,
          close,
          volume,
          timestamp: intervalStart,
          interval,
        });
      }
    }

    return ohlcvData;
  }

  /**
   * Manually update price (for testing or external sources)
   */
  updatePrice(priceData: PriceData): void {
    const { tokenId, price, volume24h, priceChange24h, timestamp, source } = priceData;

    // Update current price
    this.currentPrices.set(tokenId, priceData);

    // Add to history
    if (!this.priceHistory.has(tokenId)) {
      this.priceHistory.set(tokenId, []);
    }

    const history = this.priceHistory.get(tokenId)!;
    history.push({
      price,
      volume: volume24h,
      timestamp,
    });

    // Limit history size
    if (history.length > this.MAX_HISTORY_ENTRIES) {
      history.shift();
    }

    // Update order monitoring service
    const orderMonitoring = getOrderMonitoringService();
    orderMonitoring.updatePrice(tokenId, price);

    // Broadcast via WebSocket to all connected clients
    webSocketManager.sendPriceUpdate(priceData);

    // Emit price update event
    this.emit('priceUpdate', priceData);

    logger.debug(`📊 Price updated: ${tokenId} = $${price.toFixed(4)} (${source})`);
  }

  /**
   * Fetch prices for all tokens in watchlist
   */
  private async fetchAllPrices(): Promise<void> {
    if (this.watchlist.size === 0) {
      return;
    }

    try {
      logger.debug(`🔄 Fetching prices for ${this.watchlist.size} tokens...`);

      // Fetch from all sources in parallel
      const fetchPromises = Array.from(this.watchlist).map((tokenId) =>
        this.fetchPriceForToken(tokenId)
      );

      await Promise.allSettled(fetchPromises);

    } catch (error) {
      logger.error('Failed to fetch prices:', error);
    }
  }

  /**
   * Fetch price for a single token from multiple sources
   */
  private async fetchPriceForToken(tokenId: string): Promise<void> {
    try {
      // Try Polymarket first (if tokenId looks like a Polymarket token)
      if (tokenId.startsWith('0x') || tokenId.includes('-')) {
        const polymarketPrice = await this.fetchPolymarketPrice(tokenId);
        if (polymarketPrice) {
          this.updatePrice(polymarketPrice);
          return;
        }
      }

      // Try DexScreener for other tokens
      const dexscreenerPrice = await this.fetchDexScreenerPrice(tokenId);
      if (dexscreenerPrice) {
        this.updatePrice(dexscreenerPrice);
        return;
      }

      logger.debug(`⚠️  No price data found for ${tokenId}`);

    } catch (error) {
      logger.error(`Failed to fetch price for ${tokenId}:`, error);
    }
  }

  /**
   * Fetch price from Polymarket
   */
  private async fetchPolymarketPrice(tokenId: string): Promise<PriceData | null> {
    try {
      // TODO: Integrate with Polymarket Gamma API
      // For now, return null to use other sources
      return null;

    } catch (error) {
      logger.error(`Polymarket price fetch failed for ${tokenId}:`, error);
      return null;
    }
  }

  /**
   * Fetch price from DexScreener
   */
  private async fetchDexScreenerPrice(tokenAddress: string): Promise<PriceData | null> {
    try {
      const response = await fetch(
        `https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();

      if (!data.pairs || data.pairs.length === 0) {
        return null;
      }

      // Use the first pair (usually highest liquidity)
      const pair = data.pairs[0];

      return {
        tokenId: tokenAddress,
        price: parseFloat(pair.priceUsd),
        volume24h: parseFloat(pair.volume?.h24 || 0),
        priceChange24h: parseFloat(pair.priceChange?.h24 || 0),
        timestamp: Date.now(),
        source: 'dexscreener',
      };

    } catch (error) {
      logger.error(`DexScreener price fetch failed for ${tokenAddress}:`, error);
      return null;
    }
  }

  /**
   * Clean up old price history
   */
  private cleanupOldHistory(): void {
    const cutoffTime = Date.now() - this.HISTORY_RETENTION_MS;
    let totalRemoved = 0;

    for (const [tokenId, history] of this.priceHistory.entries()) {
      const originalLength = history.length;
      const filteredHistory = history.filter((entry) => entry.timestamp >= cutoffTime);

      this.priceHistory.set(tokenId, filteredHistory);
      totalRemoved += originalLength - filteredHistory.length;
    }

    if (totalRemoved > 0) {
      logger.info(`🧹 Cleaned up ${totalRemoved} old price entries`);
    }
  }

  /**
   * Convert interval string to milliseconds
   */
  private getIntervalMs(interval: OHLCVData['interval']): number {
    const intervals: Record<OHLCVData['interval'], number> = {
      '1m': 60 * 1000,
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '4h': 4 * 60 * 60 * 1000,
      '1d': 24 * 60 * 60 * 1000,
    };

    return intervals[interval];
  }

  /**
   * Get service statistics
   */
  getStats(): {
    watchlistSize: number;
    trackedTokens: number;
    totalHistoryEntries: number;
    oldestTimestamp: number | null;
    newestTimestamp: number | null;
  } {
    let totalEntries = 0;
    let oldest: number | null = null;
    let newest: number | null = null;

    for (const history of this.priceHistory.values()) {
      totalEntries += history.length;

      if (history.length > 0) {
        const firstTimestamp = history[0].timestamp;
        const lastTimestamp = history[history.length - 1].timestamp;

        if (oldest === null || firstTimestamp < oldest) {
          oldest = firstTimestamp;
        }

        if (newest === null || lastTimestamp > newest) {
          newest = lastTimestamp;
        }
      }
    }

    return {
      watchlistSize: this.watchlist.size,
      trackedTokens: this.priceHistory.size,
      totalHistoryEntries: totalEntries,
      oldestTimestamp: oldest,
      newestTimestamp: newest,
    };
  }
}

// Singleton instance
let priceFeedService: PriceFeedService | null = null;

/**
 * Get price feed service instance
 */
export function getPriceFeedService(): PriceFeedService {
  if (!priceFeedService) {
    priceFeedService = new PriceFeedService();
  }
  return priceFeedService;
}

/**
 * Initialize and start price feed
 */
export function initializePriceFeed(): PriceFeedService {
  const service = getPriceFeedService();
  service.start();
  return service;
}

export default PriceFeedService;
