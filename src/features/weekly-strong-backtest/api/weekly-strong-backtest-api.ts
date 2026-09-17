import { API_ROUTES, apiFetch } from "@/features/api";
import type {
  WeeklyStrongBacktestMembershipChangesResponse,
  WeeklyStrongBacktestStackedResponse,
  WeeklyStrongBacktestWeekDetailResponse,
} from "../types";

function withQuery(path: string, query: Record<string, string | undefined>) {
  const [basePath, existingQuery = ""] = path.split("?");
  const params = new URLSearchParams(existingQuery);
  for (const [key, value] of Object.entries(query)) {
    if (value) params.set(key, value);
  }
  const queryString = params.toString();
  return queryString ? `${basePath}?${queryString}` : basePath;
}

export function getWeeklyStrongBacktestStacked(input: { code: string }) {
  return apiFetch<WeeklyStrongBacktestStackedResponse>(
    API_ROUTES.weeklyStrongBacktest.stacked(input.code)
  );
}

export function getWeeklyStrongBacktestWeekDetail(input: { code: string; weekEnding: string }) {
  return apiFetch<WeeklyStrongBacktestWeekDetailResponse>(
    API_ROUTES.weeklyStrongBacktest.weekDetail(input.code, input.weekEnding)
  );
}

export function getWeeklyStrongBacktestMembershipChanges(input: {
  code: string;
  weekEnding?: string;
  lookback?: string;
}) {
  return apiFetch<WeeklyStrongBacktestMembershipChangesResponse>(
    withQuery(API_ROUTES.weeklyStrongBacktest.membershipChanges(input.code, input.weekEnding), {
      lookback: input.lookback,
    })
  );
}
