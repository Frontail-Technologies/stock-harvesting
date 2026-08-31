"use client";

import { useCallback, useMemo, useState } from "react";
import {
  useCollectionRelativeStrength,
  type CollectionGroupRelativeStrengthRow,
  type CollectionRelativeStrengthMetric,
} from "@/features/market-collections";
import { useIndexRelativeStrength } from "@/features/market-data";
import type { DashboardCardData } from "@/types/dashboard";
import {
  buildSectorIndustryRelation,
  EMPTY_CROSS_FILTER,
  filterGroupsBySector,
  filterWeeklyStrongByCrossFilter,
  selectIndustry,
  selectSector,
  type CrossFilterState,
  type SectorIndustryRelation,
} from "../lib/dashboard-cross-filter";
import { colorForDashboardLabel } from "../lib/dashboard-widget-colors";
import { DashboardGridSkeleton } from "./DashboardWidgetSkeleton";
import { DashboardWidgetRow } from "./DashboardWidgetRow";
import { WeeklyStrongBacktestSection } from "./WeeklyStrongBacktestSection";
import { WeeklyStrongStockTable } from "./WeeklyStrongStockTable";

const GROUP_RANKING_LIMIT = 100;

const INDEX_EXCHANGE_BY_EQUITY_EXCHANGE: Record<string, string> = {
  NSE: "NSE_IDX",
  BSE: "BSE_IDX",
};

export function DashboardSegmentContent({ code, exchange }: { code: string; exchange: string }) {

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

  const indexExchange = INDEX_EXCHANGE_BY_EQUITY_EXCHANGE[exchange] ?? "NSE_IDX";
  const indexQuery = useIndexRelativeStrength(150, indexExchange);

  const [crossFilter, setCrossFilter] = useState<CrossFilterState>(EMPTY_CROSS_FILTER);

  const relation = useMemo(() => buildSectorIndustryRelation(rsQuery.metrics), [rsQuery.metrics]);

  const handleSectorClick = useCallback(
    (sector: string) => setCrossFilter((current) => selectSector(current, relation, sector)),
    [relation]
  );
  const handleIndustryClick = useCallback(
    (industry: string) => setCrossFilter((current) => selectIndustry(current, relation, industry)),
    [relation]
  );
  const clearCrossFilters = useCallback(() => setCrossFilter(EMPTY_CROSS_FILTER), []);

  const filteredStockStrengthMetrics = useMemo(
    () => filterWeeklyStrongByCrossFilter(rsQuery.metrics, crossFilter),
    [rsQuery.metrics, crossFilter]
  );

  const cards = buildCollectionCards({
    indexMetrics: indexQuery.metrics,
    indexAsOfDate: indexQuery.asOfDate,
    stockStrengthMetrics: filteredStockStrengthMetrics,
    stockStrengthAsOfDate: rsQuery.asOfDate,
    sectorGroups: sectorQuery.data?.groups ?? [],
    sectorAsOfDate: sectorQuery.asOfDate,
    industryGroups: industryQuery.data?.groups ?? [],
    industryAsOfDate: industryQuery.asOfDate,
    relation,
    crossFilter,
    onSectorClick: handleSectorClick,
    onIndustryClick: handleIndustryClick,
  });

  const isCrossFilterActive = crossFilter.selectedSector !== null || crossFilter.selectedIndustry !== null;

  return (
    <div className="flex flex-col gap-7">

      {rsQuery.isLoading || sectorQuery.isLoading || industryQuery.isLoading ? (
        <DashboardGridSkeleton />
      ) : rsQuery.isError || !rsQuery.data ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
          Couldn&apos;t load this segment. It may not exist, be inactive, or have no active
          members yet.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {isCrossFilterActive && (
            <button
              type="button"
              onClick={clearCrossFilters}
              className="cursor-pointer self-start text-xs font-medium text-primary hover:underline"
            >
              Clear filters
            </button>
          )}
          <DashboardWidgetRow cards={cards} />
        </div>
      )}

      <WeeklyStrongStockTable code={code} crossFilter={crossFilter} />

      <WeeklyStrongBacktestSection key={code} code={code} />
    </div>
  );
}

type StockChangeRow = {
  symbol: string;
  exchange: string;
  change55dPct: number;
};

function formatAsOfDate(asOfDate: string | null): string {
  if (!asOfDate) return "";
  const parsed = new Date(`${asOfDate}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) return "";
  return `As of ${new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeZone: "UTC" }).format(parsed)}`;
}

function buildCollectionCards(input: {
  indexMetrics: StockChangeRow[];
  indexAsOfDate: string | null;
  stockStrengthMetrics: CollectionRelativeStrengthMetric[];
  stockStrengthAsOfDate: string | null;
  sectorGroups: CollectionGroupRelativeStrengthRow[];
  sectorAsOfDate: string | null;
  industryGroups: CollectionGroupRelativeStrengthRow[];
  industryAsOfDate: string | null;
  relation: SectorIndustryRelation;
  crossFilter: CrossFilterState;
  onSectorClick: (sector: string) => void;
  onIndustryClick: (industry: string) => void;
}): DashboardCardData[] {

  const visibleIndustryGroups = filterGroupsBySector(
    input.industryGroups,
    input.relation,
    input.crossFilter.selectedSector
  );

  return [
    createStockCard(
      "relative-strength-index",
      "Relative Strength Index",
      formatAsOfDate(input.indexAsOfDate),
      input.indexMetrics
    ),
    createGroupCard(
      "relative-strength-sector",
      "Relative Strength Sector",
      formatAsOfDate(input.sectorAsOfDate),
      input.sectorGroups,
      { selectedLabel: input.crossFilter.selectedSector, onSelectLabel: input.onSectorClick }
    ),
    createGroupCard(
      "relative-strength-industry",
      "Relative Strength Industry",
      formatAsOfDate(input.industryAsOfDate),
      visibleIndustryGroups,
      { selectedLabel: input.crossFilter.selectedIndustry, onSelectLabel: input.onIndustryClick }
    ),
    createStockCard(
      "55-day-stock-strength",
      "55 Day Stock Strength",
      formatAsOfDate(input.stockStrengthAsOfDate),
      input.stockStrengthMetrics
    ),
  ];
}

function createStockCard(
  id: string,
  title: string,
  timestamp: string,
  metrics: StockChangeRow[]
): DashboardCardData {
  const rows = [...metrics].sort((a, b) => b.change55dPct - a.change55dPct);

  return {
    id,
    title,
    timestamp,
    variant: "stockList",
    items: rows.map((row, index) => ({
      rank: index + 1,
      label: row.symbol,
      value: row.change55dPct,
      color: colorForDashboardLabel(row.symbol),
      metric: undefined,
      exchange: row.exchange,
    })),
  };
}

function createGroupCard(
  id: string,
  title: string,
  timestamp: string,
  groups: CollectionGroupRelativeStrengthRow[],
  crossFilter: DashboardCardData["crossFilter"]
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
      color: colorForDashboardLabel(group.label),
    })),
    crossFilter,
  };
}
