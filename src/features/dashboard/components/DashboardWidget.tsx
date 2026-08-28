import { useCallback, useRef, useState } from "react";
import { Info, Maximize2, Minimize2 } from "lucide-react";
import { useCurrency } from "@/features/currency";
import type { DashboardCardData } from "@/types/dashboard";
import { cn } from "@/utils/cn";

// Panel-resize interaction refinement pass - both optional so every other
// caller (and any test/mock) that renders a plain, non-resizable
// DashboardWidget keeps working unchanged; only DashboardWidgetRow passes
// these.
export type DashboardWidgetPanelMode = "normal" | "minimized" | "maximized";

// The colored bar never grows past this fraction of its own lane - keeps
// relative proportions between rows exactly faithful (the same cap is
// applied uniformly via `scaleMax` below, so it never distorts magnitude),
// while leaving enough card width for genuinely long bars not to butt
// straight into the card's own edge.
const MAX_BAR_PCT = 88;
const MIN_BAR_PCT = 2;

// Dynamic row-height pass - VERTICAL sizing only, entirely independent of
// the horizontal MAX_BAR_PCT/MIN_BAR_PCT magnitude scaling above (item 6/7
// - the shared zero-baseline score axis is untouched by any of this).
//
// DEFAULT_PLOT_HEIGHT_PX is the pre-measurement fallback (first paint,
// before the ResizeObserver below reports a real number) - deliberately
// the same 416px `max-h-104` already used everywhere today, so an
// unfiltered/many-row card (which will actually measure out to ~this
// value anyway, see the className below) looks identical to before this
// pass. MIN_ROW_HEIGHT_PX/MIN_BAR_HEIGHT_PX are exactly today's old fixed
// h-7/h-5 values - the "many rows" floor this pass must never squash
// below (item 8), so a large list's proportions stay byte-for-byte what
// they were before dynamic sizing existed.
const DEFAULT_PLOT_HEIGHT_PX = 416;
const MIN_ROW_HEIGHT_PX = 28;
const MIN_BAR_HEIGHT_PX = 20;
// The small vertical inset a row's colored bar leaves within its own slot
// (item 4: "barHeight ~= rowSlotHeight - gap") - a FIXED px amount, not a
// fraction, so it reproduces today's exact 8px gap when rows are at their
// minimum height, but becomes proportionally smaller (the bar fills
// almost the whole slot) once rows grow tall from a small filtered result
// set - never hardcoding the resulting bar size itself.
const ROW_VERTICAL_GAP_PX = 8;

function formatValue(value: number): string {
  const sign = value >= 0 ? "+" : "-";
  return `${sign}${Math.abs(value).toFixed(2)}`;
}

// One row's bar + label. The colored FILL and the LABEL are two separate
// layers sharing the same box, not one element:
//  - the fill is sized to `barPct` only - pure magnitude, never touched by
//    how long the label is.
//  - the label spans the FULL LANE (its own `inset-0`, not the fill's
//    narrower width), anchored at the same edge the fill grows from (the
//    zero line) and reading in the same direction the fill grows.
// The effect: a label shorter than the fill renders on top of the color,
// centered; a label longer than the fill keeps rendering in full, simply
// continuing past the color onto the plain card background, right up
// until it would exceed the LANE's own width - only then does the row's
// own `overflow-hidden` + `truncate` ellipsize it. The card's own
// scroll container (`overflow-x-hidden`, below) is a second, redundant
// safety net so text can never physically reach the card edge either way.
function BarWithLabel({
  barPct,
  barHeight,
  color,
  label,
  anchorEnd,
  selected,
}: {
  barPct: number;
  // Dynamic row-height pass - the ONLY thing that changes when the visible
  // row count changes (item 4). `barPct` (horizontal) is computed
  // completely separately, from `scaleMax`, and is never touched here.
  barHeight: number;
  color: string;
  label: string;
  anchorEnd: boolean;
  // Cross-filter pass (item 12) - "slightly stronger outline" on the bar
  // itself, undefined/false for every non-cross-filter card (Index/Weekly
  // Strong), which look byte-for-byte unchanged.
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
        {/* Label typography is a FIXED size regardless of barHeight (item
            5) - only the colored geometry around it grows. */}
        <span className="truncate px-1 text-[0.6875rem] font-medium text-foreground">{label}</span>
      </div>
    </div>
  );
}

