/**
 * Comprehensive Type Definitions for Polymarket Real-Time Data
 * Based on official Polymarket real-time-data-client specification
 */

// ============================================================================
// Activity Types
// ============================================================================

export interface Trade {
    asset: string;
    bio?: string;
    conditionId: string;
    eventSlug?: string;
    icon?: string;
    name?: string;
    outcome: string;
    outcomeIndex: number;
    price: number;
    profileImage?: string;
    proxyWallet?: string;
    pseudonym?: string;
    side: 'BUY' | 'SELL';
    size: number;
    slug?: string;
    timestamp: number;
    title?: string;
    transactionHash?: string;
}

// ============================================================================
// Comments Types
// ============================================================================

export interface Comment {
    id: string;
    body: string;
    parentEntityType: 'Event' | 'Series';
    parentEntityID: number;
    parentCommentID?: string;
    userAddress: string;
    replyAddress?: string;
    createdAt: string;
    updatedAt: string;
}

export interface Reaction {
    id: string;
    commentID: number;
    reactionType: string;
    icon: string;
    userAddress: string;
    createdAt: string;
}

// ============================================================================
// RFQ (Request for Quote) Types
// ============================================================================

export interface Request {
    requestId: string;
    proxyAddress: string;
    market: string;
    token: string;
    complement: string;
    state: string;
    side: 'BUY' | 'SELL';
    sizeIn: number;
    sizeOut: number;
    price: number;
    expiry: number;
}

export interface Quote {
    quoteId: string;
    requestId: string;
    proxyAddress: string;
    token: string;
    state: string;
    side: 'BUY' | 'SELL';
    sizeIn: number;
    sizeOut: number;
    condition: string;
    complement: string;
    expiry: number;
}

// ============================================================================
// Price Feed Types
// ============================================================================

export interface CryptoPrice {
    symbol: string;
    timestamp: number;
    value: number;
}

export interface CryptoPriceHistorical {
    symbol: string;
    data: Array<{
        timestamp: number;
        value: number;
    }>;
}

export interface EquityPrice {
    symbol: string;
    timestamp: number;
    value: number;
}

export interface EquityPriceHistorical {
    symbol: string;
    data: Array<{
        timestamp: number;
        value: number;
    }>;
}

// ============================================================================
// CLOB User Types
// ============================================================================

export interface Order {
    asset_id: string;
    created_at: string;
    expiration: string;
    id: string;
    maker_address: string;
    market: string;
    order_type: 'GTC' | 'GTD' | 'FOK' | 'FAK';
    original_size: string;
    outcome: 'YES' | 'NO';
    owner: string;
    price: string;
    side: 'BUY' | 'SELL';
    size_matched: string;
    status: string;
    type: 'PLACEMENT' | 'CANCELLATION' | 'FILL';
}

export interface MakerOrder {
    asset_id: string;
    fee_rate_bps: string;
    maker_address: string;
    matched_amount: string;
    order_id: string;
    outcome: 'YES' | 'NO';
    owner: string;
    price: string;
    side: 'BUY' | 'SELL';
}

export interface UserTrade {
    asset_id: string;
    fee_rate_bps: string;
    id: string;
    last_update: string;
    maker_address: string;
    maker_orders: MakerOrder[];
    market: string;
    match_time: string;
    outcome: 'YES' | 'NO';
    owner: string;
    price: string;
    side: 'BUY' | 'SELL';
    size: string;
    status: string;
    taker_order_id: string;
    transaction_hash: string;
}

// ============================================================================
// CLOB Market Types
// ============================================================================

export interface PriceChange {
    a: string; // asset_id
    h: string; // hash
    p: string; // price
    s: 'BUY' | 'SELL'; // side
    si: string; // size
    ba: string; // best_ask
    bb: string; // best_bid
}

export interface PriceChanges {
    m: string; // market
    pc: PriceChange[];
    t: string; // timestamp
}

export interface OrderbookLevel {
    price: string;
    size: string;
}

