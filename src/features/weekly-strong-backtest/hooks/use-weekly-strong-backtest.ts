"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/features/api";
import { useSessionStore } from "@/features/auth";
import {
  getWeeklyStrongBacktestStacked,
  getWeeklyStrongBacktestWeekDetail,
} from "../api/weekly-strong-backtest-api";

const BACKTEST_STALE_TIME_MS = 60 * 60_000;
const BACKTEST_GC_TIME_MS = 2 * 60 * 60_000;

export function useWeeklyStrongBacktestStacked(input: { code: string }) {
  const authStatus = useSessionStore((state) => state.status);
  const query = useQuery({
    queryKey: queryKeys.weeklyStrongBacktest.stacked(input),
    queryFn: () => getWeeklyStrongBacktestStacked(input),
    enabled: authStatus !== "unknown" && Boolean(input.code),
    retry: false,
    staleTime: BACKTEST_STALE_TIME_MS,
    gcTime: BACKTEST_GC_TIME_MS,

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

    placeholderData: (previousData) => previousData,
  });

  return { ...query, members: query.data?.members ?? [] };
}
