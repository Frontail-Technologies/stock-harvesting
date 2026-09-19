export const API_ROUTES = {
  auth: {
    googleUrl: (portal?: "admin") =>
      portal ? `/api/auth/google/url?portal=${portal}` : "/api/auth/google/url",
    login: "/api/auth/login",
    register: "/api/auth/register",
    registerResend: "/api/auth/register/resend",
    registerVerify: "/api/auth/register/verify",
    passwordResetRequest: "/api/auth/password-reset/request",
    passwordResetConfirm: "/api/auth/password-reset/confirm",
    refresh: "/api/auth/refresh",
    me: "/api/auth/me",
    logout: "/api/auth/logout",
  },

  adminAuth: {
    login: "/api/admin-auth/login",
    refresh: "/api/admin-auth/refresh",
    me: "/api/admin-auth/me",
    logout: "/api/admin-auth/logout",
  },
  marketData: {
    stocks: "/api/market-data/stocks",
    stockSearch: "/api/market-data/stocks/search",
    chartEligibleStockSearch: "/api/market-data/stocks/search/chart-eligible",
    candles: (symbol: string) =>
      `/api/market-data/charts/${encodeURIComponent(symbol)}/candles`,
    currentDayCandle: (symbol: string) =>
      `/api/market-data/charts/${encodeURIComponent(symbol)}/current-day-candle`,
    ensureFreshCandles: "/api/market-data/candles/ensure-fresh",
    publicCandles: (symbol: string) =>
      `/api/market-data/public/candles/${encodeURIComponent(symbol)}`,
    historyRange: "/api/market-data/history-range",
    exchanges: "/api/market-data/exchanges",
    indexRelativeStrength: "/api/market-data/index-relative-strength",
  },
  marketCollections: {
    list: "/api/market-collections",
    members: (code: string) =>
      `/api/market-collections/${encodeURIComponent(code)}/members`,
    relativeStrength: (code: string) =>
      `/api/market-collections/${encodeURIComponent(code)}/relative-strength`,
    sectorIndustryTaxonomy: (code: string) =>
      `/api/market-collections/${encodeURIComponent(code)}/sector-industry-taxonomy`,
    weeklyStrongStocks: (code: string) =>
      `/api/market-collections/${encodeURIComponent(code)}/weekly-strong-stocks`,
  },
  weeklyStrongBacktest: {
    stacked: (code: string) =>
      `/api/weekly-strong-backtest/${encodeURIComponent(code)}`,
    weekDetail: (code: string, weekEnding: string) =>
      `/api/weekly-strong-backtest/${encodeURIComponent(code)}/${encodeURIComponent(weekEnding)}`,
    membershipChanges: (code: string, weekEnding?: string) =>
      weekEnding
        ? `/api/weekly-strong-backtest/${encodeURIComponent(code)}/membership-changes?weekEnding=${encodeURIComponent(weekEnding)}`
        : `/api/weekly-strong-backtest/${encodeURIComponent(code)}/membership-changes`,
  },
  scanner: {
    results: "/api/scanner/results",
    symbolResults: (symbol: string) =>
      `/api/scanner/results/${encodeURIComponent(symbol)}`,
    workspace: (symbol: string, timeframe: string) =>
      `/api/scanner/workspaces/${encodeURIComponent(symbol)}/${encodeURIComponent(timeframe)}`,
    workspaceDrawings: (symbol: string, timeframe: string) =>
      `/api/scanner/workspaces/${encodeURIComponent(symbol)}/${encodeURIComponent(timeframe)}/drawings`,
    drawing: (id: string) => `/api/scanner/drawings/${encodeURIComponent(id)}`,
    backtest: (symbol: string) =>
      `/api/scanner/backtest/${encodeURIComponent(symbol)}`,
  },
  admin: {
    analytics: "/api/admin/analytics",
    users: "/api/admin/users",
    usersExport: "/api/admin/users/export",
    userRole: (id: string) => `/api/admin/users/${encodeURIComponent(id)}/role`,
    userPlan: (id: string) => `/api/admin/users/${encodeURIComponent(id)}/plan`,
    userById: (id: string) => `/api/admin/users/${encodeURIComponent(id)}`,
    branding: "/api/admin/branding",
    dataProviderStatuses: "/api/admin/data-provider/statuses",
    dataProviderHealth: (provider: string) =>
      `/api/admin/data-provider/health/${encodeURIComponent(provider)}`,
    dataProviderSync: "/api/admin/data-provider/sync",
    sectorClassificationSync:
      "/api/admin/data-provider/sector-classification-sync",
    indexCandleBackfill: "/api/admin/data-provider/index-candle-backfill",
    marketDataSyncPrices: "/api/admin/market-data/sync-prices",
    marketDataWorkers: "/api/admin/market-data/workers",
    marketDataHealth: "/api/admin/market-data/health",
    marketDataJobRuns: "/api/admin/market-data/job-runs",
    marketDataSchedules: "/api/admin/market-data/schedules",
    marketDataOperations: "/api/admin/market-data/operations",
    marketDataQueue: "/api/admin/market-data/queue",
    marketDataReconcile: "/api/admin/market-data/reconcile",
    marketDataCatchUp: "/api/admin/market-data/catch-up",
    marketDataRefreshBacktests: "/api/admin/market-data/refresh-backtests",
    jobs: "/api/admin/jobs",
    jobById: (id: string) => `/api/admin/jobs/${encodeURIComponent(id)}`,
    aiSettings: "/api/admin/ai-settings",
    aiSettingsKey: "/api/admin/ai-settings/key",
    marketCollections: "/api/admin/market-collections",
    marketCollection: (id: string) =>
      `/api/admin/market-collections/${encodeURIComponent(id)}`,
    marketCollectionMembers: (id: string) =>
      `/api/admin/market-collections/${encodeURIComponent(id)}/members`,
    marketCollectionImportDryRun: (id: string) =>
      `/api/admin/market-collections/${encodeURIComponent(id)}/import/dry-run`,
    marketCollectionImport: (id: string) =>
      `/api/admin/market-collections/${encodeURIComponent(id)}/import`,
    marketCollectionVersions: (id: string) =>
      `/api/admin/market-collections/${encodeURIComponent(id)}/versions`,
    marketCollectionVersion: (id: string, versionId: string) =>
      `/api/admin/market-collections/${encodeURIComponent(id)}/versions/${encodeURIComponent(versionId)}`,
    marketCollectionVersionReplace: (id: string, versionId: string) =>
      `/api/admin/market-collections/${encodeURIComponent(id)}/versions/${encodeURIComponent(versionId)}/replace`,
    marketCollectionWeeklyStrongBacktestStatus: (id: string) =>
      `/api/admin/market-collections/${encodeURIComponent(id)}/weekly-strong-backtest/status`,
    marketCollectionWeeklyStrongBacktestHistoricalStatus: (id: string) =>
      `/api/admin/market-collections/${encodeURIComponent(id)}/weekly-strong-backtest/historical-status`,
    marketCollectionWeeklyStrongBacktestGenerate: (id: string) =>
      `/api/admin/market-collections/${encodeURIComponent(id)}/weekly-strong-backtest/generate`,
    marketCollectionWeeklyStrongBacktestRebuildHistorical: (id: string) =>
      `/api/admin/market-collections/${encodeURIComponent(id)}/weekly-strong-backtest/rebuild-historical`,
    marketCollectionBulkImportPreview: "/api/admin/market-collections/bulk-import/preview",
    marketCollectionBulkImportFile: "/api/admin/market-collections/bulk-import",
    marketCollectionBulkDelete: "/api/admin/market-collections/bulk-delete",
    marketCollectionPrepare: (id: string) =>
      `/api/admin/market-collections/${encodeURIComponent(id)}/prepare`,
    monetization: "/api/admin/monetization",
    monetizationSettings: "/api/admin/monetization/settings",
    monetizationPlacement: (key: string) =>
      `/api/admin/monetization/placements/${encodeURIComponent(key)}`,
    dataProviders: "/api/admin/data-providers",
    dataProviderSettings: (key: string) =>
      `/api/admin/data-providers/${encodeURIComponent(key)}`,
  },
  ai: {
    ask: (symbol: string) =>
      `/api/ai/scanner/${encodeURIComponent(symbol)}/ask`,
  },
  priceAlerts: {
    root: "/api/price-alerts",
    byId: (id: string) => `/api/price-alerts/${encodeURIComponent(id)}`,
  },
  pushSubscriptions: {
    root: "/api/push-subscriptions",
    publicKey: "/api/push-subscriptions/public-key",
  },
  watchlists: {
    root: "/api/watchlists",
    byId: (id: string) => `/api/watchlists/${encodeURIComponent(id)}`,
    items: (id: string) => `/api/watchlists/${encodeURIComponent(id)}/items`,
    bulkItems: (id: string) => `/api/watchlists/${encodeURIComponent(id)}/items/bulk`,
    item: (id: string, itemId: string) =>
      `/api/watchlists/${encodeURIComponent(id)}/items/${encodeURIComponent(itemId)}`,
    relativeStrength: (id: string) => `/api/watchlists/${encodeURIComponent(id)}/relative-strength`,
  },
  widgetPreferences: {
    root: "/api/widget-preferences",
  },
  monetization: {
    config: "/api/monetization/config",
  },
} as const;
