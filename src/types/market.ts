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
  exchange: string;
  close: number;
  changePct: number | null;
  volume: number;
  open?: number;
  hasMarketData?: boolean;
};

export type ScanBand = {
  id: string;
  startTime: string;
  endTime: string;
  label: string;
  latestMatched?: boolean;
  highlightTimes?: string[];
};
