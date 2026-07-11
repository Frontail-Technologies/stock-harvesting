export type Candle = {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type Stock = {
  symbol: string;
  name: string;
  exchange: "NSE";
  close: number;
  changePct: number;
  volume: number;
};

// A narrow, full-height highlight marking a detected signal window (e.g. a
// rally leg or the recent period where a scan condition held true). Spans a
// short time range only — never the full calculation lookback.
export type ScanBand = {
  id: string;
  startTime: string;
  endTime: string;
  label: string;
};

// A price-range box measuring an actual price move within a scan band's
// time range (low/high, % gain, bar count).
export type MeasurementBox = {
  id: string;
  startTime: string;
  endTime: string;
  lowPrice: number;
  highPrice: number;
  label: string;
  percent: string;
  bars: string;
};
