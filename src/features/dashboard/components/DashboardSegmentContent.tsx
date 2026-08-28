"use client";

import { useCallback, useMemo, useState } from "react";
import {
  useCollectionRelativeStrength,
  useCollectionWeeklyStrongStocks,
  type CollectionGroupRelativeStrengthRow,
  type CollectionWeeklyStrongStock,
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

// The actual per-segment dashboard content (the 4 relative-strength widgets,
// the Weekly Strong table, and the backtest chart) - reused directly on the
// unified Dashboard page (DashboardPage.tsx), with no route of its own.
// This is the exact same calculation/rendering path the old
// /dashboard/collections/[code] route used - only the surrounding page
// chrome (the "Back to Dashboard" link/heading) was dropped, since the
// unified page now owns that context via its own country/segment selectors.
// Phase D.9 #3 - `exchange` used to be read from `rsQuery.data?.collection
// .exchange`, an artificial dependency: `indexQuery` couldn't even START
// until `rsQuery` had already finished a full live RS computation and come
// back, even though the exchange is really just a property of the
// collection the caller already knows (the same MarketCollection the
// segment selector picked from). It's a prop now, so all 5 of this
// component's queries (rsQuery/sectorQuery/industryQuery/weeklyStrongQuery
// /indexQuery) become knowable and start in parallel the moment `code` is
// chosen - none of them waits on another's response. This also incidentally
// fixed a real correctness bug: with the old derivation, indexQuery fired
// ONCE on mount with `exchange=undefined` (before rsQuery resolved), then
// AGAIN once the real exchange arrived - two requests, and a possible
// flash of the wrong exchange's indices in between.
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
  // Same query WeeklyStrongStockTable below calls with the same {code} -
  // React Query dedupes identical query keys, so this is one network
  // request shared between the two, not a duplicate fetch. This is now
  // the ONLY source for the "Weekly Strong Stock List" card too (see
  // createWeeklyStrongCard) - the card used to source from
  // computeRelativeStrengthMetrics instead, a different pass/fail rule
  // than the table below it despite the identical label (Phase C1.5 fix).
  const weeklyStrongQuery = useCollectionWeeklyStrongStocks({ code });
  // Not collection-scoped — same index ranking regardless of which
  // collection is open (indices aren't members of any market_collection) —
  // but scoped to the collection's own exchange so a BSE collection shows
  // BSE indices, not NSE ones. Known synchronously from the `exchange`
  // prop now - see comment above.
  const indexExchange = INDEX_EXCHANGE_BY_EQUITY_EXCHANGE[exchange] ?? "NSE_IDX";
  const indexQuery = useIndexRelativeStrength(150, indexExchange);

  // Cross-filter pass (Part B) - explicit Dashboard-local state (item 7),
  // never written to Scanner/global market state. This component is
  // key={code}-remounted by DashboardPage on every Country/Segment change
  // (see the render there), which resets this back to EMPTY_CROSS_FILTER
  // for free (item 16) - no manual reset effect needed, the same pattern
  // WeeklyStrongBacktestSection already relies on for its own per-segment
  // state.
  const [crossFilter, setCrossFilter] = useState<CrossFilterState>(EMPTY_CROSS_FILTER);

  // Item 13 - the industry<->sector relation is derived from the SAME
  // ungrouped `rsQuery.metrics` this component already fetches (see the
  // import comment in dashboard-cross-filter.ts) - no new request, no new
  // backend work.
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

  const filteredWeeklyStrongItems = useMemo(
    () => filterWeeklyStrongByCrossFilter(weeklyStrongQuery.items, crossFilter),
    [weeklyStrongQuery.items, crossFilter]
  );

  const cards = buildCollectionCards({
    indexMetrics: indexQuery.metrics,
    weeklyStrongItems: filteredWeeklyStrongItems,
    sectorGroups: sectorQuery.data?.groups ?? [],
    industryGroups: industryQuery.data?.groups ?? [],
    relation,
    crossFilter,
    onSectorClick: handleSectorClick,
    onIndustryClick: handleIndustryClick,
  });

  const isCrossFilterActive = crossFilter.selectedSector !== null || crossFilter.selectedIndustry !== null;

  return (
    <div className="flex flex-col gap-7">
      {/* Only the 4-card grid is gated on its own queries - the table and
          the Backtest chart each already handle their own loading/error
          states internally (Phase D.9 #12: "no full-section loading
          dependency") and source from entirely independent queries, so
          there's no reason for them to sit behind the RS queries'
          slower live computation. */}
      {rsQuery.isLoading || sectorQuery.isLoading || industryQuery.isLoading || weeklyStrongQuery.isLoading ? (
        <DashboardGridSkeleton />
      ) : rsQuery.isError || !rsQuery.data || weeklyStrongQuery.isError ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
          Couldn&apos;t load this segment. It may not exist, be inactive, or have no active
          members yet.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {/* Item 11 - one subtle, unobtrusive action, only present once a
              cross-filter is actually active (never a permanent, always-
              visible chrome element). */}
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

      {/* key={code} forces a clean remount per segment - its period/
          solo-sector-filter/selected-week state all reset to defaults
          (Backtest defaults to "All") rather than carrying over from
          whatever the previous segment had set, since none of that is a
          deliberately persisted cross-segment preference. This is the
          Backtest chart's OWN sector-visibility filter, a completely
          separate state system from the Sector/Industry cross-filter
          above (item 16) - they are never read from or written to each
          other. */}
      <WeeklyStrongBacktestSection key={code} code={code} />
    </div>
  );
}

// Phase C1 consolidated the "near multi-year high" breakout check itself
// into one shared evaluator (weekly-strong-evaluator.ts, backend). Phase
// C1.5 fixed the remaining Dashboard-layer inconsistency this file used to
// have: the "Weekly Strong Stock List" CARD below used to source from
// computeRelativeStrengthMetrics (ranked by 55-day change, a WEEKLY-only
// pre-filter) while WeeklyStrongStockTable sourced from
// computeWeeklyStrongStocks (the real daily+weekly evaluator) - same
// label, different stocks. The card now sources from the exact same
// useCollectionWeeklyStrongStocks result as the table (see
// createWeeklyStrongCard below), so the two can never disagree on which
// stocks are shown, only on how they're visualized.
//
// Relative Strength Index/Sector/Industry are deliberately untouched -
// still computeRelativeStrengthMetrics/computeGroupRelativeStrength, a
// genuinely different ranking (55-day change), not the Weekly Strong
// screen.

type StockScoreRow = {
  symbol: string;
  exchange: string;
  combinedScore: number;
};

function buildCollectionCards(input: {
  indexMetrics: StockScoreRow[];
  weeklyStrongItems: CollectionWeeklyStrongStock[];
  sectorGroups: CollectionGroupRelativeStrengthRow[];
  industryGroups: CollectionGroupRelativeStrengthRow[];
  relation: SectorIndustryRelation;
  crossFilter: CrossFilterState;
  onSectorClick: (sector: string) => void;
  onIndustryClick: (industry: string) => void;
}): DashboardCardData[] {
  const timestamp = new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date());

  // Item 8 - the Sector card itself is never narrowed (every sector always
  // stays visible so the user can pivot to a different one; see
  // DashboardWidget's ring/mute treatment for "selected" instead), but the
  // Industry card genuinely filters down to "industries under selected
  // sector" once one is active.
  const visibleIndustryGroups = filterGroupsBySector(
    input.industryGroups,
    input.relation,
    input.crossFilter.selectedSector
  );

  // Index ranks actual NSE indices (NIFTY AUTO, BANKNIFTY, ...) against each
  // other — global, not scoped to the selected collection, since indices
  // aren't members of any market_collection. Sector/Industry rank the
  // categories themselves (mean combinedScore of member stocks) — a
  // sector-rotation view, not a stock list. Weekly Strong is the same
  // passing universe as the table below it, visualized by day-over-day
  // % change (the same metric the table's own "% Change" column shows).
  //
  // Item 15 - Relative Strength Index gets no `crossFilter` and its
  // `indexMetrics` are never filtered by sector/industry - it stays the
  // independent market/index reference card untouched by any of this.
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
      input.sectorGroups,
      { selectedLabel: input.crossFilter.selectedSector, onSelectLabel: input.onSectorClick }
    ),
    createGroupCard(
      "relative-strength-industry",
      "Relative Strength Industry",
      timestamp,
      visibleIndustryGroups,
      { selectedLabel: input.crossFilter.selectedIndustry, onSelectLabel: input.onIndustryClick }
    ),
    createWeeklyStrongCard(
      "weekly-strong-stock-list",
      "Weekly Strong Stock List",
      timestamp,
      input.weeklyStrongItems
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
      color: colorForDashboardLabel(row.symbol),
      metric: undefined,
      exchange: row.exchange,
    })),
  };
}

// The same passing universe as WeeklyStrongStockTable, just compactly
// visualized - bar magnitude is changePct (the table's own "% Change"
// column), already sorted desc by computeWeeklyStrongStocks itself.
function createWeeklyStrongCard(
  id: string,
  title: string,
  timestamp: string,
  items: CollectionWeeklyStrongStock[]
): DashboardCardData {
  return {
    id,
    title,
    timestamp,
    variant: "stockList",
    items: items.map((item, index) => ({
      rank: index + 1,
      label: item.symbol,
      value: item.changePct,
      color: colorForDashboardLabel(item.symbol),
      metric: undefined,
      exchange: item.exchange,
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
