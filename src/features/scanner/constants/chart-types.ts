export const SCANNER_CHART_TYPES = [
  "candlestick",
  "bar-ohlc",
  "bar-hlc",
  "line",
  "line-markers",
  "step-line",
  "hollow-candles",
] as const;

export const SCANNER_CHART_TYPE_LABEL = {
  candlestick: "Candlestick",
  "bar-ohlc": "Bar OHLC",
  "bar-hlc": "Bar HLC",
  line: "Line",
  "line-markers": "Line with markers",
  "step-line": "Step line",
  "hollow-candles": "Hollow Candles",
} as const;
