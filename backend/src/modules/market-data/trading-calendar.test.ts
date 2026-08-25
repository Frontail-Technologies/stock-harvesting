import { describe, expect, it } from "vitest";

import { getLatestExpectedTradingDay } from "./trading-calendar";

// NSE/BSE close at 15:30 IST (Asia/Kolkata, UTC+5:30) = 10:00 UTC.
describe("getLatestExpectedTradingDay - India exchanges (NSE)", () => {
  it("returns today once the market close has passed on a weekday", () => {
    // 2026-01-06 is a Tuesday. 10:05 UTC = 15:35 IST.
    const at = new Date("2026-01-06T10:05:00Z");
    expect(getLatestExpectedTradingDay("NSE", at)).toBe("2026-01-06");
  });

  it("returns the previous weekday while the market is still open", () => {
    // 09:00 UTC = 14:30 IST, before the 15:30 close.
    const at = new Date("2026-01-06T09:00:00Z");
    expect(getLatestExpectedTradingDay("NSE", at)).toBe("2026-01-05");
  });

  it("skips the weekend when the previous day would be a Sunday/Saturday", () => {
    // Monday 2026-01-05, before close - the prior trading day is Friday
    // 2026-01-02, not Sunday 2026-01-04.
    const at = new Date("2026-01-05T09:00:00Z");
    expect(getLatestExpectedTradingDay("NSE", at)).toBe("2026-01-02");
  });

  it("resolves to Friday when evaluated on a Saturday", () => {
    const at = new Date("2026-01-10T12:00:00Z");
    expect(getLatestExpectedTradingDay("NSE", at)).toBe("2026-01-09");
  });

  it("resolves to Friday when evaluated on a Sunday", () => {
    const at = new Date("2026-01-11T03:00:00Z");
    expect(getLatestExpectedTradingDay("NSE", at)).toBe("2026-01-09");
  });
});

// US-style exchanges close at 16:00 America/New_York (UTC-5 in January) = 21:00 UTC.
describe("getLatestExpectedTradingDay - non-India exchanges (US)", () => {
  it("returns today once the market close has passed on a weekday", () => {
    const at = new Date("2026-01-06T21:05:00Z");
    expect(getLatestExpectedTradingDay("US", at)).toBe("2026-01-06");
  });

  it("returns the previous weekday while the market is still open", () => {
    const at = new Date("2026-01-06T20:00:00Z");
    expect(getLatestExpectedTradingDay("US", at)).toBe("2026-01-05");
  });
});
