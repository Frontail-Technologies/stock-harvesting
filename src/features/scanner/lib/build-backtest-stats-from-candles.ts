import type { Candle } from "@/types/market";
import type { ScannerBacktestStats } from "../api/scanner-api.types";
import {
  getEffectiveScannerLookbackWeeks,
  getScannerLookbackWeeks,
  type ScannerLookbackMultiplier,
} from "../types";

const NEAR_HIGH_THRESHOLD = 0.85;

type Trade = {
  entryIndex: number;
  exitIndex: number;
  returnPct: number;
};

export function buildBacktestStatsFromCandles(
  candles: Candle[],
  lookbackMultiplier: ScannerLookbackMultiplier
): ScannerBacktestStats | null {
  const sortedCandles = [...candles].sort((a, b) => a.time.localeCompare(b.time));
  const lookbackWeeks = getEffectiveScannerLookbackWeeks(
    getScannerLookbackWeeks(lookbackMultiplier),
    sortedCandles.length
  );

  if (!lookbackWeeks || sortedCandles.length < 2) return null;

  const highs = sortedCandles.map((candle) => candle.high);
  const rollingHighs = rollingMax(highs, lookbackWeeks);
  const matched = sortedCandles.map(
    (candle, index) => candle.close >= rollingHighs[index] * NEAR_HIGH_THRESHOLD
  );
  const trades = buildTrades(sortedCandles, matched);

  if (trades.length === 0) {
    return {
      hitRatePct: 0,
      totalReturnPct: 0,
      maxDrawdownPct: 0,
      profitFactor: null,
      signalsGenerated: 0,
      avgHoldingDays: 0,
      largestWinnerPct: 0,
      largestLoserPct: 0,
    };
  }

  const winners = trades.filter((trade) => trade.returnPct > 0);
  const losers = trades.filter((trade) => trade.returnPct <= 0);
  let equity = 100;
  let peak = 100;
  let maxDrawdownPct = 0;

  for (const trade of trades) {
    equity *= 1 + trade.returnPct / 100;
    peak = Math.max(peak, equity);
    maxDrawdownPct = Math.max(maxDrawdownPct, ((peak - equity) / peak) * 100);
  }

  const grossProfit = winners.reduce((sum, trade) => sum + trade.returnPct, 0);
  const grossLoss = Math.abs(losers.reduce((sum, trade) => sum + trade.returnPct, 0));

  return {
    hitRatePct: (winners.length / trades.length) * 100,
    totalReturnPct: equity - 100,
    maxDrawdownPct,
    profitFactor: grossLoss === 0 ? null : grossProfit / grossLoss,
    signalsGenerated: trades.length,
    avgHoldingDays:
      trades.reduce((sum, trade) => sum + (trade.exitIndex - trade.entryIndex) * 7, 0) /
      trades.length,
    largestWinnerPct: Math.max(...trades.map((trade) => trade.returnPct)),
    largestLoserPct: Math.min(...trades.map((trade) => trade.returnPct)),
  };
}

function buildTrades(candles: Candle[], matched: boolean[]) {
  const trades: Trade[] = [];
  let entryIndex: number | null = null;

  for (let index = 0; index < candles.length; index++) {
    const isMatched = matched[index];
    const wasMatched = index > 0 && matched[index - 1];

    if (isMatched && !wasMatched) {
      entryIndex = index;
    } else if (!isMatched && wasMatched && entryIndex !== null) {
      trades.push(buildTrade(candles, entryIndex, index));
      entryIndex = null;
    }
  }

  if (entryIndex !== null) {
    trades.push(buildTrade(candles, entryIndex, candles.length - 1));
  }

  return trades;
}

function buildTrade(candles: Candle[], entryIndex: number, exitIndex: number): Trade {
  const entryClose = candles[entryIndex].close;
  const exitClose = candles[exitIndex].close;

  return {
    entryIndex,
    exitIndex,
    returnPct: entryClose === 0 ? 0 : ((exitClose - entryClose) / entryClose) * 100,
  };
}

function rollingMax(values: number[], windowSize: number) {
  const result = new Array<number>(values.length);
  const deque: number[] = [];

  for (let index = 0; index < values.length; index++) {
    while (deque.length > 0 && values[deque[deque.length - 1]] <= values[index]) {
      deque.pop();
    }

    deque.push(index);
    const windowStart = index - windowSize + 1;

    while (deque[0] < windowStart) {
      deque.shift();
    }

    result[index] = values[deque[0]];
  }

  return result;
}
