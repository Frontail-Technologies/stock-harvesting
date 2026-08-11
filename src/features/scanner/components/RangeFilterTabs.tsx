"use client";

import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/utils/cn";
import { SCANNER_RANGE_FILTERS, type ScannerRangeFilter } from "../types";
import { ChartScaleControls } from "./ChartScaleControls";

type RangeFilterTabsProps = {
  value: ScannerRangeFilter;
  onChange: (value: ScannerRangeFilter) => void;
  autoScale: boolean;
  percentageScale: boolean;
  showBacktestStats: boolean;
  onToggleAutoScale: () => void;
  onTogglePercentageScale: () => void;
  onToggleBacktestStats: () => void;
};

const RANGE_LABELS: Record<ScannerRangeFilter, string> = {
  "1D": "1 day",
  "2D": "2 days",
  "3D": "3 days",
  "5D": "5 days",
  "10D": "10 days",
  "1M": "1 month",
  "2M": "2 months",
  "3M": "3 months",
  "4M": "4 months",
  "6M": "6 months",
  "9M": "9 months",
  "1Y": "1 year",
  "2Y": "2 years",
  "3Y": "3 years",
  "5Y": "5 years",
  "8Y": "8 years",
  ALL: "All data",
};

export function RangeFilterTabs({
  value,
  onChange,
  autoScale,
  percentageScale,
  showBacktestStats,
  onToggleAutoScale,
  onTogglePercentageScale,
  onToggleBacktestStats,
}: RangeFilterTabsProps) {
  return (
    <div className="h-10 shrink-0 border-t border-border bg-background md:h-9">
      <div className="flex items-center justify-between gap-3 overflow-x-auto px-2 py-1.5">
        <MobileRangeDropdown value={value} onChange={onChange} />

        <div className="hidden shrink-0 items-center gap-1 sm:flex">
          {SCANNER_RANGE_FILTERS.map((filter) => {
            const active = value === filter;

            return (
              <button
                key={filter}
                type="button"
                onClick={() => onChange(filter)}
                className={`h-7 shrink-0 rounded-sm px-2 text-xs font-medium transition-colors md:h-6 ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {filter}
              </button>
            );
          })}
        </div>

        <ChartScaleControls
          autoScale={autoScale}
          percentageScale={percentageScale}
          showBacktestStats={showBacktestStats}
          onToggleAutoScale={onToggleAutoScale}
          onTogglePercentageScale={onTogglePercentageScale}
          onToggleBacktestStats={onToggleBacktestStats}
        />
      </div>
      <div className="h-0.5 bg-primary/40" />
    </div>
  );
}

function MobileRangeDropdown({
  value,
  onChange,
}: {
  value: ScannerRangeFilter;
  onChange: (value: ScannerRangeFilter) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-sm bg-muted px-2.5 text-xs font-medium text-foreground transition-colors hover:bg-accent sm:hidden">
        Date Range
        <ChevronDown className="size-3 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        side="top"
        className="scanner-portal w-56 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-2xl"
      >
        {SCANNER_RANGE_FILTERS.map((filter) => {
          const active = value === filter;

          return (
            <DropdownMenuItem
              key={filter}
              onClick={() => onChange(filter)}
              className={cn(
                "flex h-8 cursor-pointer items-center justify-between rounded-md px-2 text-sm font-medium text-muted-foreground focus:bg-muted focus:text-foreground",
                active &&
                  "bg-primary text-primary-foreground focus:bg-primary focus:text-primary-foreground"
              )}
            >
              <span>{RANGE_LABELS[filter]}</span>
              <span className="text-xs opacity-70">{filter}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
