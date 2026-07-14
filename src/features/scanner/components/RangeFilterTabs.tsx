"use client";

import { SCANNER_RANGE_FILTERS, type ScannerRangeFilter } from "../types";

type RangeFilterTabsProps = {
  value: ScannerRangeFilter;
  onChange: (value: ScannerRangeFilter) => void;
};

export function RangeFilterTabs({ value, onChange }: RangeFilterTabsProps) {
  return (
    <div className="h-10 shrink-0 overflow-x-auto border-t border-border bg-background md:h-9">
      <div className="flex min-w-max items-center gap-2 px-2 py-1.5">
        {SCANNER_RANGE_FILTERS.map((filter) => {
          const active = value === filter;

          return (
            <button
              key={filter}
              type="button"
              onClick={() => onChange(filter)}
              className={`h-7 rounded-sm px-2.5 text-xs font-medium transition-colors md:h-6 ${
                active
                  ? "bg-primary text-primary-foreground shadow-sm ring-1 ring-primary/35"
                  : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              {filter}
            </button>
          );
        })}
      </div>
      <div className="h-0.5 bg-primary" />
    </div>
  );
}
