"use client";

import {
  ChartBar,
  ChartCandlestick,
  ChartLine,
  ChevronDown,
  CircleDot,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/utils/cn";
import {
  SCANNER_CHART_TYPES,
  SCANNER_CHART_TYPE_LABEL,
  type ScannerChartType,
} from "../types";

type ChartTypeSelectorProps = {
  value: ScannerChartType;
  onChange: (value: ScannerChartType) => void;
};

const chartTypeIcon: Record<ScannerChartType, typeof ChartCandlestick> = {
  candlestick: ChartCandlestick,
  "bar-ohlc": ChartBar,
  "bar-hlc": ChartBar,
  line: ChartLine,
  "line-markers": CircleDot,
  "step-line": ChartLine,
  "hollow-candles": ChartCandlestick,
};

export function ChartTypeSelector({ value, onChange }: ChartTypeSelectorProps) {
  const ActiveIcon = chartTypeIcon[value];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-background px-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted">
        <ActiveIcon className="size-3.5 text-primary" />
        <span className="hidden sm:inline">{SCANNER_CHART_TYPE_LABEL[value]}</span>
        <ChevronDown className="size-3 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="scanner-portal w-48 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-2xl"
      >
        {SCANNER_CHART_TYPES.map((chartType) => {
          const Icon = chartTypeIcon[chartType];
          const active = chartType === value;

          return (
            <DropdownMenuItem
              key={chartType}
              onClick={() => onChange(chartType)}
              className={cn(
                "flex h-8 cursor-pointer items-center gap-2 rounded-md px-2 text-sm font-medium text-muted-foreground focus:bg-muted focus:text-foreground",
                active &&
                  "border border-primary/45 bg-primary text-primary-foreground focus:bg-primary focus:text-primary-foreground"
              )}
            >
              <Icon className="size-3.5" />
              {SCANNER_CHART_TYPE_LABEL[chartType]}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
