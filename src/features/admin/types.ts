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
