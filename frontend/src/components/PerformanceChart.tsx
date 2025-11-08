import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, ReferenceLine } from "recharts";

type PerformanceData = {
  totalPL: number;
  winRate: number;
  totalTrades: number;
  profitableTrades: number;
  losingTrades: number;
};

type Trade = {
  timestamp: number;
  outcome: 'profit' | 'loss' | 'pending';
  profitLoss?: number;
  amount: number;
};

type Props = {
  data: PerformanceData;
  trades?: Trade[];
};

export default function PerformanceChart({ data, trades = [] }: Props) {
  const chartData = useMemo(() => {
    if (!trades || trades.length === 0) {
      return [{ time: Date.now(), value: 0, label: 'Start' }];
    }

    let cumulative = 0;
    return trades
      .filter(t => t.outcome !== 'pending' && t.profitLoss !== undefined)
      .sort((a, b) => a.timestamp - b.timestamp)
      .map(trade => {
        cumulative += trade.profitLoss || 0;
        return {
          time: trade.timestamp,
          value: cumulative,
          label: new Date(trade.timestamp).toLocaleDateString()
        };
      });
  }, [trades]);

  const maxValue = Math.max(...chartData.map(d => d.value), 10);
  const minValue = Math.min(...chartData.map(d => d.value), -10);

  return (
    <div className="relative w-full flex flex-1 border-r-2 border-black bg-white">
      <div className="absolute left-1/2 top-4 -translate-x-1/2 z-10">
        <h2 className="text-sm font-bold text-black font-mono tracking-wide">
          TOTAL PROFIT/LOSS
        </h2>
      </div>

      <div className="absolute top-14 left-4 z-10 bg-white/90 backdrop-blur-sm border-2 border-black p-3 rounded shadow-lg">
        <div className="space-y-1 text-xs font-mono">
          <div className="flex justify-between gap-4">
            <span className="text-gray-600">Total P/L:</span>
            <span className={`font-bold ${data.totalPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {data.totalPL >= 0 ? '+' : ''}{data.totalPL.toFixed(2)}%
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-600">Win Rate:</span>
            <span className="font-bold text-blue-600">{data.winRate.toFixed(1)}%</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-600">Trades:</span>
            <span className="font-bold">{data.totalTrades}</span>
          </div>
          <div className="flex justify-between gap-4 text-[10px] text-gray-500">
            <span>Wins: {data.profitableTrades}</span>
            <span>Losses: {data.losingTrades}</span>
          </div>
        </div>
      </div>

      {chartData.length === 1 ? (
        <div className="flex items-center justify-center w-full h-full">
          <div className="text-center">
            <p className="text-gray-400 font-mono text-sm mb-2">No trades yet</p>
            <p className="text-gray-300 font-mono text-xs">Chart will appear after first completed trade</p>
          </div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 60, right: 40, bottom: 40, left: 40 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 0, 0, 0.1)" strokeWidth={1} />

            <XAxis
              dataKey="time"
              type="number"
              domain={["auto", "auto"]}
              tickFormatter={(v: number) => {
                const date = new Date(v);
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit' });
              }}
              tick={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 600, fill: 'rgba(0, 0, 0, 0.7)' }}
              stroke="rgba(0, 0, 0, 0.3)"
              strokeWidth={2}
            />

            <YAxis
              tick={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 600, fill: 'rgba(0, 0, 0, 0.7)' }}
              tickFormatter={(v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`}
              domain={[minValue * 1.2, maxValue * 1.2]}
              stroke="rgba(0, 0, 0, 0.3)"
              strokeWidth={2}
            />

            <Tooltip
              labelFormatter={(label: any) => new Date(label).toLocaleString()}
              formatter={(value: any) => [`${value >= 0 ? '+' : ''}${value.toFixed(2)}%`, 'P/L']}
              contentStyle={{
                backgroundColor: 'white',
                border: '2px solid black',
                borderRadius: '4px',
                fontFamily: 'monospace',
                fontSize: '12px',
                padding: '8px 12px'
              }}
            />

            <ReferenceLine
              y={0}
              stroke="rgba(0, 0, 0, 0.4)"
              strokeWidth={2}
              strokeDasharray="5 5"
              label={{ value: 'Break Even', position: 'right', style: { fontSize: 10, fill: 'rgba(0,0,0,0.5)', fontFamily: 'monospace' }}}
            />

            <Line
              type="monotone"
              dataKey="value"
              dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#1e40af' }}
              activeDot={{ r: 6 }}
              strokeWidth={3}
              stroke="#3b82f6"
              strokeLinecap="round"
              strokeLinejoin="round"
              isAnimationActive={true}
              animationDuration={800}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
