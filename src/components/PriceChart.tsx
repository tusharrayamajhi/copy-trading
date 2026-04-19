// src/components/PriceChart.tsx
"use client";
import { useEffect, useRef } from "react";
import { createChart, LineSeries } from "lightweight-charts";

export default function PriceChart({ symbol = "Crypto.SOL/USD" }) {
    const chartRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!chartRef.current) return;
        const chart = createChart(chartRef.current, {
            width: chartRef.current.clientWidth,
            height: 400,
            layout: { background: { color: "#0f172a" }, textColor: "#e2e8f0" },
            grid: { vertLines: { color: "#1e293b" }, horzLines: { color: "#1e293b" } },
        });
        const series = chart.addSeries(LineSeries, { color: "#8b5cf6" });

        // Poll Pyth Hermes for price
        const fetchPrice = async () => {
            const res = await fetch(
                `https://hermes.pyth.network/v2/updates/price/latest?ids[]=0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d`
                // ^ SOL/USD feed ID on devnet
            );
            const data = await res.json();
            const price = data.parsed[0].price;
            const p = Number(price.price) * 10 ** price.expo;
            const now = Math.floor(Date.now() / 1000);
            series.update({ time: now as any, value: p });
        };

        fetchPrice();
        const interval = setInterval(fetchPrice, 3000);
        return () => {
            clearInterval(interval);
            chart.remove();
        };
    }, []);

    return <div ref={chartRef} className="w-full rounded-xl overflow-hidden" />;
}