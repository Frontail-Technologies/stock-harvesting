"use client";

import { useMemo, useState } from "react";
import { Plus, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardWidgetSkeleton } from "@/features/dashboard";
import { EmptyState } from "@/components/ui/empty-state";
import { Select, type SelectOption } from "@/components/ui/select";
import { useMarketCollections } from "@/features/market-collections";
import { useWatchlists } from "@/features/watchlists";
import { cn } from "@/utils/cn";
import { useLegacyWidgetPreferencesMigration } from "../hooks/use-legacy-widget-preferences-migration";
import { useClearWidgetPreferences, useSaveWidgetPreferences, useWidgetPreferences } from "../hooks/use-widget-preferences";
import { getDefaultWidgetSources } from "../lib/default-widget-sources";
import {
  useWidgetViewStore,
  WIDGET_VIEW_MODE_CARD_GRID_CLASS,
  WIDGET_VIEW_MODES,
  type WidgetViewMode,
} from "../stores/widget-view-store";
import type { ResolvedWidgetSource, WidgetSource } from "../types";
import { WidgetEmptyIllustration } from "./WidgetEmptyIllustration";
import { WidgetSourceCard } from "./WidgetSourceCard";
import { WidgetSourceSelectorDialog } from "./WidgetSourceSelectorDialog";

// Purely a visual placeholder count for the loading grid before any real
// list (saved preference or DB defaults) has resolved - not a default
// segment selection itself, see getDefaultWidgetSources for that.
const SKELETON_FALLBACK_COUNT = 4;

const VIEW_MODE_OPTIONS: SelectOption[] = WIDGET_VIEW_MODES.map((mode) => ({
  value: mode,
  label: `${mode[0]} Widget in row`,
}));

function sameSource(a: WidgetSource, b: WidgetSource) {
  return a.type === b.type && a.id === b.id;
}

export function WidgetPage() {
  const { collections, isLoading: isLoadingCollections } = useMarketCollections({});
  const { watchlists, isLoading: isLoadingWatchlists } = useWatchlists();
  const preferences = useWidgetPreferences();
  const saveMutation = useSaveWidgetPreferences();
  const clearMutation = useClearWidgetPreferences();
  const viewMode = useWidgetViewStore((state) => state.viewMode);
  const setViewMode = useWidgetViewStore((state) => state.setViewMode);
  const [selectorOpen, setSelectorOpen] = useState(false);

  const isLoading = isLoadingCollections || isLoadingWatchlists || preferences.isLoading;

  useLegacyWidgetPreferencesMigration({
    ready: !isLoading,
    hasSavedPreference: preferences.hasSavedPreference,
    saveMutation,
  });

  // No saved preference yet -> always re-derive from the CURRENT DB
  // defaults (never frozen at first load), so an admin changing
  // showOnWidgetDefault/widgetOrder affects new/reset users with no code
  // changes. A saved preference - including a deliberately empty one -
  // always wins over DB defaults.
  const defaultSources = useMemo(() => getDefaultWidgetSources(collections), [collections]);
  const sources = preferences.hasSavedPreference ? preferences.sources : defaultSources;

  const persistSources = (next: WidgetSource[]) => saveMutation.mutate({ sources: next });

  const addSource = (source: WidgetSource) => {
    if (sources.some((existing) => sameSource(existing, source))) return;
    persistSources([...sources, source]);
  };

  const removeSource = (source: WidgetSource) => {
    persistSources(sources.filter((existing) => !sameSource(existing, source)));
  };

  const moveSource = (source: WidgetSource, direction: "left" | "right") => {
    const index = sources.findIndex((existing) => sameSource(existing, source));
    if (index === -1) return;
    const targetIndex = direction === "left" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sources.length) return;

    const next = [...sources];
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    persistSources(next);
  };

  const resetToDefaults = () => clearMutation.mutate();

  // Stale saved sources referencing a deleted/unavailable Segment or
  // Watchlist are silently dropped here rather than rendered as broken
  // cards.
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
  const skeletonCount = sources.length > 0 ? sources.length : SKELETON_FALLBACK_COUNT;

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
            {preferences.hasSavedPreference && (
              <Button
                type="button"
                variant="outline"
                onClick={resetToDefaults}
                disabled={clearMutation.isPending}
                className="gap-1.5"
              >
                <RotateCcw className="size-4" />
                Reset to defaults
              </Button>
            )}
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
            illustration={<WidgetEmptyIllustration />}
            title="Choose Segments to build your quick stock view."
            primaryAction={{
              label: "Add Widget",
              icon: Plus,
              onClick: () => setSelectorOpen(true),
            }}
            secondaryAction={
              preferences.hasSavedPreference
                ? { label: "Reset to defaults", onClick: resetToDefaults }
                : undefined
            }
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
        onRemove={(source) => removeSource(source)}
      />
    </>
  );
}
