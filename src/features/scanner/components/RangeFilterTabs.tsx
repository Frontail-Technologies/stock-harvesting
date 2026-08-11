"use client";

import { useMemo, useState } from "react";
import { BarChart3, Eye, EyeOff, Gauge, Maximize2, SlidersHorizontal } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/utils/cn";
import type { ScannerBacktestStats } from "../api/scanner-api.types";
import type { AvailableHistoryRange } from "../lib/historical-range";
import { getVisibleHistoricalRangeFilters } from "../lib/historical-range";
import type { ScannerRangeFilter } from "../types";
import { ChartScaleControls } from "./ChartScaleControls";
import { ScannerBacktestStatsContent } from "./ScannerBacktestStatsOverlay";

type RangeFilterTabsProps = {
  value: ScannerRangeFilter;
  availableRange: AvailableHistoryRange | null;
  availableRangeLoading: boolean;
  backtestStats: ScannerBacktestStats | null;
  onChange: (value: ScannerRangeFilter) => void;
  autoScale: boolean;
  percentageScale: boolean;
  showBacktestStats: boolean;
  scannerHighlightsVisible: boolean;
  onToggleAutoScale: () => void;
  onTogglePercentageScale: () => void;
  onToggleBacktestStats: () => void;
  onToggleScannerHighlights: () => void;
};

type MobileSheetId = "range" | "stats" | "display" | null;

function formatRangeDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00Z`));
}

function MobileBarButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active?: boolean;
  icon: typeof Maximize2;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-9 min-w-14 cursor-pointer items-center justify-center gap-1 rounded-md px-2.5 text-[0.75rem] font-semibold transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <Icon className="size-3.5" />
      <span>{label}</span>
    </button>
  );
}

export function RangeFilterTabs({
  value,
  availableRange,
  availableRangeLoading,
  backtestStats,
  onChange,
  autoScale,
  percentageScale,
  showBacktestStats,
  scannerHighlightsVisible,
  onToggleAutoScale,
  onTogglePercentageScale,
  onToggleBacktestStats,
  onToggleScannerHighlights,
}: RangeFilterTabsProps) {
  const [mobileSheet, setMobileSheet] = useState<MobileSheetId>(null);
  const visibleFilters = useMemo(
    () => getVisibleHistoricalRangeFilters(availableRange),
    [availableRange]
  );
  const showLoadingState = availableRangeLoading && !availableRange;
  const currentRangeLabel = value === "ALL" ? "MAX" : value;

  const handleRangeChange = (filter: ScannerRangeFilter) => {
    onChange(filter);
    setMobileSheet(null);
  };

  return (
    <>
      <div className="hidden h-9 shrink-0 border-t border-border bg-background sm:block">
        <div className="flex items-center justify-between gap-3 px-2 py-1.5">
          <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
            {showLoadingState ? (
              <span className="h-6 shrink-0 rounded-sm bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                Loading ranges...
              </span>
            ) : (
              visibleFilters.map((filter) => {
                const active = value === filter;

                return (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => onChange(filter)}
                    className={cn(
                      "h-6 shrink-0 cursor-pointer rounded-sm px-2 text-xs font-medium transition-colors",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    {filter === "ALL" ? "MAX" : filter}
                  </button>
                );
              })
            )}
          </div>

          <ChartScaleControls
            autoScale={autoScale}
            percentageScale={percentageScale}
            showBacktestStats={showBacktestStats}
            scannerHighlightsVisible={scannerHighlightsVisible}
            onToggleAutoScale={onToggleAutoScale}
            onTogglePercentageScale={onTogglePercentageScale}
            onToggleBacktestStats={onToggleBacktestStats}
            onToggleScannerHighlights={onToggleScannerHighlights}
          />
        </div>
        <div className="h-0.5 bg-primary/40" />
      </div>

      <div className="shrink-0 border-t border-border bg-background px-2 pt-1 pb-[calc(0.25rem+env(safe-area-inset-bottom))] sm:hidden">
        <div className="flex items-center justify-between gap-1 overflow-x-auto">
          <MobileBarButton
            icon={Maximize2}
            label={currentRangeLabel}
            active={mobileSheet === "range"}
            onClick={() => setMobileSheet("range")}
          />
          <MobileBarButton
            icon={Gauge}
            label="Auto"
            active={autoScale}
            onClick={onToggleAutoScale}
          />
          <MobileBarButton
            icon={BarChart3}
            label="Stats"
            active={mobileSheet === "stats"}
            onClick={() => setMobileSheet("stats")}
          />
          <MobileBarButton
            icon={SlidersHorizontal}
            label="Display"
            active={mobileSheet === "display"}
            onClick={() => setMobileSheet("display")}
          />
        </div>
      </div>

      <Sheet open={mobileSheet !== null} onOpenChange={(open) => !open && setMobileSheet(null)}>
        <SheetContent
          side="bottom"
          className="scanner-portal gap-3 overflow-y-auto px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 sm:hidden"
        >
          {mobileSheet === "range" && (
            <>
              <SheetHeader>
                <SheetTitle>Historical Range</SheetTitle>
                <p className="text-xs text-muted-foreground">
                  {availableRange
                    ? `${formatRangeDate(availableRange.from)} - ${formatRangeDate(availableRange.to)}`
                    : "Loading available data..."}
                </p>
              </SheetHeader>
              <div className="grid grid-cols-4 gap-2">
                {visibleFilters.map((filter) => {
                  const active = value === filter;

                  return (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => handleRangeChange(filter)}
                      className={cn(
                        "h-11 cursor-pointer rounded-md border border-border text-sm font-semibold transition-colors",
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "bg-muted/60 text-foreground hover:bg-muted",
                      )}
                    >
                      {filter === "ALL" ? "MAX" : filter}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {mobileSheet === "stats" && (
            <>
              <SheetHeader>
                <SheetTitle>Performance</SheetTitle>
              </SheetHeader>
              <ScannerBacktestStatsContent stats={backtestStats} className="gap-2 text-sm" />
            </>
          )}

          {mobileSheet === "display" && (
            <>
              <SheetHeader>
                <SheetTitle>Display</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={onToggleScannerHighlights}
                  className="flex h-11 cursor-pointer items-center justify-between rounded-md border border-border bg-muted/50 px-3 text-sm font-semibold text-foreground"
                >
                  <span>Scanner highlights</span>
                  {scannerHighlightsVisible ? <Eye className="size-4 text-primary" /> : <EyeOff className="size-4 text-muted-foreground" />}
                </button>
                <button
                  type="button"
                  onClick={onTogglePercentageScale}
                  className="flex h-11 cursor-pointer items-center justify-between rounded-md border border-border bg-muted/50 px-3 text-sm font-semibold text-foreground"
                >
                  <span>Percentage scale</span>
                  <span className={cn("text-xs", percentageScale ? "text-primary" : "text-muted-foreground")}>{percentageScale ? "On" : "Off"}</span>
                </button>
                <button
                  type="button"
                  onClick={onToggleBacktestStats}
                  className="flex h-11 cursor-pointer items-center justify-between rounded-md border border-border bg-muted/50 px-3 text-sm font-semibold text-foreground"
                >
                  <span>Desktop stats panel</span>
                  <span className={cn("text-xs", showBacktestStats ? "text-primary" : "text-muted-foreground")}>{showBacktestStats ? "On" : "Off"}</span>
                </button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

