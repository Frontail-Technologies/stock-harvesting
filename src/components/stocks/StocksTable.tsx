"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ArrowUpDown } from "lucide-react";
import type { Stock } from "@/types/market";
import { mockStocks } from "@/lib/mock-stocks";
import { formatCompactVolume, formatCurrency } from "@/lib/formatters";
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

type SortField = keyof Pick<Stock, "name" | "symbol" | "close" | "changePct" | "volume">;

const ROWS_PER_PAGE_OPTIONS = [10, 20, 50];

type StocksTableProps = {
  query: string;
};

export function StocksTable({ query }: StocksTableProps) {
  const [sortField, setSortField] = useState<SortField>("changePct");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q
      ? mockStocks.filter(
          (s) => s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
        )
      : mockStocks;

    const dir = sortDirection === "asc" ? 1 : -1;
    return [...base].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (typeof aVal === "string" && typeof bVal === "string") {
        return aVal.localeCompare(bVal) * dir;
      }
      return ((aVal as number) - (bVal as number)) * dir;
    });
  }, [query, sortField, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * rowsPerPage;
  const pageRows = filtered.slice(start, start + rowsPerPage);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
    setPage(1);
  };

  const SortableHead = ({
    field,
    children,
    align = "left",
  }: {
    field: SortField;
    children: ReactNode;
    align?: "left" | "right";
  }) => (
    <TableHead className={align === "right" ? "text-right" : undefined}>
      <button
        type="button"
        onClick={() => toggleSort(field)}
        className={`inline-flex items-center gap-1 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase hover:text-foreground ${
          align === "right" ? "flex-row-reverse" : ""
        }`}
      >
        {children}
        <ArrowUpDown className="size-3" />
      </button>
    </TableHead>
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-hidden rounded-lg border border-border bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/70 hover:bg-muted/70">
              <TableHead className="w-12 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                Sr.
              </TableHead>
              <SortableHead field="name">Stock Name</SortableHead>
              <SortableHead field="symbol">Symbol</SortableHead>
              <SortableHead field="close" align="right">
                Close (₹)
              </SortableHead>
              <SortableHead field="changePct" align="right">
                % Change
              </SortableHead>
              <SortableHead field="volume" align="right">
                Volume
              </SortableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageRows.map((stock, index) => (
              <TableRow
                key={stock.symbol}
                className={index % 2 === 1 ? "bg-muted/25 hover:bg-muted/40" : undefined}
              >
                <TableCell className="text-xs text-muted-foreground">
                  {start + index + 1}
                </TableCell>
                <TableCell className="text-sm font-medium text-primary">
                  {stock.name}
                </TableCell>
                <TableCell className="text-sm text-foreground">{stock.symbol}</TableCell>
                <TableCell className="text-right text-sm text-foreground">
                  {formatCurrency(stock.close)}
                </TableCell>
                <TableCell className="text-right">
                  <Badge
                    variant="outline"
                    className={`border-transparent ${
                      stock.changePct >= 0
                        ? "bg-brand-green/10 text-brand-green"
                        : "bg-brand-red/10 text-brand-red"
                    }`}
                  >
                    {stock.changePct >= 0 ? "+" : ""}
                    {stock.changePct.toFixed(2)}%
                  </Badge>
                </TableCell>
                <TableCell className="text-right text-sm text-muted-foreground">
                  {formatCompactVolume(stock.volume)}
                </TableCell>
              </TableRow>
            ))}
            {pageRows.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-8 text-center text-sm text-muted-foreground"
                >
                  No stocks found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <span>Rows per page</span>
          <select
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setPage(1);
            }}
            className="rounded-md border border-border bg-white px-2 py-1 text-xs"
          >
            {ROWS_PER_PAGE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        <span>
          Page {currentPage} of {totalPages} · {filtered.length} stocks
        </span>

        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
