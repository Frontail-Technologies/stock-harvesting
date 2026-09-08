"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useMarketCollections } from "@/features/market-collections";
import { useWatchlists } from "@/features/watchlists";
import { cn } from "@/utils/cn";
import type { WidgetSource } from "../types";

type SourceTab = "segment" | "watchlist";

type WidgetSourceSelectorDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sources: WidgetSource[];
  onSelect: (source: WidgetSource) => void;
  onRemove: (source: WidgetSource) => void;
};

function isSelected(sources: WidgetSource[], candidate: WidgetSource) {
  return sources.some((source) => source.type === candidate.type && source.id === candidate.id);
}

// Shared row for both the Segments and Watchlists tabs, so the two never
// drift onto different interaction patterns. Not selected: the whole row
// adds it (matches the previous behavior, which was also click-anywhere-
// to-add) plus an explicit Plus button. Already selected: the row itself
// is inert (it never toggled on click before this change either - only
// this dedicated Trash2 button removes it), and stays fully readable
// rather than dimmed, since it's still an active source.
function SourceRow({
  label,
  meta,
  selected,
  onAdd,
  onRemove,
}: {
  label: string;
  meta: ReactNode;
  selected: boolean;
  onAdd: () => void;
  onRemove: () => void;
}) {
  const actionLabel = selected ? `Remove ${label} widget` : `Add ${label} widget`;

  const action = (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            variant={selected ? "ghost" : "outline"}
            size="icon"
            aria-label={actionLabel}
            className={cn(
              "shrink-0",
              selected && "text-destructive hover:bg-destructive/10 hover:text-destructive"
            )}
            onClick={(event) => {
              event.stopPropagation();
              if (selected) onRemove();
              else onAdd();
            }}
          />
        }
      >
        {selected ? <Trash2 className="size-4" /> : <Plus className="size-4" />}
      </TooltipTrigger>
      <TooltipContent side="left">{actionLabel}</TooltipContent>
    </Tooltip>
  );

  const nameBlock = (
    <span className="min-w-0 flex-1 truncate">
      <span className="block truncate font-medium text-foreground">{label}</span>
      <span className="block truncate text-xs text-muted-foreground">{meta}</span>
    </span>
  );

  if (selected) {
    return (
      <div className="flex w-full items-center justify-between gap-3 px-2 py-2.5 text-sm">
        {nameBlock}
        {action}
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onAdd}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onAdd();
        }
      }}
      className="flex w-full cursor-pointer items-center justify-between gap-3 px-2 py-2.5 text-left text-sm transition-colors hover:bg-muted/60"
    >
      {nameBlock}
      {action}
    </div>
  );
}

export function WidgetSourceSelectorDialog({
  open,
  onOpenChange,
  sources,
  onSelect,
  onRemove,
}: WidgetSourceSelectorDialogProps) {
  const [tab, setTab] = useState<SourceTab>("segment");
  const [query, setQuery] = useState("");
  const { collections, isLoading: isLoadingCollections } = useMarketCollections({});
  const { watchlists, isLoading: isLoadingWatchlists } = useWatchlists();

  const trimmedQuery = query.trim().toLowerCase();

  const filteredCollections = useMemo(
    () =>
      trimmedQuery
        ? collections.filter((collection) => collection.name.toLowerCase().includes(trimmedQuery))
        : collections,
    [collections, trimmedQuery]
  );
  const filteredWatchlists = useMemo(
    () =>
      trimmedQuery
        ? watchlists.filter((watchlist) => watchlist.name.toLowerCase().includes(trimmedQuery))
        : watchlists,
    [watchlists, trimmedQuery]
  );

  const isLoading = tab === "segment" ? isLoadingCollections : isLoadingWatchlists;
  const isEmpty = tab === "segment" ? filteredCollections.length === 0 : filteredWatchlists.length === 0;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) setQuery("");
      }}
    >
      <DialogContent className="flex h-[70dvh] w-[min(96vw,480px)] max-w-[min(96vw,480px)] flex-col gap-0 p-4">
        <DialogHeader className="gap-1">
          <DialogTitle className="text-base font-semibold">Add Widget</DialogTitle>
        </DialogHeader>

        <div className="mt-3 grid grid-cols-2 gap-1 rounded-md border border-border bg-background p-1">
          {(["segment", "watchlist"] as SourceTab[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setTab(option)}
              className={cn(
                "h-8 cursor-pointer rounded text-xs font-semibold transition-colors hover:bg-muted",
                tab === option && "bg-primary text-primary-foreground hover:bg-primary"
              )}
            >
              {option === "segment" ? "Segments" : "Watchlists"}
            </button>
          ))}
        </div>

        <div className="relative mt-3">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={tab === "segment" ? "Search Segments" : "Search Watchlists"}
            className="h-9 pl-8 text-sm"
          />
        </div>

        <div className="mt-2 min-h-0 flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner size="sm" />
            </div>
          ) : isEmpty ? (
            <EmptyState
              size="compact"
              title={
                trimmedQuery
                  ? "No matches for your search."
                  : tab === "segment"
                    ? "No Segments available."
                    : "No Watchlists yet."
              }
              className="py-8"
            />
          ) : tab === "segment" ? (
            <div className="flex flex-col divide-y divide-border">
              {filteredCollections.map((collection) => {
                const source: WidgetSource = { type: "segment", id: collection.id };
                const selected = isSelected(sources, source);
                return (
                  <SourceRow
                    key={collection.id}
                    label={collection.name}
                    meta={
                      <>
                        {collection.exchange} &middot; {collection.memberCount} stocks
                      </>
                    }
                    selected={selected}
                    onAdd={() => onSelect(source)}
                    onRemove={() => onRemove(source)}
                  />
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {filteredWatchlists.map((watchlist) => {
                const source: WidgetSource = { type: "watchlist", id: watchlist.id };
                const selected = isSelected(sources, source);
                return (
                  <SourceRow
                    key={watchlist.id}
                    label={watchlist.name}
                    meta={`${watchlist.itemCount} ${watchlist.itemCount === 1 ? "stock" : "stocks"}`}
                    selected={selected}
                    onAdd={() => onSelect(source)}
                    onRemove={() => onRemove(source)}
                  />
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
