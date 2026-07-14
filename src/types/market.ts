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

export type ScanBand = {
  id: string;
  startTime: string;
  endTime: string;
  label: string;
  highlightTimes?: string[];
};
