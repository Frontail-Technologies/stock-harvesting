import type { UserPlan, UserRole } from "@/features/auth";
import type { CollectionImportReport, CollectionImportResult } from "@/features/market-collections";

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

// Local/DB-derived status entry from GET /api/admin/data-provider/statuses -
// resolves with no external provider call. External reachability is a
// separate per-provider query (AdminDataProviderHealth).
export type AdminDataProviderStatusEntry = AdminDataProviderStatus & {
  provider: string;
  enabled: boolean;
  priority: number;
  requiresConnection: boolean;
};

export type AdminDataProviderStatusesResponse = {
  providers: AdminDataProviderStatusEntry[];
};

// Result of GET /api/admin/data-provider/health/:provider - the bounded
// external connectivity check, loaded independently per provider.
export type AdminDataProviderHealthResult = {
  provider: string;
  connected: boolean;
  status: AdminDataProviderStatusValue;
  errorMessage: string | null;
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

export type BulkImportPreviewResponse = {
  report: CollectionImportReport;
  existingCollectionId: string | null;
  name: string;
  code: string;
};

export type BulkImportFileResult = CollectionImportResult & { created: boolean; name: string; code: string };

export type AdminWorkerStatus = {
  name: string;
  status: "online" | "offline";
  lastHeartbeat: string | null;
  startedAt: string | null;
};

export type AdminMarketDataHealth = {
  exchange: string;
  exchanges: string[];
  latestExpectedTradingDate: string | null;
  activeSymbols: number;
  fresh: number;
  stale: number;
  bootstrapRequired: number;
  lastSuccessfulRefresh: string | null;
  liveDelayedFeed: Array<{
    provider: string;
    connected: boolean;
    exchange?: string;
    lastMessageTime: string | null;
    activeSubscriptions: number;
    currentDayCandlesInMemory: number;
    lastError: string | null;
  }>;
  providerCapabilities: Array<{
    provider: string;
    exchange?: string;
    realtime: "available" | "unavailable" | "unknown";
    currentDayCandle: "available" | "unavailable" | "unknown";
    completedDailyHistory: "available" | "unavailable" | "unknown";
    reason: string | null;
    lastCheckedAt: string | null;
    retryAfter: string | null;
  }>;
  mechanisms: {
    historicalDailySync: string;
    currentPriceSnapshot: string;
    liveFeed: string;
  };
};

export type AdminBackgroundJobRunStatus = "pending" | "queued" | "running" | "completed" | "partial" | "failed" | "missed";

export type AdminFailedSymbolDetail = {
  instrumentId: string | null;
  symbol: string;
  reason: string;
};

export type AdminBackgroundJobRun = {
  id: string;
  jobType: string;
  status: AdminBackgroundJobRunStatus;
  startedAt: string | null;
  tradingDate?: string | null;
  exchange?: string | null;
  scheduledAt?: string | null;
  attemptCount?: number;
  totalExpected?: number;
  completedCount?: number;
  missingCount?: number;
  backtestStatus?: string | null;
  backtestThrough?: string | null;
  finishedAt: string | null;
  processedCount: number;
  updatedCount: number;
  repairedCount: number;
  alreadyCurrentCount: number;
  bootstrapRequiredCount: number;
  failedCount: number;
  errorSummary: string | null;
  metadata: { failedSymbols?: AdminFailedSymbolDetail[] } & Record<string, unknown>;
  createdAt: string;
};

export type AdminAnalytics = {
  summary: {
    totalUsers: number;
    verifiedUsers: number;
    newUsers30d: number;
    activeSegments: number;
    totalMembers: number;
    activeJobs: number;
    jobSuccessRate: number;
  };
  userGrowth: Array<{ day: string; users: number }>;
  plans: Array<{ name: string; value: number }>;
  jobs: Array<{ day: string; successful: number; failed: number }>;
  segmentReadiness: Array<{ name: string; value: number }>;
};

export type AdminAnalyticsPeriod = "all" | "today" | "7d" | "30d" | "90d";

export type AdminSyncJob = {
  id: string;
  type: string;
  status: "queued" | "running" | "completed" | "failed";
  payload: Record<string, unknown>;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminScheduledJobStatus = {
  jobType: string;
  nextRunAt: string | null;
  lastRun: {
    status: AdminBackgroundJobRunStatus;
    startedAt: string | null;
    finishedAt: string | null;
    processedCount: number;
    updatedCount: number;
    repairedCount: number;
    failedCount: number;
  } | null;
};

export type AdminQueueJob = {
  id: string;
  name: string;
  state: "active" | "waiting" | "delayed";
  exchange: string | null;
  attemptsMade: number;
  addedAt: string | null;
  startedAt: string | null;
  runAt: string | null;
};

export type AdminMarketDataQueue = {
  available: boolean;
  counts: { active: number; waiting: number; delayed: number };
  jobs: AdminQueueJob[];
};

export type AdminMarketDataOperations = {
  checkedAt: string;
  expectedCompletedTradingDate: string | null;
  historicalThrough: string | null;
  backtestsThrough: string | null;
  productionProvider: string;
  coverage: Array<{
    tradingDate: string;
    exchange: string;
    totalExpected: number;
    completed: number;
    missing: number;
    // Instruments GlobalDataFeeds confirmed (successful empty response) have no history; not counted as missing.
    exempt?: number;
    coveragePct: number;
    missingSymbols: string[];
  }>;
  jobs: AdminBackgroundJobRun[];
};
