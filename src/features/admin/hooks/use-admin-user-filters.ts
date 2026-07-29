"use client";

import { useMemo, useState } from "react";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { DEFAULT_ADMIN_USER_FILTERS } from "../constants/admin-users";
import type { AdminUserFilters } from "../types";

export function useAdminUserFilters() {
  const [filters, setFilters] = useState<AdminUserFilters>(
    DEFAULT_ADMIN_USER_FILTERS
  );
  const debouncedSearch = useDebouncedValue(filters.q, 300);
  const queryFilters = useMemo(
    () => ({ ...filters, q: debouncedSearch.trim() }),
    [debouncedSearch, filters]
  );
  const activeFilterCount = [
    debouncedSearch.trim(),
    filters.role,
    filters.plan,
  ].filter(Boolean).length;
  const filtersAreDefault =
    filters.q === DEFAULT_ADMIN_USER_FILTERS.q &&
    filters.role === DEFAULT_ADMIN_USER_FILTERS.role &&
    filters.plan === DEFAULT_ADMIN_USER_FILTERS.plan &&
    filters.page === DEFAULT_ADMIN_USER_FILTERS.page &&
    filters.limit === DEFAULT_ADMIN_USER_FILTERS.limit &&
    filters.sort === DEFAULT_ADMIN_USER_FILTERS.sort &&
    filters.direction === DEFAULT_ADMIN_USER_FILTERS.direction;

  const setFilter = <K extends keyof AdminUserFilters>(
    key: K,
    value: AdminUserFilters[K]
  ) => {
    setFilters((current) => ({
      ...current,
      [key]: value,
      page: key === "page" ? Number(value) : 1,
    }));
  };

  return {
    filters,
    queryFilters,
    activeFilterCount,
    filtersAreDefault,
    setFilter,
    resetFilters: () => setFilters(DEFAULT_ADMIN_USER_FILTERS),
  };
}
