// src/blockchain/eventListener.ts
// Real-time blockchain event listener for dynamic token discovery
// Listens to PancakeSwap factory events, new pair creation, and high-volume activities

import { ethers } from 'ethers';
import { logger, logError } from '../utils/logger';
import { CONFIG } from '../config';
import DynamicMarketFetcher from '../data/dynamicMarketFetcher';
import type { DiscoveredToken } from './tokenDiscovery';

export interface NewTokenEvent {
  tokenAddress: string;
  pairAddress: string;
  symbol?: string;
  name?: string;
  blockNumber: number;
  transactionHash: string;
  timestamp: number;
  initialLiquidity?: number;
}

export interface VolumeEvent {
  tokenAddress: string;
  volume: number;
  priceChange: number;
  timestamp: number;
  type: 'spike' | 'sustained' | 'breakout';
}

export interface EventCallback {
  onNewToken?: (event: NewTokenEvent) => void | Promise<void>;
  onVolumeSpike?: (event: VolumeEvent) => void | Promise<void>;
  onLiquidityChange?: (tokenAddress: string, change: number) => void | Promise<void>;
}

/**
 * Real-time blockchain event listener for automated trading
 * Provides instant detection of new tokens and market events
 */
export class BlockchainEventListener {
  private provider: ethers.WebSocketProvider;
  private factoryContract: ethers.Contract;
  private marketFetcher: DynamicMarketFetcher;
  private callbacks: EventCallback;
  private isListening = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private knownPairs = new Set<string>();
  private volumeTracker = new Map<string, { volume: number; timestamp: number }>();

  // Contract addresses and ABIs
  private readonly FACTORY_ADDRESS = CONFIG.PANCAKE_FACTORY;
  private readonly FACTORY_ABI = [
    'event PoolCreated(address indexed token0, address indexed token1, uint24 indexed fee, int24 tickSpacing, address pool)',
    'event PairCreated(address indexed token0, address indexed token1, address pair, uint256)',
  ];

  private readonly PAIR_ABI = [
    'event Mint(address indexed sender, uint256 amount0, uint256 amount1)',
    'event Swap(address indexed sender, uint256 amount0In, uint256 amount1In, uint256 amount0Out, uint256 amount1Out, address indexed to)',
    'function token0() external view returns (address)',
    'function token1() external view returns (address)',
    'function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)'
  ];

  constructor(callbacks: EventCallback = {}) {
    this.callbacks = callbacks;
    this.marketFetcher = new DynamicMarketFetcher();
    
    // Initialize WebSocket provider
    const wsUrl = CONFIG.RPC_URL.replace('https://', 'wss://').replace('http://', 'ws://');
    this.provider = new ethers.WebSocketProvider(wsUrl);
    
    // Initialize factory contract
    this.factoryContract = new ethers.Contract(
      this.FACTORY_ADDRESS,
      this.FACTORY_ABI,
      this.provider
    );

    // Setup connection error handling
    this.setupConnectionHandling();
    
    logger.info('👂 Blockchain Event Listener initialized');
    logger.info(`  WebSocket: ${wsUrl}`);
    logger.info(`  Factory: ${this.FACTORY_ADDRESS}`);
  }

  /**
   * Start listening to blockchain events
   */
  async startListening(): Promise<void> {
    if (this.isListening) {
      logger.warn('Event listener is already running');
      return;
    }

    try {
      logger.info('🚀 Starting blockchain event listener...');
      
      this.isListening = true;
      this.reconnectAttempts = 0;

      // Start listening to different event types
      await Promise.all([
        this.listenToNewPairs(),
        this.listenToVolumeEvents(),
        this.startVolumeTracking()
      ]);

      logger.info('✅ Event listener started successfully');
    } catch (error) {
      logError('startListening', error as Error);
      this.isListening = false;
      throw error;
    }
  }

  /**
   * Stop listening to events
   */
  async stopListening(): Promise<void> {
    logger.info('🛑 Stopping blockchain event listener...');
    
    this.isListening = false;
    
    try {
      // Remove all listeners
      this.factoryContract.removeAllListeners();
      
      // Close WebSocket connection
      if (this.provider.websocket) {
        this.provider.websocket.close();
      }
      
      logger.info('✅ Event listener stopped');
    } catch (error) {
      logError('stopListening', error as Error);
    }
  }

