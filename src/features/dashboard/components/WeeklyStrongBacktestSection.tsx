"use client";

import {
  memo,
  useCallback,
  useId,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Info } from "lucide-react";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  useWeeklyStrongBacktestStacked,
  useWeeklyStrongBacktestWeekDetail,
  type WeeklyStrongBacktestStackedPoint,
} from "@/features/weekly-strong-backtest";
import { cn } from "@/utils/cn";
import { colorForDashboardLabel } from "../lib/dashboard-widget-colors";
import { computeNiceTicks } from "../lib/nice-ticks";

const CHART_HEIGHT_PX = 340;
const AXIS_WIDTH_PX = 34;
// Below this plot width we're on a phone-class viewport - fitting 250
// hairline-thin bars there would be unreadable, so the period is clamped
// to 1Y regardless of what's selected (see `isCompact` below).
const MOBILE_BREAKPOINT_PX = 480;
const MAGNIFIER_SIZE_PX = 108;
const MAGNIFIER_NEIGHBOR_RADIUS = 2; // hovered bar plus this many on each side
// Backtest interaction refinement pass - adaptive zoom bounds for the
// pointer-centered magnifier (see BacktestMagnifier below). Real bar width
// shrinks toward ~1-2px in "All" mode (250 weeks fit-to-width); the zoom
// level is chosen per-hover so a bar still resolves to roughly this many
// lens pixels, clamped so it never zooms out below 2x (pointless) or in
// past 30x (the +/-2-neighbor cluster would blow past the lens entirely).
const MAGNIFIER_TARGET_BAR_WIDTH_PX = 14;
const MAGNIFIER_MIN_ZOOM = 2;
const MAGNIFIER_MAX_ZOOM = 30;
const MAGNIFIER_GAP_FROM_POINTER_PX = 16;
// Dashboard interaction-refinement pass - the tooltip now anchors beside/
// above the magnifier itself rather than the hovered bar, so the two feel
// like one connected inspection UI (see computeMagnifierBox/BacktestTooltip
// below). Kept within the 8-12px range requested.
const TOOLTIP_MAGNIFIER_GAP_PX = 10;
// Only used to decide whether the tooltip has room to sit ABOVE the
// magnifier (an estimate, not a measurement - the actual "above" case
// still uses the height-agnostic translateY(-100%) trick below, so this
// only needs to be roughly right, not exact).
const TOOLTIP_APPROX_HEIGHT_PX = 60;

// Display-only zoom over the already-fetched series - never re-fetches or
// recomputes anything, just which trailing slice of `points` renders and
// how the fit-to-width bars are sized. Bounded by whatever the backend has
// actually generated (up to 250 weeks, ~4.8y) - "All" reflects that
// honestly instead of a false "5Y" label.
const PERIOD_OPTIONS = [
  { value: "1y", weeks: 52, label: "1Y" },
  { value: "3y", weeks: 156, label: "3Y" },
  { value: "all", weeks: Infinity, label: "All" },
] as const;
type PeriodValue = (typeof PERIOD_OPTIONS)[number]["value"];

// Stable reference for "nothing hidden" so the hiddenSectors useMemo below
// doesn't allocate a fresh empty Set on every render while no sector is
// solo'd.
const EMPTY_SECTOR_SET: ReadonlySet<string> = new Set();

type HoverState = {
  index: number;
  point: WeeklyStrongBacktestStackedPoint;
  // The exact stacked segment under the pointer, or null when hovering the
  // bar's empty headroom (above a shorter stack) - falls back to a
  // total-only tooltip in that case rather than guessing a sector.
  sector: string | null;
  x: number; // horizontal position within the plot area, shared by tooltip/guide-line/magnifier anchoring
  // Distance from the plot's own top edge down to the TOP of the hovered
  // bar's visible stack (0 = a bar reaching the chart's max, CHART_HEIGHT_PX
  // = an empty/zero bar) - this is what the magnifier anchors to, so it
  // appears right at the bar it's magnifying rather than a fixed spot.
  barTop: number;
  // Exact pointer position, local to the plot container (same coordinate
  // space as BarGeometry's own barX/segments[].y) - the magnifier's
  // actual focal reference (see BacktestMagnifier). Distinct from `x`
  // above, which is the hovered BAR's center and stays used for the
  // tooltip/guide-line anchoring - unchanged by this pass.
  pointerX: number;
  pointerY: number;
  clientX: number;
  clientY: number;
};

// One resolved stacked segment's pixel geometry within a bar, top-down
// coordinate space (y=0 is the plot's top edge, y=CHART_HEIGHT_PX its
// bottom) - matches SVG's native coordinate system directly.
type SegmentGeometry = {
  sector: string;
  color: string;
  y: number;
  height: number;
};

// Full pixel geometry for one week's bar - the ONE thing pointer-move
// handling and rendering both read from. Precomputed for every visible
// week in a single pass (see buildBarGeometry) whenever the data,
// dimensions, solo-filter, or period actually change; a pointer move
// never triggers this to be recomputed (Perf pass #1/#3 - see
// WeeklyStrongBacktestSection below).
type BarGeometry = {
  index: number;
  weekEnding: string;
  point: WeeklyStrongBacktestStackedPoint;
  slotX: number; // left edge of this week's full click/hover territory (no overlap with neighbors)
  slotWidth: number;
  barX: number; // left edge of the visible (narrower) bar rect
  barWidth: number;
  top: number; // y offset of the top of the visible stack
  height: number;
  visibleTotal: number;
  segments: SegmentGeometry[];
};

function formatWeekLabel(date: string) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
}

function formatWeekFull(date: string) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// Deterministic, stable across renders/weeks (see dashboard-widget-colors.ts) -
// a sector keeps the same color in every bar it appears in, and the same
// color the 4 strength widgets above would already use for it.
function sectorColor(sector: string) {
  return colorForDashboardLabel(sector);
}

