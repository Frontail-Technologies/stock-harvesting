"use client";

import { useCallback, useMemo, useState } from "react";
import {
  useCollectionRelativeStrength,
  useCollectionSectorIndustryTaxonomy,
  useCollectionWeeklyStrongStocks,
  type CollectionGroupRelativeStrengthRow,
  type CollectionRelativeStrengthMetric,
} from "@/features/market-collections";
import { useIndexRelativeStrength } from "@/features/market-data";
import { DEFAULT_SCANNER_LOOKBACK, type ScannerLookbackMultiplier } from "@/features/scanner/types";
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
import { openChartInNewTab } from "../lib/open-chart-in-new-tab";
import { DashboardGridSkeleton } from "./DashboardWidgetSkeleton";
import { DashboardWidgetRow } from "./DashboardWidgetRow";
import { WeeklyStrongBacktestSection } from "./WeeklyStrongBacktestSection";
import { WeeklyStrongMembershipChanges } from "./WeeklyStrongMembershipChanges";
import { WeeklyStrongStockTable } from "./WeeklyStrongStockTable";

const GROUP_RANKING_LIMIT = 100;

const INDEX_EXCHANGE_BY_EQUITY_EXCHANGE: Record<string, string> = {
  NSE: "NSE_IDX",
  BSE: "BSE_IDX",
};

export function DashboardSegmentContent({ code, exchange }: { code: string; exchange: string }) {

  const rsQuery = useCollectionRelativeStrength({ code, limit: 200 });
  // Sector<->industry pairs must come from the complete membership
  // taxonomy, not a ranked/limited stock sample - otherwise a sector or
  // industry with no representative in that sample can never resolve its
  // relationship. See getCollectionSectorIndustryTaxonomy on the backend.
  const taxonomyQuery = useCollectionSectorIndustryTaxonomy({ code });
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
  const [harvestLookback, setHarvestLookback] =
    useState<ScannerLookbackMultiplier>(DEFAULT_SCANNER_LOOKBACK);

  const { weekEnding: canonicalWeekEnding } = useCollectionWeeklyStrongStocks({
    code,
    lookback: harvestLookback,
  });

  const [crossFilter, setCrossFilter] = useState<CrossFilterState>(EMPTY_CROSS_FILTER);

  const relation = useMemo(
    () => buildSectorIndustryRelation(taxonomyQuery.sectors),
    [taxonomyQuery.sectors]
  );

  const handleSectorClick = useCallback(
    (sector: string) => setCrossFilter((current) => selectSector(current, relation, sector)),
    [relation]
  );
  const handleIndustryClick = useCallback(
    (industry: string) => setCrossFilter((current) => selectIndustry(current, relation, industry)),
    [relation]
  );
  const clearCrossFilters = useCallback(() => setCrossFilter(EMPTY_CROSS_FILTER), []);

  const handleStockClick = useCallback((item: { label: string; exchange?: string }) => {
    if (!item.exchange) return;
    openChartInNewTab(item.label, item.exchange, harvestLookback);
  }, [harvestLookback]);

  const filteredStockStrengthMetrics = useMemo(
    () => filterWeeklyStrongByCrossFilter(rsQuery.metrics, crossFilter),
    [rsQuery.metrics, crossFilter]
  );

  const cards = buildCollectionCards({
    indexMetrics: indexQuery.metrics,
    stockStrengthMetrics: filteredStockStrengthMetrics,
    sectorGroups: sectorQuery.data?.groups ?? [],
    industryGroups: industryQuery.data?.groups ?? [],
    relation,
    crossFilter,
    onSectorClick: handleSectorClick,
    onIndustryClick: handleIndustryClick,
    onStockClick: handleStockClick,
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

      <WeeklyStrongStockTable
        code={code}
        crossFilter={crossFilter}
        lookback={harvestLookback}
        onLookbackChange={setHarvestLookback}
      />

      <WeeklyStrongMembershipChanges code={code} lookback={harvestLookback} />

      <WeeklyStrongBacktestSection
        key={code}
        code={code}
        canonicalWeekEnding={canonicalWeekEnding}
        lookback={harvestLookback}
      />
    </div>
  );
}

type StockChangeRow = {
  symbol: string;
  exchange: string;
  change55dPct: number;
};

function buildCollectionCards(input: {
  indexMetrics: StockChangeRow[];
  stockStrengthMetrics: CollectionRelativeStrengthMetric[];
  sectorGroups: CollectionGroupRelativeStrengthRow[];
  industryGroups: CollectionGroupRelativeStrengthRow[];
  relation: SectorIndustryRelation;
  crossFilter: CrossFilterState;
  onSectorClick: (sector: string) => void;
  onIndustryClick: (industry: string) => void;
  onStockClick: DashboardCardData["onItemClick"];
}): DashboardCardData[] {

  const visibleIndustryGroups = filterGroupsBySector(
    input.industryGroups,
    input.relation,
    input.crossFilter.selectedSector
  );

  return [
    createStockCard("relative-strength-index", "Index Harvest", input.indexMetrics),
    createGroupCard("relative-strength-sector", "Sector Harvest", input.sectorGroups, {
      selectedLabel: input.crossFilter.selectedSector,
      onSelectLabel: input.onSectorClick,
    }),
    createGroupCard("relative-strength-industry", "Industry Harvest", visibleIndustryGroups, {
      selectedLabel: input.crossFilter.selectedIndustry,
      onSelectLabel: input.onIndustryClick,
    }),
    createStockCard(
      "55-day-stock-strength",
      "Stock Harvest",
      input.stockStrengthMetrics,
      input.onStockClick
    ),
  ];
}

function createStockCard(
  id: string,
  title: string,
  metrics: StockChangeRow[],
  onItemClick?: DashboardCardData["onItemClick"]
): DashboardCardData {
  const rows = [...metrics].sort((a, b) => b.change55dPct - a.change55dPct);

  return {
    id,
    title,
    variant: "stockList",
    items: rows.map((row, index) => ({
      rank: index + 1,
      label: row.symbol,
      value: row.change55dPct,
      color: colorForDashboardLabel(row.symbol),
      metric: undefined,
      exchange: row.exchange,
    })),
    onItemClick,
  };
}

function createGroupCard(
  id: string,
  title: string,
  groups: CollectionGroupRelativeStrengthRow[],
  crossFilter: DashboardCardData["crossFilter"]
): DashboardCardData {
  return {
    id,
    title,
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
