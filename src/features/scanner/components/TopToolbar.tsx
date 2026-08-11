"use client";

import type { Stock } from "@/types/market";
import { Camera, ChevronDown } from "lucide-react";
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
} from "../types";
import { ChartTypeSelector } from "./ChartTypeSelector";
import { ScannerAccountMenu } from "./ScannerAccountMenu";
import { ShareMenu } from "./ShareMenu";
import { StockSearchCombobox } from "./StockSearchCombobox";

type TopToolbarProps = {
  stock: Stock;
  chartType: ScannerChartType;
  lookbackMultiplier: ScannerLookbackMultiplier;
  exchange: MarketExchangeCode;
  onChartTypeChange: (chartType: ScannerChartType) => void;
  onLookbackMultiplierChange: (value: ScannerLookbackMultiplier) => void;
  onExchangeChange: (exchange: MarketExchangeCode) => void;
  onSelectStock: (stock: Stock) => void;
  onScreenshot: () => void;
  onSend: () => void;
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
          "inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-background px-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted",
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
  lookbackMultiplier,
  exchange,
  onChartTypeChange,
  onLookbackMultiplierChange,
  onExchangeChange,
  onSelectStock,
  onScreenshot,
  onSend,
}: TopToolbarProps) {
  return (
    <div className="flex min-h-9 shrink-0 items-center gap-1 overflow-hidden border-b border-border bg-background px-1 py-0.5 sm:min-h-10 sm:gap-2 sm:px-2 sm:py-1">
      {/* Mobile: search input, left-anchored, grows to fill available width.
          Chart type moved to ChartToolsBar (side rail) on mobile, so this
          takes its place as the leading element. */}
      <div className="min-w-0 flex-1 sm:hidden">
        <StockSearchCombobox
          selectedStock={stock}
          exchange={exchange}
          onSelectStock={onSelectStock}
        />
      </div>

      {/* Desktop-only left cluster: chart type, lookback. */}
      <div className="hidden items-center gap-1.5 sm:flex">
        <ChartTypeSelector value={chartType} onChange={onChartTypeChange} />
        <Separator orientation="vertical" className="mx-1 h-5" />
        <LookbackDropdown
          lookbackMultiplier={lookbackMultiplier}
          onLookbackMultiplierChange={onLookbackMultiplierChange}
        />
      </div>

      {/* Mobile-only compact right cluster. */}
      <div className="flex shrink-0 items-center gap-1 sm:hidden">
        <LookbackDropdown
          lookbackMultiplier={lookbackMultiplier}
          onLookbackMultiplierChange={onLookbackMultiplierChange}
        />
        <MarketSelector compact onExchangeChange={onExchangeChange} />
        <ThemeToggle />
        <ScannerAccountMenu />
      </div>

      {/* Desktop-only right cluster: grouped into actions / market+theme /
          search+account, separated by thin dividers so the bar reads as
          logical terminal groups rather than one flat row of controls. */}
      <div className="hidden min-w-0 flex-1 items-center justify-end gap-1.5 sm:flex">
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Screenshot"
            title="Screenshot"
            onClick={onScreenshot}
          >
            <Camera className="size-4" />
          </Button>
          <ShareMenu stock={stock} onNativeShare={onSend} onDownload={onScreenshot} />
        </div>

        <Separator orientation="vertical" className="mx-0.5 h-5" />

        <div className="flex items-center gap-1.5">
          <MarketSelector compact onExchangeChange={onExchangeChange} />
          <ThemeToggle />
        </div>

        <Separator orientation="vertical" className="mx-0.5 h-5" />

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
