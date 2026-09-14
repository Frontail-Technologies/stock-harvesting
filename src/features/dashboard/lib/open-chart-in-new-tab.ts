// Dashboard stock rows (Harvest Results, Stocks In/Out, Backtest week
// detail) open the Charts page in a new tab rather than navigating the
// dashboard away - same chart URL/query params as before, just opened via
// window.open with the noopener/noreferrer equivalent of an anchor's
// target="_blank" rel="noopener noreferrer" instead of router.push.
export function buildChartUrl(symbol: string, exchange: string): string {
  return `/charts?symbol=${encodeURIComponent(symbol)}&exchange=${encodeURIComponent(exchange)}`;
}

export function openChartInNewTab(symbol: string, exchange: string): void {
  window.open(buildChartUrl(symbol, exchange), "_blank", "noopener,noreferrer");
}
