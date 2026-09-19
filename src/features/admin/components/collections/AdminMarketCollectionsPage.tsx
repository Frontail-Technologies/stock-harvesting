"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Layers, Loader2, MoreHorizontal, RotateCcw, Trash2, Upload, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { CollectionPreparationStatus, MarketCollection } from "@/features/market-collections";
import { adminPath } from "@/utils/seo";
import { cn } from "@/utils/cn";
import {
  useAdminMarketCollections,
  useRetryAdminCollectionPreparation,
  useUpdateAdminMarketCollection,
} from "../../hooks/use-admin-market-collections";
import { AdminBulkDeleteCollectionsDialog } from "./AdminBulkDeleteCollectionsDialog";
import { AdminCreateCollectionDialog } from "./AdminCreateCollectionDialog";
import { AdminDeleteCollectionDialog } from "./AdminDeleteCollectionDialog";

const PREPARATION_STATUS_LABEL: Record<CollectionPreparationStatus, string> = {
  pending: "Preparing",
  syncing_candles: "Preparing",
  building_backtest: "Preparing",
  ready: "Ready",
  partial: "Partial",
  failed: "Failed",
};

function PreparationStatusBadge({ status }: { status: CollectionPreparationStatus }) {
  const isPreparing = status === "pending" || status === "syncing_candles" || status === "building_backtest";
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1 border-transparent",
        status === "ready" && "bg-success/10 text-success",
        status === "partial" && "bg-warning/10 text-warning",
        status === "failed" && "bg-danger/10 text-danger",
        isPreparing && "bg-muted text-muted-foreground"
      )}
    >
      {isPreparing && <Loader2 className="size-3 animate-spin" />}
      {PREPARATION_STATUS_LABEL[status]}
    </Badge>
  );
}

// Toggle + order live in one cell (the order only means anything while the
// toggle is on) - a self-contained local draft for the order input so
// typing doesn't fire a save on every keystroke, committed on blur/Enter.
function WidgetDefaultCell({
  collection,
  onToggle,
  onOrderCommit,
  pending,
}: {
  collection: MarketCollection;
  onToggle: (checked: boolean) => void;
  onOrderCommit: (value: number | null) => void;
  pending: boolean;
}) {
  // Resyncing to the server value when it changes underneath this cell is
  // handled by the caller keying this component on collection.widgetOrder
  // (remounts with a fresh initial draft) rather than an effect.
  const [orderDraft, setOrderDraft] = useState(collection.widgetOrder?.toString() ?? "");
  const [editingOrder, setEditingOrder] = useState(false);

  const commitOrder = () => {
    const trimmed = orderDraft.trim();
    if (trimmed === "") {
      if (collection.widgetOrder !== null) onOrderCommit(null);
      setEditingOrder(false);
      return;
    }
    const parsed = Number(trimmed);
    if (!Number.isInteger(parsed) || parsed < 1) {
      setOrderDraft(collection.widgetOrder?.toString() ?? "");
      setEditingOrder(false);
      return;
    }
    if (parsed !== collection.widgetOrder) onOrderCommit(parsed);
    setEditingOrder(false);
  };

  return (
    <div className="flex items-center gap-2">
      <Switch
        checked={collection.showOnWidgetDefault}
        disabled={pending}
        onCheckedChange={onToggle}
        aria-label={`Toggle Widget default for ${collection.name}`}
      />
      {collection.showOnWidgetDefault && (
        editingOrder ? (
          <Input
            autoFocus
            type="number"
            min={1}
            value={orderDraft}
            disabled={pending}
            onClick={(event) => event.stopPropagation()}
            onChange={(event) => setOrderDraft(event.target.value)}
            onBlur={commitOrder}
            onKeyDown={(event) => {
              if (event.key === "Enter") event.currentTarget.blur();
              if (event.key === "Escape") {
                setOrderDraft(collection.widgetOrder?.toString() ?? "");
                setEditingOrder(false);
              }
            }}
            placeholder="Order"
            aria-label={`Widget order for ${collection.name}`}
            className="h-7 w-16 px-1.5 text-center text-xs"
          />
        ) : (
          <button
            type="button"
            disabled={pending}
            onClick={(event) => {
              event.stopPropagation();
              setEditingOrder(true);
            }}
            className="h-7 min-w-9 rounded-md px-2 text-xs tabular-nums text-foreground hover:bg-muted disabled:opacity-50"
            aria-label={`Edit widget order for ${collection.name}`}
          >
            {collection.widgetOrder ?? "Set"}
          </button>
        )
      )}
    </div>
  );
}

