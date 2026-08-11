"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/utils/cn";
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
      {TIMEFRAMES.map((tf) => {
        const selected = tf === value;

        return (
          <ToggleGroupItem
            key={tf}
            value={tf}
            className={cn(
              "h-7 cursor-pointer rounded border border-transparent px-3 text-xs font-medium transition-colors hover:border-primary/50 hover:bg-primary/15 hover:text-primary dark:hover:bg-primary/20",
              selected
                ? "border-primary bg-primary text-primary-foreground shadow-sm hover:bg-primary hover:text-primary-foreground dark:border-primary dark:bg-primary dark:text-primary-foreground"
                : "text-muted-foreground"
            )}
          >
            {tf}
          </ToggleGroupItem>
        );
      })}
    </ToggleGroup>
  );
}