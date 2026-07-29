"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getApiAccessToken, refreshAccessToken } from "@/features/api";
import { useSessionStore } from "@/features/auth";
import { getMarketStreamUrl } from "../lib/market-stream-url";
import type {
  MarketStreamEvent,
  MarketStreamServerMessage,
  MarketStreamStatus,
  MarketStreamSymbol,
} from "../types";

type UseMarketStreamInput = {
  symbols: MarketStreamSymbol[];
  enabled?: boolean;
  onEvent?: (event: MarketStreamEvent) => void;
};

const RECONNECT_DELAY_MS = 2500;
const DEBUG_MARKET_STREAM = process.env.NEXT_PUBLIC_DEBUG_MARKET_STREAM === "true";

function debugMarketStream(message: string, payload?: unknown) {
  if (!DEBUG_MARKET_STREAM) return;
  if (payload === undefined) {
    console.log(`[market-stream] ${message}`);
    return;
  }
  console.log(`[market-stream] ${message}`, payload);
}

function symbolKey(symbol: MarketStreamSymbol) {
  return `${symbol.exchange.trim().toUpperCase()}:${symbol.symbol.trim().toUpperCase()}`;
}

function normalizeSymbols(symbols: MarketStreamSymbol[]) {
  const unique = new Map<string, MarketStreamSymbol>();

  for (const item of symbols) {
    const exchange = item.exchange.trim().toUpperCase();
    const symbol = item.symbol.trim().toUpperCase();
    if (!exchange || !symbol) continue;
    unique.set(`${exchange}:${symbol}`, { exchange, symbol });
  }

  return [...unique.values()];
}

function isMarketEvent(message: MarketStreamServerMessage): message is MarketStreamEvent {
  return (
    message.type === "market.tick" ||
    message.type === "market.candle.update" ||
    message.type === "market.provider.status" ||
    message.type === "job.progress"
  );
}

export function useMarketStream({
  symbols,
  enabled = true,
  onEvent,
}: UseMarketStreamInput) {
  const sessionAccessToken = useSessionStore((state) => state.accessToken);
  const [status, setStatus] = useState<MarketStreamStatus>("idle");
  const [lastEvent, setLastEvent] = useState<MarketStreamEvent | null>(null);
  const normalizedSymbols = useMemo(() => normalizeSymbols(symbols), [symbols]);
  const normalizedSymbolsKey = useMemo(
    () => normalizedSymbols.map(symbolKey).sort().join("|"),
    [normalizedSymbols]
  );
  const onEventRef = useRef(onEvent);
  const normalizedSymbolsRef = useRef(normalizedSymbols);

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    normalizedSymbolsRef.current = normalizedSymbols;
  }, [normalizedSymbols]);

  useEffect(() => {
    const activeSymbols = normalizedSymbolsRef.current;
    if (!enabled || activeSymbols.length === 0) {
      debugMarketStream("skipped", {
        enabled,
        symbolCount: activeSymbols.length,
      });
      return;
    }

    let socket: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let stopped = false;

    const connect = (token: string) => {
      setStatus("connecting");
      const url = getMarketStreamUrl(token);
      debugMarketStream("connecting", {
        url: url.replace(/token=.*/, "token=[redacted]"),
        symbolCount: activeSymbols.length,
        symbols: activeSymbols.slice(0, 10),
      });
      socket = new WebSocket(url);

      socket.addEventListener("open", () => {
        setStatus("connected");
        debugMarketStream("open");
        debugMarketStream("subscribe", {
          symbolCount: activeSymbols.length,
          symbols: activeSymbols.slice(0, 10),
        });
        socket?.send(
          JSON.stringify({
            type: "subscribe",
            symbols: activeSymbols,
          })
        );
      });

      socket.addEventListener("message", (event) => {
        try {
          const message = JSON.parse(String(event.data)) as MarketStreamServerMessage;
          debugMarketStream("message", message);
          if (!isMarketEvent(message)) return;

          setLastEvent(message);
          onEventRef.current?.(message);
        } catch {
          debugMarketStream("message parse failed", String(event.data).slice(0, 300));
          setStatus("error");
        }
      });

      socket.addEventListener("close", () => {
        debugMarketStream("close", { stopped });
        if (stopped) return;
        setStatus("disconnected");
        reconnectTimer = setTimeout(() => connect(token), RECONNECT_DELAY_MS);
      });

      socket.addEventListener("error", () => {
        debugMarketStream("error");
        setStatus("error");
      });
    };

    async function start() {
      let token = sessionAccessToken ?? getApiAccessToken();

      if (!token) {
        try {
          debugMarketStream("refreshing token");
          const refreshed = await refreshAccessToken();
          token = refreshed.accessToken;
        } catch {
          debugMarketStream("refresh failed");
          setStatus("error");
          return;
        }
      }

      if (!stopped) connect(token);
    }

    void start();

    return () => {
      stopped = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (socket?.readyState === WebSocket.OPEN) {
        debugMarketStream("unsubscribe", {
          symbolCount: activeSymbols.length,
          symbols: activeSymbols.slice(0, 10),
        });
        socket.send(
          JSON.stringify({
            type: "unsubscribe",
            symbols: activeSymbols,
          })
        );
      }
      socket?.close();
    };
  }, [enabled, normalizedSymbolsKey, sessionAccessToken]);

  return {
    status,
    lastEvent,
  };
}
