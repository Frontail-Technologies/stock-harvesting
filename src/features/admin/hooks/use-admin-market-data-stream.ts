"use client";

import { useEffect, useRef, useState } from "react";
import { getAdminApiAccessToken, refreshAdminAccessToken } from "@/features/api";
import { useAdminSessionStore } from "@/features/auth";
import { getMarketStreamProtocols, getMarketStreamUrl, type AdminMarketDataEvent, type MarketStreamServerMessage, type MarketStreamStatus } from "@/features/market-stream";
import { isAccessTokenExpiring } from "@/features/market-stream/lib/access-token-expiry";

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

    async function getFreshToken() {
      const currentToken = getAdminApiAccessToken() ?? adminAccessToken;
      if (currentToken && !isAccessTokenExpiring(currentToken)) return currentToken;
      const refreshed = await refreshAdminAccessToken();
      return refreshed.accessToken;
    }

    async function reconnect() {
      try {
        const token = await getFreshToken();
        if (!stopped) connect(token);
      } catch {
        if (!stopped) setStatus("error");
      }
    }

    function scheduleReconnect() {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(() => void reconnect(), RECONNECT_DELAY_MS);
    }

    const connect = (token: string) => {
      setStatus("connecting");
      const nextSocket = new WebSocket(getMarketStreamUrl(), getMarketStreamProtocols(token));
      socket = nextSocket;

      nextSocket.addEventListener("open", () => {
        if (stopped) {
          nextSocket.close();
          return;
        }
        setStatus("connected");
        nextSocket.send(JSON.stringify({ type: "admin.subscribe" }));
        if (hasConnectedBeforeRef.current) onReconnectedRef.current?.();
        hasConnectedBeforeRef.current = true;
      });

      nextSocket.addEventListener("message", (event) => {
        if (stopped) return;
        try {
          const message = JSON.parse(String(event.data)) as MarketStreamServerMessage;
          if (!isAdminEvent(message)) return;
          onEventRef.current?.(message);
        } catch {
          setStatus("error");
        }
      });

      nextSocket.addEventListener("close", () => {
        if (stopped) return;
        setStatus("disconnected");
        scheduleReconnect();
      });

      nextSocket.addEventListener("error", () => {
        if (stopped) return;
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
        socket.send(JSON.stringify({ type: "admin.unsubscribe" }));
        socket.close();
      }
      // Calling close() while CONNECTING makes browsers emit a misleading
      // console error. The open handler sees `stopped` and closes immediately.
    };
  }, [enabled, adminAccessToken]);

  return { status };
}
