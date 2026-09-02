import type { Candle } from "@/types/market";

export type StockPriceRange = {
  low: number;
  high: number;
  current: number;
};

const FIFTY_TWO_WEEK_TRADING_DAYS = 252;

export function computeDayRange(candles: Candle[]): StockPriceRange | null {
  if (candles.length === 0) return null;
  const last = candles[candles.length - 1];
  return { low: last.low, high: last.high, current: last.close };
}

export function compute52WeekRange(candles: Candle[]): StockPriceRange | null {
  if (candles.length === 0) return null;
  const window = candles.slice(-FIFTY_TWO_WEEK_TRADING_DAYS);
  const low = Math.min(...window.map((candle) => candle.low));
  const high = Math.max(...window.map((candle) => candle.high));
  return { low, high, current: candles[candles.length - 1].close };
}

export type StockLatestChange = {
  price: number;
  changeAbs: number;
  changePct: number;
};

export function computeLatestChange(candles: Candle[]): StockLatestChange | null {
  if (candles.length === 0) return null;
  const last = candles[candles.length - 1];
  const prev = candles.length > 1 ? candles[candles.length - 2] : last;
  const changeAbs = last.close - prev.close;
  const changePct = prev.close ? (changeAbs / prev.close) * 100 : 0;
  return { price: last.close, changeAbs, changePct };
}