// One of the 4 strength widgets - a genuine diverging horizontal bar chart
// sharing ONE zero baseline down the middle of the plot area. Every row's
// bar length is scaled against the SAME card-wide magnitude (max(|min|,
// |max|) across all items, computed once as `scaleMax` below), so a score
// of 4 and a score of 40 are never visually indistinguishable - the label
// behavior above never touches this.
export function DashboardWidget({
  card,
  mode = "normal",
  onToggleMinimize,
  onToggleMaximize,
}: {
  card: DashboardCardData;
  mode?: DashboardWidgetPanelMode;
  onToggleMinimize?: () => void;
  onToggleMaximize?: () => void;
}) {
  const { formatStockCurrency } = useCurrency();
  const scaleMax = Math.max(...card.items.map((item) => Math.abs(item.value)), 1);
  const crossFilter = card.crossFilter;

  // Dynamic row-height pass (item 1/11) - measures the rows list's own
  // rendered height via ResizeObserver, the same callback-ref pattern
  // already established for the Backtest chart's plot area and the
  // resizable panel row (DashboardWidgetRow) - "reusing existing widget
  // measurement" per item 11, rather than inventing a new mechanism.
  //
  // That container keeps its EXISTING `max-h-104` cap (see the className
  // below) and gains `flex-1 min-h-0`, so its resolved height is still
  // capped at exactly the same 416px ceiling as before (an unfiltered/
  // many-row card - typically Index - looks byte-for-byte unchanged, and
  // continues to be what anchors the resizable panel row's shared
  // stretched height per DashboardWidgetRow's `items-stretch`), but a
  // FILTERED card now also STRETCHES UP to that same shared height
  // instead of shrinking to its own sparse content - which is the actual
  // fix: real, measured available height, not a guess, and never a fixed
  // viewport-relative number (item 11).
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

  // The actual fix (item 1/2): distribute the measured available height
  // across however many rows are CURRENTLY visible (post cross-filter),
  // floored at MIN_ROW_HEIGHT_PX. Few rows -> a large slot each, filling
  // the available height (item 1's "large bars filling most of the chart
  // height"); many rows -> floors at the old minimum and the container's
  // own `overflow-y-auto` (unchanged) takes over, exactly like before
  // (item 8) - never a hardcoded "if count < N" special case, purely this
  // one division.
  const visibleRowCount = card.items.length;
  const rowSlotHeight =
    visibleRowCount > 0 ? Math.max(plotHeight / visibleRowCount, MIN_ROW_HEIGHT_PX) : MIN_ROW_HEIGHT_PX;
  const barHeight = Math.max(rowSlotHeight - ROW_VERTICAL_GAP_PX, MIN_BAR_HEIGHT_PX);

  return (
    <div className="flex h-full min-w-0 flex-col rounded-xl border border-border bg-card px-4 py-3.5 text-card-foreground">
      <div className="flex items-center justify-between gap-2">
        <h3 className="truncate text-sm font-semibold text-foreground">{card.title}</h3>
        <div className="flex shrink-0 items-center gap-0.5">
          {onToggleMaximize && (
            <button
              type="button"
              onClick={onToggleMaximize}
              aria-pressed={mode === "maximized"}
              title={mode === "maximized" ? "Restore panel" : "Maximize panel"}
              className={cn(
                "rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                mode === "maximized" && "bg-muted text-foreground"
              )}
            >
              <Maximize2 className="size-3.5" />
            </button>
          )}
          {onToggleMinimize && (
            <button
              type="button"
              onClick={onToggleMinimize}
              aria-pressed={mode === "minimized"}
              title={mode === "minimized" ? "Restore panel" : "Minimize panel"}
              className={cn(
                "rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                mode === "minimized" && "bg-muted text-foreground"
              )}
            >
              <Minimize2 className="size-3.5" />
            </button>
          )}
          <Info className="size-3.5 shrink-0 text-muted-foreground" />
        </div>
      </div>
      <p className="mt-1 text-[0.6875rem] text-muted-foreground">{card.timestamp}</p>

      <div ref={rowsContainerRef} className="mt-3 flex max-h-104 min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto">
        {card.items.length === 0 ? (
          <div className="py-3 text-[0.6875rem] text-muted-foreground">
            No additional movers to show right now
          </div>
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

          // Cross-filter row state (item 12) - undefined for every card
          // without `crossFilter` (Index/Weekly Strong), so their rows
          // stay exactly as before: no click, no tooltip override, no
          // muting. `isSelected` implies this row's OWN bar gets the ring;
          // `isMuted` is the OTHER rows once something is selected -
          // "lightly muted", not hidden (item 12's "can remain visible").
          const isSelected = crossFilter?.selectedLabel === item.label;
          const isMuted = Boolean(crossFilter?.selectedLabel) && !isSelected;
          const rowTooltip = crossFilter
            ? `${item.label}\n${isSelected ? "Selected · Click to clear" : "Click to filter"}`
            : item.label;

          return (
            <div
              key={item.rank}
              title={rowTooltip}
              onClick={crossFilter ? () => crossFilter.onSelectLabel(item.label) : undefined}
              onKeyDown={
                crossFilter
                  ? (event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        crossFilter.onSelectLabel(item.label);
                      }
                    }
                  : undefined
              }
              role={crossFilter ? "button" : undefined}
              tabIndex={crossFilter ? 0 : undefined}
              aria-pressed={crossFilter ? isSelected : undefined}
              style={{ height: rowSlotHeight }}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-sm outline-none transition-all",
                crossFilter && "cursor-pointer focus-visible:ring-2 focus-visible:ring-ring/50",
                isMuted && "opacity-45"
              )}
            >
              <span
                className={cn("w-14 shrink-0 text-right text-xs font-semibold tabular-nums", valueClass)}
              >
                {displayValue}
              </span>

              <div className="flex min-w-0 flex-1 items-stretch" style={{ height: barHeight }}>
                {/* Negative lane - bars anchor at the shared zero line and
                    grow leftward, away from it; the label anchors there
                    too and reads leftward, so it "extends outside the
                    fill" toward the number column when the bar is short. */}
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

                {/* Positive lane - bars start at the shared zero line and
                    grow rightward; the label anchors there too, so a
                    short bar's label spills rightward past the fill,
                    away from zero. */}
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
