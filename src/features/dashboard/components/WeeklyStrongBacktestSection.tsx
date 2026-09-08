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
import { EmptyState } from "@/components/ui/empty-state";
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

const MOBILE_BREAKPOINT_PX = 480;
const TABLET_BREAKPOINT_PX = 768;

// X-axis label density targets the *measured plot width*, not the raw
// dataset length - the same 52-week ("1Y") dataset needs far fewer visible
// labels squeezed into a ~300px mobile plot than into a wide desktop one.
const MOBILE_X_AXIS_LABEL_COUNT = 5;
const TABLET_X_AXIS_LABEL_COUNT = 8;
const DESKTOP_X_AXIS_LABEL_COUNT = 14;

// Chartlink-style lens diameter - big enough to feel like an inspection
// tool, not a decorative bubble.
const MAGNIFIER_SIZE_PX = 180;
const MAGNIFIER_NEIGHBOR_RADIUS = 2;

const MAGNIFIER_TARGET_BAR_WIDTH_PX = 14;
const MAGNIFIER_MIN_ZOOM = 2;
const MAGNIFIER_MAX_ZOOM = 30;
const ACTIVE_COLUMN_STROKE_WIDTH = 1.75;

const TOOLTIP_MAGNIFIER_GAP_PX = 10;

const TOOLTIP_APPROX_HEIGHT_PX = 60;

const PERIOD_OPTIONS = [
  { value: "1y", weeks: 52, label: "1Y" },
  { value: "3y", weeks: 156, label: "3Y" },
  { value: "all", weeks: Infinity, label: "All" },
] as const;
type PeriodValue = (typeof PERIOD_OPTIONS)[number]["value"];

const EMPTY_SECTOR_SET: ReadonlySet<string> = new Set();

type HoverState = {
  index: number;
  point: WeeklyStrongBacktestStackedPoint;

  sector: string | null;
  x: number;

  barTop: number;

  pointerX: number;
  pointerY: number;
  clientX: number;
  clientY: number;
};

type SegmentGeometry = {
  sector: string;
  color: string;
  y: number;
  height: number;
};

type BarGeometry = {
  index: number;
  weekEnding: string;
  point: WeeklyStrongBacktestStackedPoint;
  slotX: number;
  slotWidth: number;
  barX: number;
  barWidth: number;
  top: number;
  height: number;
  visibleTotal: number;
  segments: SegmentGeometry[];
};

function formatWeekLabel(date: string, compact: boolean) {
  // Mobile (isCompact) is already locked to the "1Y" period elsewhere in
  // this component, so it never spans more than one calendar year - the
  // year suffix can drop there without becoming ambiguous, buying back a
  // few more characters of breathing room per label. Desktop/tablet can
  // show "3Y"/"All", which do cross year boundaries, so they keep it.
  return new Date(`${date}T00:00:00Z`).toLocaleDateString(
    "en-IN",
    compact ? { month: "short" } : { month: "short", year: "2-digit" }
  );
}

// How many X-axis labels to target for the current plot width - fewer on
// narrow screens, more where there's room, independent of how many weeks
// are actually in the dataset.
function targetXAxisLabelCount(plotWidthPx: number): number {
  if (plotWidthPx <= MOBILE_BREAKPOINT_PX) return MOBILE_X_AXIS_LABEL_COUNT;
  if (plotWidthPx <= TABLET_BREAKPOINT_PX) return TABLET_X_AXIS_LABEL_COUNT;
  return DESKTOP_X_AXIS_LABEL_COUNT;
}

function formatWeekFull(date: string) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function sectorColor(sector: string) {
  return colorForDashboardLabel(sector);
}

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

// Chartlink-style: the lens is centered exactly on the pointer, full stop -
// no preferred side, no offset gap, no clamping to stay inside the plot.
// The real system cursor renders above the lens on its own (the lens is
// pointer-events: none), so it naturally appears inside the circle once
// the box is centered here. Near an edge, the lens is deliberately allowed
// to extend past the plot bounds rather than shift away from the cursor -
// nothing in this component's ancestor chain clips overflow, so no portal
// is needed for that to render correctly.
function computeMagnifierBox(pointerX: number, pointerY: number): MagnifierBox {
  const radius = MAGNIFIER_SIZE_PX / 2;
  return { left: pointerX - radius, top: pointerY - radius };
}

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
      aria-label={`Harvest passing-stock counts by sector, ${geometry.length} periods`}
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

  const referenceX = magnifierBox ? magnifierBox.left + MAGNIFIER_SIZE_PX / 2 : hover.x;
  const nearRightEdge = referenceX > plotWidth - 150;
  const nearLeftEdge = referenceX < 150;
  const translateX = nearRightEdge ? "-100%" : nearLeftEdge ? "0%" : "-50%";

  const placeBelowMagnifier =
    magnifierBox !== null && magnifierBox.top < TOOLTIP_APPROX_HEIGHT_PX + TOOLTIP_MAGNIFIER_GAP_PX;

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

