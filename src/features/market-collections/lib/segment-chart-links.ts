export function buildSegmentChartsHref(input: {
  segmentCode: string;
  symbol?: string;
  exchange?: string;
}): string {
  const params = new URLSearchParams();
  if (input.symbol) params.set("symbol", input.symbol);
  if (input.exchange) params.set("exchange", input.exchange);
  params.set("panel", "segment");
  params.set("segment", input.segmentCode);
  return `/charts?${params.toString()}`;
}
