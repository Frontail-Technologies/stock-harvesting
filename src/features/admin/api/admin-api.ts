import { adminApiFetch, API_ROUTES } from "@/features/api";
import type { UserPlan, UserRole } from "@/features/auth";
import type {
  AdminMarketCollection,
  CollectionImportReport,
  CollectionImportResult,
  CollectionMembersResponse,
  CollectionVersionMembersResponse,
  CollectionVersionReplaceResult,
  CollectionVersionSummary,
  MarketCollection,
} from "@/features/market-collections";
import type { WeeklyStrongBacktestStatus } from "@/features/weekly-strong-backtest";
import type {
  AdminAdPlacementKey,
  AdminAiKeyResponse,
  AdminAiSettingsResponse,
  AdminDataProviderConnectResponse,
  AdminDataProviderConnectUrlResponse,
  AdminDataProviderSettingsResponse,
  AdminDataProviderStatus,
  AdminDataProviderStatusesResponse,
  AdminMonetizationConfig,
  AdminUserFilters,
  AdminUsersResponse,
  MonetizationMode,
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
  return adminApiFetch<AdminUsersResponse>(
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

export function getAdminUsersExportCsv(
  filters: Pick<AdminUserFilters, "q" | "role" | "plan" | "sort" | "direction">
) {
  return adminApiFetch<string>(
    withQuery(API_ROUTES.admin.usersExport, {
      q: filters.q.trim() || undefined,
      role: filters.role || undefined,
      plan: filters.plan || undefined,
      sort: filters.sort,
      direction: filters.direction,
    })
  );
}

export function updateAdminUserRole(input: { id: string; role: UserRole }) {
  return adminApiFetch(API_ROUTES.admin.userRole(input.id), {
    method: "PATCH",
    body: JSON.stringify({ role: input.role }),
  });
}

export function updateAdminUserPlan(input: { id: string; plan: UserPlan }) {
  return adminApiFetch(API_ROUTES.admin.userPlan(input.id), {
    method: "PATCH",
    body: JSON.stringify({ plan: input.plan }),
  });
}

export function deleteAdminUser(id: string) {
  return adminApiFetch<{ id: string }>(API_ROUTES.admin.userById(id), {
    method: "DELETE",
  });
}

export function getAdminAiSettings() {
  return adminApiFetch<AdminAiSettingsResponse>(API_ROUTES.admin.aiSettings);
}

export function updateAdminAiSettings(input: { model: string }) {
  return adminApiFetch<Pick<AdminAiSettingsResponse, "aiSettings">>(API_ROUTES.admin.aiSettings, {
    method: "PUT",
    body: JSON.stringify({ model: input.model }),
  });
}

export function getAdminAiKeyStatus() {
  return adminApiFetch<AdminAiKeyResponse>(API_ROUTES.admin.aiSettingsKey);
}

export function updateAdminAiKey(input: { apiKey: string }) {
  return adminApiFetch<AdminAiKeyResponse>(API_ROUTES.admin.aiSettingsKey, {
    method: "PUT",
    body: JSON.stringify({ apiKey: input.apiKey }),
  });
}

export function deleteAdminAiKey() {
  return adminApiFetch<AdminAiKeyResponse>(API_ROUTES.admin.aiSettingsKey, {
    method: "DELETE",
  });
}

export function getAdminMonetization() {
  return adminApiFetch<AdminMonetizationConfig>(API_ROUTES.admin.monetization);
}

export function updateAdminMonetizationSettings(input: {
  mode: MonetizationMode;
  publisherId: string | null;
}) {
  return adminApiFetch<{ settings: unknown }>(API_ROUTES.admin.monetizationSettings, {
    method: "PUT",
    body: JSON.stringify(input),
  });
}

export function updateAdminMonetizationPlacement(input: {
  key: AdminAdPlacementKey;
  enabled: boolean;
  slotId: string | null;
}) {
  return adminApiFetch<{ placement: unknown }>(API_ROUTES.admin.monetizationPlacement(input.key), {
    method: "PUT",
    body: JSON.stringify({ enabled: input.enabled, slotId: input.slotId }),
  });
}

export function getAdminDataProviders() {
  return adminApiFetch<AdminDataProviderSettingsResponse>(API_ROUTES.admin.dataProviders);
}

export function updateAdminDataProviderSettings(input: {
  key: string;
  enabled?: boolean;
  priority?: number;
  disabledReason?: string | null;
}) {
  const { key, ...body } = input;
  return adminApiFetch<{ provider: unknown }>(API_ROUTES.admin.dataProviderSettings(key), {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function getAdminDataProviderStatus() {
  return adminApiFetch<AdminDataProviderStatus>(API_ROUTES.admin.dataProviderStatus);
}

export function getAdminDataProviderStatuses() {
  return adminApiFetch<AdminDataProviderStatusesResponse>(API_ROUTES.admin.dataProviderStatuses);
}

export function getAdminDataProviderConnectUrl() {
  return adminApiFetch<AdminDataProviderConnectUrlResponse>(
    API_ROUTES.admin.dataProviderConnectUrl,
    {
      method: "POST",
    }
  );
}

export function connectAdminDataProvider(input: { requestToken: string }) {
  return adminApiFetch<AdminDataProviderConnectResponse>(
    API_ROUTES.admin.dataProviderConnect,
    {
      method: "POST",
      body: JSON.stringify({ requestToken: input.requestToken }),
    }
  );
}

export function syncAdminDataProvider(input: { exchange: string }) {
  return adminApiFetch<{ job: unknown }>(API_ROUTES.admin.dataProviderSync, {
    method: "POST",
    body: JSON.stringify({ exchange: input.exchange }),
  });
}

export function syncAdminMarketDataPrices(input: { exchange: string }) {
  return adminApiFetch<{ job: unknown }>(API_ROUTES.admin.marketDataSyncPrices, {
    method: "POST",
    body: JSON.stringify({ exchange: input.exchange }),
  });
}

export function syncAdminSectorClassification() {
  return adminApiFetch<{ job: unknown }>(API_ROUTES.admin.sectorClassificationSync, {
    method: "POST",
  });
}

export function backfillAdminIndexCandles(input: { exchange?: string } = {}) {
  return adminApiFetch<{ job: unknown }>(API_ROUTES.admin.indexCandleBackfill, {
    method: "POST",
    body: JSON.stringify({ exchange: input.exchange }),
  });
}

export function getAdminMarketCollections() {
  return adminApiFetch<{ collections: MarketCollection[] }>(API_ROUTES.admin.marketCollections);
}

export function createAdminMarketCollection(input: {
  code: string;
  name: string;
  exchange: string;
  countryCode?: string;
  description?: string;
}) {
  return adminApiFetch<{ collection: AdminMarketCollection }>(API_ROUTES.admin.marketCollections, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getAdminMarketCollection(id: string) {
  return adminApiFetch<{ collection: AdminMarketCollection }>(API_ROUTES.admin.marketCollection(id));
}

export function updateAdminMarketCollection(input: {
  id: string;
  name?: string;
  description?: string | null;
  active?: boolean;
}) {
  const { id, ...body } = input;
  return adminApiFetch<{ collection: AdminMarketCollection }>(API_ROUTES.admin.marketCollection(id), {
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
  return adminApiFetch<CollectionMembersResponse>(
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
  return adminApiFetch<{ report: CollectionImportReport }>(
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
  effectiveFrom: string;
}) {
  const { id, ...body } = input;
  return adminApiFetch<{ report: CollectionImportResult }>(
    API_ROUTES.admin.marketCollectionImport(id),
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  );
}

export function getAdminCollectionVersions(id: string) {
  return adminApiFetch<{ versions: CollectionVersionSummary[] }>(API_ROUTES.admin.marketCollectionVersions(id));
}

export function getAdminCollectionVersionMembers(input: { id: string; versionId: string }) {
  return adminApiFetch<CollectionVersionMembersResponse>(
    API_ROUTES.admin.marketCollectionVersion(input.id, input.versionId)
  );
}

export function replaceAdminCollectionVersion(input: { id: string; versionId: string; csvContent: string }) {
  return adminApiFetch<CollectionVersionReplaceResult>(
    API_ROUTES.admin.marketCollectionVersionReplace(input.id, input.versionId),
    {
      method: "POST",
      body: JSON.stringify({ csvContent: input.csvContent }),
    }
  );
}

export function getAdminWeeklyStrongBacktestStatus(id: string) {
  return adminApiFetch<{ status: WeeklyStrongBacktestStatus }>(
    API_ROUTES.admin.marketCollectionWeeklyStrongBacktestStatus(id)
  );
}

export function getAdminWeeklyStrongBacktestHistoricalStatus(id: string) {
  return adminApiFetch<{ status: WeeklyStrongBacktestStatus }>(
    API_ROUTES.admin.marketCollectionWeeklyStrongBacktestHistoricalStatus(id)
  );
}

export function generateAdminWeeklyStrongBacktest(input: { id: string; weeks?: number }) {
  return adminApiFetch<{ syncJobId: string; status: string }>(
    API_ROUTES.admin.marketCollectionWeeklyStrongBacktestGenerate(input.id),
    {
      method: "POST",
      body: JSON.stringify({ weeks: input.weeks }),
    }
  );
}

export function rebuildAdminWeeklyStrongBacktestHistorical(input: { id: string }) {
  return adminApiFetch<{ syncJobId: string; status: string }>(
    API_ROUTES.admin.marketCollectionWeeklyStrongBacktestRebuildHistorical(input.id),
    {
      method: "POST",
    }
  );
}
