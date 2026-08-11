"use client";

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ADMIN_USER_PAGE_SIZE_OPTIONS } from "../../constants/admin-users";
import type { AdminUserFilters, PaginationMeta } from "../../types";
import { AdminSelect } from "./AdminSelect";

type AdminUsersPaginationProps = {
  filters: AdminUserFilters;
  pagination: PaginationMeta;
  loading: boolean;
  onFilterChange: <K extends keyof AdminUserFilters>(
    key: K,
    value: AdminUserFilters[K]
  ) => void;
};

export function AdminUsersPagination({
  filters,
  pagination,
  loading,
  onFilterChange,
}: AdminUsersPaginationProps) {
  const firstRecord =
    pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const lastRecord = Math.min(
    pagination.page * pagination.limit,
    pagination.total
  );

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
      <span className="font-mono uppercase tracking-[0.08em]">
        Showing {firstRecord} to {lastRecord} of {pagination.total} records
      </span>

      <div className="flex flex-wrap items-center gap-1.5">
        <AdminSelect
          label="Rows"
          value={String(filters.limit)}
          onChange={(value) => onFilterChange("limit", Number(value))}
          options={ADMIN_USER_PAGE_SIZE_OPTIONS.map((option) => ({
            value: String(option),
            label: `${option} rows`,
          }))}
          compact
        />
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label="First page"
          className="rounded-md border-border bg-[var(--admin-elevated)] hover:bg-accent"
          disabled={filters.page <= 1 || loading}
          onClick={() => onFilterChange("page", 1)}
        >
          <ChevronsLeft className="size-3.5" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label="Previous page"
          className="rounded-md border-border bg-[var(--admin-elevated)] hover:bg-accent"
          disabled={filters.page <= 1 || loading}
          onClick={() => onFilterChange("page", Math.max(1, filters.page - 1))}
        >
          <ChevronLeft className="size-3.5" />
        </Button>
        <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-md bg-primary px-2 font-mono text-xs font-semibold text-primary-foreground">
          {pagination.page}
        </span>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label="Next page"
          className="rounded-md border-border bg-[var(--admin-elevated)] hover:bg-accent"
          disabled={filters.page >= pagination.totalPages || loading}
          onClick={() =>
            onFilterChange(
              "page",
              Math.min(pagination.totalPages, filters.page + 1)
            )
          }
        >
          <ChevronRight className="size-3.5" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label="Last page"
          className="rounded-md border-border bg-[var(--admin-elevated)] hover:bg-accent"
          disabled={filters.page >= pagination.totalPages || loading}
          onClick={() =>
            onFilterChange("page", Math.max(1, pagination.totalPages))
          }
        >
          <ChevronsRight className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

