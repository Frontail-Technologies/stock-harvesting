"use client";

import { useRouter } from "next/navigation";
import { useSessionStore } from "@/features/auth";

// A search result's own {symbol, exchange} is the full stock identity -
// Charts' URL always carries both (see the exchange-scoped search
// refactor), so a selected result never needs to touch any shared/global
// exchange state to "commit" its choice. Selecting a result is the one
// moment Search is allowed to affect Charts, and it does so purely by
// navigating to an explicit URL, not by mutating a store Charts also
// reads.
function buildChartsPath(symbol: string, exchange: string): string {
  const params = new URLSearchParams({ symbol, exchange });
  return `/charts?${params.toString()}`;
}

export function useStockDestination() {
  const router = useRouter();
  const status = useSessionStore((state) => state.status);

  return function goToStock(stock: { symbol: string; exchange: string }) {
    const chartsPath = buildChartsPath(stock.symbol, stock.exchange);

    if (status === "authenticated") {
      router.push(chartsPath);
      return;
    }

    // Covers "guest" and, defensively, "unknown" - in practice a result
    // can't even be selected while status is still unknown, since the
    // search query itself is disabled until auth resolves (see
    // useGlobalStockSearch -> useStockSearch), so this is never reached
    // mid-resolution. Same safe "next" mechanism the rest of auth uses:
    // only ever a same-site app path, never an absolute/external URL - and
    // since chartsPath already carries both symbol and exchange, they
    // survive the /login round-trip intact.
    router.push(`/login?next=${encodeURIComponent(chartsPath)}`);
  };
}
