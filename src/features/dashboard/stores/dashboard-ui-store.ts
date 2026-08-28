"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

// Dashboard interaction-refinement pass - per-panel width/minimize/maximize
// state for the top 4 relative-strength/weekly-strong cards. Mirrors the
// established scanner-ui-store.ts pattern (persist middleware, a plain
// localStorage-backed Zustand store) rather than inventing a new
// persistence mechanism - this is UI-only preference data, no backend
// involvement, so a single browser-local store is the correct layer.
//
// Keyed by DashboardCardData.id (e.g. "relative-strength-index") rather
// than array position, so a saved width still applies to the right card
// even if the card list is ever reordered.
export const DASHBOARD_PANEL_MIN_WIDTH = 270;
export const DASHBOARD_PANEL_MAX_WIDTH = 640;
export const DASHBOARD_PANEL_DEFAULT_WIDTH = 340;

export function clampDashboardPanelWidth(width: number): number {
  return Math.min(DASHBOARD_PANEL_MAX_WIDTH, Math.max(DASHBOARD_PANEL_MIN_WIDTH, width));
}

type DashboardUiState = {
  // Only ever holds an ENTRY for a panel the user has actually dragged -
  // a panel with no entry uses DASHBOARD_PANEL_DEFAULT_WIDTH, which is
  // what makes "sensible defaults for users with no saved preference"
  // (item 7) automatic rather than something that has to be seeded.
  panelWidths: Record<string, number>;
  minimizedPanels: Record<string, boolean>;
  // At most one panel maximized at a time - maximizing a second panel
  // just reassigns this rather than stacking state, since two
  // simultaneously "majority width" panels isn't a meaningful layout.
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
      // Minimizing a currently-maximized panel would otherwise leave both
      // flags true for the same id (a contradictory "minimized AND
      // majority-width" state) - clearing maximizedPanelId here keeps
      // exactly one mode active per panel.
      togglePanelMinimized: (id) =>
        set((state) => ({
          minimizedPanels: { ...state.minimizedPanels, [id]: !state.minimizedPanels[id] },
          maximizedPanelId: state.maximizedPanelId === id ? null : state.maximizedPanelId,
        })),
      // Same cross-clearing the other direction - maximizing a minimized
      // panel un-minimizes it first.
      toggleMaximizedPanel: (id) =>
        set((state) => ({
          maximizedPanelId: state.maximizedPanelId === id ? null : id,
          minimizedPanels: { ...state.minimizedPanels, [id]: false },
        })),
      // Item 9's "reset" action - removes the saved override entirely
      // (rather than writing DASHBOARD_PANEL_DEFAULT_WIDTH back in) so a
      // future change to the default takes effect for this panel too.
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
