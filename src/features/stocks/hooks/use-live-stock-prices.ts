"use client";

import { useCallback, useMemo } from "react";
import type { StockListInput } from "@/features/market-data/types";
import { useMarketStream, type MarketStreamEvent } from "@/features/market-stream";
import {
  getLivePriceKey,
  useLivePriceStore,
  type LiveStockPrice,
} from "@/features/market-stream";
import type { Stock } from "@/types/market";

const STOCKS_STREAM_SYMBOL_LIMIT = 100;
const DEBUG_STOCKS_LIVE_PRICES =
  process.env.NEXT_PUBLIC_DEBUG_MARKET_STREAM === "true";

function debugStocksLivePrices(message: string, payload?: unknown) {
  if (!DEBUG_STOCKS_LIVE_PRICES) return;
  if (payload === undefined) {
    console.log(`[stocks-live-prices] ${message}`);
    return;
  }
  console.log(`[stocks-live-prices] ${message}`, payload);
}

type UseLiveStockPricesInput = {
  rows: Stock[];
  queryInput: StockListInput;
  enabled?: boolean;
};

function changePct(open: number | undefined, close: number) {
  if (!open || open <= 0) return null;
  return ((close - open) / open) * 100;
}

function applyLivePrice(stock: Stock, livePrice?: LiveStockPrice): Stock {
  if (!livePrice) return stock;

  const open = livePrice.open ?? stock.open;
  const close = livePrice.close;

  return {
    ...stock,
    open,
    close,
    changePct: livePrice.changePct ?? changePct(open, close) ?? stock.changePct,
    volume: livePrice.volume ?? stock.volume,
    hasMarketData: true,
  };
}

export function useStocksWithLivePrices(rows: Stock[]) {
  const pricesByKey = useLivePriceStore((state) => state.pricesByKey);

  return useMemo(
    () =>
      rows.map((stock) =>
        applyLivePrice(
          stock,
          pricesByKey[getLivePriceKey(stock.exchange, stock.symbol)]
        )
      ),
    [pricesByKey, rows]
  );
}

export function useLiveStockPrices({
  rows,
  queryInput,
  enabled = true,
}: UseLiveStockPricesInput) {
  const upsertFromMarketEvent = useLivePriceStore(
    (state) => state.upsertFromMarketEvent
  );
  const symbols = useMemo(
    () => {
      const unique = new Map<string, { exchange: string; symbol: string }>();
      const requestedExchange = queryInput.exchange?.toUpperCase();
      const prioritizeNewestLoadedRows =
        requestedExchange === "BSE" || requestedExchange === "BSE_IDX";
      const candidateRows = prioritizeNewestLoadedRows ? [...rows].reverse() : rows;

      for (const row of candidateRows) {
        const exchange = row.exchange.toUpperCase();
        const symbol = row.symbol.toUpperCase();
        const isBse = exchange === "BSE" || exchange === "BSE_IDX";
        if (!isBse && !row.hasMarketData) continue;

        unique.set(`${exchange}:${symbol}`, { exchange, symbol });
        if (unique.size >= STOCKS_STREAM_SYMBOL_LIMIT) break;
      }

      const selectedSymbols = [...unique.values()];
      debugStocksLivePrices("selected stream symbols", {
        rows: rows.length,
        requestedExchange,
        selected: selectedSymbols.length,
        sample: selectedSymbols.slice(0, 10),
      });

      return selectedSymbols;
    },
    [queryInput.exchange, rows]
  );

  const handleMarketEvent = useCallback(
    (event: MarketStreamEvent) => {
      if (event.type !== "market.tick" && event.type !== "market.candle.update") {
        return;
      }

      debugStocksLivePrices("event received", event);
      upsertFromMarketEvent(event);
    },
    [upsertFromMarketEvent]
  );

  return useMarketStream({
    symbols,
    enabled: enabled && symbols.length > 0,
    onEvent: handleMarketEvent,
  });
}
