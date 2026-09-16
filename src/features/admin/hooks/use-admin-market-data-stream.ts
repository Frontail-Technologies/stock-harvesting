"use client";

import { useEffect, useRef, useState } from "react";
import { getAdminApiAccessToken, refreshAdminAccessToken } from "@/features/api";
import { useAdminSessionStore } from "@/features/auth";
import { getMarketStreamUrl, type AdminMarketDataEvent, type MarketStreamServerMessage, type MarketStreamStatus } from "@/features/market-stream";

type UseAdminMarketDataStreamInput = {
  enabled?: boolean;
  onEvent?: (event: AdminMarketDataEvent) => void;
  onReconnected?: () => void;
};

const RECONNECT_DELAY_MS = 2500;

function isAdminEvent(message: MarketStreamServerMessage): message is AdminMarketDataEvent {
  return (
    message.type === "market-data:job-started" ||
    message.type === "market-data:job-progress" ||
    message.type === "market-data:job-completed" ||
    message.type === "market-data:job-failed" ||
    message.type === "worker:status"
  );
}

export function useAdminMarketDataStream({
  enabled = true,
  onEvent,
  onReconnected,
}: UseAdminMarketDataStreamInput) {
  const adminAccessToken = useAdminSessionStore((state) => state.accessToken);
  const [status, setStatus] = useState<MarketStreamStatus>("idle");
  const onEventRef = useRef(onEvent);
  const onReconnectedRef = useRef(onReconnected);
  const hasConnectedBeforeRef = useRef(false);

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    onReconnectedRef.current = onReconnected;
  }, [onReconnected]);

  useEffect(() => {
    if (!enabled) return;

    let socket: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let stopped = false;

    const connect = (token: string) => {
      setStatus("connecting");
      socket = new WebSocket(getMarketStreamUrl(token));

      socket.addEventListener("open", () => {
        setStatus("connected");
        socket?.send(JSON.stringify({ type: "admin.subscribe" }));
        if (hasConnectedBeforeRef.current) onReconnectedRef.current?.();
        hasConnectedBeforeRef.current = true;
      });

      socket.addEventListener("message", (event) => {
        try {
          const message = JSON.parse(String(event.data)) as MarketStreamServerMessage;
          if (!isAdminEvent(message)) return;
          onEventRef.current?.(message);
        } catch {
          setStatus("error");
        }
      });

      socket.addEventListener("close", () => {
        if (stopped) return;
        setStatus("disconnected");
        reconnectTimer = setTimeout(() => connect(token), RECONNECT_DELAY_MS);
      });

      socket.addEventListener("error", () => {
        setStatus("error");
      });
    };

    async function start() {
      let token = adminAccessToken ?? getAdminApiAccessToken();

      if (!token) {
        try {
          const refreshed = await refreshAdminAccessToken();
          token = refreshed.accessToken;
        } catch {
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
        socket.send(JSON.stringify({ type: "admin.unsubscribe" }));
      }
      socket?.close();
    };
  }, [enabled, adminAccessToken]);

  return { status };
}
