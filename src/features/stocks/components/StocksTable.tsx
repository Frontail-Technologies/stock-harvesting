"use client";

import { useRef, useState, type PointerEvent, type ReactNode } from "react";
import { ArrowUpDown } from "lucide-react";
import type { Stock } from "@/types/market";
import { useCurrency } from "@/features/currency";
import { formatCompactVolume } from "@/utils/formatters";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { StockQuickChartPreview } from "./StockQuickChartPreview";
import { StocksTableSkeleton } from "./StocksTableSkeleton";

export type StocksSortField = keyof Pick<
  Stock,
  "name" | "symbol" | "close" | "changePct" | "volume"
>;
export type StocksSortDirection = "asc" | "desc";

export const ROWS_PER_PAGE_OPTIONS = [10, 20, 50, 100];

type StocksTableProps = {
  rows: Stock[];
  totalRows: number;
  rowsPerPage: number;
  sortField: StocksSortField;
  sortDirection: StocksSortDirection;
  loading?: boolean;
  loadingMore?: boolean;
  error?: Error | null;
  onSort: (field: StocksSortField) => void;
  onLoadMore: () => void;
  onRowsPerPageChange: (rowsPerPage: number) => void;
  onStockClick?: (stock: Stock) => void;
};

type SortableHeadProps = {
  field: StocksSortField;
  children: ReactNode;
  align?: "left" | "right";
  active?: boolean;
  direction?: StocksSortDirection;
  onSort: (field: StocksSortField) => void;
};

function getStockRowKey(stock: Stock) {
  return `${stock.exchange}:${stock.symbol}`;
}

function SortableHead({
  field,
  children,
  align = "left",
  active = false,
  direction = "asc",
  onSort,
}: SortableHeadProps) {
  return (
    <TableHead className={align === "right" ? "text-right" : undefined}>
      <button
        type="button"
        onClick={() => onSort(field)}
        className={`inline-flex items-center gap-1 text-[0.6875rem] font-semibold tracking-wide uppercase hover:text-foreground ${
          active ? "text-foreground" : "text-muted-foreground"
        } ${
          align === "right" ? "flex-row-reverse" : ""
        }`}
      >
        {children}
        <ArrowUpDown
          className={`size-3 transition-transform ${
            active && direction === "desc" ? "rotate-180" : ""
          }`}
        />
      </button>
    </TableHead>
  );
}

