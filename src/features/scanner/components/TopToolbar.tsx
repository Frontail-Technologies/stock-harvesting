"use client";

import { useState } from "react";
import type { Stock } from "@/types/market";
import { ChevronDown, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCurrency } from "@/features/currency";
import { GlobalSearchMobileSheet } from "@/features/global-search/components/GlobalSearchMobileSheet";
import { GlobalSearchNavbarField } from "@/features/global-search/components/GlobalSearchNavbarField";
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
import { ScannerIconButton } from "./ScannerIconButton";
import { ScannerWatchlistToggle } from "./ScannerWatchlistToggle";
import { ShareMenu } from "./ShareMenu";
import { TimeframeSelector } from "./TimeframeSelector";

const SCANNER_GHOST_TRIGGER_CLASS =
  "border-transparent bg-transparent hover:bg-muted hover:border-transparent";

type TopToolbarProps = {
  stock: Stock;
  chartType: ScannerChartType;
  timeframe: Timeframe;
  lookbackMultiplier: ScannerLookbackMultiplier;
  onChartTypeChange: (chartType: ScannerChartType) => void;
  onTimeframeChange: (timeframe: Timeframe) => void;
  onLookbackMultiplierChange: (value: ScannerLookbackMultiplier) => void;
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
          className,
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
                "bg-primary text-primary-foreground focus:bg-primary focus:text-primary-foreground",
            )}
          >
            <span>{option.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Mobile stock-identity strip (item 8) - a compact, non-floating row ABOVE
// the plot, not a card and not overlaid on the candles. Two lines, left-
// aligned, matching the target composition exactly:
//   TCS · BSE
//   ₹2,252.00   -0.84%
// Renders nothing when no stock is open (the empty state already explains
// itself) or while a stock's identity is still a bare URL placeholder
// (hasMarketData false, close 0) - a real "0.00 / 0.00%" row would read as
// a loaded-but-wrong price rather than "not loaded yet".
function MobileStockStrip({ stock }: { stock: Stock }) {
  const { formatStockCurrency } = useCurrency();
  if (!stock.symbol || !stock.hasMarketData) return null;

  const isPositive = (stock.changePct ?? 0) >= 0;

  return (
    <div className="flex flex-col gap-0.5 px-1.5 py-1 sm:hidden">
      <span className="text-xs font-semibold text-foreground">
        {stock.symbol} <span className="font-normal text-muted-foreground">· {stock.exchange}</span>
      </span>
      <span className="flex items-center gap-2 text-xs tabular-nums">
        <span className="font-semibold text-foreground">{formatStockCurrency(stock.close, stock.exchange)}</span>
        {stock.changePct !== null && (
          <span className={isPositive ? "text-success" : "text-danger"}>
            {isPositive ? "+" : ""}
            {stock.changePct.toFixed(2)}%
          </span>
        )}
      </span>
    </div>
  );
}

export function TopToolbar({
  stock,
  chartType,
  timeframe,
  lookbackMultiplier,
  onChartTypeChange,
  onTimeframeChange,
  onLookbackMultiplierChange,
}: TopToolbarProps) {
  // Snapshot/share/price-alerts all act on a specific chart/stock - with
  // none open (stock.symbol is empty, the same placeholder convention
  // ScannerPage uses for its own no-stock state) there's nothing for them
  // to operate on, so they're disabled rather than left clickable against
  // stale or empty data. Search and every other control here stays live.
  const hasStock = Boolean(stock.symbol);
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <div className="flex shrink-0 flex-col overflow-hidden rounded-[3px] border-b border-border/60 bg-background sm:min-h-10 sm:flex-row sm:items-center sm:gap-2 sm:px-2 sm:py-1">
      {/* Mobile pass (item 7) - ONE compact ~44px row: search, watchlist,
          alerts, account. Chart-type/snapshot/share stayed on the
          collapsed drawing-tools trigger's own sheet (see ChartToolsBar) -
          they're chart-editing actions, not top-chrome ones, so moving
          them there (rather than duplicating them into a second "More"
          here) keeps this row to exactly the 4 high-value controls item 7
          asks for. */}
      <div className="flex h-11 items-center gap-1 px-1 sm:hidden">
        <GlobalSearchMobileSheet />
        <div className="min-w-0 flex-1" aria-hidden />
        <ScannerWatchlistToggle />
        <ScannerPriceAlertMenu
          key={`${stock.exchange}:${stock.symbol}`}
          stock={stock}
          disabled={!hasStock}
        />
        <ScannerAccountMenu />
      </div>

      {/* Item 8 - compact stock identity, its own row, never overlapping
          the chart. */}
      <MobileStockStrip stock={stock} />

      {/* Item 9 - 1D/1W/1M stay one tap away; everything else (lookback
          window, theme) collapses into "More" instead of a second
          permanently-visible row. */}
      <div className="flex h-10 items-center gap-1 border-t border-border/40 px-1 sm:hidden">
        <TimeframeSelector value={timeframe} onChange={onTimeframeChange} />
        <div className="min-w-0 flex-1" aria-hidden />
        <ScannerIconButton
          label="More chart options"
          icon={MoreHorizontal}
          active={moreOpen}
          onClick={() => setMoreOpen(true)}
        />
      </div>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent
          side="bottom"
          className="scanner-portal gap-3 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 sm:hidden"
        >
          <SheetHeader>
            <SheetTitle>Chart options</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-foreground">Lookback window</span>
              <LookbackDropdown
                lookbackMultiplier={lookbackMultiplier}
                onLookbackMultiplierChange={onLookbackMultiplierChange}
                className="h-9 border border-border bg-muted/40"
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-foreground">Theme</span>
              <ThemeToggle tooltipPortalClassName="scanner-portal" />
            </div>
          </div>
        </SheetContent>
      </Sheet>

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
          <ChartSnapshotMenu stock={stock} disabled={!hasStock} />
          <ShareMenu stock={stock} disabled={!hasStock} />
        </div>

        <Separator orientation="vertical" className="mx-0.5 h-5 bg-border/50" />

        <div className="flex items-center gap-1.5">
          <ScannerWatchlistToggle />
          <ScannerPriceAlertMenu
            key={`${stock.exchange}:${stock.symbol}`}
            stock={stock}
            disabled={!hasStock}
          />
          <ThemeToggle
            className={SCANNER_GHOST_TRIGGER_CLASS}
            tooltipPortalClassName="scanner-portal"
          />
        </div>

        <Separator orientation="vertical" className="mx-0.5 h-5 bg-border/50" />

        <div className="flex min-w-0 items-center gap-1.5">
          <div className="w-56 lg:w-72">
            <GlobalSearchNavbarField />
          </div>
          <ScannerAccountMenu />
        </div>
      </div>
    </div>
  );
}
