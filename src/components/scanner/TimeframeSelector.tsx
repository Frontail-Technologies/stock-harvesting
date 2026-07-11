"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export type Timeframe = "1D" | "1W" | "1M";

const TIMEFRAMES: Timeframe[] = ["1D", "1W", "1M"];

export const TIMEFRAME_LABEL: Record<Timeframe, string> = {
  "1D": "Daily",
  "1W": "Weekly",
  "1M": "Monthly",
};

type TimeframeSelectorProps = {
  value: Timeframe;
  onChange: (value: Timeframe) => void;
};

export function TimeframeSelector({ value, onChange }: TimeframeSelectorProps) {
  return (
    <ToggleGroup
      value={[value]}
      onValueChange={(values) => {
        const next = values[0] as Timeframe | undefined;
        if (next) onChange(next);
      }}
      className="rounded-md border border-border bg-muted/50 p-0.5"
    >
      {TIMEFRAMES.map((tf) => (
        <ToggleGroupItem
          key={tf}
          value={tf}
          className="h-7 rounded px-3 text-xs font-medium text-muted-foreground data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
        >
          {tf}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