export interface AggOrderbook {
    asks: OrderbookLevel[];
    asset_id: string;
    bids: OrderbookLevel[];
    hash: string;
    market: string;
    min_order_size: string;
    neg_risk: boolean;
    tick_size: string;
    timestamp: string;
}

export interface LastTradePrice {
    asset_id: string;
    fee_rate_bps: string;
    market: string;
    price: string;
    side: 'BUY' | 'SELL';
    size: string;
}

export interface TickSizeChange {
    market: string;
    asset_id: string;
    old_tick_size: string;
    new_tick_size: string;
}

export interface ClobMarket {
    market: string;
    asset_ids: [string, string];
    min_order_size: string;
    tick_size: string;
    neg_risk: boolean;
}

// ============================================================================
// Message Type Union
// ============================================================================

export type MessagePayload =
    | Trade
    | Comment
    | Reaction
    | Request
    | Quote
    | CryptoPrice
    | CryptoPriceHistorical
    | EquityPrice
    | EquityPriceHistorical
    | Order
    | UserTrade
    | PriceChanges
    | AggOrderbook
    | LastTradePrice
    | TickSizeChange
    | ClobMarket;

// ============================================================================
// Topic and Type Constants
// ============================================================================

export const Topics = {
    ACTIVITY: 'activity',
    COMMENTS: 'comments',
    RFQ: 'rfq',
    CRYPTO_PRICES: 'crypto_prices',
    CRYPTO_PRICES_CHAINLINK: 'crypto_prices_chainlink',
    EQUITY_PRICES: 'equity_prices',
    CLOB_USER: 'clob_user',
    CLOB_MARKET: 'clob_market',
} as const;

export const ActivityTypes = {
    TRADES: 'trades',
    ORDERS_MATCHED: 'orders_matched',
} as const;

export const CommentsTypes = {
    COMMENT_CREATED: 'comment_created',
    COMMENT_REMOVED: 'comment_removed',
    REACTION_CREATED: 'reaction_created',
    REACTION_REMOVED: 'reaction_removed',
} as const;

export const RFQTypes = {
    REQUEST_CREATED: 'request_created',
    REQUEST_EDITED: 'request_edited',
    REQUEST_CANCELED: 'request_canceled',
    REQUEST_EXPIRED: 'request_expired',
    QUOTE_CREATED: 'quote_created',
    QUOTE_EDITED: 'quote_edited',
    QUOTE_CANCELED: 'quote_canceled',
    QUOTE_EXPIRED: 'quote_expired',
} as const;

export const PriceTypes = {
    UPDATE: 'update',
} as const;

export const ClobUserTypes = {
    ORDER: 'order',
    TRADE: 'trade',
} as const;

export const ClobMarketTypes = {
    PRICE_CHANGE: 'price_change',
    AGG_ORDERBOOK: 'agg_orderbook',
    LAST_TRADE_PRICE: 'last_trade_price',
    TICK_SIZE_CHANGE: 'tick_size_change',
    MARKET_CREATED: 'market_created',
    MARKET_RESOLVED: 'market_resolved',
} as const;

// ============================================================================
// Crypto Symbols
// ============================================================================

export const CryptoSymbols = {
    BTCUSDT: 'BTCUSDT',
    ETHUSDT: 'ETHUSDT',
    XRPUSDT: 'XRPUSDT',
    SOLUSDT: 'SOLUSDT',
    DOGEUSDT: 'DOGEUSDT',
} as const;

// ============================================================================
// Equity Symbols
// ============================================================================

export const EquitySymbols = {
    AAPL: 'AAPL',
    TSLA: 'TSLA',
    MSFT: 'MSFT',
    GOOGL: 'GOOGL',
    AMZN: 'AMZN',
    META: 'META',
    NVDA: 'NVDA',
    NFLX: 'NFLX',
    PLTR: 'PLTR',
    OPEN: 'OPEN',
    RKLB: 'RKLB',
    ABNB: 'ABNB',
} as const;
