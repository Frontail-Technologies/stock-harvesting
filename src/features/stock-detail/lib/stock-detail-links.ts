export function buildFullChartHref(symbol: string, exchange: string): string {
  const params = new URLSearchParams({ symbol, exchange });
  return `/charts?${params.toString()}`;
}

export function buildStockDetailHref(symbol: string, exchange: string): string {
  return `/stocks/${encodeURIComponent(exchange)}/${encodeURIComponent(symbol)}`;
}