// The persisted `point.total` is never rewritten by client-side sector
// toggles (Phase D.6 #4) - this is a SEPARATE, purely visual sum used only
// to size bars/axis when one or more sectors are hidden. When nothing is
// hidden it's numerically identical to point.total (sectors always sum to
// the real total), so this is a strict generalization, not a divergent
// code path.
function visibleTotalFor(point: WeeklyStrongBacktestStackedPoint, hiddenSectors: ReadonlySet<string>) {
  if (hiddenSectors.size === 0) return point.total;
  let sum = 0;
  for (const sector of point.sectors) {
    if (!hiddenSectors.has(sector.sector)) sum += sector.count;
  }
  return sum;
}

function visibleSectorsFor(point: WeeklyStrongBacktestStackedPoint, hiddenSectors: ReadonlySet<string>) {
  return point.sectors
    .filter((sector) => !hiddenSectors.has(sector.sector))
    .sort((a, b) => a.sector.localeCompare(b.sector));
}

type MagnifierBox = { left: number; top: number };

// The lens's own placement (item 4) - pulled out to a pure function, computed
// ONCE per hover in the parent, and handed to both BacktestMagnifier (to
// render itself there) and BacktestTooltip (to anchor beside/above it) -
// one source of truth, so the two can never disagree about where the lens
// actually is. Follows the real pointer, offset diagonally so the lens
// never covers the exact spot being inspected, flipping to whichever side/
// edge of the plot actually has room.
function computeMagnifierBox(pointerX: number, pointerY: number, plotWidth: number): MagnifierBox {
  const preferRight = pointerX + MAGNIFIER_GAP_FROM_POINTER_PX + MAGNIFIER_SIZE_PX <= plotWidth;
  const left = Math.min(
    Math.max(
      preferRight
        ? pointerX + MAGNIFIER_GAP_FROM_POINTER_PX
        : pointerX - MAGNIFIER_GAP_FROM_POINTER_PX - MAGNIFIER_SIZE_PX,
      0
    ),
    Math.max(plotWidth - MAGNIFIER_SIZE_PX, 0)
  );
  const preferAbove = pointerY - MAGNIFIER_GAP_FROM_POINTER_PX - MAGNIFIER_SIZE_PX >= 0;
  const top = Math.min(
    Math.max(
      preferAbove
        ? pointerY - MAGNIFIER_GAP_FROM_POINTER_PX - MAGNIFIER_SIZE_PX
        : pointerY + MAGNIFIER_GAP_FROM_POINTER_PX,
      0
    ),
    Math.max(CHART_HEIGHT_PX - MAGNIFIER_SIZE_PX, 0)
  );
  return { left, top };
}

// The ONE pass over "all 250 weeks" that Perf pass #1/#2/#3 requires to
// happen on data/dimension/filter change ONLY, never on a pointer move.
// Mirrors the old per-bar layout exactly (alphabetical stacking order,
// same height formula, same 1.5px minimum for a nonzero bar) so the chart
// looks pixel-identical to before - only where the geometry gets computed,
// and how often, has changed.
function buildBarGeometry(
  points: WeeklyStrongBacktestStackedPoint[],
  hiddenSectors: ReadonlySet<string>,
  niceMax: number,
  slotWidthPx: number,
  barWidthPx: number
): BarGeometry[] {
  return points.map((point, index) => {
    const sortedSectors = visibleSectorsFor(point, hiddenSectors);
    const visibleTotal = sortedSectors.reduce((sum, sector) => sum + sector.count, 0);
    const heightPx =
      niceMax === 0 ? 0 : Math.max((visibleTotal / niceMax) * CHART_HEIGHT_PX, visibleTotal > 0 ? 1.5 : 0);
    const slotX = index * slotWidthPx;

    const segments: SegmentGeometry[] = [];
    let cursorY = CHART_HEIGHT_PX;
    for (const sector of sortedSectors) {
      const segmentHeight = visibleTotal === 0 ? 0 : (sector.count / visibleTotal) * heightPx;
      cursorY -= segmentHeight;
      segments.push({ sector: sector.sector, color: sectorColor(sector.sector), y: cursorY, height: segmentHeight });
    }

    return {
      index,
      weekEnding: point.weekEnding,
      point,
      slotX,
      slotWidth: slotWidthPx,
      barX: slotX,
      barWidth: barWidthPx,
      top: CHART_HEIGHT_PX - heightPx,
      height: heightPx,
      visibleTotal,
      segments,
    };
  });
}

// The plot itself - one <svg>, one <rect> per visible stacked segment plus
// a handful of gridlines and the selected-week indicator. Wrapped in
// memo() so it only re-renders when geometry/ticks/niceMax/plotWidth/
// selectedIndex actually change (data, dimensions, solo-filter, period, or
// an explicit week click) - a hover-only state update in the parent
// re-renders the parent function, but props here stay referentially equal
// (geometry/ticks come from useMemo upstream), so memo bails out and this
// entire ~2,000+ node subtree is skipped. Hover feedback itself never
// depends on React state at all here - the per-segment brighten-on-hover
// is a plain CSS :hover rule, free of any re-render.
const BacktestBarsSvg = memo(function BacktestBarsSvg({
  geometry,
  ticks,
  niceMax,
  plotWidth,
  selectedIndex,
}: {
  geometry: BarGeometry[];
  ticks: number[];
  niceMax: number;
  plotWidth: number;
  selectedIndex: number;
}) {
  const selectedBar = selectedIndex >= 0 ? geometry[selectedIndex] : undefined;
  return (
    <svg
      width={plotWidth}
      height={CHART_HEIGHT_PX}
      className="block overflow-visible"
      role="img"
      aria-label={`Weekly passing-stock counts by sector, ${geometry.length} weeks`}
    >
      {ticks.map((tick) => {
        const y = (1 - tick / niceMax) * CHART_HEIGHT_PX;
        return (
          <line key={tick} x1={0} x2={plotWidth} y1={y} y2={y} className="stroke-border/50" strokeWidth={1} />
        );
      })}

      {geometry.map((bar) =>
        bar.segments.map((segment) => (
          <rect
            key={`${bar.weekEnding}-${segment.sector}`}
            x={bar.barX}
            y={segment.y}
            width={bar.barWidth}
            height={segment.height}
            fill={segment.color}
            className={cn(
              "transition-opacity",
              bar.index === selectedIndex ? "opacity-100" : "opacity-85 hover:opacity-100"
            )}
          />
        ))
      )}

      {selectedBar && (
        <rect
          x={selectedBar.slotX}
          y={CHART_HEIGHT_PX - 2}
          width={selectedBar.slotWidth}
          height={2}
          rx={1}
          className="fill-primary"
        />
      )}
    </svg>
  );
});

