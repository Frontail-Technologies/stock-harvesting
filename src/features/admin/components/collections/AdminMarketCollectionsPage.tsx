"use client";

import Link from "next/link";
import { ChevronRight, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { adminPath } from "@/utils/seo";
import { useAdminMarketCollections } from "../../hooks/use-admin-market-collections";
import { AdminCreateCollectionDialog } from "./AdminCreateCollectionDialog";

export function AdminMarketCollectionsPage() {
  const collectionsQuery = useAdminMarketCollections();
  const collections = collectionsQuery.data?.collections ?? [];

  return (
    <div className="flex w-full flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Segments</h1>
          <p className="text-sm text-muted-foreground">
            Manage index/segment groups (NIFTY 50, NIFTY 100, ...) used to power the dashboard.
          </p>
        </div>
        <AdminCreateCollectionDialog />
      </div>

      <section className="overflow-hidden rounded-md border border-border bg-card text-card-foreground">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="border-r border-border px-4 text-xs font-semibold">
                Code
              </TableHead>
              <TableHead className="min-w-52 border-r border-border px-4 text-xs font-semibold">
                Name
              </TableHead>
              <TableHead className="w-28 border-r border-border px-4 text-xs font-semibold">
                Exchange
              </TableHead>
              <TableHead className="w-32 border-r border-border px-4 text-xs font-semibold">
                Members
              </TableHead>
              <TableHead className="w-10 px-4" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {collections.map((collection) => (
              <TableRow key={collection.id} className="hover:bg-muted/30">
                <TableCell className="border-r border-border px-4">
                  <Link
                    href={adminPath(`/admin/market-collections/${collection.id}`)}
                    className="font-medium text-foreground hover:underline"
                  >
                    {collection.code}
                  </Link>
                </TableCell>
                <TableCell className="border-r border-border px-4 text-muted-foreground">
                  {collection.name}
                </TableCell>
                <TableCell className="border-r border-border px-4">
                  <Badge variant="outline" className="bg-muted text-muted-foreground">
                    {collection.exchange}
                  </Badge>
                </TableCell>
                <TableCell className="border-r border-border px-4 text-muted-foreground">
                  {collection.memberCount}
                </TableCell>
                <TableCell className="px-4">
                  <Link href={adminPath(`/admin/market-collections/${collection.id}`)}>
                    <ChevronRight className="size-4 text-muted-foreground" />
                  </Link>
                </TableCell>
              </TableRow>
            ))}

            {collections.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                  {collectionsQuery.isLoading ? (
                    <span className="inline-flex items-center gap-2">
                      <Spinner size="sm" />
                      Loading segments...
                    </span>
                  ) : collectionsQuery.isError ? (
                    "Unable to load segments."
                  ) : (
                    <span className="inline-flex items-center gap-2">
                      <Layers className="size-4" />
                      No segments yet. Create one to get started.
                    </span>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </section>
    </div>
  );
}