function BacktestMagnifier({
  geometry,
  ticks,
  niceMax,
  centerIndex,
  activeSegment,
  pointerX,
  pointerY,
  slotWidthPx,
  barWidthPx,
  box,
}: {
  geometry: BarGeometry[];
  ticks: number[];
  niceMax: number;
  centerIndex: number;
  // Resolved once, up in WeeklyStrongBacktestSection, from the SAME hover
  // state the tooltip and the main-chart outline already use - never
  // re-detected here, so the lens can't disagree with what's on screen.
  activeSegment: SegmentGeometry | undefined;
  pointerX: number;
  pointerY: number;
  slotWidthPx: number;
  barWidthPx: number;

  box: MagnifierBox;
}) {
  const clipId = useId();
  const radius = MAGNIFIER_SIZE_PX / 2;
  const start = Math.max(0, centerIndex - MAGNIFIER_NEIGHBOR_RADIUS);
  const end = Math.min(geometry.length - 1, centerIndex + MAGNIFIER_NEIGHBOR_RADIUS);
  const cluster = geometry.slice(start, end + 1);
  const activeBar = geometry[centerIndex];

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
      <svg width={MAGNIFIER_SIZE_PX} height={MAGNIFIER_SIZE_PX} className="overflow-visible drop-shadow-lg">
        <defs>
          <clipPath id={clipId}>
            <circle cx={radius} cy={radius} r={radius - 2} />
          </clipPath>
        </defs>
        <circle cx={radius} cy={radius} r={radius - 1} className="fill-card stroke-border" strokeWidth={2} />
        <g clipPath={`url(#${clipId})`}>
          {ticks.map((tick) => {
            const y = toLensY((1 - tick / niceMax) * CHART_HEIGHT_PX);
            return (
              <line
                key={tick}
                x1={0}
                x2={MAGNIFIER_SIZE_PX}
                y1={y}
                y2={y}
                className="stroke-border/50"
                strokeWidth={1}
              />
            );
          })}

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

          {/* Same active-SEGMENT outline as the normal chart (not the
              whole column), magnified along with everything else - the
              stroke width is a raw SVG unit here (not multiplied by
              zoom), so it stays a clean, constant line instead of
              growing huge at high zoom. */}
          {activeBar && activeSegment && (
            <rect
              x={toLensX(activeBar.barX)}
              y={toLensY(activeSegment.y)}
              width={activeBar.barWidth * zoom}
              height={activeSegment.height * zoom}
              fill="none"
              className="stroke-foreground/70"
              strokeWidth={ACTIVE_COLUMN_STROKE_WIDTH}
            />
          )}
        </g>
      </svg>
    </div>
  );
}

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
    <div className="flex flex-col gap-3">
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

      <div className="max-h-128 overflow-y-auto rounded-lg">
        {/* Desktop/tablet: unchanged full table. */}
        <div className="hidden sm:block">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-foreground/5 backdrop-blur-sm">
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-9 w-14 px-4 text-right text-xs font-semibold text-muted-foreground">
                  Sr. No.
                </TableHead>
                <TableHead className="h-9 px-4 text-xs font-semibold text-muted-foreground">Symbol</TableHead>
                <TableHead className="h-9 px-4 text-xs font-semibold text-muted-foreground">Stock Name</TableHead>
                <TableHead className="h-9 px-4 text-xs font-semibold text-muted-foreground">Exchange</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>

              {isLoading && members.length === 0
                ? Array.from({ length: 6 }, (_, index) => (
                    <TableRow key={`skeleton-${index}`} className="hover:bg-transparent">
                      <TableCell className="h-11 px-4">
                        <div className="ml-auto h-3 w-4 animate-pulse rounded-full bg-muted" />
                      </TableCell>
                      <TableCell className="px-4">
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
                : members.map((member, index) => (
                    <TableRow
                      key={member.symbol}
                      onClick={() => handleRowClick(member)}
                      className="cursor-pointer border-border/60 hover:bg-primary/5"
                    >
                      <TableCell className="h-11 px-4 text-right text-muted-foreground tabular-nums">
                        {index + 1}
                      </TableCell>
                      <TableCell className="h-11 px-4 font-semibold text-primary">{member.symbol}</TableCell>
                      <TableCell className="max-w-56 truncate px-4 text-foreground">{member.name}</TableCell>
                      <TableCell className="px-4 font-mono text-[0.6875rem] text-muted-foreground uppercase">
                        {member.exchange}
                      </TableCell>
                    </TableRow>
                  ))}
              {!isLoading && members.length === 0 && (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={4} className="py-6 text-center text-sm text-muted-foreground">
                    <EmptyState size="compact" title="No stocks passed in this week." className="py-0" />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile: compact stacked records instead of a squeezed table. */}
        <div className="flex flex-col divide-y divide-border sm:hidden">
          {isLoading && members.length === 0
            ? Array.from({ length: 6 }, (_, index) => (
                <div key={`skeleton-m-${index}`} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="flex min-w-0 items-baseline gap-2">
                    <div className="h-3 w-4 shrink-0 animate-pulse rounded-full bg-muted" />
                    <div className="min-w-0">
                      <div className="h-3 w-16 animate-pulse rounded-full bg-muted" />
                      <div className="mt-1.5 h-3 w-32 animate-pulse rounded-full bg-muted" />
                    </div>
                  </div>
                  <div className="h-3 w-8 shrink-0 animate-pulse rounded-full bg-muted" />
                </div>
              ))
            : members.map((member, index) => (
                <div
                  key={member.symbol}
                  onClick={() => handleRowClick(member)}
                  className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 active:bg-primary/5"
                >
                  <div className="flex min-w-0 items-baseline gap-2">
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-primary">{member.symbol}</p>
                      <p className="truncate text-xs text-muted-foreground">{member.name}</p>
                    </div>
                  </div>
                  <span className="shrink-0 font-mono text-[0.6875rem] text-muted-foreground uppercase">
                    {member.exchange}
                  </span>
                </div>
              ))}
          {!isLoading && members.length === 0 && (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              <EmptyState size="compact" title="No stocks passed in this week." className="py-0" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function WeeklyStrongBacktestSection({ code }: { code: string }) {
  const { points, generated, isLoading, isError, membershipNote } = useWeeklyStrongBacktestStacked({
    code,
  });

  const [period, setPeriod] = useState<PeriodValue>("all");

  const [selectedWeekOverride, setSelectedWeekOverride] = useState<string | null>(null);

  const [visibleSectors, setVisibleSectors] = useState<ReadonlySet<string> | null>(null);
  const [hover, setHover] = useState<HoverState | null>(null);

  const [isResultsView, setIsResultsView] = useState(false);

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

  const isCompact = plotWidth > 0 && plotWidth < MOBILE_BREAKPOINT_PX;
  const effectivePeriod = isCompact ? "1y" : period;
  const periodWeeks = PERIOD_OPTIONS.find((option) => option.value === effectivePeriod)?.weeks ?? Infinity;
  const visiblePoints = useMemo(
    () => (Number.isFinite(periodWeeks) ? points.slice(-periodWeeks) : points),
    [points, periodWeeks]
  );

  const selectedWeek =
    selectedWeekOverride && visiblePoints.some((point) => point.weekEnding === selectedWeekOverride)
      ? selectedWeekOverride
      : (visiblePoints[visiblePoints.length - 1]?.weekEnding ?? null);

  const slotCount = visiblePoints.length;

  const slotWidthPx = plotWidth > 0 && slotCount > 0 ? plotWidth / slotCount : 0;
  const desiredGapPx = slotCount > 150 ? 1 : slotCount > 60 ? 1.5 : 2;
  const gapPx = Math.min(desiredGapPx, slotWidthPx * 0.35);
  const barWidthPx = slotWidthPx > 0 ? Math.max(slotWidthPx - gapPx, 0.5) : 0;
  const labelEveryNWeeks =
    plotWidth > 0 && slotCount > 0
      ? Math.max(1, Math.ceil(slotCount / targetXAxisLabelCount(plotWidth)))
      : 1;

  const sectorLegend = useMemo(() => {
    const sectors = new Set<string>();
    for (const point of visiblePoints) {
      for (const sector of point.sectors) sectors.add(sector.sector);
    }
    return [...sectors].sort((a, b) => a.localeCompare(b));
  }, [visiblePoints]);

  const effectiveVisibleSectors = useMemo<ReadonlySet<string> | null>(() => {
    if (visibleSectors === null) return null;
    const filtered = new Set([...visibleSectors].filter((sector) => sectorLegend.includes(sector)));
    return filtered.size > 0 ? filtered : null;
  }, [visibleSectors, sectorLegend]);

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

  const handleLegendSelect = useCallback(
    (sector: string) => {
      setVisibleSectors(() => {
        if (effectiveVisibleSectors === null) {

          return new Set([sector]);
        }
        if (effectiveVisibleSectors.has(sector)) {
          if (effectiveVisibleSectors.size <= 1) {

            return null;
          }

          const next = new Set(effectiveVisibleSectors);
          next.delete(sector);
          return next;
        }

        const next = new Set(effectiveVisibleSectors);
        next.add(sector);
        return next;
      });
    },
    [effectiveVisibleSectors]
  );
  const resetFilter = useCallback(() => setVisibleSectors(null), []);

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

  const handleSelectWeekFromDropdown = useCallback((weekEnding: string) => {
    setSelectedWeekOverride(weekEnding);
    setIsResultsView(true);
  }, []);

  const handleBackToChart = useCallback(() => setIsResultsView(false), []);

  const magnifierBox = hover && !isCompact ? computeMagnifierBox(hover.pointerX, hover.pointerY) : null;
  const hoveredBar = hover ? geometry[hover.index] : undefined;
  // The exact stacked rectangle under the pointer (not the whole column) -
  // resolved once here from hover.sector (already Y-position-detected in
  // handlePlotPointerMove), then reused as-is by the main-chart outline,
  // the lens outline, and the tooltip so all three can never disagree.
  const activeSegment = hoveredBar?.segments.find((segment) => segment.sector === hover?.sector);

  return (
    <section className="flex flex-col gap-5 rounded-xl border border-border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">Harvest Backtest</h2>
          <div className="mt-0.5 flex items-center gap-1.5">
            <p className="text-xs text-muted-foreground">Historical results, grouped by sector</p>
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
        <div className="flex h-64 items-center justify-center">
          <EmptyState size="compact" title="Backtest history has not been generated yet." />
        </div>
      ) : isResultsView && selectedWeek ? (

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

              {hover && <BacktestTooltip hover={hover} magnifierBox={magnifierBox} plotWidth={plotWidth} />}
              {hover && magnifierBox && (
                <BacktestMagnifier
                  geometry={geometry}
                  ticks={ticks}
                  niceMax={niceMax}
                  centerIndex={hover.index}
                  activeSegment={activeSegment}
                  pointerX={hover.pointerX}
                  pointerY={hover.pointerY}
                  slotWidthPx={slotWidthPx}
                  barWidthPx={barWidthPx}
                  box={magnifierBox}
                />
              )}

              {plotWidth === 0 ? (

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

                    {/* Hover-active SEGMENT outline (not the whole
                        column) - kept as its own tiny sibling rather than
                        a prop on the memoized bars SVG above, so moving
                        the mouse across hundreds of bars never forces
                        that whole (much more expensive) SVG to
                        re-render; only this one small box updates.
                        Nothing renders when the pointer is between bars,
                        above the stack, or over a zero-height segment -
                        activeSegment is undefined in all those cases. */}
                    {hoveredBar && activeSegment && (
                      <div
                        className="pointer-events-none absolute border-foreground/70"
                        style={{
                          left: hoveredBar.barX,
                          top: activeSegment.y,
                          width: hoveredBar.barWidth,
                          height: activeSegment.height,
                          borderWidth: ACTIVE_COLUMN_STROKE_WIDTH,
                        }}
                        aria-hidden
                      />
                    )}
                  </div>

                  <div className="relative mt-2 h-4 text-[0.6875rem] text-muted-foreground">
                    {visiblePoints.map((point, index) =>
                      index % labelEveryNWeeks === 0 || index === visiblePoints.length - 1 ? (
                        <span
                          key={point.weekEnding}
                          className="absolute -translate-x-1/2 whitespace-nowrap first:translate-x-0 last:-translate-x-full"
                          style={{ left: index * (barWidthPx + gapPx) + barWidthPx / 2 }}
                        >
                          {formatWeekLabel(point.weekEnding, isCompact)}
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
