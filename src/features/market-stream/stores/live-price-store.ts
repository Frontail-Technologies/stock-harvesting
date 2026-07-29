"use client";

import { create } from "zustand";
import type {
  MarketCandleUpdateEvent,
  MarketStreamEvent,
  MarketStreamSymbol,
  MarketTickEvent,
} from "../types";

export type LiveStockPrice = MarketStreamSymbol & {
  open?: number;
  close: number;
  changePct: number | null;
  volume?: number;
  time: string;
  source: "tick" | "candle";
};

type LivePriceState = {
  pricesByKey: Record<string, LiveStockPrice>;
  upsertPrice: (price: LiveStockPrice) => void;
  upsertFromMarketEvent: (event: MarketStreamEvent) => void;
  clearExchangePrices: (exchange: string) => void;
  clearAllPrices: () => void;
};

export function getLivePriceKey(exchange: string, symbol: string) {
  return `${exchange.trim().toUpperCase()}:${symbol.trim().toUpperCase()}`;
}

function calculateChangePct(open: number | undefined, close: number) {
  if (!open || open <= 0) return null;
  return ((close - open) / open) * 100;
}

function priceFromTick(
  event: MarketTickEvent,
  previous?: LiveStockPrice
): LiveStockPrice {
  const open = previous?.open;

  return {
    exchange: event.data.exchange.toUpperCase(),
    symbol: event.data.symbol.toUpperCase(),
    open,
    close: event.data.price,
    changePct: calculateChangePct(open, event.data.price) ?? previous?.changePct ?? null,
    volume: event.data.volume ?? previous?.volume,
    time: event.data.time,
    source: "tick",
  };
}

function priceFromCandle(event: MarketCandleUpdateEvent): LiveStockPrice | null {
  if (event.data.timeframe !== "1D") return null;

  return {
    exchange: event.data.exchange.toUpperCase(),
    symbol: event.data.symbol.toUpperCase(),
    open: event.data.open,
    close: event.data.close,
    changePct: calculateChangePct(event.data.open, event.data.close),
    volume: event.data.volume,
    time: event.data.time,
    source: "candle",
  };
}

export const useLivePriceStore = create<LivePriceState>((set) => ({
  pricesByKey: {},
  upsertPrice: (price) =>
    set((state) => ({
      pricesByKey: {
        ...state.pricesByKey,
        [getLivePriceKey(price.exchange, price.symbol)]: price,
      },
    })),
  upsertFromMarketEvent: (event) =>
    set((state) => {
      if (event.type !== "market.tick" && event.type !== "market.candle.update") {
        return state;
      }

      const key = getLivePriceKey(event.data.exchange, event.data.symbol);
      const previous = state.pricesByKey[key];
      const nextPrice =
        event.type === "market.tick"
          ? priceFromTick(event, previous)
          : priceFromCandle(event);

      if (!nextPrice) return state;

      return {
        pricesByKey: {
          ...state.pricesByKey,
          [key]: nextPrice,
        },
      };
    }),
  clearExchangePrices: (exchange) =>
    set((state) => {
      const normalizedExchange = exchange.toUpperCase();
      const nextPrices = Object.fromEntries(
        Object.entries(state.pricesByKey).filter(
          ([, price]) => price.exchange.toUpperCase() !== normalizedExchange
        )
      );

      return { pricesByKey: nextPrices };
    }),
  clearAllPrices: () => set({ pricesByKey: {} }),
}));