// Compact, sector-first tooltip (Phase D.6 #14). When the pointer is over
// a specific stacked segment, that segment's own count is the headline,
// paired with the week's real total (never a sum recomputed from only the
// currently-visible sectors). Falls back to a total-only line when hovering
// bar headroom rather than a segment.
//
// Dashboard interaction-refinement pass - now anchors beside/just above
// the MAGNIFIER (via the shared `magnifierBox`, see computeMagnifierBox)
// rather than the plot's own top edge, so the two read as one connected
// inspection UI instead of sitting far apart. Falls back to the original
// bar-anchored/top-of-chart placement when there's no magnifier to anchor
// to (isCompact - see the render site), so behavior there is unchanged.
function BacktestTooltip({
  hover,
  magnifierBox,
  plotWidth,
}: {
  hover: HoverState;
  magnifierBox: MagnifierBox | null;
  plotWidth: number;
}) {
  const hoveredSector = hover.sector
    ? hover.point.sectors.find((sector) => sector.sector === hover.sector)
    : null;
  // Horizontal reference is the magnifier's own center once one exists -
  // the tooltip should hug the LENS, not the raw bar position underneath
  // it, so it never drifts to the opposite side of the chart from where
  // the magnifier actually rendered.
  const referenceX = magnifierBox ? magnifierBox.left + MAGNIFIER_SIZE_PX / 2 : hover.x;
  const nearRightEdge = referenceX > plotWidth - 150;
  const nearLeftEdge = referenceX < 150;
  const translateX = nearRightEdge ? "-100%" : nearLeftEdge ? "0%" : "-50%";
  // No room above the lens (it's already hugging the plot's top edge) -
  // sit just below it instead, same gap, never overlapping the lens or
  // the pointer/cursor marker inside it.
  const placeBelowMagnifier =
    magnifierBox !== null && magnifierBox.top < TOOLTIP_APPROX_HEIGHT_PX + TOOLTIP_MAGNIFIER_GAP_PX;

  // The gap is a shared constant (TOOLTIP_MAGNIFIER_GAP_PX), so it's
  // applied via an inline `transform`, not a Tailwind arbitrary-value
  // class - a JIT build can't statically see a class name built from a JS
  // variable. "Above" reuses the same height-agnostic translateY(-100%)
  // trick the original top-of-chart placement used (no need to know the
  // tooltip's actual rendered height); "below"/"no magnifier" grow
  // downward from an explicit top instead.
  const top = magnifierBox
    ? placeBelowMagnifier
      ? magnifierBox.top + MAGNIFIER_SIZE_PX + TOOLTIP_MAGNIFIER_GAP_PX
      : magnifierBox.top
    : 0;
  const translateY = magnifierBox
    ? placeBelowMagnifier
      ? "0"
      : `calc(-100% - ${TOOLTIP_MAGNIFIER_GAP_PX}px)`
    : "calc(-100% - 12px)";

  return (
    <div
      className="pointer-events-none absolute z-20 w-max max-w-64 rounded-lg border border-border bg-popover px-3 py-2 text-popover-foreground shadow-md"
      style={{ left: referenceX, top, transform: `translate(${translateX}, ${translateY})` }}
    >
      <div className="text-xs font-semibold text-foreground">{formatWeekFull(hover.point.weekEnding)}</div>
      {hoveredSector ? (
        <div className="mt-1 flex items-center gap-1.5 text-xs">
          <span
            className="size-2 shrink-0 rounded-full"
            style={{ backgroundColor: sectorColor(hoveredSector.sector) }}
          />
          <span className="text-muted-foreground">{hoveredSector.sector}:</span>
          <span className="font-semibold text-foreground tabular-nums">{hoveredSector.count}</span>
          <span className="text-muted-foreground">| Total:</span>
          <span className="font-semibold text-foreground tabular-nums">{hover.point.total}</span>
        </div>
      ) : (
        <div className="mt-1 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground tabular-nums">{hover.point.total}</span> stocks passing
        </div>
      )}
    </div>
  );
}

