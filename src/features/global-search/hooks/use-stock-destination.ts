"use client";

import { useRouter } from "next/navigation";
import { useSessionStore } from "@/features/auth";

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

    router.push(`/login?next=${encodeURIComponent(chartsPath)}`);
  };
}
