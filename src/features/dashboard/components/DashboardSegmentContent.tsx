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
// segment selector picked from). It's a prop now, so all 4 of this
// component's queries (rsQuery/sectorQuery/industryQuery/indexQuery)
// become knowable and start in parallel the moment `code` is chosen -
// none of them waits on another's response. This also incidentally fixed
// a real correctness bug: with the old derivation, indexQuery fired ONCE
// on mount with `exchange=undefined` (before rsQuery resolved), then AGAIN
// once the real exchange arrived - two requests, and a possible flash of
// the wrong exchange's indices in between.
export function DashboardSegmentContent({ code, exchange }: { code: string; exchange: string }) {
  // Also the source for the 4th ("55 Day Stock Strength") card below - the
  // ungrouped, per-stock 55-day change % every active member of this
  // segment already carries (limit 200 covers a whole collection).
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

  // Item 7 - the 4th widget re-ranks whatever sector/industry cross-filter
  // leaves remaining, by 55-day change % - no Weekly Strong evaluation
  // runs for this. `filterWeeklyStrongByCrossFilter` is generically typed
  // over any `{sector, industry}` item (see dashboard-cross-filter.ts), so
  // it applies just as well to these RS metric rows as it does to the
  // Weekly Strong table's own rows.
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
      {/* Only the 4-card grid is gated on its own queries - the table and
          the Backtest chart each already handle their own loading/error
          states internally (Phase D.9 #12: "no full-section loading
          dependency") and source from entirely independent queries, so
          there's no reason for them to sit behind the RS queries'
          slower live computation. */}
      {rsQuery.isLoading || sectorQuery.isLoading || industryQuery.isLoading ? (
        <DashboardGridSkeleton />
      ) : rsQuery.isError || !rsQuery.data ? (
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

// The 4 top Dashboard widgets rank/average by exactly ONE metric: 55-day
// change % (see calculate55DayChange, backend). Index/Sector/Industry/
// Stock all derive from the same computeAllRelativeStrengthMetrics base -
// no combinedScore, MACD, monthlyPct, or Weekly Strong evaluator feeds any
// of these 4 cards. The detailed Weekly Strong table below (and its own
// Backtest section) is a completely separate, untouched system - it keeps
// running the real daily+weekly near-high evaluator via its own
// useCollectionWeeklyStrongStocks call, independent of everything here.

type StockChangeRow = {
  symbol: string;
  exchange: string;
  change55dPct: number;
};

// "As of <trading day>" - the real day the underlying snapshot was
// computed as of (item 9), not a client-rendered "now". Each of the 4
// cards gets its OWN query's asOfDate rather than one shared value, so if
// two ever genuinely diverge (a rare cross-scope invalidation race) that's
// visible on the cards instead of silently papered over.
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
  // categories themselves (mean 55-day change % of member stocks) — a
  // sector-rotation view, not a stock list. Stock ranks every remaining
  // (cross-filtered) stock in the segment the same way.
  //
  // Item 15 - Relative Strength Index gets no `crossFilter` and its
  // `indexMetrics` are never filtered by sector/industry - it stays the
  // independent market/index reference card untouched by any of this.
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
