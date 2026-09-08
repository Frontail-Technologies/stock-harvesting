"use client";

import { useMemo, useRef, useState, type PointerEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, ArrowUpDown, Download, FileSpreadsheet, FileText, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  exportWeeklyStrongStocksToCsv,
  exportWeeklyStrongStocksToXlsx,
} from "../lib/export-weekly-strong-stocks";
import { formatWeekEnding } from "../lib/format-as-of-date";

type SortKey = "symbol" | "name" | "close" | "changePct" | "returnPct" | "volume";
type SortDirection = "asc" | "desc";

const SORTABLE_COLUMNS: Array<{ key: SortKey; label: string; align?: "right" }> = [
  { key: "symbol", label: "Symbol" },
  { key: "name", label: "Stock Name" },
  { key: "close", label: "Close", align: "right" },
  { key: "changePct", label: "% Change", align: "right" },
  { key: "returnPct", label: "Return", align: "right" },
  { key: "volume", label: "Volume", align: "right" },
];

function compareRows(a: CollectionWeeklyStrongStock, b: CollectionWeeklyStrongStock, key: SortKey) {
  const av = a[key];
  const bv = b[key];
  // returnPct can be null (no currently-open qualifying streak) - treated
  // as the lowest possible value so it settles to one end of the sort
  // rather than throwing off a numeric comparison against real values.
  if (typeof av === "number" || typeof bv === "number" || av === null || bv === null) {
    const an = typeof av === "number" ? av : -Infinity;
    const bn = typeof bv === "number" ? bv : -Infinity;
    return an - bn;
  }
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
  const { items, isLoading, isError, weekEnding } = useCollectionWeeklyStrongStocks({ code });
  const weekEndingLabel = !isLoading ? formatWeekEnding(weekEnding) : "";
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
  const [isExportingXlsx, setIsExportingXlsx] = useState(false);

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
        : {
            key,
            direction:
              key === "changePct" || key === "close" || key === "returnPct" || key === "volume"
                ? "desc"
                : "asc",
          }
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

  // Exports exactly the currently visible rows (current search + sort),
  // never a separate "export everything" request - what downloads always
  // matches what's on screen.
  const exportFilename = `harvest-results-${code}-${new Date().toISOString().slice(0, 10)}`;

  const handleExportCsv = () => {
    exportWeeklyStrongStocksToCsv(filteredItems, `${exportFilename}.csv`);
  };

  const handleExportXlsx = async () => {
    if (isExportingXlsx) return;
    setIsExportingXlsx(true);
    try {
      await exportWeeklyStrongStocksToXlsx(filteredItems, `${exportFilename}.xlsx`);
    } finally {
      setIsExportingXlsx(false);
    }
  };

  return (
    <section className="relative flex flex-col gap-4 rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">Harvest Results</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Qualified stocks for this segment
            {weekEndingLabel && <span className="text-foreground/70"> · {weekEndingLabel}</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-56">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="Search symbol or name"
              className="h-9 pl-8"
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={filteredItems.length === 0 || isExportingXlsx}
                  aria-busy={isExportingXlsx}
                  className="h-9 gap-1.5"
                />
              }
            >
              {isExportingXlsx ? <Spinner size="sm" /> : <Download className="size-3.5" />}
              Export
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportCsv} className="gap-2">
                <FileText className="size-3.5" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => void handleExportXlsx()} className="gap-2">
                <FileSpreadsheet className="size-3.5" />
                Export as XLSX
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="max-h-128 overflow-y-auto rounded-lg">
        {/* Desktop/tablet: unchanged full table. */}
        <div className="hidden sm:block">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-foreground/5 backdrop-blur-sm">
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-9 w-14 px-4 text-right text-xs font-semibold text-muted-foreground">
                  Sr. No.
                </TableHead>
                {SORTABLE_COLUMNS.map((column) => {
                  const active = sort.key === column.key;
                  const Icon = active ? (sort.direction === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;

                  return (
                    <TableHead
                      key={column.key}
                      className={cn(
                        "h-9 px-4 text-xs font-semibold text-muted-foreground",
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
                  className="cursor-pointer border-border/60 hover:bg-primary/5"
                >
                  <TableCell className="h-11 px-4 text-right text-muted-foreground tabular-nums">
                    {index + 1}
                  </TableCell>
                  <TableCell className="h-11 px-4 font-semibold text-primary">{item.symbol}</TableCell>
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
                  <TableCell className="px-4 text-right tabular-nums">
                    {typeof item.returnPct !== "number" ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <span
                        className={cn(
                          "font-semibold",
                          item.returnPct >= 0 ? "text-success" : "text-danger"
                        )}
                      >
                        {item.returnPct >= 0 ? "+" : ""}
                        {item.returnPct.toFixed(2)}%
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="px-4 text-right text-muted-foreground tabular-nums">
                    {formatCompactVolume(item.volume)}
                  </TableCell>
                </TableRow>
              ))}

              {filteredItems.length === 0 && (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={SORTABLE_COLUMNS.length + 1} className="py-6 text-center text-sm text-muted-foreground">
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

        {/* Mobile: compact stacked records instead of a squeezed table. */}
        <div className="flex flex-col divide-y divide-border sm:hidden">
          {filteredItems.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
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
            </div>
          ) : (
            filteredItems.map((item, index) => (
              <div
                key={item.symbol}
                onClick={() => handleStockClick(item)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    handleStockClick(item);
                  }
                }}
                tabIndex={0}
                role="button"
                className="flex cursor-pointer items-start justify-between gap-3 px-4 py-3 active:bg-primary/5"
              >
                <div className="flex min-w-0 items-baseline gap-2">
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-primary">{item.symbol}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{item.name}</p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
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
                  <dl className="flex flex-col items-end gap-0.5">
                    <div className="flex items-center gap-1.5">
                      <dt className="text-[0.6875rem] text-muted-foreground">Close</dt>
                      <dd className="text-xs font-medium tabular-nums text-foreground">
                        {formatStockCurrency(item.close, item.exchange)}
                      </dd>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <dt className="text-[0.6875rem] text-muted-foreground">Return</dt>
                      <dd
                        className={cn(
                          "text-xs font-semibold tabular-nums",
                          typeof item.returnPct !== "number"
                            ? "text-muted-foreground"
                            : item.returnPct >= 0
                              ? "text-success"
                              : "text-danger"
                        )}
                      >
                        {typeof item.returnPct !== "number"
                          ? "—"
                          : `${item.returnPct >= 0 ? "+" : ""}${item.returnPct.toFixed(2)}%`}
                      </dd>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <dt className="text-[0.6875rem] text-muted-foreground">Vol</dt>
                      <dd className="text-xs font-medium tabular-nums text-foreground">
                        {formatCompactVolume(item.volume)}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            ))
          )}
        </div>
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