// The magnifier/lens - a TRUE magnifying glass, rebuilt for the Backtest
// interaction-refinement pass to fix two problems with the previous
// version: it centered the hovered WEEK regardless of where the pointer
// actually was vertically, and it positioned itself off the bar's own
// geometry (barTop) rather than the cursor.
//
// Draws the hovered week +/- MAGNIFIER_NEIGHBOR_RADIUS neighbors by
// reading the SAME precomputed `geometry` the main chart renders from (so
// it can never show different data/colors/stacking than what's on
// screen - item 15's filter-alignment requirement falls out of this for
// free, since `geometry` is already built from the current hiddenSectors).
//
// The key fix is the coordinate transform (toLensX/toLensY below): it's a
// pointer-centered zoom - whatever main-chart pixel sits exactly under
// the real (pointerX, pointerY) is placed at the lens's own center, at
// any zoom level. That guarantees, by construction rather than by
// approximation, that the sector segment the lens is magnifying is
// exactly the sector `handlePlotPointerMove` resolved from the same
// pointerX/pointerY - they can never visually disagree.
//
// Cheap by construction: at most 5 weeks x ~13 sectors, recomputed only
// while a hover is active and only over that small cluster - never the
// full 250-week series (Perf pass, unchanged/preserved). `pointer-events-
// none` throughout so it never steals hover/click - the user always
// clicks their real cursor position on the main chart (handlePlotClick),
// never inside the lens.
function BacktestMagnifier({
  geometry,
  centerIndex,
  pointerX,
  pointerY,
  slotWidthPx,
  barWidthPx,
  box,
}: {
  geometry: BarGeometry[];
  centerIndex: number;
  pointerX: number;
  pointerY: number;
  slotWidthPx: number;
  barWidthPx: number;
  // Computed once by the parent (computeMagnifierBox) and shared with
  // BacktestTooltip, so the lens and the tooltip that anchors to it can
  // never disagree about where the lens actually rendered.
  box: MagnifierBox;
}) {
  const clipId = useId();
  const radius = MAGNIFIER_SIZE_PX / 2;
  const start = Math.max(0, centerIndex - MAGNIFIER_NEIGHBOR_RADIUS);
  const end = Math.min(geometry.length - 1, centerIndex + MAGNIFIER_NEIGHBOR_RADIUS);
  const cluster = geometry.slice(start, end + 1);

  // Adaptive, uniform (no axis distortion) zoom - the smaller of "make a
  // hairline bar legible" and "keep the +/-2-neighbor cluster from
  // spilling past the lens", clamped to a sane range.
  const neighborSlots = MAGNIFIER_NEIGHBOR_RADIUS * 2 + 1;
  const zoomForReadability = MAGNIFIER_TARGET_BAR_WIDTH_PX / Math.max(barWidthPx, 0.5);
  const zoomForFit = (MAGNIFIER_SIZE_PX * 0.85) / Math.max(slotWidthPx * neighborSlots, 1);
  const zoom = Math.min(
    Math.max(Math.min(zoomForReadability, zoomForFit), MAGNIFIER_MIN_ZOOM),
    MAGNIFIER_MAX_ZOOM
  );

  const toLensX = (worldX: number) => radius + (worldX - pointerX) * zoom;
  const toLensY = (worldY: number) => radius + (worldY - pointerY) * zoom;

  return (
    <div
      className="pointer-events-none absolute z-30"
      style={{ left: box.left, top: box.top, width: MAGNIFIER_SIZE_PX, height: MAGNIFIER_SIZE_PX }}
    >
      <svg width={MAGNIFIER_SIZE_PX} height={MAGNIFIER_SIZE_PX} className="overflow-visible drop-shadow-xl">
        <defs>
          <clipPath id={clipId}>
            <circle cx={radius} cy={radius} r={radius - 2} />
          </clipPath>
        </defs>
        <circle cx={radius} cy={radius} r={radius - 1} className="fill-card stroke-border" strokeWidth={2} />
        <g clipPath={`url(#${clipId})`}>
          {cluster.map((bar) => (
            <g key={bar.weekEnding}>
              {bar.segments.map((segment) => (
                <rect
                  key={segment.sector}
                  x={toLensX(bar.barX)}
                  y={toLensY(segment.y)}
                  width={bar.barWidth * zoom}
                  height={segment.height * zoom}
                  fill={segment.color}
                />
              ))}
            </g>
          ))}
        </g>
        {/* Cursor/crosshair marker (item 2) - fixed at the lens's exact
            center by construction of toLensX/toLensY above, so it always
            marks the TRUE pointer position rather than an approximation.
            Rendered AFTER (on top of, unclipped by) the magnified content,
            with a two-tone stroke so it stays visible over any segment
            color underneath. */}
        <circle cx={radius} cy={radius} r={5.5} fill="none" stroke="black" strokeOpacity={0.35} strokeWidth={3} />
        <circle cx={radius} cy={radius} r={5.5} fill="none" stroke="white" strokeWidth={1.5} />
        <circle cx={radius} cy={radius} r={1.5} fill="white" stroke="black" strokeOpacity={0.35} strokeWidth={0.5} />
      </svg>
    </div>
  );
}

// Fixed (non-scrolling) Y-axis with clean rounded tick values (Phase D.6
// #11) - derived fresh from whatever's currently visible (period + hidden
// sectors), never a hardcoded max.
function BacktestAxis({ ticks, niceMax }: { ticks: number[]; niceMax: number }) {
  return (
    <div
      className="relative shrink-0 text-right text-[0.6875rem] text-muted-foreground"
      style={{ width: AXIS_WIDTH_PX, height: CHART_HEIGHT_PX }}
    >
      {ticks.map((tick) => (
        <span
          key={tick}
          className="absolute right-1.5 -translate-y-1/2 tabular-nums"
          style={{ top: `${(1 - tick / niceMax) * 100}%` }}
        >
          {tick}
        </span>
      ))}
    </div>
  );
}

// Individual compact chips (Phase D.6 #12), not one shared background
// pill. SOLO-FIRST -> MULTI-SELECT semantics (interaction-refinement
// pass, replacing the earlier solo-only behavior): the first click from
// "all visible" solos that one sector (every other chip stays in the
// legend but goes dim + strikethrough, so the full category list is
// still visible, just marked inactive) - identical to before. From there,
// clicking any HIDDEN chip ADDS it to the visible set (no Ctrl/Cmd
// needed), and clicking a currently-VISIBLE chip removes it, letting the
// user build up any combination of 1..N sectors. Clicking the last
// remaining visible chip restores "all visible" rather than leaving an
// empty chart. See `handleLegendSelect`/`visibleSectors` below for the
// actual state machine - this component only renders chip visual state
// from whatever set it's handed.
function SectorLegend({
  sectors,
  visibleSectors,
  onSelect,
  onReset,
}: {
  sectors: string[];
  visibleSectors: ReadonlySet<string> | null;
  onSelect: (sector: string) => void;
  onReset: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {sectors.map((sector) => {
        const isActive = visibleSectors === null || visibleSectors.has(sector);
        return (
          <button
            key={sector}
            type="button"
            onClick={() => onSelect(sector)}
            aria-pressed={visibleSectors !== null && visibleSectors.has(sector)}
            className={cn(
              "flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/30 px-2.5 py-1 text-xs font-medium transition-colors hover:bg-muted",
              isActive ? "text-foreground" : "text-muted-foreground/60 line-through"
            )}
          >
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: sectorColor(sector), opacity: isActive ? 1 : 0.35 }}
            />
            {sector}
          </button>
        );
      })}
      {visibleSectors !== null && (
        <button
          type="button"
          onClick={onReset}
          className="cursor-pointer px-1 text-xs font-medium text-primary hover:underline"
        >
          Show all
        </button>
      )}
    </div>
  );
}

