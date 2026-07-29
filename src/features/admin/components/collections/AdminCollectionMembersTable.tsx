"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { useAdminMarketCollectionMembers } from "../../hooks/use-admin-market-collections";

const MEMBERS_PAGE_SIZE = 25;

export function AdminCollectionMembersTable({ collectionId }: { collectionId: string }) {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");

  const membersQuery = useAdminMarketCollectionMembers({
    id: collectionId,
    page,
    limit: MEMBERS_PAGE_SIZE,
    q: q.trim() || undefined,
  });

  const { items, pagination } = membersQuery;

  return (
    <section className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-foreground">
          Constituents ({pagination.total})
        </h2>
        <Input
          value={q}
          onChange={(event) => {
            setQ(event.target.value);
            setPage(1);
          }}
          placeholder="Search symbol or name"
          className="h-8 w-56"
        />
      </div>

      <div className="overflow-hidden rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-32 border-r border-border px-3 text-xs font-semibold">
                Symbol
              </TableHead>
              <TableHead className="min-w-52 border-r border-border px-3 text-xs font-semibold">
                Name
              </TableHead>
              <TableHead className="w-24 px-3 text-xs font-semibold">Exchange</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.instrumentId} className="hover:bg-muted/30">
                <TableCell className="border-r border-border px-3 font-medium text-foreground">
                  {item.tradingSymbol}
                </TableCell>
                <TableCell className="border-r border-border px-3 text-muted-foreground">
                  {item.name}
                </TableCell>
                <TableCell className="px-3 text-muted-foreground">{item.exchange}</TableCell>
              </TableRow>
            ))}

            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="py-8 text-center text-sm text-muted-foreground">
                  {membersQuery.isLoading ? (
                    <span className="inline-flex items-center gap-2">
                      <Spinner size="sm" />
                      Loading constituents...
                    </span>
                  ) : (
                    "No constituents found."
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Page {pagination.page} of {pagination.totalPages}
        </span>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Previous page"
            disabled={pagination.page <= 1 || membersQuery.isFetching}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            <ChevronLeft className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Next page"
            disabled={pagination.page >= pagination.totalPages || membersQuery.isFetching}
            onClick={() => setPage((current) => Math.min(pagination.totalPages, current + 1))}
          >
            <ChevronRight className="size-3.5" />
          </Button>
        </div>
      </div>
    </section>
  );
}
