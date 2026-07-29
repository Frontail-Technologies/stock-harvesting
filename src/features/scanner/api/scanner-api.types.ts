export type BackendScannerResult = {
  id: string;
  ruleKey: string;
  exchange: string;
  symbol: string;
  timeframe: string;
  startTime: string;
  endTime: string;
  highlightTimes: string[];
  metrics: Record<string, unknown>;
};

export type ScannerResultsResponse = {
  results: BackendScannerResult[];
};

export type BackendDrawingRow = {
  id: string;
  symbol: string;
  timeframe: string;
  drawingType: string;
  payload: Record<string, unknown>;
  locked: boolean;
  hidden: boolean;
  createdAt: string;
  updatedAt: string;
};

export type WorkspaceDrawingsResponse = {
  drawings: BackendDrawingRow[];
};

export type ScannerBacktestStats = {
  hitRatePct: number;
  totalReturnPct: number;
  maxDrawdownPct: number;
  profitFactor: number | null;
  signalsGenerated: number;
  avgHoldingDays: number;
  largestWinnerPct: number;
  largestLoserPct: number;
};

export type ScannerBacktestResponse = {
  stats: ScannerBacktestStats | null;
};