export function AdminMarketCollectionsPage() {
  const collectionsQuery = useAdminMarketCollections();
  const retryMutation = useRetryAdminCollectionPreparation();
  const updateMutation = useUpdateAdminMarketCollection();
  const collections = collectionsQuery.data?.collections ?? [];
  const totalMembers = collections.reduce((total, collection) => total + collection.memberCount, 0);
  const readyCount = collections.filter((collection) => collection.preparationStatus === "ready").length;
  const attentionCount = collections.filter((collection) => collection.preparationStatus === "failed" || collection.preparationStatus === "partial").length;

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const selectedCount = selectedIds.size;
  const allVisibleSelected = collections.length > 0 && collections.every((row) => selectedIds.has(row.id));

  const toggleAll = (checked: boolean) => {
    setSelectedIds(checked ? new Set(collections.map((row) => row.id)) : new Set());
  };

  const toggleRow = (id: string, checked: boolean) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  return (
    <div className="flex w-full flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {selectedCount > 0 ? (
          <>
            <p className="text-sm font-medium text-foreground">{selectedCount} selected</p>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="gap-1.5"
              onClick={() => setBulkDeleteOpen(true)}
            >
              <Trash2 className="size-3.5" />
              Delete selected
            </Button>
          </>
        ) : (
          <>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Segments</h1>
            </div>
            <div className="flex items-center gap-2">
              <Link href={adminPath("/admin/market-collections/bulk-import")}>
                <Button type="button" variant="outline" size="sm" className="gap-1.5">
                  <Upload className="size-3.5" />
                  Bulk Import
                </Button>
              </Link>
              <AdminCreateCollectionDialog />
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
          <span className="flex size-9 items-center justify-center rounded-md bg-violet-500/10 text-violet-700 dark:text-violet-300"><Layers className="size-4" /></span>
          <div><p className="text-[11px] text-muted-foreground">Segments</p><p className="font-semibold text-foreground">{collections.length}</p></div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
          <span className="flex size-9 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"><CheckCircle2 className="size-4" /></span>
          <div><p className="text-[11px] text-muted-foreground">Ready</p><p className="font-semibold text-foreground">{readyCount}</p></div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
          <span className="flex size-9 items-center justify-center rounded-md bg-cyan-500/10 text-cyan-700 dark:text-cyan-300"><Users className="size-4" /></span>
          <div><p className="text-[11px] text-muted-foreground">Members</p><p className="font-semibold text-foreground tabular-nums">{totalMembers}</p></div>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
          <span className={cn("flex size-9 items-center justify-center rounded-md", attentionCount > 0 ? "bg-rose-500/10 text-rose-700 dark:text-rose-300" : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300")}><AlertTriangle className="size-4" /></span>
          <div><p className="text-[11px] text-muted-foreground">Needs attention</p><p className="font-semibold text-foreground">{attentionCount}</p></div>
        </div>
      </div>

      <section className="overflow-hidden rounded-md border border-border bg-card text-card-foreground">
        <Table className="table-fixed">
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-11 border-r border-border p-0">
                <div className="flex items-center justify-center py-2">
                  <Checkbox
                    checked={allVisibleSelected}
                    indeterminate={selectedCount > 0 && !allVisibleSelected}
                    onCheckedChange={(checked) => toggleAll(checked === true)}
                    aria-label="Select all segments"
                  />
                </div>
              </TableHead>
              <TableHead className="w-12 border-r border-border px-2 text-right text-xs font-semibold">
                No.
              </TableHead>
              <TableHead className="w-36 border-r border-border px-3 text-xs font-semibold">
                Code
              </TableHead>
              <TableHead className="border-r border-border px-3 text-xs font-semibold">
                Name
              </TableHead>
              <TableHead className="w-20 border-r border-border px-2 text-xs font-semibold">
                Exchange
              </TableHead>
              <TableHead className="w-20 border-r border-border px-2 text-right text-xs font-semibold">
                Members
              </TableHead>
              <TableHead className="w-40 border-r border-border px-2 text-xs font-semibold">
                Data
              </TableHead>
              <TableHead className="w-40 border-r border-border px-2 text-xs font-semibold">
                Widget Default
              </TableHead>
              <TableHead className="sticky right-0 z-10 w-12 border-l border-border bg-muted/50 p-0" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {collections.map((collection, index) => (
              <TableRow key={collection.id} className="hover:bg-muted/30">
                <TableCell className="border-r border-border p-0">
                  <div className="flex items-center justify-center py-2">
                    <Checkbox
                      checked={selectedIds.has(collection.id)}
                      onCheckedChange={(checked) => toggleRow(collection.id, checked === true)}
                      aria-label={`Select ${collection.name}`}
                    />
                  </div>
                </TableCell>
                <TableCell className="border-r border-border px-2 text-right text-muted-foreground tabular-nums">
                  {index + 1}
                </TableCell>
                <TableCell className="min-w-0 border-r border-border px-3">
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Link
                          href={adminPath(`/admin/market-collections/${collection.id}`)}
                          className="block truncate font-medium text-foreground hover:underline"
                        />
                      }
                    >
                      {collection.code}
                    </TooltipTrigger>
                    <TooltipContent>{collection.code}</TooltipContent>
                  </Tooltip>
                </TableCell>
                <TableCell className="min-w-0 border-r border-border px-3 text-muted-foreground">
                  <Tooltip>
                    <TooltipTrigger render={<span className="block truncate" />}>
                      {collection.name}
                    </TooltipTrigger>
                    <TooltipContent>{collection.name}</TooltipContent>
                  </Tooltip>
                </TableCell>
                <TableCell className="border-r border-border px-2">
                  <Badge variant="outline" className="bg-muted text-muted-foreground">
                    {collection.exchange}
                  </Badge>
                </TableCell>
                <TableCell className="border-r border-border px-2 text-right text-muted-foreground tabular-nums">
                  {collection.memberCount}
                </TableCell>
                <TableCell className="border-r border-border px-2">
                  <div className="flex items-center gap-1.5">
                    <PreparationStatusBadge status={collection.preparationStatus} />
                    {collection.preparationStatus === "failed" && (
                      <Tooltip>
                        <TooltipTrigger
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            retryMutation.mutate(collection.id);
                          }}
                          disabled={retryMutation.isPending}
                          aria-label="Retry data preparation"
                          className="shrink-0 cursor-pointer text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                        >
                          <RotateCcw className="size-3.5" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          {collection.preparationError ? (
                            <span className="block">
                              <span className="font-semibold">Preparation failed.</span> Click to retry.
                              <span className="mt-1 block break-words font-mono text-[11px] opacity-90">
                                {collection.preparationError}
                              </span>
                            </span>
                          ) : (
                            "Retry data preparation"
                          )}
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </TableCell>
                <TableCell className="border-r border-border px-2">
                  <WidgetDefaultCell
                    key={`${collection.id}:${collection.widgetOrder ?? "none"}`}
                    collection={collection}
                    pending={updateMutation.isPending && updateMutation.variables?.id === collection.id}
                    onToggle={(checked) =>
                      updateMutation.mutate({ id: collection.id, showOnWidgetDefault: checked })
                    }
                    onOrderCommit={(value) =>
                      updateMutation.mutate({ id: collection.id, widgetOrder: value })
                    }
                  />
                </TableCell>
                <TableCell className="sticky right-0 z-10 w-12 border-l border-border bg-card p-0">
                  <div className="flex items-center justify-center py-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Actions for ${collection.name}`}
                          />
                        }
                      >
                        <MoreHorizontal className="size-4 text-muted-foreground" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setDeleteTarget({ id: collection.id, name: collection.name })}
                        >
                          <Trash2 />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}

            {collections.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="py-10 text-center text-sm text-muted-foreground">
                  {collectionsQuery.isLoading ? (
                    <span className="inline-flex items-center gap-2">
                      <Spinner size="md" className="text-primary" />
                      Loading segments...
                    </span>
                  ) : collectionsQuery.isError ? (
                    "Unable to load segments."
                  ) : (
                    <EmptyState
                      size="compact"
                      illustration={<Layers className="size-4 text-muted-foreground" />}
                      title="No segments yet."
                      className="py-0"
                    />
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </section>

      <AdminDeleteCollectionDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        collection={deleteTarget}
        onDeleted={() => {
          if (deleteTarget) {
            setSelectedIds((current) => {
              const next = new Set(current);
              next.delete(deleteTarget.id);
              return next;
            });
          }
        }}
      />

      <AdminBulkDeleteCollectionsDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        collectionIds={[...selectedIds]}
        onDeleted={() => setSelectedIds(new Set())}
      />
    </div>
  );
}
