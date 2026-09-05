import type { CollectionRelativeStrengthMetric } from "@/features/market-collections";

export type WatchlistSummary = {
  id: string;
  name: string;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
};

export type WatchlistItem = {
  id: string;
  exchange: string;
  symbol: string;
  position: number;
  createdAt: string;
};

export type WatchlistDetail = {
  id: string;
  name: string;
  items: WatchlistItem[];
  createdAt: string;
  updatedAt: string;
};

// Reuses the exact same ranked-row DTO Dashboard's Stock Harvest already
// sends the browser for a Segment (@/features/market-collections'
// CollectionRelativeStrengthMetric) - a Watchlist's members are ranked
// through the same backend evaluator, so the shape stays identical.
export type WatchlistRelativeStrengthResponse = {
  watchlist: { id: string; name: string };
  metrics: CollectionRelativeStrengthMetric[];
  asOfDate: string | null;
};
