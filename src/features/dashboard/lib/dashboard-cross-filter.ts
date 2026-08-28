import type { CollectionRelativeStrengthMetric, CollectionWeeklyStrongStock } from "@/features/market-collections";

// Cross-filter pass (Part B) - Sector <-> Industry <-> Weekly Strong.
//
// Item 13's data-source audit: the ungrouped Relative Strength metrics
// response (`useCollectionRelativeStrength({code, limit})`, no groupBy)
// already carries BOTH `sector` and `industry` per stock - confirmed live
// against the real API, the backend's RelativeStrengthMetricRow always
// had both fields, they just weren't declared on the frontend type before
// nothing consumed them (see CollectionRelativeStrengthMetric). That
// ungrouped call was already being made on every Dashboard load
// (DashboardSegmentContent's `rsQuery`, `limit: 200` - large enough to
// cover a whole collection's active members) purely as a loading-state
// gate; this pass is what finally gives it a real purpose, instead of
// adding a new endpoint. No backend change was needed for Part B at all.

export type SectorIndustryRelation = {
  industryToSector: ReadonlyMap<string, string>;
  sectorToIndustries: ReadonlyMap<string, ReadonlySet<string>>;
};

export function buildSectorIndustryRelation(
  metrics: CollectionRelativeStrengthMetric[]
): SectorIndustryRelation {
  const industryToSector = new Map<string, string>();
  const sectorToIndustries = new Map<string, Set<string>>();

  for (const metric of metrics) {
    if (!metric.sector || !metric.industry) continue;
    industryToSector.set(metric.industry, metric.sector);
    const industries = sectorToIndustries.get(metric.sector) ?? new Set<string>();
    industries.add(metric.industry);
    sectorToIndustries.set(metric.sector, industries);
  }

  return { industryToSector, sectorToIndustries };
}

// The explicit Dashboard-local filter state (item 7/12) - never written to
// Scanner/global market state, and entirely separate from the Backtest
// chart's own `visibleSectors` solo/multi-select (item 16 - "do not mix
// the two state systems").
export type CrossFilterState = {
  selectedSector: string | null;
  selectedIndustry: string | null;
};

export const EMPTY_CROSS_FILTER: CrossFilterState = { selectedSector: null, selectedIndustry: null };

// Item 8/9/10/11's state machine, as pure transitions over the CURRENT
// state - the click handlers in DashboardSegmentContent just wrap these in
// a setState functional updater, so the rules live in exactly one place.

export function selectSector(
  current: CrossFilterState,
  relation: SectorIndustryRelation,
  sector: string
): CrossFilterState {
  // Clicking the already-active sector again clears it (item 11). An
  // industry can never outlive its parent sector in this model (see
  // selectIndustry below, which always sets both together), so clearing
  // the sector clears the industry too rather than leaving a
  // industry-without-sector state.
  if (current.selectedSector === sector) return EMPTY_CROSS_FILTER;

  // Changing sector: keep the current industry ONLY if it still belongs
  // to the newly clicked sector, otherwise drop it (item 10) - never an
  // invalid sector/industry combination.
  const industries = relation.sectorToIndustries.get(sector);
  const keepIndustry = current.selectedIndustry !== null && (industries?.has(current.selectedIndustry) ?? false);
  return { selectedSector: sector, selectedIndustry: keepIndustry ? current.selectedIndustry : null };
}

export function selectIndustry(
  current: CrossFilterState,
  relation: SectorIndustryRelation,
  industry: string
): CrossFilterState {
  // Clicking the already-active industry again clears just the industry
  // (item 11) - falls back to the broader sector-only filter rather than
  // clearing everything, since sector is the less specific, still-valid
  // context (item 8's directionality).
  if (current.selectedIndustry === industry) {
    return { selectedSector: current.selectedSector, selectedIndustry: null };
  }

  // Selecting an industry always derives/carries its OWN parent sector
  // (item 8: "Industry selected -> Sector -> corresponding sector") -
  // sector and industry are kept consistent at all times by construction,
  // never a stray industry with a mismatched or missing sector.
  const parentSector = relation.industryToSector.get(industry) ?? current.selectedSector;
  return { selectedSector: parentSector, selectedIndustry: industry };
}

// Item 8 - Industry, being the more specific filter, is what Weekly Strong
// actually filters by whenever both happen to be set (which, by
// construction above, only happens when the industry genuinely belongs to
// the selected sector). Sector alone filters when no industry is active;
// no selection at all is a pass-through.
export function filterWeeklyStrongByCrossFilter<
  T extends { sector: string | null; industry: string | null },
>(items: T[], filter: CrossFilterState): T[] {
  if (filter.selectedIndustry) return items.filter((item) => item.industry === filter.selectedIndustry);
  if (filter.selectedSector) return items.filter((item) => item.sector === filter.selectedSector);
  return items;
}

// Item 8's "Sector selected -> Industry -> industries under selected
// sector" - a real narrowing of the Industry card's own displayed rows
// (unlike Sector/Industry selection itself, which only ever highlights/
// mutes, per item 12 - see DashboardWidget). Only sector narrows the
// sibling card this way; industry selection alone never needs to (a
// clicked industry's own parent sector is already reflected via
// selectedSector, so the Industry card's filter is driven by that, not by
// selectedIndustry directly).
export function filterGroupsBySector<T extends { label: string }>(
  groups: T[],
  relation: SectorIndustryRelation,
  selectedSector: string | null
): T[] {
  if (!selectedSector) return groups;
  const industries = relation.sectorToIndustries.get(selectedSector);
  if (!industries) return groups;
  return groups.filter((group) => industries.has(group.label));
}

// Convenience re-export point for the Weekly Strong item shape both the
// widget card and WeeklyStrongStockTable filter - keeps the generic
// constraint above from having to be repeated at every call site.
export type WeeklyStrongCrossFilterItem = Pick<CollectionWeeklyStrongStock, "sector" | "industry">;