export function StocksTable({
  rows,
  totalRows,
  rowsPerPage,
  sortField,
  sortDirection,
  loading = false,
  loadingMore = false,
  error = null,
  onSort,
  onLoadMore,
  onRowsPerPageChange,
  onStockClick,
}: StocksTableProps) {
  const { formatStockCurrency } = useCurrency();
  const hasMore = rows.length < totalRows;
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [preview, setPreview] = useState<{
    key: string;
    symbol: string;
    exchange: string;
    x: number;
    rowTop: number;
    rowBottom: number;
  } | null>(null);

  const clearPreviewTimer = () => {
    if (!hoverTimeoutRef.current) return;
    clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = null;
  };

  const handleRowEnter = (stock: Stock, event: PointerEvent<HTMLTableRowElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const rowKey = getStockRowKey(stock);

    clearPreviewTimer();
    hoverTimeoutRef.current = setTimeout(() => {
      setPreview({
        key: rowKey,
        symbol: stock.symbol,
        exchange: stock.exchange,
        x: event.clientX,
        rowTop: rect.top,
        rowBottom: rect.bottom,
      });
    }, 320);
  };

  const handleRowMove = (stock: Stock, event: PointerEvent<HTMLTableRowElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const rowKey = getStockRowKey(stock);

    setPreview((current) =>
      current?.key === rowKey
        ? {
            key: rowKey,
            symbol: stock.symbol,
            exchange: stock.exchange,
            x: event.clientX,
            rowTop: rect.top,
            rowBottom: rect.bottom,
          }
        : current
    );
  };

  const previewStock = preview
    ? rows.find((row) => getStockRowKey(row) === preview.key)
    : undefined;

  const handleRowLeave = () => {
    clearPreviewTimer();
    setPreview(null);
  };

  return (
    <div className="relative flex flex-col gap-3">
      {error && (
        <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          Backend stocks are unavailable. {error.message}
        </div>
      )}
      <div className="overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm dark:shadow-none">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/70 hover:bg-muted/70">
              <TableHead className="w-12 text-[0.6875rem] font-semibold tracking-wide text-muted-foreground uppercase">
                Sr.
              </TableHead>
              <SortableHead
                field="symbol"
                active={sortField === "symbol"}
                direction={sortDirection}
                onSort={onSort}
              >
                Symbol
              </SortableHead>
              <SortableHead
                field="name"
                active={sortField === "name"}
                direction={sortDirection}
                onSort={onSort}
              >
                Stock Name
              </SortableHead>
              <TableHead className="text-[0.6875rem] font-semibold tracking-wide text-muted-foreground uppercase">
                Exchange
              </TableHead>
              <TableHead className="text-right text-[0.6875rem] font-semibold tracking-wide text-muted-foreground uppercase">
                Open
              </TableHead>
              <SortableHead
                field="close"
                align="right"
                active={sortField === "close"}
                direction={sortDirection}
                onSort={onSort}
              >
                Close
              </SortableHead>
              <SortableHead
                field="changePct"
                align="right"
                active={sortField === "changePct"}
                direction={sortDirection}
                onSort={onSort}
              >
                % Change
              </SortableHead>
              <SortableHead
                field="volume"
                align="right"
                active={sortField === "volume"}
                direction={sortDirection}
                onSort={onSort}
              >
                Volume
              </SortableHead>
            </TableRow>
          </TableHeader>
          {loading && rows.length === 0 ? (
            <StocksTableSkeleton rows={rowsPerPage} />
          ) : (
          <TableBody>
            {rows.map((stock, index) => (
              <TableRow
                key={`${getStockRowKey(stock)}:${index}`}
                onPointerEnter={(event) => handleRowEnter(stock, event)}
                onPointerMove={(event) => handleRowMove(stock, event)}
                onPointerLeave={handleRowLeave}
                onClick={() => onStockClick?.(stock)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onStockClick?.(stock);
                  }
                }}
                tabIndex={onStockClick ? 0 : undefined}
                role={onStockClick ? "button" : undefined}
                className={`transition-colors ${
                  onStockClick ? "cursor-pointer" : "cursor-default"
                } ${
                  index % 2 === 1 ? "bg-muted/35" : ""
                } hover:bg-primary/5`}
              >
                <TableCell className="text-xs text-muted-foreground">
                  {index + 1}
                </TableCell>
                <TableCell className="text-sm font-medium text-primary">
                  {stock.symbol}
                </TableCell>
                <TableCell className="text-sm text-foreground">{stock.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {stock.exchange}
                </TableCell>
                <TableCell className="text-right text-sm text-foreground">
                  {stock.hasMarketData && stock.open !== undefined
                    ? formatStockCurrency(stock.open, stock.exchange)
                    : "-"}
                </TableCell>
                <TableCell className="text-right text-sm text-foreground">
                  {stock.hasMarketData
                    ? formatStockCurrency(stock.close, stock.exchange)
                    : "-"}
                </TableCell>
                <TableCell className="text-right">
                  {stock.hasMarketData && stock.changePct !== null ? (
                    <Badge
                      variant="outline"
                      className={`border-transparent ${
                        stock.changePct >= 0
                          ? "bg-success/10 text-success"
                          : "bg-danger/10 text-danger"
                      }`}
                    >
                      {stock.changePct >= 0 ? "+" : ""}
                      {stock.changePct.toFixed(2)}%
                    </Badge>
                  ) : (
                    <span className="text-sm text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-right text-sm text-muted-foreground">
                  {stock.hasMarketData ? formatCompactVolume(stock.volume) : "-"}
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
                  No stocks found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          )}
        </Table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span>Load per click</span>
          <select
            value={rowsPerPage}
            onChange={(e) => {
              onRowsPerPageChange(Number(e.target.value));
            }}
            className="rounded-md border border-border bg-card px-2 py-1 text-xs text-card-foreground"
          >
            {ROWS_PER_PAGE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <span>
          Showing {rows.length} of {totalRows} stocks
        </span>
      </div>

      {hasMore && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            disabled={loadingMore}
            onClick={onLoadMore}
            className="gap-1.5"
          >
            {loadingMore ? <Spinner size="sm" /> : null}
            {loadingMore ? "Loading..." : "Load more"}
          </Button>
        </div>
      )}
      {preview && previewStock && (
        <StockQuickChartPreview
          stock={previewStock}
          x={preview.x}
          rowTop={preview.rowTop}
          rowBottom={preview.rowBottom}
        />
      )}
    </div>
  );
}
