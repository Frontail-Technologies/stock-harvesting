import type { ScanBand } from "@/types/market";
import type { BackendScannerResult } from "../api/scanner-api.types";

export function mapScannerResultToScanBand(result: BackendScannerResult): ScanBand {
  return {
    id: result.id,
    startTime: result.startTime,
    endTime: result.endTime,
    label: result.ruleKey,
    latestMatched:
      typeof result.metrics.latestMatched === "boolean"
        ? result.metrics.latestMatched
        : undefined,
    highlightTimes: result.highlightTimes,
  };
}

export function mapScannerResultsToScanBands(results: BackendScannerResult[]) {
  return results.map(mapScannerResultToScanBand);
}
