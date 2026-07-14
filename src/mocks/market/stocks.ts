import type { Stock } from "@/types/market";

export const mockStocks: Stock[] = [
  { symbol: "RELIANCE", name: "Reliance Industries Ltd", exchange: "NSE", close: 2950.75, changePct: 1.24, volume: 5_412_300 },
  { symbol: "HDFCBANK", name: "HDFC Bank Ltd", exchange: "NSE", close: 1678.90, changePct: 0.68, volume: 8_213_500 },
  { symbol: "ICICIBANK", name: "ICICI Bank Ltd", exchange: "NSE", close: 1124.35, changePct: -0.42, volume: 6_734_900 },
  { symbol: "TCS", name: "Tata Consultancy Services Ltd", exchange: "NSE", close: 3642.20, changePct: 0.95, volume: 2_105_600 },
  { symbol: "INFY", name: "Infosys Ltd", exchange: "NSE", close: 1918.45, changePct: 1.31, volume: 4_876_200 },
  { symbol: "HINDUNILVR", name: "Hindustan Unilever Ltd", exchange: "NSE", close: 2412.10, changePct: -0.18, volume: 1_320_400 },
  { symbol: "ITC", name: "ITC Ltd", exchange: "NSE", close: 468.55, changePct: 0.52, volume: 9_845_700 },
  { symbol: "KOTAKBANK", name: "Kotak Mahindra Bank Ltd", exchange: "NSE", close: 1789.30, changePct: -0.75, volume: 3_198_200 },
  { symbol: "LT", name: "Larsen & Toubro Ltd", exchange: "NSE", close: 3542.60, changePct: 2.10, volume: 2_654_800 },
  { symbol: "BAJFINANCE", name: "Bajaj Finance Ltd", exchange: "NSE", close: 6987.15, changePct: 1.85, volume: 1_432_900 },
  { symbol: "AXISBANK", name: "Axis Bank Ltd", exchange: "NSE", close: 1142.80, changePct: 0.31, volume: 5_986_300 },
  { symbol: "BHARTIARTL", name: "Bharti Airtel Ltd", exchange: "NSE", close: 1567.40, changePct: 1.02, volume: 4_213_700 },
  { symbol: "ASIANPAINT", name: "Asian Paints Ltd", exchange: "NSE", close: 2854.90, changePct: -1.12, volume: 987_400 },
  { symbol: "MARUTI", name: "Maruti Suzuki India Ltd", exchange: "NSE", close: 11245.60, changePct: 0.44, volume: 512_300 },
  { symbol: "TITAN", name: "Titan Company Ltd", exchange: "NSE", close: 3421.75, changePct: 1.67, volume: 1_098_600 },
  { symbol: "ULTRACEMCO", name: "UltraTech Cement Ltd", exchange: "NSE", close: 10876.20, changePct: -0.29, volume: 345_800 },
  { symbol: "NTPC", name: "NTPC Ltd", exchange: "NSE", close: 356.85, changePct: 0.88, volume: 12_453_100 },
];

export const popularSearchSymbols = ["INFY", "RELIANCE", "TCS", "HDFCBANK", "ICICIBANK"];
