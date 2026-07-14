export type WhitespaceBar = { time: string };

type WhitespaceTimeframe = "1D" | "1W" | "1M";

function addFutureStep(dateStr: string, timeframe: WhitespaceTimeframe): string {
  const date = new Date(`${dateStr}T00:00:00Z`);
  if (timeframe === "1D") {
    date.setUTCDate(date.getUTCDate() + 1);
  } else if (timeframe === "1W") {
    date.setUTCDate(date.getUTCDate() + 7);
  } else {
    date.setUTCMonth(date.getUTCMonth() + 1);
  }
  return date.toISOString().slice(0, 10);
}

export function generateFutureWhitespaceBars(
  lastTime: string,
  count: number,
  timeframe: WhitespaceTimeframe
): WhitespaceBar[] {
  const bars: WhitespaceBar[] = [];
  let current = lastTime;
  for (let i = 0; i < count; i++) {
    current = addFutureStep(current, timeframe);
    bars.push({ time: current });
  }
  return bars;
}
