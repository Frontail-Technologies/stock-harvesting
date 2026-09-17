"use client";

import { useCurrentDayCandle } from "@/features/market-data";
import { useProgressiveScannerCandles } from "../hooks/use-scanner-data";
import type { Timeframe } from "../types";

type ChartDataThroughLabelProps = {
  symbol: string;
  exchange: string;
  timeframe: Timeframe;
};

function formatDataThrough(dateStr: string) {
  const parsed = new Date(`${dateStr}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeZone: "UTC" }).format(parsed);
}

function formatProviderTimestamp(timestamp: string) {
  const parsed = new Date(timestamp);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(parsed);
}

export function ChartDataThroughLabel({ symbol, exchange, timeframe }: ChartDataThroughLabelProps) {
  const candleQuery = useProgressiveScannerCandles(symbol, timeframe, exchange);
  const currentDayCandleQuery = useCurrentDayCandle(
    { symbol, exchange },
    { enabled: Boolean(symbol) && exchange === "BSE" }
  );

  const provisional = currentDayCandleQuery.candle;
  const showProvisional = Boolean(
    provisional && (!candleQuery.dataThrough || provisional.time > candleQuery.dataThrough)
  );
  const dateStr = showProvisional ? provisional!.time : candleQuery.dataThrough;
  if (!dateStr) {
    if (currentDayCandleQuery.capability?.currentDayCandle !== "unavailable") return null;
    return (
      <span className="hidden shrink-0 whitespace-nowrap text-[11px] text-muted-foreground lg:inline">
        Live/delayed intraday unavailable
      </span>
    );
  }

  const formatted =
    showProvisional && provisional?.lastUpdatedAt
      ? formatProviderTimestamp(provisional.lastUpdatedAt) ?? formatDataThrough(dateStr)
      : formatDataThrough(dateStr);
  if (!formatted) return null;

  return (
    <span className="hidden shrink-0 whitespace-nowrap text-[11px] text-muted-foreground lg:inline">
      Data through: {formatted}
      {showProvisional && <span className="text-primary"> - delayed</span>}
      {!showProvisional && currentDayCandleQuery.capability?.currentDayCandle === "unavailable" && (
        <span> - live/delayed intraday unavailable</span>
      )}
    </span>
  );
}
