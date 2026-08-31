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

const MOBILE_BREAKPOINT_PX = 480;
const MAGNIFIER_SIZE_PX = 108;
const MAGNIFIER_NEIGHBOR_RADIUS = 2;

const MAGNIFIER_TARGET_BAR_WIDTH_PX = 14;
const MAGNIFIER_MIN_ZOOM = 2;
const MAGNIFIER_MAX_ZOOM = 30;
const MAGNIFIER_GAP_FROM_POINTER_PX = 16;

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

  box: MagnifierBox;
}) {
  const clipId = useId();
  const radius = MAGNIFIER_SIZE_PX / 2;
  const start = Math.max(0, centerIndex - MAGNIFIER_NEIGHBOR_RADIUS);
  const end = Math.min(geometry.length - 1, centerIndex + MAGNIFIER_NEIGHBOR_RADIUS);
  const cluster = geometry.slice(start, end + 1);

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

        <circle cx={radius} cy={radius} r={5.5} fill="none" stroke="black" strokeOpacity={0.35} strokeWidth={3} />
        <circle cx={radius} cy={radius} r={5.5} fill="none" stroke="white" strokeWidth={1.5} />
        <circle cx={radius} cy={radius} r={1.5} fill="white" stroke="black" strokeOpacity={0.35} strokeWidth={0.5} />
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
  const labelEveryNWeeks = slotCount <= 60 ? 4 : slotCount <= 170 ? 13 : 17;

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
                  centerIndex={hover.index}
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
