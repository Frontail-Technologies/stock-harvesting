import { Info } from "lucide-react";

export function StockMockDataNotice() {
  return (
    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <Info className="size-3.5 shrink-0" />
      Fundamentals, financials, and company data below are preview content while real
      integrations are finalized.
    </p>
  );
}
