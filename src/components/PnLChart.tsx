"use client";

import { useEffect, useRef, useState } from "react";
import { createChart, ColorType, IChartApi, ISeriesApi, AreaSeries } from "lightweight-charts";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";

interface PnLChartProps {
  address: string;
}

export function PnLChart({ address }: PnLChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalPnl, setTotalPnl] = useState(0);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`/api/traders/${address}/pnl`);
        const data = await res.json();
        
        if (Array.isArray(data) && chartContainerRef.current) {
          setTotalPnl(data[data.length - 1]?.value || 0);
          
          if (!chartRef.current) {
            const chart = createChart(chartContainerRef.current, {
              layout: {
                background: { type: ColorType.Solid, color: "transparent" },
                textColor: "#94a3b8",
              },
              grid: {
                vertLines: { visible: false },
                horzLines: { color: "#1e293b" },
              },
              width: chartContainerRef.current.clientWidth,
              height: 300,
              timeScale: {
                borderVisible: false,
                timeVisible: true,
                secondsVisible: false,
              },
              rightPriceScale: {
                borderVisible: false,
              },
              handleScroll: false,
              handleScale: false,
            });

            const isPositive = (data[data.length - 1]?.value || 0) >= 0;
            const themeColor = isPositive ? "#10b981" : "#ef4444";

            const areaSeries = chart.addSeries(AreaSeries, {
              lineColor: themeColor,
              topColor: `${themeColor}44`,
              bottomColor: `${themeColor}00`,
              lineWidth: 2,
            });

            areaSeries.setData(data);
            chart.timeScale().fitContent();

            seriesRef.current = areaSeries;
            chartRef.current = chart;

            const handleResize = () => {
              if (chartContainerRef.current) {
                chart.applyOptions({ width: chartContainerRef.current.clientWidth });
              }
            };

            window.addEventListener("resize", handleResize);
            setLoading(false);
          }
        }
      } catch (error) {
        console.error("Failed to load PnL history:", error);
      }
    };

    fetchHistory();

    return () => {
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [address]);

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Cumulative Realized P&L
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            <h3 className={`text-2xl font-bold tabular-nums ${totalPnl >= 0 ? "text-chart-2" : "text-destructive"}`}>
              {totalPnl >= 0 ? "+" : ""}${Math.abs(totalPnl).toFixed(2)}
            </h3>
            <span className="text-xs text-muted-foreground">USD</span>
          </div>
        </div>
        <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${totalPnl >= 0 ? "bg-chart-2/10 text-chart-2" : "bg-destructive/10 text-destructive"}`}>
          {totalPnl >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
          {totalPnl >= 0 ? "Profit" : "Loss"}
        </div>
      </div>

      <div className="relative rounded-xl border border-border bg-card/30 p-2">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm">
            <Activity className="size-6 animate-pulse text-primary" />
          </div>
        )}
        <div ref={chartContainerRef} className="w-full" />
      </div>
    </div>
  );
}
