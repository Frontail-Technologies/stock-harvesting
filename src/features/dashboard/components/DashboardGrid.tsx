"use client";

import Link from "next/link";
import { Layers } from "lucide-react";
import { useMarketStore } from "@/features/market";
import { useMarketCollections } from "@/features/market-collections";

export function DashboardGrid() {
  const selectedExchange = useMarketStore((state) => state.selectedExchange);
  const collectionsQuery = useMarketCollections({ exchange: selectedExchange });

  if (collectionsQuery.isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-24 animate-pulse rounded-lg border border-border bg-card"
          />
        ))}
      </div>
    );
  }

  if (collectionsQuery.collections.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-sm text-muted-foreground">
        No market collections yet for {selectedExchange}. Create one from Admin &gt;
        Collections and import a constituent CSV.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {collectionsQuery.collections.map((collection) => (
        <Link
          key={collection.id}
          href={`/dashboard/collections/${collection.code}`}
          className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-4 transition-colors hover:border-primary/40 hover:bg-primary/5"
        >
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Layers className="size-4" />
          </div>
          <h3 className="truncate text-sm font-semibold text-foreground">{collection.name}</h3>
        </Link>
      ))}
    </div>
  );
}
