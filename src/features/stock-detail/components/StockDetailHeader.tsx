import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatCurrencyValue } from "@/features/currency/lib/currency-formatters";
import { ShareMenu } from "@/features/scanner/components/ShareMenu";
import type { Stock } from "@/types/market";
import { changeColorClass, formatSignedChange } from "@/utils/formatters";
import { getAvatarInitials } from "@/utils/api-client";
import { cn } from "@/utils/cn";
import { StockDetailWatchlistAction } from "./StockDetailWatchlistAction";

type StockDetailHeaderProps = {
  stock: Stock;
  companyName: string;
  price: number | null;
  changeAbs: number | null;
  changePct: number | null;
  sector: string;
  industry: string;
  currency: string;
};

export function StockDetailHeader({
  stock,
  companyName,
  price,
  changeAbs,
  changePct,
  sector,
  industry,
  currency,
}: StockDetailHeaderProps) {
  const initials = getAvatarInitials(companyName || stock.symbol, stock.symbol);
  const hasChange = changeAbs !== null && changePct !== null;
  const signed = hasChange ? formatSignedChange(changeAbs, changePct) : null;

  return (
    <header className="flex flex-col gap-5">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-muted-foreground">
        <Link href="/charts" className="hover:text-foreground">
          Charts
        </Link>
        <ChevronRight className="size-3" />
        <span>{stock.exchange}</span>
        <ChevronRight className="size-3" />
        <span className="font-medium text-foreground">{stock.symbol}</span>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="flex min-w-0 items-center gap-3.5">
          <Avatar className="size-12 shrink-0 rounded-lg">
            <AvatarFallback className="rounded-lg bg-primary/15 text-sm font-semibold text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0">
            <h1 className="truncate text-2xl font-semibold tracking-tight text-foreground sm:text-[1.75rem]">
              {companyName || stock.symbol}
            </h1>
            <p className="mt-1 truncate text-sm text-muted-foreground">
              {stock.symbol} &middot; {stock.exchange} &middot; {sector} &middot; {industry}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <StockDetailWatchlistAction
            exchange={stock.exchange}
            symbol={stock.symbol}
            className="size-9 rounded-md border border-border"
          />
          <ShareMenu stock={stock} className="size-9 rounded-md border border-border" />
        </div>
      </div>

      <div className="flex flex-wrap items-baseline gap-3 tabular-nums">
        <span className="text-4xl font-bold tracking-tight text-foreground">
          {price !== null ? formatCurrencyValue(price, currency) : "—"}
        </span>
        {signed && (
          <span className={cn("text-base font-semibold", changeColorClass(signed.isPositive))}>
            {signed.text}
          </span>
        )}
        {!hasChange && (
          <span className="text-sm text-muted-foreground">No market data available</span>
        )}
        {price !== null && (
          <span className="text-xs text-muted-foreground">Latest available close</span>
        )}
      </div>
    </header>
  );
}
