"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/features/api";
import { useSessionStore } from "@/features/auth";
import {
  getWeeklyStrongBacktestMembershipChanges,
  getWeeklyStrongBacktestStacked,
  getWeeklyStrongBacktestWeekDetail,
} from "../api/weekly-strong-backtest-api";

const BACKTEST_STALE_TIME_MS = 60 * 60_000;
const BACKTEST_GC_TIME_MS = 2 * 60 * 60_000;
// The In/Out diff tracks the in-progress week, so it must refresh as new daily candles land.
const MEMBERSHIP_CHANGES_STALE_TIME_MS = 2 * 60_000;

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

// weekEnding is optional - when omitted, the backend resolves and returns
// the current week itself (it always derives its own week internally; a
// caller-supplied weekEnding is only used as a consistency check against
// that). Not requiring it here lets this query fire immediately instead of
// waiting on some other query (e.g. the Harvest Result list) to resolve a
// week first - that dependency used to make this panel visibly slower than
// it needed to be.
export function useWeeklyStrongBacktestMembershipChanges(input: {
  code: string;
  weekEnding?: string | null;
  lookback?: string;
}) {
  const authStatus = useSessionStore((state) => state.status);
  const query = useQuery({
    queryKey: queryKeys.weeklyStrongBacktest.membershipChanges({
      code: input.code,
      weekEnding: input.weekEnding ?? "",
      lookback: input.lookback,
    }),
    queryFn: () =>
      getWeeklyStrongBacktestMembershipChanges({
        code: input.code,
        weekEnding: input.weekEnding ?? undefined,
        lookback: input.lookback,
      }),
    enabled: authStatus !== "unknown" && Boolean(input.code),
    retry: false,
    staleTime: MEMBERSHIP_CHANGES_STALE_TIME_MS,
    refetchInterval: MEMBERSHIP_CHANGES_STALE_TIME_MS,
    gcTime: BACKTEST_GC_TIME_MS,

    placeholderData: (previousData) => previousData,
  });

  return {
    ...query,
    available: query.data?.available ?? false,
    inProgress: query.data?.inProgress ?? false,
    asOf: query.data?.asOf ?? null,
    weekEnding: query.data?.weekEnding ?? null,
    previousWeekEnding: query.data?.previousWeekEnding ?? null,
    enteredStocks: query.data?.enteredStocks ?? [],
    exitedStocks: query.data?.exitedStocks ?? [],
  };
}
