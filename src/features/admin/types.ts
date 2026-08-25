import type { UserPlan, UserRole } from "@/features/auth";

export type AdminUserSortField = "name" | "email" | "role" | "plan" | "createdAt";
export type AdminSortDirection = "asc" | "desc";
export type AdminRoleFilter = UserRole | "";
export type AdminPlanFilter = UserPlan | "";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  plan: UserPlan;
  createdAt: string;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type AdminUserFilters = {
  q: string;
  role: AdminRoleFilter;
  plan: AdminPlanFilter;
  page: number;
  limit: number;
  sort: AdminUserSortField;
  direction: AdminSortDirection;
};

export type AdminUsersResponse = {
  users: AdminUser[];
  pagination: PaginationMeta;
};

export type AdminAiModelOption = {
  code: string;
  label: string;
};

export type AdminAiSettings = {
  id: number;
  model: string;
  updatedAt: string;
};

export type AdminAiSettingsResponse = {
  aiSettings: AdminAiSettings;
  availableModels: AdminAiModelOption[];
};

export type AdminAiKeyStatus = {
  hasKey: boolean;
  source: "stored" | "env" | "missing";
  updatedAt: string | null;
};

export type AdminAiKeyResponse = {
  key: AdminAiKeyStatus;
};

export type AdminDataProviderStatusValue =
  | "disconnected"
  | "connected"
  | "expired"
  | "error";

export type AdminDataProviderStatus = {
  providerConfigured: boolean;
  connected: boolean;
  status: AdminDataProviderStatusValue;
  lastSyncedAt: string | null;
  errorMessage: string | null;
};

export type AdminDataProviderStatusEntry = AdminDataProviderStatus & {
  provider: string;
};

export type AdminDataProviderStatusesResponse = {
  providers: AdminDataProviderStatusEntry[];
};

export type AdminDataProviderConnectUrlResponse = {
  url: string;
};

export type AdminDataProviderConnectResponse = {
  connected: boolean;
};

export type AdminSyncJobStatus = "queued" | "running" | "completed" | "failed";

export type AdminSyncJob = {
  id: string;
  type: string;
  status: AdminSyncJobStatus;
  payload: Record<string, unknown>;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminJobsResponse = {
  jobs: AdminSyncJob[];
};

export type MonetizationMode = "off" | "preview" | "live";

export type AdminAdPlacementKey =
  | "landing_primary"
  | "landing_secondary"
  | "scanner_bottom"
  | "insights_article";

export type AdminAdPlacement = {
  key: AdminAdPlacementKey;
  label: string;
  description: string;
  enabled: boolean;
  slotId: string | null;
  updatedAt: string | null;
  renderable: boolean;
};

export type AdminMonetizationConfig = {
  mode: MonetizationMode;
  publisherId: string | null;
  placements: AdminAdPlacement[];
};

export type AdminDataProviderCapability =
  | "instrument_sync"
  | "historical_daily_candles"
  | "latest_daily_candles"
  | "instrument_search"
  | "instrument_token"
  | "exchange_list"
  | "realtime_ws";

export type AdminDataProviderHealth = "disabled" | "healthy" | "error" | "unknown";

export type AdminDataProviderSettingsRow = {
  key: string;
  displayName: string;
  enabled: boolean;
  priority: number;
  disabledReason: string | null;
  configured: boolean;
  capabilities: AdminDataProviderCapability[];
  health: AdminDataProviderHealth;
  lastSuccessAt: string | null;
  lastFailureAt: string | null;
  lastError: string | null;
  updatedAt: string;
};

export type AdminDataProviderSettingsResponse = {
  providers: AdminDataProviderSettingsRow[];
};
