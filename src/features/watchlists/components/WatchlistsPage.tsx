"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Select, type SelectOption } from "@/components/ui/select";
import { cn } from "@/utils/cn";
import { AddStockDialog } from "./AddStockDialog";
import { CreateWatchlistDialog } from "./CreateWatchlistDialog";
import { DeleteWatchlistDialog } from "./DeleteWatchlistDialog";
import { RenameWatchlistDialog } from "./RenameWatchlistDialog";
import { WatchlistCardSkeleton } from "./WatchlistCardSkeleton";
import { WatchlistEmptyIllustration } from "./WatchlistEmptyIllustration";
import { WatchlistFullViewDialog } from "./WatchlistFullViewDialog";
import { WatchlistWidget } from "./WatchlistWidget";
import { useWatchlists } from "../hooks/use-watchlists";
import {
  useWatchlistViewStore,
  WATCHLIST_VIEW_MODE_CARD_GRID_CLASS,
  WATCHLIST_VIEW_MODES,
  type WatchlistViewMode,
} from "../stores/watchlist-view-store";
import type { WatchlistSummary } from "../types";

const VIEW_MODE_OPTIONS: SelectOption[] = WATCHLIST_VIEW_MODES.map((mode) => ({
  value: mode,
  label: `${mode[0]} Watchlist in row`,
}));

export function WatchlistsPage() {
  const { watchlists, isLoading } = useWatchlists();
  const [createOpen, setCreateOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<WatchlistSummary | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<WatchlistSummary | null>(
    null,
  );
  const [addStockTargetId, setAddStockTargetId] = useState<string | null>(null);
  const [fullViewId, setFullViewId] = useState<string | null>(null);
  const viewMode = useWatchlistViewStore((state) => state.viewMode);
  const setViewMode = useWatchlistViewStore((state) => state.setViewMode);

  const hasWatchlists = !isLoading && watchlists.length > 0;

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="mt-1 text-[1.75rem] font-semibold tracking-tight text-foreground">
            Watchlists
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Build and organize the stocks you want to review.
          </p>
        </div>
        {hasWatchlists && (
          <div className="flex items-center gap-2">
            <Select
              value={viewMode}
              onValueChange={(value) => setViewMode(value as WatchlistViewMode)}
              options={VIEW_MODE_OPTIONS}
              triggerClassName="h-9 w-44"
            />
            <Button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="gap-1.5"
            >
              <Plus className="size-4" />
              New Watchlist
            </Button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div
          className={cn("grid gap-4", WATCHLIST_VIEW_MODE_CARD_GRID_CLASS[viewMode])}
          aria-label="Loading watchlists"
          role="status"
        >
          {[0, 1, 2].map((index) => (
            <WatchlistCardSkeleton key={index} />
          ))}
        </div>
      ) : watchlists.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
          <EmptyState
            illustration={<WatchlistEmptyIllustration />}
            title="Keep stocks you want to review together."
            description="Create watchlists to organize companies and open them quickly in Charts."
            primaryAction={{
              label: "Create Watchlist",
              icon: Plus,
              onClick: () => setCreateOpen(true),
            }}
          />
        </div>
      ) : (
        <div className={cn("grid gap-4", WATCHLIST_VIEW_MODE_CARD_GRID_CLASS[viewMode])}>
          {watchlists.map((watchlist) => (
            <WatchlistWidget
              key={watchlist.id}
              watchlist={watchlist}
              onRename={() => setRenameTarget(watchlist)}
              onDelete={() => setDeleteTarget(watchlist)}
              onAddStock={() => setAddStockTargetId(watchlist.id)}
              onFullView={() => setFullViewId(watchlist.id)}
            />
          ))}
        </div>
      )}

      <CreateWatchlistDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(watchlistId) => setFullViewId(watchlistId)}
      />
      <RenameWatchlistDialog
        watchlist={renameTarget}
        onClose={() => setRenameTarget(null)}
      />
      <DeleteWatchlistDialog
        watchlist={deleteTarget}
        onClose={() => {
          setDeleteTarget((current) => {
            if (current && fullViewId === current.id) setFullViewId(null);
            return null;
          });
        }}
      />
      <AddStockDialog
        watchlistId={addStockTargetId}
        onClose={() => setAddStockTargetId(null)}
      />
      <WatchlistFullViewDialog
        watchlistId={fullViewId}
        onClose={() => setFullViewId(null)}
        onAddStock={setAddStockTargetId}
      />
    </>
  );
}
