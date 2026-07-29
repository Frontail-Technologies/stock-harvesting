"use client";

import { useMemo, useState } from "react";
import { Spinner } from "@/components/ui/spinner";
import { useCollectionWeeklyStrongStocksBacktest } from "@/features/market-collections";

const LABEL_COUNT = 8;

function formatMonthLabel(date: string) {
  return new Date(date).toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
}

function formatFullDate(date: string) {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function buildLabelIndices(count: number) {
  const indices = new Set<number>();
  if (count === 0) return indices;

  const step = Math.max(1, Math.floor(count / LABEL_COUNT));
  for (let index = 0; index < count; index += step) indices.add(index);
  indices.add(count - 1);
  return indices;
}

export function WeeklyStrongBacktestChart({ code }: { code: string }) {
  const { points, isLoading, isError } = useCollectionWeeklyStrongStocksBacktest({ code });
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const maxCount = useMemo(() => Math.max(...points.map((point) => point.passCount), 1), [points]);
  const labelIndices = useMemo(() => buildLabelIndices(points.length), [points.length]);
  const hovered = hoveredIndex !== null ? points[hoveredIndex] : null;

  return (
    <section className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
      <div>
        <h2 className="text-sm font-semibold text-foreground">Backtest History</h2>
        <p className="text-xs text-muted-foreground">
          Collection members passing the Weekly Strong screen, by week (last 3 years)
        </p>
      </div>

      {isLoading ? (
        <div className="flex h-56 items-center justify-center">
          <Spinner size="sm" />
        </div>
      ) : isError || points.length === 0 ? (
        <div className="flex h-56 items-center justify-center text-center text-sm text-muted-foreground">
          Not enough historical data to build a backtest yet.
        </div>
      ) : (
        <div className="relative">
          {hovered && hoveredIndex !== null && (
            <div
              className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 -translate-y-full rounded-md border border-border bg-popover px-2 py-1 text-xs whitespace-nowrap text-popover-foreground shadow-md"
              style={{ left: `${((hoveredIndex + 0.5) / points.length) * 100}%` }}
            >
              <div className="font-semibold text-foreground">{hovered.passCount} stocks</div>
              <div className="text-muted-foreground">{formatFullDate(hovered.date)}</div>
            </div>
          )}

          <div className="flex h-56 items-end gap-px">
            {points.map((point, index) => {
              const heightPct =
                point.passCount === 0 ? 0 : Math.max((point.passCount / maxCount) * 100, 4);

              return (
                <div
                  key={point.date}
                  className="group flex h-full flex-1 items-end"
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex((current) => (current === index ? null : current))}
                >
                  <div
                    className={`w-full origin-bottom rounded-t-[1px] transition-all duration-100 ${
                      hoveredIndex === index
                        ? "scale-y-105 bg-primary"
                        : "bg-primary/45 group-hover:bg-primary/70"
                    }`}
                    style={{ height: `${heightPct}%` }}
                  />
                </div>
              );
            })}
          </div>

          <div className="relative mt-1.5 h-4 text-[0.625rem] text-muted-foreground">
            {[...labelIndices].map((index) => (
              <span
                key={points[index]?.date}
                className="absolute -translate-x-1/2 whitespace-nowrap"
                style={{ left: `${((index + 0.5) / points.length) * 100}%` }}
              >
                {formatMonthLabel(points[index].date)}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
