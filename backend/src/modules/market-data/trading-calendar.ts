// Exchange-aware "what's the latest trading day that should already have a
// completed daily candle" logic. Nothing like this existed anywhere in the
// backend before - "today" was computed as naive UTC (getTodayDate() in
// market-data.service.ts), so there was no way to tell "stale but present"
// daily candles apart from fresh ones. This intentionally does not model
// exchange holidays (no holiday calendar exists in this codebase to draw
// from) - it only fixes the weekday/timezone gap.

const INDIA_EXCHANGE_PREFIXES = ["NSE", "BSE"];

function isIndiaExchange(exchange: string) {
  return INDIA_EXCHANGE_PREFIXES.some((prefix) => exchange.startsWith(prefix));
}

// Falls back to US market hours for every non-India exchange (which today
// means the US symbols plus EODHD's broader coverage) - not a real per-market
// timezone table, just enough to stop treating every exchange as UTC-midnight.
function getExchangeTimeZone(exchange: string): string {
  return isIndiaExchange(exchange) ? "Asia/Kolkata" : "America/New_York";
}

function getExchangeMarketClose(exchange: string) {
  return isIndiaExchange(exchange) ? { hour: 15, minute: 30 } : { hour: 16, minute: 0 };
}

const WEEKDAY_BY_SHORT_NAME: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

function getExchangeLocalParts(exchange: string, at: Date) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: getExchangeTimeZone(exchange),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    weekday: "short",
  });
  const parts = formatter.formatToParts(at);
  const lookup = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  const hour = Number(lookup("hour"));

  return {
    date: `${lookup("year")}-${lookup("month")}-${lookup("day")}`,
    weekday: WEEKDAY_BY_SHORT_NAME[lookup("weekday")] ?? 0,
    // Some ICU implementations report midnight as "24" under hour12: false.
    hour: hour === 24 ? 0 : hour,
    minute: Number(lookup("minute")),
  };
}

function shiftDateString(date: string, days: number) {
  const [year, month, day] = date.split("-").map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day));
  utcDate.setUTCDate(utcDate.getUTCDate() + days);
  return utcDate.toISOString().slice(0, 10);
}

// Returns the latest date (YYYY-MM-DD, in the exchange's own timezone) that
// should already have a completed daily candle: weekends are skipped, and
// "today" only counts once the exchange's market close has passed for the
// day - otherwise the previous trading day is still the latest complete one.
export function getLatestExpectedTradingDay(exchange: string, at: Date = new Date()): string {
  const local = getExchangeLocalParts(exchange, at);
  const marketClose = getExchangeMarketClose(exchange);
  const isAfterClose =
    local.hour > marketClose.hour ||
    (local.hour === marketClose.hour && local.minute >= marketClose.minute);

  let candidateDate = local.date;
  let candidateWeekday = local.weekday;
  if (!isAfterClose) {
    candidateDate = shiftDateString(candidateDate, -1);
    candidateWeekday = (candidateWeekday + 6) % 7;
  }

  while (candidateWeekday === 0 || candidateWeekday === 6) {
    candidateDate = shiftDateString(candidateDate, -1);
    candidateWeekday = (candidateWeekday + 6) % 7;
  }

  return candidateDate;
}
