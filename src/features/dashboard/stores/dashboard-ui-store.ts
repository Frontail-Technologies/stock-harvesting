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
  minimizedPanels: Record<string, boolean>;

  maximizedPanelId: string | null;
  setPanelWidth: (id: string, width: number) => void;
  togglePanelMinimized: (id: string) => void;
  toggleMaximizedPanel: (id: string) => void;
  resetPanelWidth: (id: string) => void;
  resetAllPanelLayout: () => void;
};

export const useDashboardUiStore = create<DashboardUiState>()(
  persist(
    (set) => ({
      panelWidths: {},
      minimizedPanels: {},
      maximizedPanelId: null,
      setPanelWidth: (id, width) =>
        set((state) => ({
          panelWidths: { ...state.panelWidths, [id]: clampDashboardPanelWidth(width) },
        })),

      togglePanelMinimized: (id) =>
        set((state) => ({
          minimizedPanels: { ...state.minimizedPanels, [id]: !state.minimizedPanels[id] },
          maximizedPanelId: state.maximizedPanelId === id ? null : state.maximizedPanelId,
        })),

      toggleMaximizedPanel: (id) =>
        set((state) => ({
          maximizedPanelId: state.maximizedPanelId === id ? null : id,
          minimizedPanels: { ...state.minimizedPanels, [id]: false },
        })),

      resetPanelWidth: (id) =>
        set((state) => {
          const next = { ...state.panelWidths };
          delete next[id];
          return { panelWidths: next };
        }),
      resetAllPanelLayout: () => set({ panelWidths: {}, minimizedPanels: {}, maximizedPanelId: null }),
    }),
    {
      name: "stock-harvesting-dashboard-ui",
      partialize: (state) => ({
        panelWidths: state.panelWidths,
        minimizedPanels: state.minimizedPanels,
        maximizedPanelId: state.maximizedPanelId,
      }),
    }
  )
);
