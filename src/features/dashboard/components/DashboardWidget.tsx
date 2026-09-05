"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";
import { Info, Maximize2 } from "lucide-react";
import { useCurrency } from "@/features/currency";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { DashboardCardData } from "@/types/dashboard";
import { cn } from "@/utils/cn";

const MAX_BAR_PCT = 88;
const MIN_BAR_PCT = 2;

const DEFAULT_PLOT_HEIGHT_PX = 416;
const MIN_ROW_HEIGHT_PX = 28;
const MIN_BAR_HEIGHT_PX = 20;

const ROW_VERTICAL_GAP_PX = 8;

function formatValue(value: number): string {
  const sign = value >= 0 ? "+" : "-";
  return `${sign}${Math.abs(value).toFixed(2)}`;
}

function BarWithLabel({
  barPct,
  barHeight,
  color,
  label,
  anchorEnd,
  selected,
}: {
  barPct: number;
  barHeight: number;
  color: string;
  label: string;
  anchorEnd: boolean;

  selected?: boolean;
}) {
  return (
    <div className="relative w-full" style={{ height: barHeight }}>
      <div
        className={cn(
          "absolute inset-y-0 rounded-sm transition-shadow",
          anchorEnd ? "right-0" : "left-0",
          selected && "ring-2 ring-foreground/70 ring-offset-1 ring-offset-card"
        )}
        style={{ width: `${barPct}%`, backgroundColor: color }}
        aria-hidden
      />
      <div
        className={cn(
          "absolute inset-0 flex items-center overflow-hidden",
          anchorEnd ? "justify-end" : "justify-start"
        )}
      >

        <span className="truncate px-1 text-[0.6875rem] font-medium text-foreground">{label}</span>
      </div>
    </div>
  );
}

export function DashboardWidget({
  card,
  expanded = false,
  onExpand,
  headerActions,
  emptyState,
}: {
  card: DashboardCardData;
  expanded?: boolean;
  onExpand?: () => void;
  // Optional extra header controls rendered alongside the existing
  // expand/info icons - Dashboard itself never passes this, so its own
  // rendering is unchanged; other features (e.g. Widget) reusing this same
  // presentation for their own ranked-stock cards use it for actions this
  // component has no built-in concept of (reorder, remove, etc.).
  headerActions?: ReactNode;
  // Optional replacement for the built-in "No additional movers to show
  // right now" message - Dashboard never passes this either, so its own
  // empty copy is unchanged; Widget uses it for a Segment/Watchlist-
  // specific empty message (and, for an empty Watchlist, an action link).
  emptyState?: ReactNode;
}) {
  const { formatStockCurrency } = useCurrency();
  const scaleMax = Math.max(...card.items.map((item) => Math.abs(item.value)), 1);
  const crossFilter = card.crossFilter;
  const onItemClick = card.onItemClick;

  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const [plotHeight, setPlotHeight] = useState(DEFAULT_PLOT_HEIGHT_PX);
  const rowsContainerRef = useCallback((node: HTMLDivElement | null) => {
    resizeObserverRef.current?.disconnect();
    resizeObserverRef.current = null;
    if (!node || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver((entries) => {
      const height = entries[0]?.contentRect.height;
      if (height) setPlotHeight(height);
    });
    observer.observe(node);
    resizeObserverRef.current = observer;
  }, []);

  const visibleRowCount = card.items.length;
  const rowSlotHeight =
    visibleRowCount > 0 ? Math.max(plotHeight / visibleRowCount, MIN_ROW_HEIGHT_PX) : MIN_ROW_HEIGHT_PX;
  const barHeight = Math.max(rowSlotHeight - ROW_VERTICAL_GAP_PX, MIN_BAR_HEIGHT_PX);

  return (
    <div className="flex h-full min-w-0 flex-col rounded-xl border border-border bg-card px-4 py-3.5 text-card-foreground">
      <div className="flex items-center justify-between gap-2">
        <h3 className="truncate text-sm font-semibold text-foreground">{card.title}</h3>
        <div className="flex shrink-0 items-center gap-1">
          {onExpand && !expanded && (
            <Tooltip>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    onClick={onExpand}
                    className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  />
                }
              >
                <Maximize2 className="size-3.5" />
              </TooltipTrigger>
              <TooltipContent side="bottom">Open full view</TooltipContent>
            </Tooltip>
          )}
          {headerActions}
          <Info className="size-3.5 shrink-0 text-muted-foreground" />
        </div>
      </div>
      <p className="mt-1 text-[0.6875rem] text-muted-foreground">{card.timestamp}</p>

      <div
        ref={rowsContainerRef}
        className={cn(
          "mt-3 flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto",
          !expanded && "max-h-104"
        )}
      >
        {card.items.length === 0 ? (
          emptyState ?? (
            <div className="py-3 text-[0.6875rem] text-muted-foreground">
              No additional movers to show right now
            </div>
          )
        ) : null}
        {card.items.map((item) => {
          const isPositive = item.value >= 0;
          const barPct =
            item.value === 0 ? 0 : Math.max((Math.abs(item.value) / scaleMax) * MAX_BAR_PCT, MIN_BAR_PCT);
          const valueClass = isPositive ? "text-success" : "text-danger";
          const displayValue =
            item.metric === "price"
              ? formatStockCurrency(item.value, item.exchange)
              : formatValue(item.value);

          const isSelected = crossFilter?.selectedLabel === item.label;
          const isMuted = Boolean(crossFilter?.selectedLabel) && !isSelected;
          const isClickable = Boolean(crossFilter) || Boolean(onItemClick);
          const activateRow = () => {
            if (crossFilter) crossFilter.onSelectLabel(item.label);
            else onItemClick?.(item);
          };
          const rowTooltip = crossFilter
            ? `${item.label}\n${isSelected ? "Selected · Click to clear" : "Click to filter"}`
            : onItemClick
              ? `${item.label}\nOpen in Charts`
              : item.label;

          return (
            <div
              key={item.rank}
              title={rowTooltip}
              onClick={isClickable ? activateRow : undefined}
              onKeyDown={
                isClickable
                  ? (event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        activateRow();
                      }
                    }
                  : undefined
              }
              role={isClickable ? "button" : undefined}
              tabIndex={isClickable ? 0 : undefined}
              aria-pressed={crossFilter ? isSelected : undefined}
              style={{ height: rowSlotHeight }}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-sm outline-none transition-all",
                isClickable && "cursor-pointer focus-visible:ring-2 focus-visible:ring-ring/50",
                onItemClick && "hover:bg-muted/60",
                isMuted && "opacity-45"
              )}
            >
              <span
                className={cn("w-14 shrink-0 text-right text-xs font-semibold tabular-nums", valueClass)}
              >
                {displayValue}
              </span>

              <div className="flex min-w-0 flex-1 items-stretch" style={{ height: barHeight }}>

                <div className="relative min-w-0 flex-1">
                  {!isPositive && (
                    <BarWithLabel
                      barPct={barPct}
                      barHeight={barHeight}
                      color={item.color}
                      label={item.label}
                      anchorEnd
                      selected={isSelected}
                    />
                  )}
                </div>

                <div className="w-px shrink-0 bg-border" aria-hidden />

                <div className="relative min-w-0 flex-1">
                  {isPositive && (
                    <BarWithLabel
                      barPct={barPct}
                      barHeight={barHeight}
                      color={item.color}
                      label={item.label}
                      anchorEnd={false}
                      selected={isSelected}
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
