import { apiFetch, API_ROUTES } from "@/features/api";
import type {
  CollectionMembersInput,
  CollectionMembersResponse,
  CollectionRelativeStrengthResponse,
  CollectionSectorIndustryTaxonomyResponse,
  CollectionWeeklyStrongStocksResponse,
  MarketCollection,
} from "../types";

function withQuery(
  path: string,
  query: Record<string, string | number | undefined>,
) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }

  const queryString = params.toString();
  return queryString ? `${path}?${queryString}` : path;
}

export function getMarketCollections(input: { exchange?: string } = {}) {
  return apiFetch<{ collections: MarketCollection[] }>(
    withQuery(API_ROUTES.marketCollections.list, { exchange: input.exchange }),
  );
}

export function getCollectionMembers(input: CollectionMembersInput) {
  return apiFetch<CollectionMembersResponse>(
    withQuery(API_ROUTES.marketCollections.members(input.code), {
      page: input.page ?? 1,
      limit: input.limit,
      q: input.q,
      sortBy: input.sortBy,
      sortDirection: input.sortDirection,
    }),
  );
}

export function getCollectionRelativeStrength(input: {
  code: string;
  limit?: number;
  groupBy?: "sector" | "industry";
}) {
  return apiFetch<CollectionRelativeStrengthResponse>(
    withQuery(API_ROUTES.marketCollections.relativeStrength(input.code), {
      limit: input.limit,
      groupBy: input.groupBy,
    }),
  );
}

export function getCollectionSectorIndustryTaxonomy(input: { code: string }) {
  return apiFetch<CollectionSectorIndustryTaxonomyResponse>(
    API_ROUTES.marketCollections.sectorIndustryTaxonomy(input.code),
  );
}

export function getCollectionWeeklyStrongStocks(input: { code: string }) {
  return apiFetch<CollectionWeeklyStrongStocksResponse>(
    API_ROUTES.marketCollections.weeklyStrongStocks(input.code),
  );
}
