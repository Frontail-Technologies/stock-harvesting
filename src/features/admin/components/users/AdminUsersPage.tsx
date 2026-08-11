"use client";

import { useState } from "react";
import { getAdminUsersExportCsv } from "../../api/admin-api";
import {
  useAdminUsers,
  useDeleteAdminUser,
  useUpdateAdminUserPlan,
  useUpdateAdminUserRole,
} from "../../hooks/use-admin-users";
import { useAdminUserFilters } from "../../hooks/use-admin-user-filters";
import type { AdminUser } from "../../types";
import { downloadBlob } from "@/utils/download-blob";
import { AdminUserSheet } from "./AdminUserSheet";
import { AdminUsersFilters } from "./AdminUsersFilters";
import { AdminUsersHeader } from "./AdminUsersHeader";
import { AdminUsersPagination } from "./AdminUsersPagination";
import { AdminUsersTable } from "./AdminUsersTable";

export function AdminUsersPage() {
  const {
    filters,
    queryFilters,
    activeFilterCount,
    filtersAreDefault,
    setFilter,
    resetFilters,
  } = useAdminUserFilters();
  const usersQuery = useAdminUsers(queryFilters);
  const roleMutation = useUpdateAdminUserRole();
  const planMutation = useUpdateAdminUserPlan();
  const deleteMutation = useDeleteAdminUser();
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const csv = await getAdminUsersExportCsv(queryFilters);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      downloadBlob(blob, `stock-harvesting-users-${Date.now()}.csv`);
    } catch {
      // No toast/notification system on this page yet — button just stops
      // spinning on failure rather than downloading a broken file.
    } finally {
      setExporting(false);
    }
  };
  const users = usersQuery.data?.users ?? [];
  const pagination = usersQuery.data?.pagination ?? {
    page: filters.page,
    limit: filters.limit,
    total: 0,
    totalPages: 1,
  };
  const editingUser = users.find((user) => user.id === editingUserId) ?? null;

  const handleEditUser = (user: AdminUser) => {
    deleteMutation.reset();
    setEditingUserId(user.id);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id, {
      onSuccess: () => setEditingUserId(null),
    });
  };

  return (
    <div className="flex w-full flex-col gap-5">
      <AdminUsersHeader
        totalUsers={pagination.total}
        refreshing={usersQuery.isFetching}
        exporting={exporting}
        onRefresh={() => void usersQuery.refetch()}
        onExport={() => void handleExport()}
      />
      <section className="rounded-lg border border-border bg-card p-3 text-card-foreground shadow-sm">
        <AdminUsersFilters
          filters={filters}
          activeFilterCount={activeFilterCount}
          filtersAreDefault={filtersAreDefault}
          onFilterChange={setFilter}
          onReset={resetFilters}
        />
        <AdminUsersPagination
          filters={filters}
          pagination={pagination}
          loading={usersQuery.isFetching}
          onFilterChange={setFilter}
        />
        <AdminUsersTable
          users={users}
          loading={usersQuery.isLoading}
          error={usersQuery.error}
          startIndex={(pagination.page - 1) * pagination.limit}
          onEditUser={handleEditUser}
        />
      </section>

      <AdminUserSheet
        user={editingUser}
        onOpenChange={(open) => {
          if (!open) setEditingUserId(null);
        }}
        rolePending={roleMutation.isPending}
        planPending={planMutation.isPending}
        deletePending={deleteMutation.isPending}
        deleteError={deleteMutation.error?.message ?? null}
        onRoleChange={roleMutation.mutate}
        onPlanChange={planMutation.mutate}
        onDelete={handleDelete}
      />
    </div>
  );
}
