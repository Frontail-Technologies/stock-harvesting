"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { getApiAccessToken, refreshAccessToken } from "@/features/api";
import { useSessionStore } from "@/features/auth";
import { isAccessTokenExpiring } from "../lib/access-token-expiry";
import { getMarketStreamProtocols, getMarketStreamUrl } from "../lib/market-stream-url";
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
    message.type === "job.progress" ||
    message.type === "market.symbol.refreshed"
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

    async function getFreshToken() {
      const currentToken = getApiAccessToken() ?? sessionAccessToken;
      if (currentToken && !isAccessTokenExpiring(currentToken)) return currentToken;
      debugMarketStream("refreshing token");
      const refreshed = await refreshAccessToken();
      return refreshed.accessToken;
    }

    async function reconnect() {
      try {
        const token = await getFreshToken();
        if (!stopped) connect(token);
      } catch {
        debugMarketStream("refresh failed");
        if (!stopped) setStatus("error");
      }
    }

    function scheduleReconnect() {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(() => void reconnect(), RECONNECT_DELAY_MS);
    }

    const connect = (token: string) => {
      setStatus("connecting");
      const url = getMarketStreamUrl();
      debugMarketStream("connecting", {
        url,
        symbolCount: activeSymbols.length,
        symbols: activeSymbols.slice(0, 10),
      });
      const nextSocket = new WebSocket(url, getMarketStreamProtocols(token));
      socket = nextSocket;

      nextSocket.addEventListener("open", () => {
        if (stopped) {
          nextSocket.close();
          return;
        }
        setStatus("connected");
        debugMarketStream("open");
        debugMarketStream("subscribe", {
          symbolCount: activeSymbols.length,
          symbols: activeSymbols.slice(0, 10),
        });
        nextSocket.send(
          JSON.stringify({
            type: "subscribe",
            symbols: activeSymbols,
          })
        );
      });

      nextSocket.addEventListener("message", (event) => {
        if (stopped) return;
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

      nextSocket.addEventListener("close", () => {
        debugMarketStream("close", { stopped });
        if (stopped) return;
        setStatus("disconnected");
        scheduleReconnect();
      });

      nextSocket.addEventListener("error", () => {
        if (stopped) return;
        debugMarketStream("error");
        setStatus("error");
      });
    };

    async function start() {
      await reconnect();
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
        socket.close();
      }
      // Let a CONNECTING socket reach `open`; that handler closes it when
      // `stopped` instead of triggering the browser's premature-close error.
    };
  }, [enabled, normalizedSymbolsKey, sessionAccessToken]);

  return {
    status,
    lastEvent,
  };
}