// Part A - the Backtest chart's Results View: replaces the chart entirely
// (see the isResultsView branch below) rather than sitting stacked
// underneath it. Fetches independently via useWeeklyStrongBacktestWeekDetail
// (already a persisted, DB-read-only lookup - unchanged) - entering/leaving
// this view never touches the chart's own useWeeklyStrongBacktestStacked
// query, so "Back to Backtest" can never trigger a refetch/recompute of
// anything (Part A #2).
function WeekResultsView({
  code,
  weekEnding,
  onBack,
}: {
  code: string;
  weekEnding: string;
  onBack: () => void;
}) {
  const router = useRouter();
  const { members, isLoading } = useWeeklyStrongBacktestWeekDetail({ code, weekEnding });

  const handleRowClick = (member: { symbol: string; exchange: string }) => {
    router.push(
      `/charts?symbol=${encodeURIComponent(member.symbol)}&exchange=${encodeURIComponent(member.exchange)}`
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex w-fit cursor-pointer items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" />
        Back to Backtest
      </button>

      <div>
        <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <span className="size-1.5 shrink-0 rounded-full bg-primary" />
          Stocks passing — {formatWeekFull(weekEnding)}
        </h3>
        {!isLoading && (
          <p className="mt-0.5 text-xs text-muted-foreground">
            {members.length} {members.length === 1 ? "stock" : "stocks"}
          </p>
        )}
      </div>

      <div className="max-h-128 overflow-y-auto rounded-lg border border-border">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-muted/95">
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-9 px-4 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Symbol</TableHead>
              <TableHead className="h-9 px-4 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Stock Name</TableHead>
              <TableHead className="h-9 px-4 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Exchange</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Item 4 - a non-blocking, in-place table skeleton while the
                week's data is fetching, rather than replacing the whole
                view with a spinner: the header/back-button/table shell
                above stay put and interactive throughout. */}
            {isLoading && members.length === 0
              ? Array.from({ length: 6 }, (_, index) => (
                  <TableRow key={`skeleton-${index}`} className="hover:bg-transparent">
                    <TableCell className="h-11 px-4">
                      <div className="h-3 w-16 animate-pulse rounded-full bg-muted" />
                    </TableCell>
                    <TableCell className="px-4">
                      <div className="h-3 w-32 animate-pulse rounded-full bg-muted" />
                    </TableCell>
                    <TableCell className="px-4">
                      <div className="h-3 w-10 animate-pulse rounded-full bg-muted" />
                    </TableCell>
                  </TableRow>
                ))
              : members.map((member) => (
                  <TableRow
                    key={member.symbol}
                    onClick={() => handleRowClick(member)}
                    className="cursor-pointer border-border/60 hover:bg-primary/5"
                  >
                    <TableCell className="h-11 px-4 font-semibold text-primary">{member.symbol}</TableCell>
                    <TableCell className="max-w-56 truncate px-4 text-foreground">{member.name}</TableCell>
                    <TableCell className="px-4 font-mono text-[0.6875rem] text-muted-foreground uppercase">
                      {member.exchange}
                    </TableCell>
                  </TableRow>
                ))}
            {!isLoading && members.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={3} className="py-8 text-center text-sm text-muted-foreground">
                  No stocks passed in this week.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export function WeeklyStrongBacktestSection({ code }: { code: string }) {
  const { points, generated, isLoading, isError, membershipNote } = useWeeklyStrongBacktestStacked({
    code,
  });
  // Defaults to "All" (Phase D.7 #1) - every persisted week visible on
  // first load. A key={code} on this component (see
  // DashboardSegmentContent.tsx) remounts it - and so resets this back to
  // "All" - on every segment switch, since there's no deliberately
  // persisted per-segment preference to respect instead.
  const [period, setPeriod] = useState<PeriodValue>("all");
  // Explicit click overrides only - null means "no click yet, use the
  // default". Derived (not synced via an effect+setState) so the default
  // just falls out of whatever `visiblePoints` currently is.
  const [selectedWeekOverride, setSelectedWeekOverride] = useState<string | null>(null);
  // SOLO-FIRST -> MULTI-SELECT filter (interaction-refinement pass,
  // replacing the earlier `soloSector: string | null`) - null means every
  // sector is visible; a non-null Set means ONLY the sectors it contains
  // are visible. Always replaced with a NEW Set on every update (see
  // handleLegendSelect) rather than mutated in place, so this stays a
  // normal React state dependency.
  const [visibleSectors, setVisibleSectors] = useState<ReadonlySet<string> | null>(null);
  const [hover, setHover] = useState<HoverState | null>(null);
  // Chart <-> Results View (interaction-refinement pass, Part A) - purely
  // a display mode over state that already exists (period/visibleSectors/
  // selectedWeekOverride/points are all untouched by this toggle), not a
  // route change and not a refetch trigger. "Back to Backtest" only ever
  // flips this back to false - it never resets any of the state above, so
  // the chart reappears exactly as the user left it, still selected on
  // whichever week they last picked.
  const [isResultsView, setIsResultsView] = useState(false);

  // ResizeObserver-driven fit-to-width measurement (Phase D.6 #1) - the
  // plot area's own width, excluding the fixed Y-axis column, drives bar
  // sizing directly. No horizontal scrollbar is ever rendered.
  //
  // A CALLBACK ref, not useRef+useEffect([]) - this section returns a
  // different subtree depending on isLoading/isError/generated, so the
  // plot div doesn't necessarily exist on this component's very first
  // render (a cold/uncached load shows the top-level loading branch
  // first). A plain effect with an empty dependency array only runs once,
  // at that first render - if the div wasn't mounted yet, `ref.current`
  // was null, the effect bailed out immediately, and the observer never
  // got attached even after the div appeared on a later render (nothing
  // ever re-ran it). A callback ref doesn't have that gap: React invokes
  // it every time the underlying DOM node actually changes - including
  // the null-to-mounted transition, whichever render that happens on -
  // so the observer reliably attaches regardless of whether the chart
  // was ready on the first paint or several renders later.
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const [plotWidth, setPlotWidth] = useState(0);
  const plotAreaRef = useCallback((node: HTMLDivElement | null) => {
    resizeObserverRef.current?.disconnect();
    resizeObserverRef.current = null;
    if (!node || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width) setPlotWidth(width);
    });
    observer.observe(node);
    resizeObserverRef.current = observer;
  }, []);

  // Phase D.6 #18 - a phone-width plot can't usefully show 250 hairline
  // bars, so the effective period is clamped to 1Y there regardless of the
  // button selection (the buttons for 3Y/All are disabled, not hidden, so
  // it's clear why).
  const isCompact = plotWidth > 0 && plotWidth < MOBILE_BREAKPOINT_PX;
  const effectivePeriod = isCompact ? "1y" : period;
  const periodWeeks = PERIOD_OPTIONS.find((option) => option.value === effectivePeriod)?.weeks ?? Infinity;
  const visiblePoints = useMemo(
    () => (Number.isFinite(periodWeeks) ? points.slice(-periodWeeks) : points),
    [points, periodWeeks]
  );

  // Defaults to the latest completed week that actually has data - the
  // last entry of both the full and the period-zoomed series, since
  // zooming only trims older weeks off the front. Hover never changes
  // this - only a click (or the week-select dropdown) does.
  const selectedWeek =
    selectedWeekOverride && visiblePoints.some((point) => point.weekEnding === selectedWeekOverride)
      ? selectedWeekOverride
      : (visiblePoints[visiblePoints.length - 1]?.weekEnding ?? null);

  const slotCount = visiblePoints.length;
  // Phase D.8 #3 - each week gets an equal slot (plotWidth / slotCount);
  // the gap is capped at a FRACTION of that slot (never a fixed px value
  // that could exceed it) so it can never consume the whole slot, and the
  // bar takes up whatever's left. This guarantees
  // (barWidth + gap) * slotCount === plotWidth exactly (mod the 0.5px
  // floor, which only matters for a pathologically narrow container far
  // below what `isCompact` already clamps to), so bars can never overflow
  // the plot and force a horizontal scrollbar, at ANY slot count.
  const slotWidthPx = plotWidth > 0 && slotCount > 0 ? plotWidth / slotCount : 0;
  const desiredGapPx = slotCount > 150 ? 1 : slotCount > 60 ? 1.5 : 2;
  const gapPx = Math.min(desiredGapPx, slotWidthPx * 0.35);
  const barWidthPx = slotWidthPx > 0 ? Math.max(slotWidthPx - gapPx, 0.5) : 0;
  const labelEveryNWeeks = slotCount <= 60 ? 4 : slotCount <= 170 ? 13 : 17;

  const sectorLegend = useMemo(() => {
    const sectors = new Set<string>();
    for (const point of visiblePoints) {
      for (const sector of point.sectors) sectors.add(sector.sector);
    }
    return [...sectors].sort((a, b) => a.localeCompare(b));
  }, [visiblePoints]);

  // Self-heals a stale filter (Phase D.8 #4/#root-cause, generalized from
  // solo to multi-select): drops any previously-visible sector that no
  // longer exists in the CURRENTLY visible sector set - e.g. it only ever
  // appeared in weeks that fell out of view after switching from All to
  // 1Y - and if that empties the set entirely, falls back to "no filter"
  // (item 11's zero-guard, extended to this case too) rather than a
  // blank-looking chart with every bar at zero height. Derived, not an
  // effect - the same pattern already used for `selectedWeek` above.
  const effectiveVisibleSectors = useMemo<ReadonlySet<string> | null>(() => {
    if (visibleSectors === null) return null;
    const filtered = new Set([...visibleSectors].filter((sector) => sectorLegend.includes(sector)));
    return filtered.size > 0 ? filtered : null;
  }, [visibleSectors, sectorLegend]);

  // Derived from the visible-set, not stored directly - every sector NOT
  // in effectiveVisibleSectors is "hidden" for rendering purposes;
  // nothing is hidden when effectiveVisibleSectors is null. This is the
  // only place the filter touches the bar/axis/tooltip/magnifier math
  // below, all of which just consume a hidden-set exactly as before -
  // that math already generalizes correctly from "1 sector visible" to
  // "N sectors visible" with no further changes (item 13/14).
  const hiddenSectors = useMemo<ReadonlySet<string>>(() => {
    if (effectiveVisibleSectors === null) return EMPTY_SECTOR_SET;
    return new Set(sectorLegend.filter((sector) => !effectiveVisibleSectors.has(sector)));
  }, [effectiveVisibleSectors, sectorLegend]);

  const visibleTotals = useMemo(
    () => visiblePoints.map((point) => visibleTotalFor(point, hiddenSectors)),
    [visiblePoints, hiddenSectors]
  );
  const rawMax = Math.max(...visibleTotals, 1);
  const ticks = useMemo(() => computeNiceTicks(rawMax), [rawMax]);
  const niceMax = ticks[ticks.length - 1] || 1;

  // Backtest chart performance pass - THE fix for "mouse movement must not
  // cause the complete chart geometry to recalculate" (see BacktestBarsSvg
  // above). Every pixel position (bar x/width, per-segment stack y/height,
  // color) is resolved HERE, in one pass over the currently-visible weeks,
  // gated on exactly the inputs that can legitimately change it: the data
  // itself, the plot's measured dimensions, the solo-sector filter, and
  // the period slice. A pointer move touches none of these, so this
  // useMemo - and the ~2,000+ SVG nodes it feeds - never reruns while the
  // user is just moving the mouse across the chart; only `hover`
  // (hoveredWeekIndex/hoveredSector/pointer position) updates on that path.
  const geometry = useMemo(
    () => buildBarGeometry(visiblePoints, hiddenSectors, niceMax, slotWidthPx, barWidthPx),
    [visiblePoints, hiddenSectors, niceMax, slotWidthPx, barWidthPx]
  );

  const selectedIndex = useMemo(
    () => (selectedWeek ? geometry.findIndex((bar) => bar.weekEnding === selectedWeek) : -1),
    [geometry, selectedWeek]
  );

  const weekOptions = useMemo(
    () =>
      [...visiblePoints]
        .reverse()
        .map((point) => ({ value: point.weekEnding, label: formatWeekFull(point.weekEnding) })),
    [visiblePoints]
  );

  // The state-machine from item 12, run off `effectiveVisibleSectors` (the
  // already self-healed, currently-valid set) rather than the raw state,
  // so the decision always matches what's actually on screen. Never
  // mutates a Set in place - every branch returns a brand-new Set (or
  // null), so React's state update is always a real reference change.
  const handleLegendSelect = useCallback(
    (sector: string) => {
      setVisibleSectors(() => {
        if (effectiveVisibleSectors === null) {
          // All visible -> first click solos this one (item 8).
          return new Set([sector]);
        }
        if (effectiveVisibleSectors.has(sector)) {
          if (effectiveVisibleSectors.size <= 1) {
            // Clicking the last remaining visible category -> restore all
            // (item 11), never an empty chart.
            return null;
          }
          // Currently visible, others remain -> hide just this one (item 10).
          const next = new Set(effectiveVisibleSectors);
          next.delete(sector);
          return next;
        }
        // Currently hidden -> add it to the visible set (item 9).
        const next = new Set(effectiveVisibleSectors);
        next.add(sector);
        return next;
      });
    },
    [effectiveVisibleSectors]
  );
  const resetFilter = useCallback(() => setVisibleSectors(null), []);

  // Bails out (returns the same object reference) on sub-pixel jitter
  // within the same bar/segment, so a slow drag across one thin bar
  // doesn't trigger a React re-render on every pointermove tick (Phase
  // D.6 #17) - only an actual segment/bar change, or a real cursor move,
  // updates state. Combined with BacktestBarsSvg's memo(), this state
  // update only ever re-renders the small tooltip/guide-line/magnifier
  // overlay (a handful of nodes), never the chart geometry itself.
  const handleBarHover = useCallback((next: HoverState) => {
    setHover((previous) => {
      if (
        previous &&
        previous.index === next.index &&
        previous.sector === next.sector &&
        Math.abs(previous.clientX - next.clientX) < 2 &&
        Math.abs(previous.clientY - next.clientY) < 2
      ) {
        return previous;
      }
      return next;
    });
  }, []);
  const handleBarLeave = useCallback(() => setHover(null), []);

  // Single delegated pointer handler for the ENTIRE plot, replacing what
  // used to be per-bar onPointerEnter/onPointerMove handlers on 250
  // individual <button> elements. The hovered week is resolved by pure
  // arithmetic against the precomputed slot width (every week owns an
  // equal, non-overlapping horizontal slot - Perf pass #6's "hit target
  // wider than the visible bar, without overlapping neighbors",
  // implemented without allocating any extra hit-testing DOM/SVG nodes),
  // and the exact sector by a short linear scan (<=13 entries) of that
  // one bar's already-computed segment list - never the full 250-week
  // series. Touch pointers never produce hover (see the original
  // handlePointerActive) - tap goes straight to onClick/handlePlotClick.
  const handlePlotPointerMove = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.pointerType === "touch") return;
      if (slotWidthPx <= 0 || geometry.length === 0) return;
      const containerRect = event.currentTarget.getBoundingClientRect();
      const localX = event.clientX - containerRect.left;
      const index = Math.min(Math.max(Math.floor(localX / slotWidthPx), 0), geometry.length - 1);
      const bar = geometry[index];
      if (!bar) return;

      const localY = event.clientY - containerRect.top;
      let sector: string | null = null;
      for (const segment of bar.segments) {
        if (localY >= segment.y && localY <= segment.y + segment.height) {
          sector = segment.sector;
          break;
        }
      }

      handleBarHover({
        index: bar.index,
        point: bar.point,
        sector,
        x: bar.barX + bar.barWidth / 2,
        barTop: bar.top,
        pointerX: localX,
        pointerY: localY,
        clientX: event.clientX,
        clientY: event.clientY,
      });
    },
    [geometry, slotWidthPx, handleBarHover]
  );

  // Clicking a bar both selects its week (unchanged) AND enters Results
  // View (Part A #1) - the chart itself is hidden while Results View is
  // active (see the render below), never a route change.
  const handlePlotClick = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      if (slotWidthPx <= 0 || geometry.length === 0) return;
      const containerRect = event.currentTarget.getBoundingClientRect();
      const localX = event.clientX - containerRect.left;
      const index = Math.min(Math.max(Math.floor(localX / slotWidthPx), 0), geometry.length - 1);
      const bar = geometry[index];
      if (bar) {
        setSelectedWeekOverride(bar.weekEnding);
        setIsResultsView(true);
      }
    },
    [geometry, slotWidthPx]
  );

  // The week-select dropdown participates in the same workflow (Part A
  // #3) - picking an exact week is an explicit "show me that week's
  // stocks" request, so it also enters Results View rather than just
  // moving the chart's own selection marker.
  const handleSelectWeekFromDropdown = useCallback((weekEnding: string) => {
    setSelectedWeekOverride(weekEnding);
    setIsResultsView(true);
  }, []);

  // Restores the chart - never touches period/visibleSectors/
  // selectedWeekOverride/points, so nothing here can trigger a refetch or
  // recomputation (Part A #2). The chart reappears with the same week
  // still marked selected (see the selectedIndex-driven underline in
  // BacktestBarsSvg).
  const handleBackToChart = useCallback(() => setIsResultsView(false), []);

  // Computed once per hover (not memoized - plain arithmetic over 5
  // numbers, not the 250-week geometry pass) and shared by the tooltip and
  // the lens below, so they can never disagree about where the lens is.
  // null on isCompact, where the magnifier itself doesn't render.
  const magnifierBox =
    hover && !isCompact ? computeMagnifierBox(hover.pointerX, hover.pointerY, plotWidth) : null;

  return (
    <section className="flex flex-col gap-5 rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">Backtest History</h2>
          <div className="mt-0.5 flex items-center gap-1.5">
            <p className="text-xs text-muted-foreground">Historical weekly results, grouped by sector</p>
            {membershipNote && (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <button
                      type="button"
                      aria-label="Coverage details"
                      className="inline-flex text-muted-foreground/70 hover:text-foreground"
                    />
                  }
                >
                  <Info className="size-3.5" />
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-64">
                  {membershipNote}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>

        {/* Part A #1 - the toolbar (week dropdown + period toggle) is
            chart-only chrome, hidden while Results View is active. */}
        {generated && points.length > 0 && !isResultsView && (
          <div className="flex items-center gap-2">
            {selectedWeek && (
              <Select
                value={selectedWeek}
                onValueChange={handleSelectWeekFromDropdown}
                options={weekOptions}
                triggerClassName="h-8 w-36"
              />
            )}
            <div className="flex items-center gap-0.5 rounded-lg border border-border bg-muted/40 p-0.5">
              {PERIOD_OPTIONS.map((option) => {
                const disabled = isCompact && option.value !== "1y";
                return (
                  <button
                    key={option.value}
                    type="button"
                    disabled={disabled}
                    title={disabled ? "Switch to a wider screen to view a longer range" : undefined}
                    onClick={() => setPeriod(option.value)}
                    className={cn(
                      "h-7 cursor-pointer rounded-md px-2.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                      effectivePeriod === option.value
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner size="sm" />
        </div>
      ) : isError ? (
        <div className="flex h-64 items-center justify-center text-center text-sm text-muted-foreground">
          Couldn&apos;t load backtest history.
        </div>
      ) : !generated || points.length === 0 ? (
        <div className="flex h-64 items-center justify-center text-center text-sm text-muted-foreground">
          Backtest history has not been generated yet.
        </div>
      ) : isResultsView && selectedWeek ? (
        // Part A - Results View REPLACES the chart entirely (toolbar/
        // legend/plot all hidden above and here), not stacked underneath
        // it as before. `code`/`weekEnding` are the only inputs
        // WeekResultsView needs - it fetches independently of the chart's
        // own `points` query, so switching modes never touches (let alone
        // refetches) the already-loaded chart state.
        <WeekResultsView code={code} weekEnding={selectedWeek} onBack={handleBackToChart} />
      ) : (
        <>
          {sectorLegend.length > 0 && (
            <SectorLegend
              sectors={sectorLegend}
              visibleSectors={effectiveVisibleSectors}
              onSelect={handleLegendSelect}
              onReset={resetFilter}
            />
          )}

          <div className="relative flex">
            <BacktestAxis ticks={ticks} niceMax={niceMax} />
            <div ref={plotAreaRef} className="relative min-w-0 flex-1">
              {/* Touch pointers never produce hover state at all (see
                  handlePlotPointerMove), so the tooltip needs no separate
                  isCompact gate - it simply never appears on a real touch
                  device. The magnifier is gated on isCompact too, on top
                  of that, since it's a nice-to-have inspection aid that
                  would look cramped on a narrow chart even from a mouse -
                  magnifierBox is computed ONCE here and shared by both, so
                  the tooltip (anchored to it) and the lens itself can
                  never disagree about where the lens actually is. */}
              {hover && <BacktestTooltip hover={hover} magnifierBox={magnifierBox} plotWidth={plotWidth} />}
              {hover && magnifierBox && (
                <BacktestMagnifier
                  geometry={geometry}
                  centerIndex={hover.index}
                  pointerX={hover.pointerX}
                  pointerY={hover.pointerY}
                  slotWidthPx={slotWidthPx}
                  barWidthPx={barWidthPx}
                  box={magnifierBox}
                />
              )}

              {plotWidth === 0 ? (
                // Phase D.8 #2 - the ResizeObserver hasn't reported a real
                // width yet (typically resolves within a frame of mount,
                // or right after a key={code} remount / period switch
                // that changes layout). Persisted data can genuinely be
                // sitting in `points` right now - this is never confused
                // with "no backtest generated" (that's the branch further
                // up, gated on `generated`/`points.length`) - it's purely
                // "known data, dimensions not measured yet," so a brief
                // spinner here instead of the blank plot area that used
                // to render nothing at all.
                <div className="flex items-center justify-center" style={{ height: CHART_HEIGHT_PX }}>
                  <Spinner size="sm" />
                </div>
              ) : (
                <>
                  <div
                    className="relative cursor-pointer border-l border-border"
                    style={{ height: CHART_HEIGHT_PX }}
                    onPointerMove={handlePlotPointerMove}
                    onPointerLeave={handleBarLeave}
                    onClick={handlePlotClick}
                  >
                    {hover && (
                      <div
                        className="pointer-events-none absolute inset-y-0 w-px bg-foreground/20"
                        style={{ left: hover.x }}
                        aria-hidden
                      />
                    )}

                    <BacktestBarsSvg
                      geometry={geometry}
                      ticks={ticks}
                      niceMax={niceMax}
                      plotWidth={plotWidth}
                      selectedIndex={selectedIndex}
                    />
                  </div>

                  <div className="relative mt-2 h-4 text-[0.6875rem] text-muted-foreground">
                    {visiblePoints.map((point, index) =>
                      index % labelEveryNWeeks === 0 || index === visiblePoints.length - 1 ? (
                        <span
                          key={point.weekEnding}
                          className="absolute -translate-x-1/2 whitespace-nowrap first:translate-x-0 last:-translate-x-full"
                          style={{ left: index * (barWidthPx + gapPx) + barWidthPx / 2 }}
                        >
                          {formatWeekLabel(point.weekEnding)}
                        </span>
                      ) : null
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
