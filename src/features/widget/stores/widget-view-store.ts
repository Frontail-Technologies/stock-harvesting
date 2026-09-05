"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type WidgetViewMode = "3x3" | "4x4" | "5x5";

export const WIDGET_VIEW_MODES: WidgetViewMode[] = ["3x3", "4x4", "5x5"];

// Controls how many Widget cards sit across the page grid - same
// responsive-fallback convention as the rest of the app (mobile 1 column,
// tablet 2), only the desktop column count changes per mode. Matches the
// existing Watchlist page's own view-mode store shape/values 1:1 so the
// two stay consistent, even though they're persisted independently.
export const WIDGET_VIEW_MODE_CARD_GRID_CLASS: Record<WidgetViewMode, string> = {
  "3x3": "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3",
  "4x4": "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4",
  "5x5": "grid-cols-1 sm:grid-cols-2 xl:grid-cols-5",
};

type WidgetViewState = {
  viewMode: WidgetViewMode;
  setViewMode: (mode: WidgetViewMode) => void;
};

export const useWidgetViewStore = create<WidgetViewState>()(
  persist(
    (set) => ({
      // Matches Widget's previous fixed grid (xl:grid-cols-3) so turning
      // this control on doesn't change anyone's existing layout by default.
      viewMode: "3x3",
      setViewMode: (mode) => set({ viewMode: mode }),
    }),
    {
      name: "stock-harvesting-widget-view",
    }
  )
);
