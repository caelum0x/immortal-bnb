import { useEffect, useState } from "react";
import PerformanceChart from "./components/PerformanceChart";
import RecentTrades from "./components/RecentTrades";
import Navbar from "./components/Navbar";
import api from "./services/api";

function ChartSkeleton() {
  return (
    <div className="relative w-full flex flex-1 border-r-2 border-black">
      <div className="absolute left-1/2 top-2 -translate-x-1/2 z-10">
        <div className="h-4 w-48 rounded bg-gray-300 animate-pulse" />
      </div>
      <div className="w-full h-full flex items-center justify-center p-8">
        <div className="w-full h-full rounded bg-linear-to-br from-gray-100 to-gray-200 animate-pulse" />
      </div>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="hidden md:block md:w-[280px] lg:w-[320px] xl:w-[380px] 2xl:w-[500px] shrink-0 bg-surface md:overflow-hidden">
      <div className="flex h-full flex-col gap-4 overflow-y-auto p-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="px-2 py-2">
            <div className="flex space-x-2">
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <div className="h-4 w-24 rounded bg-gray-300 animate-pulse" />
                  <div className="h-3 w-20 rounded bg-gray-200 animate-pulse" />
                </div>
                <div className="rounded p-3 border border-gray-200 bg-gray-50">
                  <div className="space-y-2">
                    <div className="h-3 w-full rounded bg-gray-200 animate-pulse" />
                    <div className="h-3 w-5/6 rounded bg-gray-200 animate-pulse" />
                    <div className="h-3 w-4/6 rounded bg-gray-200 animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [tradesData, setTradesData] = useState<any[] | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch bot stats and trades from our backend API
        const [stats, tradesResponse] = await Promise.all([
          api.getStats(),
          api.getTrades(30),
        ]);

        // Transform stats data for performance chart
        const perfData = {
          totalPL: stats.totalProfitLoss,
          winRate: stats.winRate,
          totalTrades: stats.totalTrades,
          profitableTrades: stats.profitableTrades,
          losingTrades: stats.losingTrades,
        };
        setPerformanceData(perfData);
        setLastUpdated(new Date());

        // Set trades data
        setTradesData(tradesResponse.trades);
      } catch (err) {
        console.error("Error fetching data:", err);
        // Set empty data on error to show UI
        setPerformanceData({
          totalPL: 0,
          winRate: 0,
          totalTrades: 0,
          profitableTrades: 0,
          losingTrades: 0,
        });
        setTradesData([]);
      }
    }

    fetchData();
    const interval = setInterval(fetchData, 30 * 1000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const loading = !performanceData || !tradesData;

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-linear-to-b from-gray-50 to-gray-100 text-gray-900 font-[system-ui]">
      <Navbar />
      <div className="flex min-h-0 flex-1 flex-col md:flex-row overflow-y-auto md:overflow-hidden">
        {loading ? (
          <>
            <ChartSkeleton />
            <ListSkeleton />
          </>
        ) : (
          <>
            <PerformanceChart data={performanceData} trades={tradesData} />
            <RecentTrades data={tradesData} />
          </>
        )}
      </div>
      {lastUpdated && (
        <div className="py-2 text-sm text-center text-gray-500 border-t-2 border-black">
          Last updated:{" "}
          <span className="font-medium text-gray-700">
            {new Date(lastUpdated).toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      )}
    </div>
  );
}
