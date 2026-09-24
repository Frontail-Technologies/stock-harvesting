"use client";

import { useState } from "react";
import { ListFilter, RotateCcw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  ADMIN_USER_DIRECTION_OPTIONS,
  ADMIN_USER_PLAN_OPTIONS,
  ADMIN_USER_ROLE_OPTIONS,
  ADMIN_USER_SORT_OPTIONS,
} from "../../constants/admin-users";
import type {
  AdminPlanFilter,
  AdminRoleFilter,
  AdminSortDirection,
  AdminUserFilters,
  AdminUserSortField,
} from "../../types";
import { AdminSelect } from "./AdminSelect";

type AdminUsersFiltersProps = {
  filters: AdminUserFilters;
  activeFilterCount: number;
  filtersAreDefault: boolean;
  onFilterChange: <K extends keyof AdminUserFilters>(
    key: K,
    value: AdminUserFilters[K]
  ) => void;
  onReset: () => void;
};

export function AdminUsersFilters({
  filters,
  activeFilterCount,
  filtersAreDefault,
  onFilterChange,
  onReset,
}: AdminUsersFiltersProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);

  return (
    <>
      <div className="flex gap-2 md:hidden">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filters.q}
            onChange={(event) => onFilterChange("q", event.target.value)}
            placeholder="Search name or email"
            className="h-10 rounded-md border-input bg-card pl-9 text-sm"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon-lg"
          aria-label="Filter and sort users"
          className="relative rounded-md border-border bg-card"
          onClick={() => setFiltersOpen(true)}
        >
          <ListFilter className="size-4" />
          {activeFilterCount > 0 ? (
            <span className="absolute -right-1 -top-1 inline-flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
              {activeFilterCount}
            </span>
          ) : null}
        </Button>
      </div>

      <div className="hidden rounded-md border border-border bg-[var(--admin-elevated)] p-2 md:block">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-[minmax(240px,1fr)_130px_130px] xl:grid-cols-[minmax(300px,1.4fr)_130px_130px_150px_130px_auto]">
          <div className="relative col-span-2 md:col-span-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={filters.q}
              onChange={(event) => onFilterChange("q", event.target.value)}
              placeholder="Search name or email"
              className="h-8 rounded-md border-input bg-card pl-9 text-sm focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-primary/30"
            />
          </div>

          <AdminSelect
            label="Role"
            value={filters.role}
            onChange={(value) => onFilterChange("role", value as AdminRoleFilter)}
            options={ADMIN_USER_ROLE_OPTIONS}
            compact
          />

          <AdminSelect
            label="Plan"
            value={filters.plan}
            onChange={(value) => onFilterChange("plan", value as AdminPlanFilter)}
            options={ADMIN_USER_PLAN_OPTIONS}
            compact
          />

          <AdminSelect
            label="Sort"
            value={filters.sort}
            onChange={(value) => onFilterChange("sort", value as AdminUserSortField)}
            options={ADMIN_USER_SORT_OPTIONS}
            compact
          />

          <AdminSelect
            label="Direction"
            value={filters.direction}
            onChange={(value) =>
              onFilterChange("direction", value as AdminSortDirection)
            }
            options={ADMIN_USER_DIRECTION_OPTIONS}
            compact
          />

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 rounded-md border-border bg-card px-3 text-xs hover:bg-accent"
            onClick={onReset}
            disabled={filtersAreDefault}
          >
            <RotateCcw className="size-3.5" />
            Reset
          </Button>
        </div>

        {activeFilterCount > 0 ? (
          <div className="mt-1.5 px-1 text-xs text-muted-foreground">
            {activeFilterCount} active filter{activeFilterCount === 1 ? "" : "s"}
          </div>
        ) : null}
      </div>

      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent side="bottom" className="gap-5 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <SheetHeader>
            <SheetTitle>Filter users</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-2 gap-3">
            <AdminSelect
              label="Role"
              value={filters.role}
              onChange={(value) => onFilterChange("role", value as AdminRoleFilter)}
              options={ADMIN_USER_ROLE_OPTIONS}
            />
            <AdminSelect
              label="Plan"
              value={filters.plan}
              onChange={(value) => onFilterChange("plan", value as AdminPlanFilter)}
              options={ADMIN_USER_PLAN_OPTIONS}
            />
            <AdminSelect
              label="Sort"
              value={filters.sort}
              onChange={(value) => onFilterChange("sort", value as AdminUserSortField)}
              options={ADMIN_USER_SORT_OPTIONS}
            />
            <AdminSelect
              label="Direction"
              value={filters.direction}
              onChange={(value) => onFilterChange("direction", value as AdminSortDirection)}
              options={ADMIN_USER_DIRECTION_OPTIONS}
            />
          </div>
          <SheetFooter className="grid grid-cols-2">
            <Button
              type="button"
              variant="outline"
              onClick={onReset}
              disabled={filtersAreDefault}
            >
              <RotateCcw className="size-4" />
              Reset
            </Button>
            <Button type="button" onClick={() => setFiltersOpen(false)}>
              Show users
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}

