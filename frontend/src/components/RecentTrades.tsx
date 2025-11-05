import { useState } from 'react';

type TradeMemory = {
  id: string;
  timestamp: number;
  tokenSymbol: string;
  tokenAddress: string;
  action: 'buy' | 'sell';
  amount: number;
  entryPrice: number;
  outcome: 'profit' | 'loss' | 'pending';
  profitLoss?: number;
  aiReasoning: string;
  marketConditions: {
    volume24h: number;
    liquidity: number;
    priceChange24h: number;
    buySellPressure: number;
  };
};

type Props = {
  data: TradeMemory[] | null;
};

const getOutcomeColor = (outcome: string) => {
  if (outcome === 'profit') return '#10b981'; // green
  if (outcome === 'loss') return '#ef4444'; // red
  return '#f59e0b'; // amber for pending
};

const getActionColor = (action: string) => {
  return action === 'buy' ? '#3b82f6' : '#8b5cf6'; // blue for buy, purple for sell
};

export default function RecentTrades({ data }: Props) {
  const [expandedTrades, setExpandedTrades] = useState<Record<string, boolean>>({});

  if (!data) {
    return (
      <div className="flex items-center justify-center h-[400px] text-gray-500 font-medium animate-pulse">
        Loading recent trades...
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px] text-gray-400 font-mono">
        <div className="text-center">
          <p className="text-sm mb-2">No trades yet</p>
          <p className="text-xs">Trades will appear here after bot starts trading</p>
        </div>
      </div>
    );
  }

  const toggleTrade = (tradeId: string) => {
    setExpandedTrades(prev => ({
      ...prev,
      [tradeId]: !prev[tradeId]
    }));
  };

  return (
    <div className="hidden md:block md:w-[280px] lg:w-[320px] xl:w-[380px] 2xl:w-[500px] shrink-0 bg-gray-50 md:overflow-hidden border-l-2 border-black">
      <div className="flex h-full flex-col overflow-y-auto p-4">
        <h3 className="text-sm font-bold mb-4 font-mono text-black sticky top-0 bg-gray-50 pb-2">
          RECENT TRADES ({data.length})
        </h3>

        <div className="space-y-3">
          {data.map((trade) => {
            const outcomeColor = getOutcomeColor(trade.outcome);
            const actionColor = getActionColor(trade.action);
            const isExpanded = expandedTrades[trade.id];

            return (
              <div
                key={trade.id}
                className="transition-all duration-200 border-2 border-black rounded-lg overflow-hidden bg-white hover:shadow-lg"
              >
                <div
                  className="cursor-pointer px-3 py-3"
                  onClick={() => toggleTrade(trade.id)}
                >
                  {/* Header */}
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-sm font-bold uppercase"
                        style={{ color: actionColor }}
                      >
                        {trade.action}
                      </span>
                      <span className="text-sm font-bold text-black">
                        {trade.tokenSymbol}
                      </span>
                    </div>
                    <span className="text-[9px] text-gray-500 font-mono">
                      {new Date(trade.timestamp).toLocaleString('en-US', {
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                      })}
                    </span>
                  </div>

                  {/* Outcome Badge */}
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="px-2 py-1 rounded text-xs font-bold text-white uppercase"
                      style={{ backgroundColor: outcomeColor }}
                    >
                      {trade.outcome}
                      {trade.profitLoss !== undefined && trade.outcome !== 'pending' &&
                        ` ${trade.profitLoss >= 0 ? '+' : ''}${trade.profitLoss.toFixed(2)}%`
                      }
                    </div>
                    <span className="text-xs text-gray-600 font-mono">
                      {trade.amount.toFixed(4)} BNB
                    </span>
                  </div>

                  {/* AI Reasoning Preview */}
                  <div className="text-xs text-gray-700 line-clamp-2 mb-1">
                    {trade.aiReasoning}
                  </div>

                  {!isExpanded && (
                    <div className="text-[9px] text-gray-400 italic text-right">
                      click to expand
                    </div>
                  )}
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t-2 border-gray-200 px-3 py-3 bg-gray-50 space-y-3">
                    {/* Full Reasoning */}
                    <div>
                      <div className="text-[10px] font-bold text-gray-600 uppercase mb-1">
                        AI Reasoning
                      </div>
                      <div className="text-xs text-gray-800 font-mono bg-white p-2 rounded border border-gray-200">
                        {trade.aiReasoning}
                      </div>
                    </div>

                    {/* Trade Details */}
                    <div>
                      <div className="text-[10px] font-bold text-gray-600 uppercase mb-1">
                        Trade Details
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                        <div>
                          <span className="text-gray-500">Entry Price:</span>
                          <span className="ml-1 font-bold">${trade.entryPrice.toFixed(6)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Amount:</span>
                          <span className="ml-1 font-bold">{trade.amount.toFixed(4)} BNB</span>
                        </div>
                      </div>
                    </div>

                    {/* Market Conditions */}
                    <div>
                      <div className="text-[10px] font-bold text-gray-600 uppercase mb-1">
                        Market Conditions
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-[10px] font-mono">
                        <div>
                          <span className="text-gray-500">Volume 24h:</span>
                          <span className="ml-1">${(trade.marketConditions.volume24h / 1000).toFixed(1)}k</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Liquidity:</span>
                          <span className="ml-1">${(trade.marketConditions.liquidity / 1000).toFixed(1)}k</span>
                        </div>
                        <div>
                          <span className="text-gray-500">24h Change:</span>
                          <span className={`ml-1 ${trade.marketConditions.priceChange24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {trade.marketConditions.priceChange24h >= 0 ? '+' : ''}{trade.marketConditions.priceChange24h.toFixed(2)}%
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Buy Pressure:</span>
                          <span className="ml-1">{(trade.marketConditions.buySellPressure * 100).toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>

                    {/* Token Address */}
                    <div>
                      <div className="text-[10px] font-bold text-gray-600 uppercase mb-1">
                        Token Address
                      </div>
                      <div className="text-[9px] font-mono text-gray-600 break-all bg-white p-2 rounded border border-gray-200">
                        {trade.tokenAddress}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
