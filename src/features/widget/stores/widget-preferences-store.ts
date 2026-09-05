"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { WidgetSource } from "../types";

type WidgetPreferencesState = {
  sources: WidgetSource[];
  // Tracks whether the one-time "seed a small default set" step has already
  // run, so clearing every source down to zero (a deliberate user action)
  // is never mistaken for "never configured yet" and silently re-seeded.
  hasSeededDefaults: boolean;
  seedDefaults: (sources: WidgetSource[]) => void;
  addSource: (source: WidgetSource) => void;
  removeSource: (source: WidgetSource) => void;
  moveSource: (source: WidgetSource, direction: "left" | "right") => void;
};

function sameSource(a: WidgetSource, b: WidgetSource) {
  return a.type === b.type && a.id === b.id;
}

const CURRENT_STORE_VERSION = 1;

export const useWidgetPreferencesStore = create<WidgetPreferencesState>()(
  persist(
    (set) => ({
      sources: [],
      hasSeededDefaults: false,
      seedDefaults: (sources) =>
        set((state) => (state.hasSeededDefaults ? state : { sources, hasSeededDefaults: true })),
      addSource: (source) =>
        set((state) =>
          state.sources.some((existing) => sameSource(existing, source))
            ? state
            : { sources: [...state.sources, source] }
        ),
      removeSource: (source) =>
        set((state) => ({
          sources: state.sources.filter((existing) => !sameSource(existing, source)),
        })),
      moveSource: (source, direction) =>
        set((state) => {
          const index = state.sources.findIndex((existing) => sameSource(existing, source));
          if (index === -1) return state;
          const targetIndex = direction === "left" ? index - 1 : index + 1;
          if (targetIndex < 0 || targetIndex >= state.sources.length) return state;

          const next = [...state.sources];
          [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
          return { sources: next };
        }),
    }),
    {
      name: "stock-harvesting-widget-segments",
      version: CURRENT_STORE_VERSION,
      // Version 0 (pre-Segment/Watchlist source model) persisted a plain
      // `selectedSegmentIds: string[]` - every id there was, by definition,
      // a Segment, so it maps 1:1 onto the new `sources` shape. Anything
      // else unrecognized falls back to an empty, un-seeded state rather
      // than throwing, so a corrupted/unexpected payload can never crash
      // the app for an existing user.
      migrate: (persistedState) => {
        const state = persistedState as Record<string, unknown> | null | undefined;
        if (!state || typeof state !== "object") {
          return { sources: [], hasSeededDefaults: false };
        }
        if (Array.isArray(state.sources)) {
          return {
            sources: state.sources as WidgetSource[],
            hasSeededDefaults: Boolean(state.hasSeededDefaults),
          };
        }
        if (Array.isArray(state.selectedSegmentIds)) {
          return {
            sources: (state.selectedSegmentIds as string[]).map(
              (id): WidgetSource => ({ type: "segment", id })
            ),
            hasSeededDefaults: Boolean(state.hasSeededDefaults),
          };
        }
        return { sources: [], hasSeededDefaults: false };
      },
    }
  )
);
