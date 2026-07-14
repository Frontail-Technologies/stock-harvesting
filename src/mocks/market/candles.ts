import type { Candle, ScanBand } from "@/types/market";

const SEED = 20250106;
const NUM_CANDLES = 260;
const START_PRICE = 850;
const FIXED_END_DATE = "2025-01-06";

type RallyWindow = {
  start: number;
  length: number;
  driftBoost: number;
};

const RALLY_WINDOW_BASE_LENGTH = 160;
const RALLY_WINDOW_OFFSET = NUM_CANDLES - RALLY_WINDOW_BASE_LENGTH;

const RALLY_WINDOWS: RallyWindow[] = [
  { start: 18 + RALLY_WINDOW_OFFSET, length: 10, driftBoost: 0.045 },
  { start: 55 + RALLY_WINDOW_OFFSET, length: 8, driftBoost: 0.05 },
  { start: 92 + RALLY_WINDOW_OFFSET, length: 12, driftBoost: 0.04 },
  { start: 130 + RALLY_WINDOW_OFFSET, length: 9, driftBoost: 0.055 },
];

function mulberry32(seed: number) {
  let state = seed;
  return function random() {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function addDaysUTC(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function findRallyWindow(index: number): RallyWindow | undefined {
  return RALLY_WINDOWS.find((w) => index >= w.start && index < w.start + w.length);
}

function generateCandles(): Candle[] {
  const random = mulberry32(SEED);
  const startDate = addDaysUTC(FIXED_END_DATE, -7 * (NUM_CANDLES - 1));

  const candles: Candle[] = [];
  let price = START_PRICE;
  let currentDate = startDate;

  for (let i = 0; i < NUM_CANDLES; i++) {
    const open = price;
    const rally = findRallyWindow(i);
    const baseDrift = 0.004;
    const drift = rally ? rally.driftBoost : baseDrift;
    const noise = (random() - 0.5) * 0.05;
    const changePct = drift + noise;

    const close = Math.max(open * (1 + changePct), 1);
    const wickUp = random() * 0.02 * open;
    const wickDown = random() * 0.02 * open;
    const high = Math.max(open, close) + wickUp;
    const low = Math.max(Math.min(open, close) - wickDown, 0.5);

    const moveSize = Math.abs(close - open) / open;
    const baseVolume = 3_000_000 + moveSize * 80_000_000;
    const volume = Math.round(baseVolume * (0.7 + random() * 0.6));

    candles.push({
      time: currentDate,
      open: round2(open),
      high: round2(high),
      low: round2(low),
      close: round2(close),
      volume,
    });

    price = close;
    currentDate = addDaysUTC(currentDate, 7);
  }

  return candles;
}

const MAX_SCAN_BANDS = 4;

type WindowStats = {
  index: number;
  slice: Candle[];
  percentValue: number;
};

function computeWindowStats(candles: Candle[]): WindowStats[] {
  return RALLY_WINDOWS.map((window, index) => {
    const slice = candles.slice(window.start, window.start + window.length);
    const lowPrice = Math.min(...slice.map((c) => c.low));
    const highPrice = Math.max(...slice.map((c) => c.high));
    const percentValue = ((highPrice - lowPrice) / lowPrice) * 100;
    return { index, slice, percentValue };
  });
}

function deriveScanBands(stats: WindowStats[]): ScanBand[] {
  return [...stats]
    .sort((a, b) => b.percentValue - a.percentValue)
    .slice(0, MAX_SCAN_BANDS)
    .sort((a, b) => a.index - b.index)
    .map((stat) => ({
      id: `band-${stat.index + 1}`,
      startTime: stat.slice[0].time,
      endTime: stat.slice[stat.slice.length - 1].time,
      label: "Scan Match",
      highlightTimes: stat.slice.map((candle) => candle.time),
    }));
}

export const mockWeeklyCandles: Candle[] = generateCandles();

const windowStats = computeWindowStats(mockWeeklyCandles);

export const mockScanBands: ScanBand[] = deriveScanBands(windowStats);
