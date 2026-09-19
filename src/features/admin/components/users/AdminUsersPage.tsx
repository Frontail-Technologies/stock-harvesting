"use client";

import { useState } from "react";
import { getAdminUsersExportCsv } from "../../api/admin-api";
import {
  useAdminUsers,
  useCreateAdminUser,
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
import { CreateAdminUserSheet } from "./CreateAdminUserSheet";

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
  const createMutation = useCreateAdminUser();
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [createSheetOpen, setCreateSheetOpen] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const csv = await getAdminUsersExportCsv(queryFilters);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      downloadBlob(blob, `stock-harvesting-users-${Date.now()}.csv`);
    } catch {
      return;
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

  const handleOpenCreateSheet = () => {
    createMutation.reset();
    setCreateSheetOpen(true);
  };

  const handleCreateAdmin = (input: { name: string; email: string; password: string }) => {
    createMutation.mutate(input, {
      onSuccess: () => setCreateSheetOpen(false),
    });
  };

  return (
    <div className="flex w-full flex-col gap-4">
      <AdminUsersHeader
        totalUsers={pagination.total}
        refreshing={usersQuery.isFetching}
        exporting={exporting}
        onRefresh={() => void usersQuery.refetch()}
        onExport={() => void handleExport()}
        onCreateAdmin={handleOpenCreateSheet}
      />

      <section className="flex flex-col gap-3 text-foreground">
        <div className="order-1">
          <AdminUsersFilters
            filters={filters}
            activeFilterCount={activeFilterCount}
            filtersAreDefault={filtersAreDefault}
            onFilterChange={setFilter}
            onReset={resetFilters}
          />
        </div>
        <div className="order-2">
          <AdminUsersTable
            users={users}
            loading={usersQuery.isLoading}
            error={usersQuery.error}
            startIndex={(pagination.page - 1) * pagination.limit}
            onEditUser={handleEditUser}
          />
        </div>
        <div className="order-3">
          <AdminUsersPagination
            filters={filters}
            pagination={pagination}
            loading={usersQuery.isFetching}
            onFilterChange={setFilter}
          />
        </div>
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

      <CreateAdminUserSheet
        open={createSheetOpen}
        onOpenChange={setCreateSheetOpen}
        pending={createMutation.isPending}
        error={createMutation.error?.message ?? null}
        onSubmit={handleCreateAdmin}
      />
    </div>
  );
}
