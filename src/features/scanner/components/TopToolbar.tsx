"use client";

import type { Stock } from "@/types/market";
import { Camera, ChevronDown, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { MarketSelector, type MarketExchangeCode } from "@/features/market";
import { ThemeToggle } from "@/features/theme";
import { cn } from "@/utils/cn";
import {
  SCANNER_LOOKBACK_OPTIONS,
  type ScannerChartType,
  type ScannerLookbackMultiplier,
  type Timeframe,
} from "../types";
import { AiSummaryButton } from "./AiSummaryButton";
import { ChartTypeSelector } from "./ChartTypeSelector";
import { ScannerAccountMenu } from "./ScannerAccountMenu";
import { StockSearchCombobox } from "./StockSearchCombobox";

type TopToolbarProps = {
  stock: Stock;
  chartType: ScannerChartType;
  lookbackMultiplier: ScannerLookbackMultiplier;
  timeframe: Timeframe;
  exchange: MarketExchangeCode;
  onChartTypeChange: (chartType: ScannerChartType) => void;
  onLookbackMultiplierChange: (value: ScannerLookbackMultiplier) => void;
  onExchangeChange: (exchange: MarketExchangeCode) => void;
  onSelectStock: (stock: Stock) => void;
  onScreenshot: () => void;
  onSend: () => void;
};

export function TopToolbar({
  stock,
  chartType,
  lookbackMultiplier,
  timeframe,
  exchange,
  onChartTypeChange,
  onLookbackMultiplierChange,
  onExchangeChange,
  onSelectStock,
  onScreenshot,
  onSend,
}: TopToolbarProps) {
  return (
    <div className="flex min-h-10 shrink-0 items-center justify-between gap-1 overflow-hidden border-b border-border bg-background px-1 py-0.5 sm:min-h-11 sm:gap-2 sm:px-2 sm:py-1">
      <div className="flex min-w-max items-center gap-1 sm:gap-1.5">
        <ChartTypeSelector value={chartType} onChange={onChartTypeChange} />

        <Separator orientation="vertical" className="mx-1 hidden h-5 sm:block" />

        <AiSummaryButton stock={stock} timeframe={timeframe} className="hidden sm:inline-flex" />

        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-background px-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted">
            <span>{lookbackMultiplier}</span>
            <ChevronDown className="size-3 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="scanner-portal w-28 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-2xl"
          >
            {SCANNER_LOOKBACK_OPTIONS.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => onLookbackMultiplierChange(option.value)}
                className={cn(
                  "flex h-8 cursor-pointer items-center justify-between rounded-md px-2 text-sm font-medium text-muted-foreground focus:bg-muted focus:text-foreground",
                  option.value === lookbackMultiplier &&
                    "border border-primary/45 bg-primary text-primary-foreground focus:bg-primary focus:text-primary-foreground"
                )}
              >
                <span>{option.label}</span>
                <span className="text-xs opacity-70">{option.weeks}w</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex min-w-0 flex-1 items-center justify-end gap-1 sm:gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Screenshot"
          title="Screenshot"
          onClick={onScreenshot}
          className="hidden sm:inline-flex"
        >
          <Camera className="size-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Send"
          title="Send"
          onClick={onSend}
          className="hidden sm:inline-flex"
        >
          <Send className="size-4" />
        </Button>
        <MarketSelector compact onExchangeChange={onExchangeChange} />
        <ThemeToggle />
        <StockSearchCombobox
          selectedStock={stock}
          exchange={exchange}
          onSelectStock={onSelectStock}
        />
        <ScannerAccountMenu />
      </div>
    </div>
  );
}
