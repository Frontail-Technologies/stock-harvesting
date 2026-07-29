import { apiFetch, API_ROUTES } from "@/features/api";
import type { UserPlan, UserRole } from "@/features/auth";
import type {
  AdminMarketCollection,
  CollectionImportReport,
  CollectionMembersResponse,
  MarketCollection,
} from "@/features/market-collections";
import type {
  AdminAiKeyResponse,
  AdminAiSettingsResponse,
  AdminDataProviderConnectResponse,
  AdminDataProviderConnectUrlResponse,
  AdminDataProviderStatus,
  AdminDataProviderStatusesResponse,
  AdminJobsResponse,
  AdminUserFilters,
  AdminUsersResponse,
} from "../types";

function withQuery(path: string, query: Record<string, string | number | undefined>) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }

  const queryString = params.toString();
  return queryString ? `${path}?${queryString}` : path;
}

export function getAdminUsers(filters: AdminUserFilters) {
  return apiFetch<AdminUsersResponse>(
    withQuery(API_ROUTES.admin.users, {
      q: filters.q.trim() || undefined,
      role: filters.role || undefined,
      plan: filters.plan || undefined,
      page: filters.page,
      limit: filters.limit,
      sort: filters.sort,
      direction: filters.direction,
    })
  );
}

export function updateAdminUserRole(input: { id: string; role: UserRole }) {
  return apiFetch(API_ROUTES.admin.userRole(input.id), {
    method: "PATCH",
    body: JSON.stringify({ role: input.role }),
  });
}

export function updateAdminUserPlan(input: { id: string; plan: UserPlan }) {
  return apiFetch(API_ROUTES.admin.userPlan(input.id), {
    method: "PATCH",
    body: JSON.stringify({ plan: input.plan }),
  });
}

export function deleteAdminUser(id: string) {
  return apiFetch<{ id: string }>(API_ROUTES.admin.userById(id), {
    method: "DELETE",
  });
}

export function getAdminAiSettings() {
  return apiFetch<AdminAiSettingsResponse>(API_ROUTES.admin.aiSettings);
}

export function updateAdminAiSettings(input: { model: string }) {
  return apiFetch<Pick<AdminAiSettingsResponse, "aiSettings">>(API_ROUTES.admin.aiSettings, {
    method: "PUT",
    body: JSON.stringify({ model: input.model }),
  });
}

export function getAdminAiKeyStatus() {
  return apiFetch<AdminAiKeyResponse>(API_ROUTES.admin.aiSettingsKey);
}

export function updateAdminAiKey(input: { apiKey: string }) {
  return apiFetch<AdminAiKeyResponse>(API_ROUTES.admin.aiSettingsKey, {
    method: "PUT",
    body: JSON.stringify({ apiKey: input.apiKey }),
  });
}

export function deleteAdminAiKey() {
  return apiFetch<AdminAiKeyResponse>(API_ROUTES.admin.aiSettingsKey, {
    method: "DELETE",
  });
}

export function getAdminDataProviderStatus() {
  return apiFetch<AdminDataProviderStatus>(API_ROUTES.admin.dataProviderStatus);
}

export function getAdminDataProviderStatuses() {
  return apiFetch<AdminDataProviderStatusesResponse>(API_ROUTES.admin.dataProviderStatuses);
}

export function getAdminDataProviderConnectUrl() {
  return apiFetch<AdminDataProviderConnectUrlResponse>(
    API_ROUTES.admin.dataProviderConnectUrl,
    {
      method: "POST",
    }
  );
}

export function connectAdminDataProvider(input: { requestToken: string }) {
  return apiFetch<AdminDataProviderConnectResponse>(
    API_ROUTES.admin.dataProviderConnect,
    {
      method: "POST",
      body: JSON.stringify({ requestToken: input.requestToken }),
    }
  );
}

export function syncAdminDataProvider(input: { exchange: string }) {
  return apiFetch<{ job: unknown }>(API_ROUTES.admin.dataProviderSync, {
    method: "POST",
    body: JSON.stringify({ exchange: input.exchange }),
  });
}

export function syncAdminMarketDataPrices(input: { exchange: string }) {
  return apiFetch<{ job: unknown }>(API_ROUTES.admin.marketDataSyncPrices, {
    method: "POST",
    body: JSON.stringify({ exchange: input.exchange }),
  });
}

export function getAdminJobs() {
  return apiFetch<AdminJobsResponse>(API_ROUTES.admin.jobs);
}

export function getAdminMarketCollections() {
  return apiFetch<{ collections: MarketCollection[] }>(API_ROUTES.admin.marketCollections);
}

export function createAdminMarketCollection(input: {
  code: string;
  name: string;
  exchange: string;
  description?: string;
}) {
  return apiFetch<{ collection: AdminMarketCollection }>(API_ROUTES.admin.marketCollections, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getAdminMarketCollection(id: string) {
  return apiFetch<{ collection: AdminMarketCollection }>(API_ROUTES.admin.marketCollection(id));
}

export function updateAdminMarketCollection(input: {
  id: string;
  name?: string;
  description?: string | null;
  active?: boolean;
}) {
  const { id, ...body } = input;
  return apiFetch<{ collection: AdminMarketCollection }>(API_ROUTES.admin.marketCollection(id), {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function getAdminMarketCollectionMembers(input: {
  id: string;
  page?: number;
  limit?: number;
  q?: string;
  sortBy?: "symbol" | "name";
  sortDirection?: "asc" | "desc";
}) {
  const { id, ...query } = input;
  return apiFetch<CollectionMembersResponse>(
    withQuery(API_ROUTES.admin.marketCollectionMembers(id), {
      page: query.page,
      limit: query.limit,
      q: query.q?.trim() || undefined,
      sortBy: query.sortBy,
      sortDirection: query.sortDirection,
    })
  );
}

export function previewAdminCollectionImport(input: { id: string; csvContent: string }) {
  return apiFetch<{ report: CollectionImportReport }>(
    API_ROUTES.admin.marketCollectionImportDryRun(input.id),
    {
      method: "POST",
      body: JSON.stringify({ csvContent: input.csvContent }),
    }
  );
}

export function importAdminCollectionCsv(input: {
  id: string;
  csvContent: string;
  sourceName?: string;
  sourceDate?: string;
}) {
  const { id, ...body } = input;
  return apiFetch<{ report: CollectionImportReport }>(
    API_ROUTES.admin.marketCollectionImport(id),
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  );
}
