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
      className="flex items-center gap-0.5"
    >
      {TIMEFRAMES.map((tf) => (
        <ToggleGroupItem
          key={tf}
          value={tf}
          className={cn(
            "h-7 cursor-pointer rounded px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
            // The base Toggle already applies data-[state=on]:bg-muted for
            // its own "pressed" styling - overriding with a plain,
            // unconditional bg-primary doesn't beat that (different
            // specificity, so twMerge doesn't dedupe them as the same
            // slot), leaving near-black text on the still-active
            // near-black bg-muted fill. Matching the same data-[state=on]
            // variant makes this the same slot, so it's the one that
            // actually wins.
            "data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:hover:bg-primary data-[state=on]:hover:text-primary-foreground"
          )}
        >
          {tf}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}