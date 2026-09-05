"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardWidgetSkeleton } from "@/features/dashboard";
import { EmptyState } from "@/components/ui/empty-state";
import { Select, type SelectOption } from "@/components/ui/select";
import { useMarketCollections } from "@/features/market-collections";
import { useWatchlists } from "@/features/watchlists";
import { cn } from "@/utils/cn";
import { useWidgetPreferencesStore } from "../stores/widget-preferences-store";
import {
  useWidgetViewStore,
  WIDGET_VIEW_MODE_CARD_GRID_CLASS,
  WIDGET_VIEW_MODES,
  type WidgetViewMode,
} from "../stores/widget-view-store";
import type { ResolvedWidgetSource, WidgetSource } from "../types";
import { WidgetSourceCard } from "./WidgetSourceCard";
import { WidgetSourceSelectorDialog } from "./WidgetSourceSelectorDialog";

// A small, non-arbitrary starting point - real Segment records only, never
// fabricated names. There's no existing "featured/recommended Segment"
// flag to pick a more curated set from, so this stays a plain small slice
// of whatever the Segments list already returns.
const DEFAULT_SEGMENT_COUNT = 2;

const VIEW_MODE_OPTIONS: SelectOption[] = WIDGET_VIEW_MODES.map((mode) => ({
  value: mode,
  label: `${mode[0]} Widget in row`,
}));

export function WidgetPage() {
  const { collections, isLoading: isLoadingCollections } = useMarketCollections({});
  const { watchlists, isLoading: isLoadingWatchlists } = useWatchlists();
  const sources = useWidgetPreferencesStore((state) => state.sources);
  const hasSeededDefaults = useWidgetPreferencesStore((state) => state.hasSeededDefaults);
  const seedDefaults = useWidgetPreferencesStore((state) => state.seedDefaults);
  const addSource = useWidgetPreferencesStore((state) => state.addSource);
  const removeSource = useWidgetPreferencesStore((state) => state.removeSource);
  const moveSource = useWidgetPreferencesStore((state) => state.moveSource);
  const viewMode = useWidgetViewStore((state) => state.viewMode);
  const setViewMode = useWidgetViewStore((state) => state.setViewMode);
  const [selectorOpen, setSelectorOpen] = useState(false);

  const isLoading = isLoadingCollections || isLoadingWatchlists;

  useEffect(() => {
    if (isLoading || hasSeededDefaults || collections.length === 0) return;
    seedDefaults(
      collections.slice(0, DEFAULT_SEGMENT_COUNT).map((collection): WidgetSource => ({
        type: "segment",
        id: collection.id,
      }))
    );
  }, [isLoading, hasSeededDefaults, collections, seedDefaults]);

  const resolvedSources: ResolvedWidgetSource[] = sources
    .map((source): ResolvedWidgetSource | null => {
      if (source.type === "segment") {
        const collection = collections.find((item) => item.id === source.id);
        return collection ? { type: "segment", id: collection.id, code: collection.code, name: collection.name } : null;
      }
      const watchlist = watchlists.find((item) => item.id === source.id);
      return watchlist
        ? { type: "watchlist", id: watchlist.id, name: watchlist.name, itemCount: watchlist.itemCount }
        : null;
    })
    .filter((source): source is ResolvedWidgetSource => source !== null);

  const hasSelection = resolvedSources.length > 0;
  // While Segments/Watchlists are still loading we don't yet have resolved
  // names, but the persisted source list itself is available synchronously
  // (zustand, not network-backed) - so the skeleton grid can match the
  // real eventual card count instead of guessing.
  const skeletonCount = sources.length > 0 ? sources.length : DEFAULT_SEGMENT_COUNT;

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[1.75rem] font-semibold tracking-tight text-foreground">Widget</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Quick ranked snapshot across your selected Segments and Watchlists.
          </p>
        </div>
        {hasSelection && (
          <div className="flex items-center gap-2">
            <Select
              value={viewMode}
              onValueChange={(value) => setViewMode(value as WidgetViewMode)}
              options={VIEW_MODE_OPTIONS}
              triggerClassName="h-9 w-40"
            />
            <Button type="button" onClick={() => setSelectorOpen(true)} className="gap-1.5">
              <Plus className="size-4" />
              Add Widget
            </Button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div
          className={cn("grid gap-4", WIDGET_VIEW_MODE_CARD_GRID_CLASS[viewMode])}
          aria-label="Loading widgets"
          role="status"
        >
          {Array.from({ length: skeletonCount }, (_, index) => (
            <div key={index} className="h-full min-h-104 max-h-112 overflow-hidden rounded-xl">
              <DashboardWidgetSkeleton title="Loading..." offset={index} />
            </div>
          ))}
        </div>
      ) : !hasSelection ? (
        <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
          <EmptyState
            title="Choose Segments to build your quick stock view."
            description="Add a Segment or one of your Watchlists to see a ranked snapshot here."
            primaryAction={{
              label: "Add Widget",
              icon: Plus,
              onClick: () => setSelectorOpen(true),
            }}
          />
        </div>
      ) : (
        <div className={cn("grid gap-4", WIDGET_VIEW_MODE_CARD_GRID_CLASS[viewMode])}>
          {resolvedSources.map((source, index) => (
            <WidgetSourceCard
              key={`${source.type}:${source.id}`}
              source={source}
              canMoveLeft={index > 0}
              canMoveRight={index < resolvedSources.length - 1}
              onMoveLeft={() => moveSource({ type: source.type, id: source.id }, "left")}
              onMoveRight={() => moveSource({ type: source.type, id: source.id }, "right")}
              onRemove={() => removeSource({ type: source.type, id: source.id })}
            />
          ))}
        </div>
      )}

      <WidgetSourceSelectorDialog
        open={selectorOpen}
        onOpenChange={setSelectorOpen}
        sources={sources}
        onSelect={(source) => addSource(source)}
      />
    </>
  );
}