  /**
   * Listen to new pair creation events
   */
  private async listenToNewPairs(): Promise<void> {
    try {
      logger.info('👂 Listening for new pair creation events...');
      
      // Listen to V3 PoolCreated events
      this.factoryContract.on('PoolCreated', async (token0, token1, fee, tickSpacing, pool, event) => {
        if (!this.isListening) return;
        
        try {
          await this.handleNewPairEvent(token0, token1, pool, event);
        } catch (error) {
          logError('PoolCreated handler', error as Error);
        }
      });

      // Also listen to V2 PairCreated events if available
      this.factoryContract.on('PairCreated', async (token0, token1, pair, pairLength, event) => {
        if (!this.isListening) return;
        
        try {
          await this.handleNewPairEvent(token0, token1, pair, event);
        } catch (error) {
          logError('PairCreated handler', error as Error);
        }
      });
      
    } catch (error) {
      logError('listenToNewPairs', error as Error);
    }
  }

  /**
   * Handle new pair creation event
   */
  private async handleNewPairEvent(
    token0: string,
    token1: string,
    pairAddress: string,
    event: any
  ): Promise<void> {
    try {
      const wbnbAddress = CONFIG.WBNB_ADDRESS.toLowerCase();
      
      // Only process pairs that include WBNB
      let newTokenAddress: string;
      if (token0.toLowerCase() === wbnbAddress) {
        newTokenAddress = token1;
      } else if (token1.toLowerCase() === wbnbAddress) {
        newTokenAddress = token0;
      } else {
        return; // Skip non-WBNB pairs
      }

      // Avoid duplicate processing
      if (this.knownPairs.has(pairAddress.toLowerCase())) {
        return;
      }
      this.knownPairs.add(pairAddress.toLowerCase());

      logger.info(`🆕 New pair detected: ${pairAddress}`);
      logger.info(`  New token: ${newTokenAddress}`);
      logger.info(`  Block: ${event.blockNumber}`);

      // Create event object
      const newTokenEvent: NewTokenEvent = {
        tokenAddress: newTokenAddress,
        pairAddress,
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash,
        timestamp: Date.now()
      };

      // Get additional token info after a short delay (allow indexing)
      setTimeout(async () => {
        try {
          await this.enrichTokenEvent(newTokenEvent);
          
          // Call callback if provided
          if (this.callbacks.onNewToken) {
            await this.callbacks.onNewToken(newTokenEvent);
          }
        } catch (error) {
          logError('enrichTokenEvent', error as Error);
        }
      }, 5000); // 5 second delay

    } catch (error) {
      logError('handleNewPairEvent', error as Error);
    }
  }

