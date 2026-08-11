"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  useCollectionRelativeStrength,
  type CollectionGroupRelativeStrengthRow,
} from "@/features/market-collections";
import { useIndexRelativeStrength } from "@/features/market-data";
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

// Sectors/industries are a small, roughly fixed taxonomy (~22 sectors, ~57
// industries per GlobalDataFeeds' GetSectors) — well under this, so the
// group-ranked cards effectively show every category with real data.
const GROUP_RANKING_LIMIT = 100;

// Indices live under a virtual exchange code parallel to the collection's
// own equity exchange — NSE collections rank NSE indices, BSE collections
// rank BSE indices.
const INDEX_EXCHANGE_BY_EQUITY_EXCHANGE: Record<string, string> = {
  NSE: "NSE_IDX",
  BSE: "BSE_IDX",
};

export function DashboardCollectionPage({ code }: { code: string }) {
  const rsQuery = useCollectionRelativeStrength({ code, limit: 200 });
  const sectorQuery = useCollectionRelativeStrength({
    code,
    limit: GROUP_RANKING_LIMIT,
    groupBy: "sector",
  });
  const industryQuery = useCollectionRelativeStrength({
    code,
    limit: GROUP_RANKING_LIMIT,
    groupBy: "industry",
  });
  // Not collection-scoped — same index ranking regardless of which
  // collection is open (indices aren't members of any market_collection) —
  // but scoped to the collection's own exchange so a BSE collection shows
  // BSE indices, not NSE ones.
  const collectionExchange = rsQuery.data?.collection.exchange;
  const indexExchange = collectionExchange
    ? INDEX_EXCHANGE_BY_EQUITY_EXCHANGE[collectionExchange] ?? "NSE_IDX"
    : undefined;
  const indexQuery = useIndexRelativeStrength(150, indexExchange);

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

  const cards = buildCollectionCards({
    indexMetrics: indexQuery.metrics,
    weeklyStrongMetrics: rsQuery.metrics,
    sectorGroups: sectorQuery.data?.groups ?? [],
    industryGroups: industryQuery.data?.groups ?? [],
  });
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

type StockScoreRow = {
  symbol: string;
  exchange: string;
  combinedScore: number;
};

function buildCollectionCards(input: {
  indexMetrics: StockScoreRow[];
  weeklyStrongMetrics: StockScoreRow[];
  sectorGroups: CollectionGroupRelativeStrengthRow[];
  industryGroups: CollectionGroupRelativeStrengthRow[];
}): DashboardCardData[] {
  const timestamp = new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());

  // Index ranks actual NSE indices (NIFTY AUTO, BANKNIFTY, ...) against each
  // other — global, not scoped to the selected collection, since indices
  // aren't members of any market_collection. Sector/Industry rank the
  // categories themselves (mean combinedScore of member stocks) — a
  // sector-rotation view, not a stock list. Weekly Strong ranks individual
  // stocks in the selected collection by the same combined score (55-day
  // change + monthly change + weekly MACD line % + weekly MACD histogram %).
  return [
    createStockCard(
      "relative-strength-index",
      "Relative Strength Index",
      timestamp,
      input.indexMetrics
    ),
    createGroupCard(
      "relative-strength-sector",
      "Relative Strength Sector",
      timestamp,
      input.sectorGroups
    ),
    createGroupCard(
      "relative-strength-industry",
      "Relative Strength Industry",
      timestamp,
      input.industryGroups
    ),
    createStockCard(
      "weekly-strong-stock-list",
      "Weekly Strong Stock List",
      timestamp,
      input.weeklyStrongMetrics
    ),
  ];
}

function createStockCard(
  id: string,
  title: string,
  timestamp: string,
  metrics: StockScoreRow[]
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

function createGroupCard(
  id: string,
  title: string,
  timestamp: string,
  groups: CollectionGroupRelativeStrengthRow[]
): DashboardCardData {
  return {
    id,
    title,
    timestamp,
    variant: "category",
    items: groups.map((group, index) => ({
      rank: index + 1,
      label: group.label,
      value: group.score,
      color: COLOR_CYCLE[index % COLOR_CYCLE.length],
    })),
  };
}
