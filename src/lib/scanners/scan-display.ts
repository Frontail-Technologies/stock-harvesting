import type { NearHighSignal } from "@/lib/scanners/near-250-week-high";

// Frontend-safe view of a matched signal. The underlying calculation
// (lookback length, threshold multiplier, "high" terminology) must never
// reach UI text — only this mapped, generic vocabulary may be rendered.
// If a future backend sends NearHighSignal-shaped data over the wire, run it
// through this mapper before it touches any component.
export type SignalStrengthLabel = "Strong" | "Moderate" | "Watch";

export type ScanDisplayInfo = {
  setupName: string;
  signalLabel: string;
  upperZoneLabel: string;
  baseZoneLabel: string;
  displayReason: string;
  signalStrengthLabel: SignalStrengthLabel;
  entryZoneValue: number;
  upperZoneValue: number;
  baseZoneValue: number;
};

function toSignalStrengthLabel(currentVsHighPct: number): SignalStrengthLabel {
  if (currentVsHighPct >= 95) return "Strong";
  if (currentVsHighPct >= 88) return "Moderate";
  return "Watch";
}

export function toScanDisplayInfo(signal: NearHighSignal): ScanDisplayInfo {
  return {
    setupName: "Momentum Scan",
    signalLabel: "Scan Match",
    upperZoneLabel: "Upper Zone",
    baseZoneLabel: "Base Zone",
    displayReason: "Internal scanner condition matched",
    signalStrengthLabel: toSignalStrengthLabel(signal.currentVsHighPct),
    entryZoneValue: signal.currentClose,
    upperZoneValue: signal.highestHigh250,
    baseZoneValue: signal.threshold85,
  };
}
