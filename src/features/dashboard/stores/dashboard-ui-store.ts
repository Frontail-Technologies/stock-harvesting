"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export const DASHBOARD_PANEL_MIN_WIDTH = 270;
export const DASHBOARD_PANEL_MAX_WIDTH = 640;
export const DASHBOARD_PANEL_DEFAULT_WIDTH = 340;

export function clampDashboardPanelWidth(width: number): number {
  return Math.min(DASHBOARD_PANEL_MAX_WIDTH, Math.max(DASHBOARD_PANEL_MIN_WIDTH, width));
}

type DashboardUiState = {

  panelWidths: Record<string, number>;

  expandedPanelId: string | null;
  setPanelWidth: (id: string, width: number) => void;
  openExpandedPanel: (id: string) => void;
  closeExpandedPanel: () => void;
  resetPanelWidth: (id: string) => void;
  resetAllPanelLayout: () => void;
};

export const useDashboardUiStore = create<DashboardUiState>()(
  persist(
    (set) => ({
      panelWidths: {},
      expandedPanelId: null,
      setPanelWidth: (id, width) =>
        set((state) => ({
          panelWidths: { ...state.panelWidths, [id]: clampDashboardPanelWidth(width) },
        })),

      openExpandedPanel: (id) => set({ expandedPanelId: id }),
      closeExpandedPanel: () => set({ expandedPanelId: null }),

      resetPanelWidth: (id) =>
        set((state) => {
          const next = { ...state.panelWidths };
          delete next[id];
          return { panelWidths: next };
        }),
      resetAllPanelLayout: () => set({ panelWidths: {}, expandedPanelId: null }),
    }),
    {
      name: "stock-harvesting-dashboard-ui",
      partialize: (state) => ({
        panelWidths: state.panelWidths,
      }),
    }
  )
);
