"use client";

import { useState } from "react";
import {
  useAdminUsers,
  useDeleteAdminUser,
  useUpdateAdminUserPlan,
  useUpdateAdminUserRole,
} from "../../hooks/use-admin-users";
import { useAdminUserFilters } from "../../hooks/use-admin-user-filters";
import type { AdminUser } from "../../types";
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
        onRefresh={() => void usersQuery.refetch()}
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
