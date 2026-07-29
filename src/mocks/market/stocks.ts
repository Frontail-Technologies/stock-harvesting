import type { Stock } from "@/types/market";

export const mockStocks: Stock[] = [
  { symbol: "AAPL", name: "Apple Inc.", exchange: "US", close: 224.31, changePct: 0.84, volume: 52_814_300 },
  { symbol: "MSFT", name: "Microsoft Corporation", exchange: "US", close: 504.27, changePct: 0.52, volume: 22_193_800 },
  { symbol: "NVDA", name: "NVIDIA Corporation", exchange: "US", close: 171.38, changePct: 1.76, volume: 156_421_500 },
  { symbol: "GOOGL", name: "Alphabet Inc.", exchange: "US", close: 185.06, changePct: -0.24, volume: 31_776_400 },
  { symbol: "AMZN", name: "Amazon.com Inc.", exchange: "US", close: 226.13, changePct: 1.08, volume: 41_212_900 },
  { symbol: "META", name: "Meta Platforms Inc.", exchange: "US", close: 712.29, changePct: 0.67, volume: 13_988_100 },
  { symbol: "TSLA", name: "Tesla Inc.", exchange: "US", close: 329.65, changePct: -1.42, volume: 98_427_600 },
  { symbol: "JPM", name: "JPMorgan Chase & Co.", exchange: "US", close: 290.18, changePct: 0.31, volume: 9_486_200 },
  { symbol: "V", name: "Visa Inc.", exchange: "US", close: 349.72, changePct: 0.19, volume: 6_184_900 },
  { symbol: "UNH", name: "UnitedHealth Group Inc.", exchange: "US", close: 517.36, changePct: -0.36, volume: 4_315_700 },
  { symbol: "XOM", name: "Exxon Mobil Corporation", exchange: "US", close: 113.52, changePct: 0.74, volume: 15_806_100 },
  { symbol: "AVGO", name: "Broadcom Inc.", exchange: "US", close: 284.09, changePct: 1.21, volume: 24_971_300 },
];

export const popularSearchSymbols = ["AAPL", "MSFT", "NVDA", "GOOGL", "AMZN"];
