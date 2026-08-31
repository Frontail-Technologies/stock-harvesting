import type { CollectionRelativeStrengthMetric, CollectionWeeklyStrongStock } from "@/features/market-collections";

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

export type CrossFilterState = {
  selectedSector: string | null;
  selectedIndustry: string | null;
};

export const EMPTY_CROSS_FILTER: CrossFilterState = { selectedSector: null, selectedIndustry: null };

export function selectSector(
  current: CrossFilterState,
  relation: SectorIndustryRelation,
  sector: string
): CrossFilterState {

  if (current.selectedSector === sector) return EMPTY_CROSS_FILTER;

  const industries = relation.sectorToIndustries.get(sector);
  const keepIndustry = current.selectedIndustry !== null && (industries?.has(current.selectedIndustry) ?? false);
  return { selectedSector: sector, selectedIndustry: keepIndustry ? current.selectedIndustry : null };
}

export function selectIndustry(
  current: CrossFilterState,
  relation: SectorIndustryRelation,
  industry: string
): CrossFilterState {

  if (current.selectedIndustry === industry) {
    return { selectedSector: current.selectedSector, selectedIndustry: null };
  }

  const parentSector = relation.industryToSector.get(industry) ?? current.selectedSector;
  return { selectedSector: parentSector, selectedIndustry: industry };
}

export function filterWeeklyStrongByCrossFilter<
  T extends { sector: string | null; industry: string | null },
>(items: T[], filter: CrossFilterState): T[] {
  if (filter.selectedIndustry) return items.filter((item) => item.industry === filter.selectedIndustry);
  if (filter.selectedSector) return items.filter((item) => item.sector === filter.selectedSector);
  return items;
}

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

export type WeeklyStrongCrossFilterItem = Pick<CollectionWeeklyStrongStock, "sector" | "industry">;
