"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  useCollectionRelativeStrength,
  type CollectionRelativeStrengthMetric,
} from "@/features/market-collections";
import type { DashboardCardData, DashboardItemColor } from "@/types/dashboard";
import { DashboardWidget } from "./DashboardWidget";
import { DashboardGridSkeleton } from "./DashboardWidgetSkeleton";
import { WeeklyStrongBacktestChart } from "./WeeklyStrongBacktestChart";
import { WeeklyStrongStockTable } from "./WeeklyStrongStockTable";

const COLOR_CYCLE: DashboardItemColor[] = [
  "blue",
  "green",
  "purple",
  "orange",
  "teal",
  "red",
];

export function DashboardCollectionPage({ code }: { code: string }) {
  const rsQuery = useCollectionRelativeStrength({ code, limit: 200 });

  if (rsQuery.isLoading) {
    return <DashboardGridSkeleton />;
  }

  if (rsQuery.isError || !rsQuery.data) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-sm text-muted-foreground">
        Couldn&apos;t load this collection. It may not exist, be inactive, or have no
        active members yet.
      </div>
    );
  }

  const cards = buildCollectionCards(rsQuery.metrics);
  const collectionName = rsQuery.data.collection.name;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3.5" />
          Back to Dashboard
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-foreground">{collectionName}</h1>
        <p className="text-sm text-muted-foreground">
          Relative strength across {collectionName} constituents
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <DashboardWidget key={card.id} card={card} />
        ))}
      </div>

      <WeeklyStrongStockTable code={code} />

      <WeeklyStrongBacktestChart code={code} />
    </div>
  );
}

function buildCollectionCards(
  metrics: CollectionRelativeStrengthMetric[]
): DashboardCardData[] {
  const timestamp = new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());

  // All 4 boxes rank by the same combined score (55-day change + monthly
  // change + weekly MACD line % + weekly MACD histogram %, all added
  // together) instead of each box using one of the 4 conditions on its
  // own — they show the same ranked list under their 4 existing titles.
  return [
    createCard("relative-strength-index", "Relative Strength Index", timestamp, metrics),
    createCard("relative-strength-sector", "Relative Strength Sector", timestamp, metrics),
    createCard("relative-strength-industry", "Relative Strength Industry", timestamp, metrics),
    createCard("weekly-strong-stock-list", "Weekly Strong Stock List", timestamp, metrics),
  ];
}

function createCard(
  id: string,
  title: string,
  timestamp: string,
  metrics: CollectionRelativeStrengthMetric[]
): DashboardCardData {
  const rows = [...metrics].sort((a, b) => b.combinedScore - a.combinedScore);

  return {
    id,
    title,
    timestamp,
    variant: "stockList",
    items: rows.map((row, index) => ({
      rank: index + 1,
      label: row.symbol,
      value: row.combinedScore,
      color: COLOR_CYCLE[index % COLOR_CYCLE.length],
      metric: undefined,
      exchange: row.exchange,
    })),
  };
}
