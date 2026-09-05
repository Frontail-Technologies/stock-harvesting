"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { adminPath } from "@/utils/seo";
import { formatAdminDate } from "../../lib/admin-formatters";
import { useAdminMarketCollection } from "../../hooks/use-admin-market-collections";
import { AdminCollectionImportDialog } from "./AdminCollectionImportDialog";
import { AdminCollectionMembersTable } from "./AdminCollectionMembersTable";
import { AdminCollectionMetadataForm } from "./AdminCollectionMetadataForm";
import { AdminCollectionVersionHistory } from "./AdminCollectionVersionHistory";
import { AdminWeeklyStrongBacktestStatus } from "./AdminWeeklyStrongBacktestStatus";

export function AdminMarketCollectionDetailPage({ id }: { id: string }) {
  const collectionQuery = useAdminMarketCollection(id);
  const collection = collectionQuery.data?.collection ?? null;

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
        </div>
        <AdminCollectionImportDialog collectionId={collection.id} />
      </div>

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
