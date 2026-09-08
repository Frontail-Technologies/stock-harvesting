import { API_ROUTES, apiFetch } from "@/features/api";
import type {
  WeeklyStrongBacktestMembershipChangesResponse,
  WeeklyStrongBacktestStackedResponse,
  WeeklyStrongBacktestWeekDetailResponse,
} from "../types";

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

export function getWeeklyStrongBacktestMembershipChanges(input: { code: string; weekEnding: string }) {
  return apiFetch<WeeklyStrongBacktestMembershipChangesResponse>(
    API_ROUTES.weeklyStrongBacktest.membershipChanges(input.code, input.weekEnding)
  );
}
