"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";
import { AddStockDialog } from "./AddStockDialog";
import { CreateWatchlistDialog } from "./CreateWatchlistDialog";
import { DeleteWatchlistDialog } from "./DeleteWatchlistDialog";
import { RenameWatchlistDialog } from "./RenameWatchlistDialog";
import { WatchlistEmptyIllustration } from "./WatchlistEmptyIllustration";
import { WatchlistRow } from "./WatchlistRow";
import { useWatchlists } from "../hooks/use-watchlists";
import type { WatchlistSummary } from "../types";

export function WatchlistsPage() {
  const { watchlists, isLoading } = useWatchlists();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<WatchlistSummary | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<WatchlistSummary | null>(
    null,
  );
  const [addStockTargetId, setAddStockTargetId] = useState<string | null>(null);

  const hasWatchlists = !isLoading && watchlists.length > 0;
  const totalStocks = watchlists.reduce((sum, list) => sum + list.itemCount, 0);

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
          <Button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="gap-1.5"
          >
            <Plus className="size-4" />
            New Watchlist
          </Button>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card p-5 sm:p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner size="sm" />
          </div>
        ) : watchlists.length === 0 ? (
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
        ) : (
          <div className="flex flex-col gap-3">

            <p className="font-mono text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {watchlists.length}{" "}
              {watchlists.length === 1 ? "Watchlist" : "Watchlists"}
              <span className="mx-2 text-border">·</span>
              {totalStocks} {totalStocks === 1 ? "Stock" : "Stocks"}
            </p>
            <div className="divide-y divide-border border-t border-border">
              {watchlists.map((watchlist, index) => (
                <WatchlistRow
                  key={watchlist.id}
                  watchlist={watchlist}
                  index={index}
                  expanded={expandedId === watchlist.id}
                  onToggleExpanded={() =>
                    setExpandedId((current) =>
                      current === watchlist.id ? null : watchlist.id,
                    )
                  }
                  onRename={() => setRenameTarget(watchlist)}
                  onDelete={() => setDeleteTarget(watchlist)}
                  onAddStock={() => setAddStockTargetId(watchlist.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <CreateWatchlistDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(watchlistId) => setExpandedId(watchlistId)}
      />
      <RenameWatchlistDialog
        watchlist={renameTarget}
        onClose={() => setRenameTarget(null)}
      />
      <DeleteWatchlistDialog
        watchlist={deleteTarget}
        onClose={() => {
          setDeleteTarget((current) => {
            if (current && expandedId === current.id) setExpandedId(null);
            return null;
          });
        }}
      />
      <AddStockDialog
        watchlistId={addStockTargetId}
        onClose={() => setAddStockTargetId(null)}
      />
    </>
  );
}
