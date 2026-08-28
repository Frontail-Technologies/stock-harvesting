"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/features/api";
import { useSessionStore } from "@/features/auth";
import {
  getWeeklyStrongBacktestStacked,
  getWeeklyStrongBacktestWeekDetail,
} from "../api/weekly-strong-backtest-api";

// Phase D.9 perf audit measured these as DB-only reads (~350-460ms,
// dominated by Neon round-trip latency, not computation - confirmed no
// evaluator/candle/provider calls anywhere in their call path) that only
// ever change on a completed weekly generation or an explicit admin
// rebuild - nothing on a normal page load ever writes new rows here. A
// staleTime this long is a direct match for how infrequently the
// underlying data actually changes, not an arbitrary number reused from
// elsewhere.
const BACKTEST_STALE_TIME_MS = 60 * 60_000;
const BACKTEST_GC_TIME_MS = 2 * 60 * 60_000;

// Always reads persisted history - this never triggers the evaluator (see
// the Phase C2 report). A "not generated yet" segment just comes back with
// `generated: false` and an empty points array, not an error.
export function useWeeklyStrongBacktestStacked(input: { code: string }) {
  const authStatus = useSessionStore((state) => state.status);
  const query = useQuery({
    queryKey: queryKeys.weeklyStrongBacktest.stacked(input),
    queryFn: () => getWeeklyStrongBacktestStacked(input),
    enabled: authStatus !== "unknown" && Boolean(input.code),
    retry: false,
    staleTime: BACKTEST_STALE_TIME_MS,
    gcTime: BACKTEST_GC_TIME_MS,
    // A segment switch changes `code` (this query's key) - keep the
    // previous segment's chart visible while the new one loads instead of
    // dropping straight to the section's own loading state (Phase D.9 #11).
    placeholderData: (previousData) => previousData,
  });

  return {
    ...query,
    generated: query.data?.generated ?? false,
    points: query.data?.points ?? [],
    membershipNote: query.data?.membershipNote,
  };
}

export function useWeeklyStrongBacktestWeekDetail(input: { code: string; weekEnding: string | null }) {
  const authStatus = useSessionStore((state) => state.status);
  const query = useQuery({
    queryKey: queryKeys.weeklyStrongBacktest.weekDetail({
      code: input.code,
      weekEnding: input.weekEnding ?? "",
    }),
    queryFn: () =>
      getWeeklyStrongBacktestWeekDetail({ code: input.code, weekEnding: input.weekEnding as string }),
    enabled: authStatus !== "unknown" && Boolean(input.code) && Boolean(input.weekEnding),
    retry: false,
    staleTime: BACKTEST_STALE_TIME_MS,
    gcTime: BACKTEST_GC_TIME_MS,
    // Picking a different week (via the week-select dropdown, or clicking
    // a different bar) changes this query's key - keep the previously
    // selected week's rows visible while the new week loads rather than
    // blanking the table on every click (Phase D.9 #11/#12).
    placeholderData: (previousData) => previousData,
  });

  return { ...query, members: query.data?.members ?? [] };
}
