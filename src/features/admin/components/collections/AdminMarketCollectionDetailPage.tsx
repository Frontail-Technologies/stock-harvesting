"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, Loader2, RotateCcw, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { adminPath } from "@/utils/seo";
import { cn } from "@/utils/cn";
import { formatAdminDate } from "../../lib/admin-formatters";
import {
  useAdminMarketCollection,
  useRetryAdminCollectionPreparation,
} from "../../hooks/use-admin-market-collections";
import { AdminCollectionImportDialog } from "./AdminCollectionImportDialog";
import { AdminCollectionMembersTable } from "./AdminCollectionMembersTable";
import { AdminCollectionMetadataForm } from "./AdminCollectionMetadataForm";
import { AdminCollectionVersionHistory } from "./AdminCollectionVersionHistory";
import { AdminDeleteCollectionDialog } from "./AdminDeleteCollectionDialog";
import { AdminWeeklyStrongBacktestStatus } from "./AdminWeeklyStrongBacktestStatus";

const PREPARATION_STATUS_LABEL = {
  pending: "Preparing",
  syncing_candles: "Preparing",
  building_backtest: "Preparing",
  ready: "Ready",
  partial: "Partial",
  failed: "Failed",
} as const;

export function AdminMarketCollectionDetailPage({ id }: { id: string }) {
  const router = useRouter();
  const collectionQuery = useAdminMarketCollection(id);
  const retryMutation = useRetryAdminCollectionPreparation();
  const collection = collectionQuery.data?.collection ?? null;
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (collectionQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Loading segment...</p>;
  }

  if (collectionQuery.isError || !collection) {
    return <p className="text-sm text-danger">Couldn&apos;t load this segment.</p>;
  }

  return (
    <div className="flex w-full flex-col gap-5">
      <Link
        href={adminPath("/admin/market-collections")}
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Back to segments
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold text-foreground">{collection.name}</h1>
          <Badge variant="outline" className="bg-muted text-muted-foreground">
            {collection.code}
          </Badge>
          <Badge variant="outline" className="bg-muted text-muted-foreground">
            {collection.exchange}
          </Badge>
          <Badge
            variant="outline"
            className={
              collection.active
                ? "border-success/30 bg-success/10 text-success"
                : "border-danger/30 bg-danger/10 text-danger"
            }
          >
            {collection.active ? "Active" : "Inactive"}
          </Badge>
          <Badge
            variant="outline"
            className={cn(
              "gap-1 border-transparent",
              collection.preparationStatus === "ready" && "bg-success/10 text-success",
              collection.preparationStatus === "partial" && "bg-warning/10 text-warning",
              collection.preparationStatus === "failed" && "bg-danger/10 text-danger",
              (collection.preparationStatus === "pending" ||
                collection.preparationStatus === "syncing_candles" ||
                collection.preparationStatus === "building_backtest") &&
                "bg-muted text-muted-foreground"
            )}
          >
            {(collection.preparationStatus === "pending" ||
              collection.preparationStatus === "syncing_candles" ||
              collection.preparationStatus === "building_backtest") && (
              <Loader2 className="size-3 animate-spin" />
            )}
            {PREPARATION_STATUS_LABEL[collection.preparationStatus]}
          </Badge>
          {collection.preparationStatus === "failed" && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-6 gap-1 px-2 text-xs"
              disabled={retryMutation.isPending}
              onClick={() => retryMutation.mutate(collection.id)}
            >
              <RotateCcw className="size-3" />
              Retry
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <AdminCollectionImportDialog collectionId={collection.id} />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="gap-1.5"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="size-3.5" />
            Delete
          </Button>
        </div>
      </div>

      {collection.preparationStatus === "failed" && collection.preparationError && (
        <div className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/10 p-3 text-xs text-danger">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <div>
            <p className="font-semibold">Data preparation failed</p>
            <p className="mt-0.5 break-words font-mono text-[11px] leading-relaxed text-danger/90">
              {collection.preparationError}
            </p>
          </div>
        </div>
      )}

      <AdminDeleteCollectionDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        collection={collection}
        onDeleted={() => router.push(adminPath("/admin/market-collections"))}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-lg border border-border bg-card p-4 text-sm">
          <h2 className="mb-3 text-sm font-semibold text-foreground">Source metadata</h2>
          <dl className="flex flex-col gap-2 text-xs">
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Members</dt>
              <dd className="font-medium text-foreground">{collection.memberCount}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Source name</dt>
              <dd className="font-medium text-foreground">{collection.sourceName ?? "-"}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Source date</dt>
              <dd className="font-medium text-foreground">
                {collection.sourceDate ? formatAdminDate(collection.sourceDate) : "-"}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Last import</dt>
              <dd className="font-medium text-foreground">
                {collection.lastImportedAt ? formatAdminDate(collection.lastImportedAt) : "Never"}
              </dd>
            </div>
          </dl>
        </section>

        <AdminCollectionMetadataForm key={collection.id} collection={collection} />
        <AdminWeeklyStrongBacktestStatus collectionId={collection.id} />
      </div>

      <AdminCollectionVersionHistory collectionId={collection.id} />

      <AdminCollectionMembersTable collectionId={collection.id} />
    </div>
  );
}
