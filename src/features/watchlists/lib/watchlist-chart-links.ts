export function buildWatchlistChartsHref(input: {
  watchlistId: string;
  symbol?: string;
  exchange?: string;
}): string {
  const params = new URLSearchParams();
  if (input.symbol) params.set("symbol", input.symbol);
  if (input.exchange) params.set("exchange", input.exchange);
  params.set("panel", "watchlist");
  params.set("watchlist", input.watchlistId);
  return `/charts?${params.toString()}`;
}
