"use client";

import { useSessionStore } from "@/features/auth";
import { WatchlistQuickAddButton } from "@/features/watchlists";

type StockDetailWatchlistActionProps = {
  exchange: string;
  symbol: string;
  className?: string;
};

export function StockDetailWatchlistAction({
  exchange,
  symbol,
  className,
}: StockDetailWatchlistActionProps) {
  const status = useSessionStore((state) => state.status);
  if (status !== "authenticated") return null;

  return <WatchlistQuickAddButton exchange={exchange} symbol={symbol} className={className} />;
}
