import { apiFetch, API_ROUTES } from "@/features/api";
import type { DrawingElement, ScannerLookbackMultiplier, Timeframe } from "../types";
import { toBackendDrawingPayload } from "../lib/drawing-api-mappers";
import type {
  BackendDrawingRow,
  BackendScannerResult,
  ScannerBacktestResponse,
  ScannerResultsResponse,
  WorkspaceDrawingsResponse,
} from "./scanner-api.types";

function withQuery(path: string, query: Record<string, string | number | undefined>) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }

  const queryString = params.toString();
  return queryString ? `${path}?${queryString}` : path;
}
function toApiTimeframe(timeframe?: string) {
  if (timeframe === "1D") return "1d";
  if (timeframe === "1W") return "1w";
  if (timeframe === "1M") return "1mo";
  return timeframe;
}
export function getScannerResults(input: {
  symbol: string;
  timeframe: Timeframe;
  rule?: string;
  limit?: number;
  exchange?: string;
  lookback?: ScannerLookbackMultiplier;
}) {
  return apiFetch<ScannerResultsResponse>(
    withQuery(API_ROUTES.scanner.symbolResults(input.symbol), {
      timeframe: toApiTimeframe(input.timeframe),
      rule: input.rule,
      limit: input.limit ?? 50,
      exchange: input.exchange,
      lookback: input.lookback,
    })
  );
}

export function getWorkspaceDrawings(input: {
  symbol: string;
  timeframe: Timeframe;
}) {
  return apiFetch<WorkspaceDrawingsResponse>(
    API_ROUTES.scanner.workspace(input.symbol, input.timeframe)
  );
}

export function saveWorkspaceDrawings(input: {
  symbol: string;
  timeframe: Timeframe;
  drawings: DrawingElement[];
}) {
  return apiFetch<WorkspaceDrawingsResponse>(
    API_ROUTES.scanner.workspaceDrawings(input.symbol, input.timeframe),
    {
      method: "PUT",
      body: JSON.stringify({
        drawings: input.drawings.map(toBackendDrawingPayload),
      }),
    }
  );
}

export function patchScannerDrawing(input: {
  id: string;
  patch: Partial<BackendDrawingRow>;
}) {
  return apiFetch<{ drawing: BackendDrawingRow }>(
    API_ROUTES.scanner.drawing(input.id),
    {
      method: "PATCH",
      body: JSON.stringify(input.patch),
    }
  );
}

export function getScannerBacktest(input: {
  symbol: string;
  exchange?: string;
  lookback?: ScannerLookbackMultiplier;
}) {
  return apiFetch<ScannerBacktestResponse>(
    withQuery(API_ROUTES.scanner.backtest(input.symbol), {
      exchange: input.exchange,
      lookback: input.lookback,
    })
  );
}

export type { BackendDrawingRow, BackendScannerResult };
