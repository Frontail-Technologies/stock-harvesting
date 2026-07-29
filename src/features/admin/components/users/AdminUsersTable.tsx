"use client";

import { Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatAdminDate,
  formatUserPlan,
  formatUserRole,
} from "../../lib/admin-formatters";
import type { AdminUser } from "../../types";

type AdminUsersTableProps = {
  users: AdminUser[];
  loading: boolean;
  error: unknown;
  startIndex: number;
  onEditUser: (user: AdminUser) => void;
};

export function AdminUsersTable({
  users,
  loading,
  error,
  startIndex,
  onEditUser,
}: AdminUsersTableProps) {
  return (
    <div className="overflow-hidden rounded-md border border-border bg-card text-card-foreground">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="w-14 border-r border-border px-4 text-xs font-semibold">
              No.
            </TableHead>
            <TableHead className="min-w-52 border-r border-border px-4 text-xs font-semibold">
              Name
            </TableHead>
            <TableHead className="min-w-64 border-r border-border px-4 text-xs font-semibold">
              Email
            </TableHead>
            <TableHead className="w-32 border-r border-border px-4 text-xs font-semibold">
              Role
            </TableHead>
            <TableHead className="w-32 border-r border-border px-4 text-xs font-semibold">
              Plan
            </TableHead>
            <TableHead className="w-44 border-r border-border px-4 text-xs font-semibold">
              Created
            </TableHead>
            <TableHead className="min-w-56 px-4 text-xs font-semibold">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user, index) => (
            <TableRow key={user.id} className="hover:bg-muted/30">
              <TableCell className="border-r border-border px-4 text-muted-foreground">
                {startIndex + index + 1}
              </TableCell>
              <TableCell className="border-r border-border px-4">
                <div className="font-medium text-foreground">{user.name}</div>
              </TableCell>
              <TableCell className="border-r border-border px-4 text-muted-foreground">
                {user.email}
              </TableCell>
              <TableCell className="border-r border-border px-4">
                <Badge
                  variant="outline"
                  className={
                    user.role === "admin"
                      ? "border-primary/30 bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  }
                >
                  {formatUserRole(user.role)}
                </Badge>
              </TableCell>
              <TableCell className="border-r border-border px-4">
                <Badge
                  variant="outline"
                  className={
                    user.plan === "pro"
                      ? "border-success/30 bg-success/10 text-success"
                      : "bg-muted text-muted-foreground"
                  }
                >
                  {formatUserPlan(user.plan)}
                </Badge>
              </TableCell>
              <TableCell className="border-r border-border px-4 text-muted-foreground">
                {formatAdminDate(user.createdAt)}
              </TableCell>
              <TableCell className="px-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => onEditUser(user)}
                >
                  <Pencil className="size-3.5" />
                  Edit
                </Button>
              </TableCell>
            </TableRow>
          ))}

          {users.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={7}
                className="py-10 text-center text-sm text-muted-foreground"
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <Spinner size="sm" />
                    Loading users...
                  </span>
                ) : error ? (
                  "Unable to load admin users."
                ) : (
                  "No users found."
                )}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
