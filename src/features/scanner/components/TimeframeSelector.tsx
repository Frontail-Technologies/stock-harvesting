"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { TIMEFRAMES, type Timeframe } from "../types";

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
