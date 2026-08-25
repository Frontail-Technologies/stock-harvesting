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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/utils/cn";
import {
  SCANNER_CHART_TYPES,
  SCANNER_CHART_TYPE_LABEL,
  type ScannerChartType,
} from "../types";

type ChartTypeSelectorProps = {
  value: ScannerChartType;
  onChange: (value: ScannerChartType) => void;
  compact?: boolean;
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

export function ChartTypeSelector({ value, onChange, compact }: ChartTypeSelectorProps) {
  const ActiveIcon = chartTypeIcon[value];

  return (
    <DropdownMenu>
      {compact ? (
        <Tooltip>
          <TooltipTrigger
            render={
              <DropdownMenuTrigger
                aria-label={`Chart type: ${SCANNER_CHART_TYPE_LABEL[value]}`}
                className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/60"
              />
            }
          >
            <ActiveIcon className="size-4" />
          </TooltipTrigger>
          <TooltipContent side="right" className="scanner-portal">
            {SCANNER_CHART_TYPE_LABEL[value]}
          </TooltipContent>
        </Tooltip>
      ) : (
        <DropdownMenuTrigger className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md px-2.5 text-sm font-medium text-foreground outline-none transition-colors hover:bg-muted aria-expanded:bg-muted focus-visible:ring-2 focus-visible:ring-primary/60">
          <ActiveIcon className="size-3.5 text-primary" />
          <span className="hidden sm:inline">{SCANNER_CHART_TYPE_LABEL[value]}</span>
          <ChevronDown className="size-3 text-muted-foreground" />
        </DropdownMenuTrigger>
      )}
      <DropdownMenuContent
        align="start"
        side={compact ? "right" : "bottom"}
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
                  "bg-primary text-primary-foreground focus:bg-primary focus:text-primary-foreground"
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

