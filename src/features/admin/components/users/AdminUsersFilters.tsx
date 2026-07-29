"use client";

import { RotateCcw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-2 md:grid-cols-[minmax(240px,1fr)_160px_160px] xl:grid-cols-[minmax(280px,1fr)_180px_180px_180px_150px_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filters.q}
            onChange={(event) => onFilterChange("q", event.target.value)}
            placeholder="Search name or email"
            className="h-8 rounded-md bg-background pl-8"
          />
        </div>

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
          onChange={(value) =>
            onFilterChange("direction", value as AdminSortDirection)
          }
          options={ADMIN_USER_DIRECTION_OPTIONS}
        />

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 gap-1.5"
          onClick={onReset}
          disabled={filtersAreDefault}
        >
          <RotateCcw className="size-3.5" />
          Reset
        </Button>
      </div>

      {activeFilterCount > 0 ? (
        <div className="text-xs text-muted-foreground">
          {activeFilterCount} active filter{activeFilterCount === 1 ? "" : "s"}
        </div>
      ) : null}
    </div>
  );
}
