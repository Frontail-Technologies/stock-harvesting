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

export function StockPeerComparison({
  stock,
  currentPrice,
  currentPeRatio,
  currentRoce,
  currentMarketCapCr,
  peers,
  currency,
}: StockPeerComparisonProps) {
  return (
    <section>
      <h2 className="text-sm font-semibold text-foreground">Peer comparison</h2>
      <p className="mt-1 text-xs text-muted-foreground">How {stock.symbol} compares against similar companies.</p>
      <StockSectionCard className="mt-4 overflow-x-auto p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">P/E</TableHead>
              <TableHead className="text-right">ROCE</TableHead>
              <TableHead className="text-right">Market Cap</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow className="bg-primary/8 hover:bg-primary/12">
              <TableCell className="font-semibold text-foreground">
                {stock.symbol} <span className="text-muted-foreground">(this stock)</span>
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {currentPrice !== null ? formatCurrencyValue(currentPrice, currency) : "—"}
              </TableCell>
              <TableCell className="text-right tabular-nums">{currentPeRatio.toFixed(1)}</TableCell>
              <TableCell className="text-right tabular-nums">{currentRoce.toFixed(1)}%</TableCell>
              <TableCell className="text-right tabular-nums">
                {formatCurrencyValue(currentMarketCapCr, currency)} Cr
              </TableCell>
            </TableRow>
            {peers.map((peer) => (
              <TableRow key={peer.symbol}>
                <TableCell className={cn("font-medium text-foreground")}>{peer.name}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatCurrencyValue(peer.price, currency)}
                </TableCell>
                <TableCell className="text-right tabular-nums">{peer.peRatio.toFixed(1)}</TableCell>
                <TableCell className="text-right tabular-nums">{peer.roce.toFixed(1)}%</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatCurrencyValue(peer.marketCapCr, currency)} Cr
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </StockSectionCard>
    </section>
  );
}
