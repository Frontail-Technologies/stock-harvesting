"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type DashboardWidgetColumns = 2 | 4;

export const DASHBOARD_WIDGET_COLUMNS_OPTIONS: DashboardWidgetColumns[] = [2, 4];

export const DEFAULT_DASHBOARD_WIDGET_COLUMNS: DashboardWidgetColumns = 4;

// Mobile always collapses to one card per row regardless of the selected
// mode - only the desktop (xl) column count changes. "2 per row" reaches
// its target at the same `sm` breakpoint everything else in the app uses
// and simply stays there, since 2 is already its ceiling.
export const DASHBOARD_WIDGET_GRID_CLASS: Record<DashboardWidgetColumns, string> = {
  2: "grid-cols-1 sm:grid-cols-2",
  4: "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4",
};

function isDashboardWidgetColumns(value: unknown): value is DashboardWidgetColumns {
  return value === 2 || value === 4;
}

type DashboardUiState = {
  expandedPanelId: string | null;
  openExpandedPanel: (id: string) => void;
  closeExpandedPanel: () => void;

  widgetColumns: DashboardWidgetColumns;
  setWidgetColumns: (columns: DashboardWidgetColumns) => void;
};

const CURRENT_STORE_VERSION = 1;

export const useDashboardUiStore = create<DashboardUiState>()(
  persist(
    (set) => ({
      expandedPanelId: null,
      openExpandedPanel: (id) => set({ expandedPanelId: id }),
      closeExpandedPanel: () => set({ expandedPanelId: null }),

      widgetColumns: DEFAULT_DASHBOARD_WIDGET_COLUMNS,
      setWidgetColumns: (columns) => set({ widgetColumns: columns }),
    }),
    {
      name: "stock-harvesting-dashboard-ui",
      version: CURRENT_STORE_VERSION,
      partialize: (state) => ({
        widgetColumns: state.widgetColumns,
      }),
      // Version 0 (the removed manual-resize feature) persisted a
      // `panelWidths` map that no longer means anything now that widgets
      // are a fixed grid - dropped rather than carried forward, so a
      // stale map from an old session can never leak into or otherwise
      // affect the new fixed-column layout. Anything else unrecognized
      // falls back to the default column count instead of throwing.
      migrate: (persistedState) => {
        const state = persistedState as Record<string, unknown> | null | undefined;
        const widgetColumns = isDashboardWidgetColumns(state?.widgetColumns)
          ? state.widgetColumns
          : DEFAULT_DASHBOARD_WIDGET_COLUMNS;
        return { widgetColumns };
      },
    }
  )
);
