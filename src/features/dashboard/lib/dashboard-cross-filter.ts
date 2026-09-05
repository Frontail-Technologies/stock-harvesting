import type {
  CollectionSectorIndustryTaxonomyRow,
  CollectionWeeklyStrongStock,
} from "@/features/market-collections";

export type SectorIndustryRelation = {
  industryToSector: ReadonlyMap<string, string>;
  sectorToIndustries: ReadonlyMap<string, ReadonlySet<string>>;
};

// Built from the complete sector->industries taxonomy (every classified
// member of the segment, not a ranked/limited sample) so an industry with
// no representative among the top Harvest movers can still resolve its
// parent sector correctly.
export function buildSectorIndustryRelation(
  taxonomy: CollectionSectorIndustryTaxonomyRow[]
): SectorIndustryRelation {
  const industryToSector = new Map<string, string>();
  const sectorToIndustries = new Map<string, ReadonlySet<string>>();

  for (const row of taxonomy) {
    sectorToIndustries.set(row.sector, new Set(row.industries));
    for (const industry of row.industries) {
      industryToSector.set(industry, row.sector);
    }
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
