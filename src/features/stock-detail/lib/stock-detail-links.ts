export function buildFullChartHref(symbol: string, exchange: string): string {
  const params = new URLSearchParams({ symbol, exchange });
  return `/charts?${params.toString()}`;
}
