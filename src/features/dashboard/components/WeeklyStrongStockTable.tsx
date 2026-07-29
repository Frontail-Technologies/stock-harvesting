"use client";

import { useMemo, useRef, useState, type PointerEvent } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCurrency } from "@/features/currency";
import {
  useCollectionWeeklyStrongStocks,
  type CollectionWeeklyStrongStock,
} from "@/features/market-collections";
import { useScannerUiStore } from "@/features/scanner";
import { StockQuickChartPreview } from "@/features/stocks";
import { formatCompactVolume } from "@/utils/formatters";

export function WeeklyStrongStockTable({ code }: { code: string }) {
  const router = useRouter();
  const setScannerStock = useScannerUiStore((state) => state.setSelectedStock);
  const { formatStockCurrency } = useCurrency();
  const { items, isLoading, isError } = useCollectionWeeklyStrongStocks({ code });
  const [q, setQ] = useState("");
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [preview, setPreview] = useState<{
    symbol: string;
    x: number;
    rowTop: number;
    rowBottom: number;
  } | null>(null);

  const filteredItems = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return items;
    return items.filter(
      (item) =>
        item.symbol.toLowerCase().includes(query) || item.name.toLowerCase().includes(query)
    );
  }, [items, q]);

  const clearPreviewTimer = () => {
    if (!hoverTimeoutRef.current) return;
    clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = null;
  };

  const handleRowEnter = (
    item: CollectionWeeklyStrongStock,
    event: PointerEvent<HTMLTableRowElement>
  ) => {
    const rect = event.currentTarget.getBoundingClientRect();

    clearPreviewTimer();
    hoverTimeoutRef.current = setTimeout(() => {
      setPreview({
        symbol: item.symbol,
        x: event.clientX,
        rowTop: rect.top,
        rowBottom: rect.bottom,
      });
    }, 320);
  };

  const handleRowMove = (
    item: CollectionWeeklyStrongStock,
    event: PointerEvent<HTMLTableRowElement>
  ) => {
    const rect = event.currentTarget.getBoundingClientRect();

    setPreview((current) =>
      current?.symbol === item.symbol
        ? { symbol: item.symbol, x: event.clientX, rowTop: rect.top, rowBottom: rect.bottom }
        : current
    );
  };

  const handleRowLeave = () => {
    clearPreviewTimer();
    setPreview(null);
  };

  const previewItem = preview ? filteredItems.find((item) => item.symbol === preview.symbol) : undefined;

  const handleStockClick = (item: CollectionWeeklyStrongStock) => {
    setScannerStock({
      symbol: item.symbol,
      name: item.name,
      exchange: item.exchange,
      close: item.close,
      changePct: item.changePct,
      volume: item.volume,
      hasMarketData: true,
    });
    router.push(`/scanner?symbol=${encodeURIComponent(item.symbol)}`);
  };

  return (
    <section className="relative flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Weekly Strong Stock List</h2>
          <p className="text-xs text-muted-foreground">
            Stocks within 15% of their own weekly and daily multi-year highs
          </p>
        </div>
        <div className="relative w-56">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Search symbol or name"
            className="h-8 pl-8"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-12 border-r border-border px-3 text-xs font-semibold">
                Sr.
              </TableHead>
              <TableHead className="w-28 border-r border-border px-3 text-xs font-semibold">
                Symbol
              </TableHead>
              <TableHead className="min-w-48 border-r border-border px-3 text-xs font-semibold">
                Stock Name
              </TableHead>
              <TableHead className="w-24 border-r border-border px-3 text-right text-xs font-semibold">
                Close
              </TableHead>
              <TableHead className="w-24 border-r border-border px-3 text-right text-xs font-semibold">
                % Change
              </TableHead>
              <TableHead className="w-28 px-3 text-right text-xs font-semibold">
                Volume
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.map((item, index) => (
              <TableRow
                key={item.symbol}
                onPointerEnter={(event) => handleRowEnter(item, event)}
                onPointerMove={(event) => handleRowMove(item, event)}
                onPointerLeave={handleRowLeave}
                onClick={() => handleStockClick(item)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    handleStockClick(item);
                  }
                }}
                tabIndex={0}
                role="button"
                className="cursor-pointer hover:bg-primary/5"
              >
                <TableCell className="border-r border-border px-3 text-muted-foreground">
                  {index + 1}
                </TableCell>
                <TableCell className="border-r border-border px-3 font-medium text-primary">
                  {item.symbol}
                </TableCell>
                <TableCell className="border-r border-border px-3 text-foreground">
                  {item.name}
                </TableCell>
                <TableCell className="border-r border-border px-3 text-right text-foreground">
                  {formatStockCurrency(item.close, item.exchange)}
                </TableCell>
                <TableCell className="border-r border-border px-3 text-right">
                  <Badge
                    variant="outline"
                    className={`border-transparent ${
                      item.changePct >= 0 ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
                    }`}
                  >
                    {item.changePct >= 0 ? "+" : ""}
                    {item.changePct.toFixed(2)}%
                  </Badge>
                </TableCell>
                <TableCell className="px-3 text-right text-muted-foreground">
                  {formatCompactVolume(item.volume)}
                </TableCell>
              </TableRow>
            ))}

            {filteredItems.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                  {isLoading ? (
                    <span className="inline-flex items-center gap-2">
                      <Spinner size="sm" />
                      Loading...
                    </span>
                  ) : isError ? (
                    "Couldn't load this list."
                  ) : q ? (
                    "No matches for your search."
                  ) : (
                    "No stocks currently pass this screen."
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {preview && previewItem && (
        <StockQuickChartPreview
          stock={{
            symbol: previewItem.symbol,
            name: previewItem.name,
            exchange: previewItem.exchange,
            close: previewItem.close,
            changePct: previewItem.changePct,
            volume: previewItem.volume,
            hasMarketData: true,
          }}
          x={preview.x}
          rowTop={preview.rowTop}
          rowBottom={preview.rowBottom}
        />
      )}
    </section>
  );
}
