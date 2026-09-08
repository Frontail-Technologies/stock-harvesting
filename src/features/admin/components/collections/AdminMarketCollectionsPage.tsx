"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Layers, Loader2, MoreHorizontal, RotateCcw, Trash2, Upload } from "lucide-react";
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
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { CollectionPreparationStatus } from "@/features/market-collections";
import { adminPath } from "@/utils/seo";
import { cn } from "@/utils/cn";
import {
  useAdminMarketCollections,
  useRetryAdminCollectionPreparation,
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

export function AdminMarketCollectionsPage() {
  const collectionsQuery = useAdminMarketCollections();
  const retryMutation = useRetryAdminCollectionPreparation();
  const collections = collectionsQuery.data?.collections ?? [];

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
              <p className="text-sm text-muted-foreground">
                Manage index/segment groups (NIFTY 50, NIFTY 100, ...) used to power the dashboard.
              </p>
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

      <section className="overflow-hidden rounded-md border border-border bg-card text-card-foreground">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-10 border-r border-border px-4">
                <Checkbox
                  checked={allVisibleSelected}
                  indeterminate={selectedCount > 0 && !allVisibleSelected}
                  onCheckedChange={(checked) => toggleAll(checked === true)}
                  aria-label="Select all segments"
                />
              </TableHead>
              <TableHead className="w-14 border-r border-border px-4 text-right text-xs font-semibold">
                No.
              </TableHead>
              <TableHead className="border-r border-border px-4 text-xs font-semibold">
                Code
              </TableHead>
              <TableHead className="min-w-52 border-r border-border px-4 text-xs font-semibold">
                Name
              </TableHead>
              <TableHead className="w-28 border-r border-border px-4 text-xs font-semibold">
                Exchange
              </TableHead>
              <TableHead className="w-32 border-r border-border px-4 text-xs font-semibold">
                Members
              </TableHead>
              <TableHead className="w-32 border-r border-border px-4 text-xs font-semibold">
                Data
              </TableHead>
              <TableHead className="w-10 px-4" />
              <TableHead className="w-10 px-4" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {collections.map((collection, index) => (
              <TableRow key={collection.id} className="hover:bg-muted/30">
                <TableCell className="border-r border-border px-4">
                  <Checkbox
                    checked={selectedIds.has(collection.id)}
                    onCheckedChange={(checked) => toggleRow(collection.id, checked === true)}
                    aria-label={`Select ${collection.name}`}
                  />
                </TableCell>
                <TableCell className="border-r border-border px-4 text-right text-muted-foreground tabular-nums">
                  {index + 1}
                </TableCell>
                <TableCell className="border-r border-border px-4">
                  <Link
                    href={adminPath(`/admin/market-collections/${collection.id}`)}
                    className="font-medium text-foreground hover:underline"
                  >
                    {collection.code}
                  </Link>
                </TableCell>
                <TableCell className="border-r border-border px-4 text-muted-foreground">
                  {collection.name}
                </TableCell>
                <TableCell className="border-r border-border px-4">
                  <Badge variant="outline" className="bg-muted text-muted-foreground">
                    {collection.exchange}
                  </Badge>
                </TableCell>
                <TableCell className="border-r border-border px-4 text-muted-foreground">
                  {collection.memberCount}
                </TableCell>
                <TableCell className="border-r border-border px-4">
                  <div className="flex items-center gap-1.5">
                    <PreparationStatusBadge status={collection.preparationStatus} />
                    {collection.preparationStatus === "failed" && (
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                retryMutation.mutate(collection.id);
                              }}
                              disabled={retryMutation.isPending}
                              aria-label="Retry data preparation"
                              className="cursor-pointer text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
                            />
                          }
                        >
                          <RotateCcw className="size-3.5" />
                        </TooltipTrigger>
                        <TooltipContent>Retry</TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </TableCell>
                <TableCell className="px-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Actions for ${collection.name}`}
                          onClick={(event) => event.stopPropagation()}
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
                </TableCell>
                <TableCell className="px-4">
                  <Link href={adminPath(`/admin/market-collections/${collection.id}`)}>
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </Link>
                </TableCell>
              </TableRow>
            ))}

            {collections.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="py-10 text-center text-sm text-muted-foreground">
                  {collectionsQuery.isLoading ? (
                    <span className="inline-flex items-center gap-2">
                      <Spinner size="sm" />
                      Loading segments...
                    </span>
                  ) : collectionsQuery.isError ? (
                    "Unable to load segments."
                  ) : (
                    <EmptyState
                      size="compact"
                      illustration={<Layers className="size-4 text-muted-foreground" />}
                      title="No segments yet."
                      description="Create one to get started."
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