  /**
   * Enrich token event with additional data
   */
  private async enrichTokenEvent(event: NewTokenEvent): Promise<void> {
    try {
      // Try to get token info from DexScreener
      const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${event.tokenAddress}`);
      if (response.ok) {
        const data = await response.json();
        if (data.pairs && data.pairs.length > 0) {
          const pair = data.pairs[0];
          event.symbol = pair.baseToken?.symbol;
          event.name = pair.baseToken?.name;
          event.initialLiquidity = pair.liquidity?.usd;
          
          logger.info(`  📊 Token enriched: ${event.symbol} ($${event.initialLiquidity?.toFixed(0)} liquidity)`);
        }
      }
    } catch (error) {
      // Silently fail - enrichment is optional
      logger.warn(`Failed to enrich token ${event.tokenAddress}: ${error}`);
    }
  }

  /**
   * Listen to volume spike events
   */
  private async listenToVolumeEvents(): Promise<void> {
    try {
      logger.info('📈 Starting volume spike detection...');
      
      // This would require listening to swap events on multiple pairs
      // For now, we'll use the volume tracking system
      
    } catch (error) {
      logError('listenToVolumeEvents', error as Error);
    }
  }

  /**
   * Start volume tracking system
   */
  private async startVolumeTracking(): Promise<void> {
    if (!this.isListening) return;

    try {
      // Get current market snapshot
      const marketSnapshot = await this.marketFetcher.getMarketSnapshot();
      
      // Track volume changes every minute
      setInterval(async () => {
        if (!this.isListening) return;
        
        try {
          await this.checkVolumeSpikes();
        } catch (error) {
          logError('checkVolumeSpikes', error as Error);
        }
      }, 60000); // Check every minute
      
    } catch (error) {
      logError('startVolumeTracking', error as Error);
    }
  }

  /**
   * Check for volume spikes in tracked tokens
   */
  private async checkVolumeSpikes(): Promise<void> {
    try {
      // Get trending tokens to check for volume spikes
      const strategies = this.marketFetcher.getDefaultStrategies();
      const firstStrategy = strategies[0];
      if (!firstStrategy) return;
      
      const trendingTokens = await this.marketFetcher.discoverWithStrategies(
        [firstStrategy], // Just use trending strategy
        0.1, // Dummy amount
        20 // Check top 20
      );

      for (const token of trendingTokens) {
        const tokenAddress = token.tokenAddress.toLowerCase();
        const currentVolume = token.volume24h;
        const lastTracked = this.volumeTracker.get(tokenAddress);

        if (lastTracked) {
          const volumeChange = (currentVolume - lastTracked.volume) / lastTracked.volume;
          const timeElapsed = Date.now() - lastTracked.timestamp;

          // Detect significant volume increases
          if (volumeChange > 2 && timeElapsed < 3600000) { // 200% increase in 1 hour
            const volumeEvent: VolumeEvent = {
              tokenAddress: token.tokenAddress,
              volume: currentVolume,
              priceChange: token.priceChange24h,
              timestamp: Date.now(),
              type: volumeChange > 5 ? 'spike' : 'breakout'
            };

            logger.info(`📈 Volume ${volumeEvent.type} detected: ${token.symbol} (+${(volumeChange * 100).toFixed(0)}%)`);

            if (this.callbacks.onVolumeSpike) {
              await this.callbacks.onVolumeSpike(volumeEvent);
            }
          }
        }

        // Update tracking
        this.volumeTracker.set(tokenAddress, {
          volume: currentVolume,
          timestamp: Date.now()
        });
      }
    } catch (error) {
      logError('checkVolumeSpikes', error as Error);
    }
  }

  /**
   * Setup WebSocket connection error handling
   */
  private setupConnectionHandling(): void {
    try {
      if (this.provider.websocket && 'on' in this.provider.websocket) {
        const ws = this.provider.websocket as any;
        
        ws.on('error', (error: Error) => {
          logError('WebSocket error', error);
          this.handleReconnection();
        });

        ws.on('close', () => {
          logger.warn('WebSocket connection closed');
          if (this.isListening) {
            this.handleReconnection();
          }
        });
      }
    } catch (error) {
      logError('setupConnectionHandling', error as Error);
    }
  }

  /**
   * Handle WebSocket reconnection
   */
  private async handleReconnection(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('Max reconnection attempts reached');
      this.isListening = false;
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000); // Exponential backoff, max 30s

    logger.info(`Attempting reconnection ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms...`);

    setTimeout(async () => {
      try {
        // Reinitialize WebSocket provider
        const wsUrl = CONFIG.RPC_URL.replace('https://', 'wss://').replace('http://', 'ws://');
        this.provider = new ethers.WebSocketProvider(wsUrl);
        
        // Reinitialize factory contract
        this.factoryContract = new ethers.Contract(
          this.FACTORY_ADDRESS,
          this.FACTORY_ABI,
          this.provider
        );

        // Setup connection handling again
        this.setupConnectionHandling();

        // Restart listening
        await this.listenToNewPairs();
        
        logger.info('✅ Reconnection successful');
        this.reconnectAttempts = 0;
      } catch (error) {
        logError('Reconnection failed', error as Error);
        this.handleReconnection();
      }
    }, delay);
  }

  /**
   * Get statistics about tracked events
   */
  getStats(): { knownPairs: number; trackedTokens: number; uptime: number } {
    return {
      knownPairs: this.knownPairs.size,
      trackedTokens: this.volumeTracker.size,
      uptime: this.isListening ? Date.now() : 0
    };
  }
}

export default BlockchainEventListener;
