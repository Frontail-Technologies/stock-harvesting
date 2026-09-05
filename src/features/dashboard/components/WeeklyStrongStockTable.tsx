"use client";

import { useMemo, useRef, useState, type PointerEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
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
import { cn } from "@/utils/cn";
import { formatCompactVolume } from "@/utils/formatters";
import { filterWeeklyStrongByCrossFilter, type CrossFilterState } from "../lib/dashboard-cross-filter";

type SortKey = "symbol" | "name" | "close" | "changePct" | "volume";
type SortDirection = "asc" | "desc";

const SORTABLE_COLUMNS: Array<{ key: SortKey; label: string; align?: "right" }> = [
  { key: "symbol", label: "Symbol" },
  { key: "name", label: "Stock Name" },
  { key: "close", label: "Close", align: "right" },
  { key: "changePct", label: "% Change", align: "right" },
  { key: "volume", label: "Volume", align: "right" },
];

function compareRows(a: CollectionWeeklyStrongStock, b: CollectionWeeklyStrongStock, key: SortKey) {
  const av = a[key];
  const bv = b[key];
  if (typeof av === "number" && typeof bv === "number") return av - bv;
  return String(av ?? "").localeCompare(String(bv ?? ""));
}

export function WeeklyStrongStockTable({
  code,
  crossFilter,
}: {
  code: string;
  crossFilter?: CrossFilterState;
}) {
  const router = useRouter();
  const setScannerStock = useScannerUiStore((state) => state.setSelectedStock);
  const { formatStockCurrency } = useCurrency();
  const { items, isLoading, isError } = useCollectionWeeklyStrongStocks({ code });
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; direction: SortDirection }>({
    key: "changePct",
    direction: "desc",
  });
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [preview, setPreview] = useState<{
    symbol: string;
    x: number;
    rowTop: number;
    rowBottom: number;
  } | null>(null);

  const crossFilteredItems = useMemo(
    () => (crossFilter ? filterWeeklyStrongByCrossFilter(items, crossFilter) : items),
    [items, crossFilter]
  );

  const filteredItems = useMemo(() => {
    const query = q.trim().toLowerCase();
    const base = query
      ? crossFilteredItems.filter(
          (item) =>
            item.symbol.toLowerCase().includes(query) || item.name.toLowerCase().includes(query)
        )
      : crossFilteredItems;

    const sorted = [...base].sort((a, b) => compareRows(a, b, sort.key));
    return sort.direction === "asc" ? sorted : sorted.reverse();
  }, [crossFilteredItems, q, sort]);

  const handleSort = (key: SortKey) => {
    setSort((current) =>
      current.key === key
        ? { key, direction: current.direction === "asc" ? "desc" : "asc" }
        : { key, direction: key === "changePct" || key === "close" || key === "volume" ? "desc" : "asc" }
    );
  };

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

    router.push(
      `/charts?symbol=${encodeURIComponent(item.symbol)}&exchange=${encodeURIComponent(item.exchange)}`
    );
  };

  return (
    <section className="relative flex flex-col gap-4 rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">Harvest Results</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">Qualified stocks for this segment</p>
        </div>
        <div className="relative w-56">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Search symbol or name"
            className="h-9 pl-8"
          />
        </div>
      </div>

      <div className="max-h-128 overflow-y-auto rounded-lg border border-border">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-muted/95 backdrop-blur-sm">
            <TableRow className="hover:bg-transparent">
              {SORTABLE_COLUMNS.map((column) => {
                const active = sort.key === column.key;
                const Icon = active ? (sort.direction === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;

                return (
                  <TableHead
                    key={column.key}
                    className={cn(
                      "h-10 px-4 text-xs font-semibold tracking-wide text-muted-foreground uppercase",
                      column.align === "right" && "text-right"
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => handleSort(column.key)}
                      className={cn(
                        "inline-flex cursor-pointer items-center gap-1 transition-colors hover:text-foreground",
                        column.align === "right" && "flex-row-reverse",
                        active && "text-foreground"
                      )}
                    >
                      {column.label}
                      <Icon className={cn("size-3", !active && "opacity-40")} />
                    </button>
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.map((item) => (
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
                className="cursor-pointer border-border/60 hover:bg-primary/5"
              >
                <TableCell className="h-12 px-4 font-semibold text-primary">{item.symbol}</TableCell>
                <TableCell className="max-w-56 truncate px-4 text-foreground">{item.name}</TableCell>
                <TableCell className="px-4 text-right text-foreground tabular-nums">
                  {formatStockCurrency(item.close, item.exchange)}
                </TableCell>
                <TableCell className="px-4 text-right">
                  <Badge
                    variant="outline"
                    className={cn(
                      "border-transparent tabular-nums",
                      item.changePct >= 0 ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
                    )}
                  >
                    {item.changePct >= 0 ? "+" : ""}
                    {item.changePct.toFixed(2)}%
                  </Badge>
                </TableCell>
                <TableCell className="px-4 text-right text-muted-foreground tabular-nums">
                  {formatCompactVolume(item.volume)}
                </TableCell>
              </TableRow>
            ))}

            {filteredItems.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={SORTABLE_COLUMNS.length} className="py-6 text-center text-sm text-muted-foreground">
                  {isLoading ? (
                    <span className="inline-flex items-center gap-2">
                      <Spinner size="sm" />
                      Loading...
                    </span>
                  ) : isError ? (
                    "Couldn't load this list."
                  ) : q ? (
                    <EmptyState size="compact" title="No matches for your search." className="py-0" />
                  ) : (
                    <EmptyState
                      size="compact"
                      title="No stocks matched for the latest completed week."
                      className="py-0"
                    />
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
