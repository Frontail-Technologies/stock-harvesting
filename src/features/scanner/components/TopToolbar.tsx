"use client";

import type { Stock } from "@/types/market";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { MarketSelector, type MarketExchangeCode } from "@/features/market";
import { ScannerPriceAlertMenu } from "@/features/price-alerts";
import { ThemeToggle } from "@/features/theme";
import { cn } from "@/utils/cn";
import {
  SCANNER_LOOKBACK_OPTIONS,
  type ScannerChartType,
  type ScannerLookbackMultiplier,
  type Timeframe,
} from "../types";
import { ChartSnapshotMenu } from "./ChartSnapshotMenu";
import { ChartTypeSelector } from "./ChartTypeSelector";
import { ScannerAccountMenu } from "./ScannerAccountMenu";
import { ShareMenu } from "./ShareMenu";
import { StockSearchCombobox } from "./StockSearchCombobox";
import { TimeframeSelector } from "./TimeframeSelector";

// Shared with MarketSelector's trigger and ThemeToggle below - both render
// a bordered box by default (their shared default across the rest of the
// app, e.g. AppHeader), but the scanner toolbar wants every compact
// control to recede behind the chart until hovered/active, so only this
// call site overrides it.
const SCANNER_GHOST_TRIGGER_CLASS =
  "border-transparent bg-transparent hover:bg-muted hover:border-transparent";

type TopToolbarProps = {
  stock: Stock;
  chartType: ScannerChartType;
  timeframe: Timeframe;
  lookbackMultiplier: ScannerLookbackMultiplier;
  exchange: MarketExchangeCode;
  onChartTypeChange: (chartType: ScannerChartType) => void;
  onTimeframeChange: (timeframe: Timeframe) => void;
  onLookbackMultiplierChange: (value: ScannerLookbackMultiplier) => void;
  onExchangeChange: (exchange: MarketExchangeCode) => void;
  onSelectStock: (stock: Stock) => void;
};

function LookbackDropdown({
  lookbackMultiplier,
  onLookbackMultiplierChange,
  className,
}: {
  lookbackMultiplier: ScannerLookbackMultiplier;
  onLookbackMultiplierChange: (value: ScannerLookbackMultiplier) => void;
  className?: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-md px-2.5 text-sm font-medium text-foreground outline-none transition-colors hover:bg-muted aria-expanded:bg-muted focus-visible:ring-2 focus-visible:ring-primary/60",
          className
        )}
      >
        <span>{lookbackMultiplier}</span>
        <ChevronDown className="size-3 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="scanner-portal w-20 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-2xl"
      >
        {SCANNER_LOOKBACK_OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => onLookbackMultiplierChange(option.value)}
            className={cn(
              "flex h-8 cursor-pointer items-center rounded-md px-2 text-sm font-medium text-muted-foreground focus:bg-muted focus:text-foreground",
              option.value === lookbackMultiplier &&
                "bg-primary text-primary-foreground focus:bg-primary focus:text-primary-foreground"
            )}
          >
            <span>{option.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function TopToolbar({
  stock,
  chartType,
  timeframe,
  lookbackMultiplier,
  exchange,
  onChartTypeChange,
  onTimeframeChange,
  onLookbackMultiplierChange,
  onExchangeChange,
  onSelectStock,
}: TopToolbarProps) {
  return (
    <div className="flex shrink-0 flex-col gap-1 overflow-hidden border-b border-border bg-background px-1 py-1 sm:min-h-10 sm:flex-row sm:items-center sm:gap-2 sm:px-2">
      <div className="flex min-h-10 items-center gap-1 sm:hidden">
        <div className="min-w-0 flex-1">
          <StockSearchCombobox
            selectedStock={stock}
            exchange={exchange}
            onSelectStock={onSelectStock}
          />
        </div>
        <MarketSelector
          compact
          portalClassName="scanner-portal"
          triggerClassName={SCANNER_GHOST_TRIGGER_CLASS}
          onExchangeChange={onExchangeChange}
        />
        <ScannerPriceAlertMenu key={`${stock.exchange}:${stock.symbol}`} stock={stock} />
        <ScannerAccountMenu />
      </div>

      <div className="flex min-h-9 items-center gap-1 sm:hidden">
        <TimeframeSelector value={timeframe} onChange={onTimeframeChange} />
        <LookbackDropdown
          lookbackMultiplier={lookbackMultiplier}
          onLookbackMultiplierChange={onLookbackMultiplierChange}
          className="h-9"
        />
        <ThemeToggle
          className={SCANNER_GHOST_TRIGGER_CLASS}
          tooltipPortalClassName="scanner-portal"
        />
      </div>

      <div className="hidden items-center gap-1.5 sm:flex">
        <ChartTypeSelector value={chartType} onChange={onChartTypeChange} />
        <TimeframeSelector value={timeframe} onChange={onTimeframeChange} />
        <Separator orientation="vertical" className="mx-1 h-5 bg-border/50" />
        <LookbackDropdown
          lookbackMultiplier={lookbackMultiplier}
          onLookbackMultiplierChange={onLookbackMultiplierChange}
        />
      </div>

      <div className="hidden min-w-0 flex-1 items-center justify-end gap-1.5 sm:flex">
        <div className="flex items-center gap-1.5">
          <ChartSnapshotMenu stock={stock} />
          <ShareMenu stock={stock} />
        </div>

        <Separator orientation="vertical" className="mx-0.5 h-5 bg-border/50" />

        <div className="flex items-center gap-1.5">
          <MarketSelector
            compact
            portalClassName="scanner-portal"
            triggerClassName={SCANNER_GHOST_TRIGGER_CLASS}
            onExchangeChange={onExchangeChange}
          />
          <ScannerPriceAlertMenu key={`${stock.exchange}:${stock.symbol}`} stock={stock} />
          <ThemeToggle
            className={SCANNER_GHOST_TRIGGER_CLASS}
            tooltipPortalClassName="scanner-portal"
          />
        </div>

        <Separator orientation="vertical" className="mx-0.5 h-5 bg-border/50" />

        <div className="flex min-w-0 items-center gap-1.5">
          <StockSearchCombobox
            selectedStock={stock}
            exchange={exchange}
            onSelectStock={onSelectStock}
          />
          <ScannerAccountMenu />
        </div>
      </div>
    </div>
  );
}
