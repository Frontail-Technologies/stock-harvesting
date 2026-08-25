"use client";

import { useRouter } from "next/navigation";
import { useSessionStore } from "@/features/auth";
import { useMarketStore } from "@/features/market";

// The scanner's own selected-stock mechanism has two parts, not one: the
// symbol lives in the URL (?symbol=...), but the exchange lives in
// useMarketStore (ScannerPage reads selectedExchange from that store, not
// from a query param - confirmed by reading it directly, there is no
// ?exchange= it consumes anywhere). So "jump to a stock" here means the
// same two actions the rest of the app already performs for an exchange
// switch (MarketSelector's onExchangeChange) plus a symbol navigation -
// not a second, parallel selected-stock mechanism.
function buildScannerPath(symbol: string): string {
  return `/scanner?symbol=${encodeURIComponent(symbol)}`;
}

export function useStockDestination() {
  const router = useRouter();
  const status = useSessionStore((state) => state.status);
  const setSelectedExchange = useMarketStore((state) => state.setSelectedExchange);

  return function goToStock(stock: { symbol: string; exchange: string }) {
    // Set first, navigate second - useMarketStore is persisted
    // (localStorage), so this survives an unauthenticated visitor's
    // /login round-trip untouched, which is what lets the exchange come
    // back correctly after they sign in (see the "next" branch below).
    setSelectedExchange(stock.exchange);
    const scannerPath = buildScannerPath(stock.symbol);

    if (status === "authenticated") {
      router.push(scannerPath);
      return;
    }

    // Covers "guest" and, defensively, "unknown" - in practice a result
    // can't even be selected while status is still unknown, since the
    // search query itself is disabled until auth resolves (see
    // useGlobalStockSearch -> useStockSearch), so this is never reached
    // mid-resolution. Same safe "next" mechanism the rest of auth uses:
    // only ever a same-site app path, never an absolute/external URL.
    router.push(`/login?next=${encodeURIComponent(scannerPath)}`);
  };
}
