import { API_ROUTES, apiFetch } from "@/features/api";
import type {
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
