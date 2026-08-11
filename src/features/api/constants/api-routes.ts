export const API_ROUTES = {
  auth: {
    googleUrl: "/api/auth/google/url",
    refresh: "/api/auth/refresh",
    me: "/api/auth/me",
    logout: "/api/auth/logout",
  },
  users: {
    me: "/api/users/me",
  },
  marketData: {
    stocks: "/api/market-data/stocks",
    stockSearch: "/api/market-data/stocks/search",
    candles: (symbol: string) =>
      `/api/market-data/charts/${encodeURIComponent(symbol)}/candles`,
    historyRange: "/api/market-data/history-range",
    exchanges: "/api/market-data/exchanges",
    exchangeRates: "/api/market-data/exchange-rates",
    indexRelativeStrength: "/api/market-data/index-relative-strength",
  },
  marketCollections: {
    list: "/api/market-collections",
    members: (code: string) => `/api/market-collections/${encodeURIComponent(code)}/members`,
    relativeStrength: (code: string) =>
      `/api/market-collections/${encodeURIComponent(code)}/relative-strength`,
    weeklyStrongStocks: (code: string) =>
      `/api/market-collections/${encodeURIComponent(code)}/weekly-strong-stocks`,
    weeklyStrongStocksBacktest: (code: string) =>
      `/api/market-collections/${encodeURIComponent(code)}/weekly-strong-stocks/backtest`,
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
    backtest: (symbol: string) => `/api/scanner/backtest/${encodeURIComponent(symbol)}`,
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
    sectorClassificationSync: "/api/admin/data-provider/sector-classification-sync",
    indexCandleBackfill: "/api/admin/data-provider/index-candle-backfill",
    marketDataSyncPrices: "/api/admin/market-data/sync-prices",
    jobs: "/api/admin/jobs",
    aiSettings: "/api/admin/ai-settings",
    aiSettingsKey: "/api/admin/ai-settings/key",
    marketCollections: "/api/admin/market-collections",
    marketCollection: (id: string) => `/api/admin/market-collections/${encodeURIComponent(id)}`,
    marketCollectionMembers: (id: string) =>
      `/api/admin/market-collections/${encodeURIComponent(id)}/members`,
    marketCollectionImportDryRun: (id: string) =>
      `/api/admin/market-collections/${encodeURIComponent(id)}/import/dry-run`,
    marketCollectionImport: (id: string) =>
      `/api/admin/market-collections/${encodeURIComponent(id)}/import`,
  },
  ai: {
    ask: (symbol: string) => `/api/ai/scanner/${encodeURIComponent(symbol)}/ask`,
  },
} as const;

