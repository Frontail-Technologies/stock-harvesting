import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrencyValue } from "@/features/currency/lib/currency-formatters";
import type { Stock } from "@/types/market";
import { cn } from "@/utils/cn";
import type { StockPeer } from "../types";
import { StockSectionCard } from "./StockSectionCard";

type StockPeerComparisonProps = {
  stock: Stock;
  currentPrice: number | null;
  currentPeRatio: number;
  currentRoce: number;
  currentMarketCapCr: number;
  peers: StockPeer[];
  currency: string;
};

type ComparisonRow = {
  key: string;
  name: string;
  isSelf: boolean;
  price: string;
  peRatio: string;
  roce: string;
  marketCap: string;
};

export function StockPeerComparison({
  stock,
  currentPrice,
  currentPeRatio,
  currentRoce,
  currentMarketCapCr,
  peers,
  currency,
}: StockPeerComparisonProps) {
  // Same formatted values feed both the desktop table and the mobile
  // stacked cards - built once here, not recomputed per layout.
  const rows: ComparisonRow[] = [
    {
      key: stock.symbol,
      name: stock.symbol,
      isSelf: true,
      price: currentPrice !== null ? formatCurrencyValue(currentPrice, currency) : "—",
      peRatio: currentPeRatio.toFixed(1),
      roce: `${currentRoce.toFixed(1)}%`,
      marketCap: `${formatCurrencyValue(currentMarketCapCr, currency)} Cr`,
    },
    ...peers.map((peer) => ({
      key: peer.symbol,
      name: peer.name,
      isSelf: false,
      price: formatCurrencyValue(peer.price, currency),
      peRatio: peer.peRatio.toFixed(1),
      roce: `${peer.roce.toFixed(1)}%`,
      marketCap: `${formatCurrencyValue(peer.marketCapCr, currency)} Cr`,
    })),
  ];

  return (
    <section>
      <h2 className="text-lg font-semibold text-foreground">Peer comparison</h2>
      <p className="mt-1 text-xs text-muted-foreground">How {stock.symbol} compares against similar companies.</p>

      {/* Desktop/tablet: unchanged full table. */}
      <StockSectionCard className="mt-4 hidden overflow-x-auto p-0 sm:block">
        <Table>
          <TableHeader className="bg-foreground/5">
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">P/E</TableHead>
              <TableHead className="text-right">ROCE</TableHead>
              <TableHead className="text-right">Market Cap</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.key} className={cn(row.isSelf && "bg-primary/8 hover:bg-primary/12")}>
                <TableCell className={cn(row.isSelf ? "font-semibold" : "font-medium", "text-foreground")}>
                  {row.name} {row.isSelf && <span className="text-muted-foreground">(this stock)</span>}
                </TableCell>
                <TableCell className="text-right tabular-nums">{row.price}</TableCell>
                <TableCell className="text-right tabular-nums">{row.peRatio}</TableCell>
                <TableCell className="text-right tabular-nums">{row.roce}</TableCell>
                <TableCell className="text-right tabular-nums">{row.marketCap}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </StockSectionCard>

      {/* Mobile: stacked per-company records instead of a squeezed table. */}
      <div className="mt-4 flex flex-col divide-y divide-border border-t border-border sm:hidden">
        {rows.map((row) => (
          <div key={row.key} className={cn("py-3", row.isSelf && "bg-primary/8 -mx-4 px-4")}>
            <p className="text-sm font-semibold text-foreground">
              {row.name} {row.isSelf && <span className="text-xs font-normal text-muted-foreground">(this stock)</span>}
            </p>
            <dl className="mt-1.5 flex flex-col gap-1">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-xs text-muted-foreground">Price</dt>
                <dd className="text-xs font-medium tabular-nums text-foreground">{row.price}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-xs text-muted-foreground">P/E</dt>
                <dd className="text-xs font-medium tabular-nums text-foreground">{row.peRatio}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-xs text-muted-foreground">ROCE</dt>
                <dd className="text-xs font-medium tabular-nums text-foreground">{row.roce}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-xs text-muted-foreground">Market Cap</dt>
                <dd className="text-xs font-medium tabular-nums text-foreground">{row.marketCap}</dd>
              </div>
            </dl>
          </div>
        ))}
      </div>
    </section>
  );
}
