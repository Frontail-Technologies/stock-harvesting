"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type WatchlistViewMode = "3x3" | "4x4" | "5x5";

export const WATCHLIST_VIEW_MODES: WatchlistViewMode[] = ["3x3", "4x4", "5x5"];

// This controls how many Watchlist WIDGETS sit across the page grid (a
// card-density preset), not anything about the stock list inside a widget.
// 3x3 = fewer, larger cards per row; 5x5 = more, more compact cards per
// row. Same responsive-fallback convention as the rest of the app (mobile
// 1 column, tablet 2), only the desktop column count changes per mode.
export const WATCHLIST_VIEW_MODE_CARD_GRID_CLASS: Record<WatchlistViewMode, string> = {
  "3x3": "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3",
  "4x4": "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4",
  "5x5": "grid-cols-1 sm:grid-cols-2 xl:grid-cols-5",
};

type WatchlistViewState = {
  viewMode: WatchlistViewMode;
  setViewMode: (mode: WatchlistViewMode) => void;
};

export const useWatchlistViewStore = create<WatchlistViewState>()(
  persist(
    (set) => ({
      viewMode: "4x4",
      setViewMode: (mode) => set({ viewMode: mode }),
    }),
    {
      name: "stock-harvesting-watchlist-view",
    }
  )
);
