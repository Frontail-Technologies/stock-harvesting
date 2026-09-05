export const API_ROUTES = {
  auth: {
    googleUrl: (portal?: "admin") =>
      portal ? `/api/auth/google/url?portal=${portal}` : "/api/auth/google/url",
    login: "/api/auth/login",
    register: "/api/auth/register",
    registerResend: "/api/auth/register/resend",
    registerVerify: "/api/auth/register/verify",
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
  users: {
    me: "/api/users/me",
  },
  marketData: {
    stocks: "/api/market-data/stocks",
    stockSearch: "/api/market-data/stocks/search",
    chartEligibleStockSearch: "/api/market-data/stocks/search/chart-eligible",
    candles: (symbol: string) =>
      `/api/market-data/charts/${encodeURIComponent(symbol)}/candles`,
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
    weeklyStrongStocks: (code: string) =>
      `/api/market-collections/${encodeURIComponent(code)}/weekly-strong-stocks`,
  },
  weeklyStrongBacktest: {
    stacked: (code: string) =>
      `/api/weekly-strong-backtest/${encodeURIComponent(code)}`,
    weekDetail: (code: string, weekEnding: string) =>
      `/api/weekly-strong-backtest/${encodeURIComponent(code)}/${encodeURIComponent(weekEnding)}`,
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
    users: "/api/admin/users",
    usersExport: "/api/admin/users/export",
    userRole: (id: string) => `/api/admin/users/${encodeURIComponent(id)}/role`,
    userPlan: (id: string) => `/api/admin/users/${encodeURIComponent(id)}/plan`,
    userById: (id: string) => `/api/admin/users/${encodeURIComponent(id)}`,
    branding: "/api/admin/branding",
    dataProviderStatus: "/api/admin/data-provider/status",
    dataProviderStatuses: "/api/admin/data-provider/statuses",
    dataProviderConnectUrl: "/api/admin/data-provider/connect-url",
    dataProviderConnect: "/api/admin/data-provider/connect",
    dataProviderSync: "/api/admin/data-provider/sync",
    sectorClassificationSync:
      "/api/admin/data-provider/sector-classification-sync",
    indexCandleBackfill: "/api/admin/data-provider/index-candle-backfill",
    marketDataSyncPrices: "/api/admin/market-data/sync-prices",
    jobs: "/api/admin/jobs",
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
    item: (id: string, itemId: string) =>
      `/api/watchlists/${encodeURIComponent(id)}/items/${encodeURIComponent(itemId)}`,
  },
  monetization: {
    config: "/api/monetization/config",
  },
} as const;
