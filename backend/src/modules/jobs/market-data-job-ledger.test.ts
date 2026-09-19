import { describe, expect, it } from "vitest";

import { BACKGROUND_JOB_RUN_STATUS } from "../../shared/constants";
import {
  calculateHistoricalCoverage,
  expectedMarketDataJobsForDate,
  isExpectedJobMissed,
  shouldQueueHistoricalCatchUp,
} from "./market-data-job-ledger";

describe("market-data job ledger", () => {
  it("calculates canonical coverage and returns only missing symbols", () => {
    const coverage = calculateHistoricalCoverage(
      [
        { instrumentId: "a", symbol: "AAA" },
        { instrumentId: "b", symbol: "BBB" },
        { instrumentId: "c", symbol: "CCC" },
      ],
      ["a", "c"],
    );

    expect(coverage).toEqual({
      totalExpected: 3,
      completed: 2,
      missing: 1,
      coveragePct: 66.67,
      missingSymbols: ["BBB"],
      exempt: 0,
    });
  });

  it("does not report empty universes as complete", () => {
    expect(calculateHistoricalCoverage([], [])).toEqual({
      totalExpected: 0,
      completed: 0,
      missing: 0,
      coveragePct: 0,
      missingSymbols: [],
      exempt: 0,
    });
  });

  it("server and worker down all Friday; Saturday materializes Friday jobs as missed and requires catch-up", () => {
    const saturdayStartup = new Date("2026-09-19T04:30:00.000Z");
    const jobs = expectedMarketDataJobsForDate("BSE", "2026-09-18");

    expect(jobs.map((job) => job.jobType)).toEqual([
      "daily_candle_morning",
      "daily_candle_post_market",
      "daily_candle_retry",
    ]);
    expect(jobs.every((job) => isExpectedJobMissed(job.status, job.scheduledAt, saturdayStartup))).toBe(true);
    expect(shouldQueueHistoricalCatchUp({ missing: 12 })).toBe(true);
  });

  it("does not expect a newly listed instrument before its first canonical candle", () => {
    const coverage = calculateHistoricalCoverage(
      [
        { instrumentId: "old", symbol: "OLD", firstCandleDate: "2020-01-01" },
        { instrumentId: "new", symbol: "NEW" },
      ],
      ["old"],
      { tradingDate: "2026-09-18", exemptSymbols: ["NEW"] },
    );
    expect(coverage).toMatchObject({ totalExpected: 1, completed: 1, missing: 0, exempt: 1 });
  });

  it("does not let a non-production-eligible instrument block completion", () => {
    const coverage = calculateHistoricalCoverage(
      [
        { instrumentId: "active", symbol: "ACTIVE", productionEligible: true },
        { instrumentId: "retired", symbol: "RETIRED", productionEligible: false },
      ],
      ["active"],
      { tradingDate: "2026-09-18" },
    );
    expect(coverage).toMatchObject({ totalExpected: 1, completed: 1, missing: 0, exempt: 1 });
  });

  it("keeps a genuinely missing eligible instrument incomplete", () => {
    const coverage = calculateHistoricalCoverage(
      [{ instrumentId: "missing", symbol: "MISSING", firstCandleDate: "2020-01-01" }],
      [],
      { tradingDate: "2026-09-18" },
    );
    expect(coverage).toMatchObject({ totalExpected: 1, completed: 0, missing: 1, missingSymbols: ["MISSING"], exempt: 0 });
    expect(shouldQueueHistoricalCatchUp(coverage)).toBe(true);
  });

  it("marks only overdue pending or queued jobs as missed", () => {
    const scheduledAt = new Date("2026-09-18T11:30:00.000Z");
    const withinGrace = new Date("2026-09-18T11:40:00.000Z");
    const overdue = new Date("2026-09-18T11:46:00.000Z");

    expect(isExpectedJobMissed(BACKGROUND_JOB_RUN_STATUS.pending, scheduledAt, withinGrace)).toBe(false);
    expect(isExpectedJobMissed(BACKGROUND_JOB_RUN_STATUS.queued, scheduledAt, overdue)).toBe(true);
    expect(isExpectedJobMissed(BACKGROUND_JOB_RUN_STATUS.running, scheduledAt, overdue)).toBe(false);
    expect(isExpectedJobMissed(BACKGROUND_JOB_RUN_STATUS.completed, scheduledAt, overdue)).toBe(false);
  });
});
