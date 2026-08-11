"use client";

import { Pencil } from "lucide-react";
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
import { cn } from "@/utils/cn";
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
    <div className="overflow-hidden rounded-md border border-border bg-[var(--admin-table)] text-card-foreground">
      <Table>
        <TableHeader>
          <TableRow className="border-border bg-[var(--admin-table-header)] hover:bg-[var(--admin-table-header)]">
            <TableHead className="w-14 border-r border-border/70 px-3 text-right font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              No.
            </TableHead>
            <TableHead className="min-w-52 border-r border-border/70 px-4 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Name
            </TableHead>
            <TableHead className="min-w-64 border-r border-border/70 px-4 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Email
            </TableHead>
            <TableHead className="w-32 border-r border-border/70 px-4 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Role
            </TableHead>
            <TableHead className="w-32 border-r border-border/70 px-4 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Plan
            </TableHead>
            <TableHead className="w-44 border-r border-border/70 px-4 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Created
            </TableHead>
            <TableHead className="w-20 px-4 text-right font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user, index) => (
            <TableRow
              key={user.id}
              className="h-11 border-border/70 hover:bg-[var(--admin-row-hover)]"
            >
              <TableCell className="border-r border-border/70 px-3 text-right font-mono text-xs text-muted-foreground">
                {startIndex + index + 1}
              </TableCell>
              <TableCell className="border-r border-border/70 px-4">
                <div className="font-medium text-foreground">{user.name}</div>
              </TableCell>
              <TableCell className="border-r border-border/70 px-4 text-muted-foreground">
                {user.email}
              </TableCell>
              <TableCell className="border-r border-border/70 px-4">
                <AdminUserTag tone={user.role === "admin" ? "accent" : "neutral"}>
                  {formatUserRole(user.role)}
                </AdminUserTag>
              </TableCell>
              <TableCell className="border-r border-border/70 px-4">
                <AdminUserTag tone={user.plan === "pro" ? "accent" : "neutral"}>
                  {formatUserPlan(user.plan)}
                </AdminUserTag>
              </TableCell>
              <TableCell className="border-r border-border/70 px-4 font-mono text-xs text-muted-foreground">
                {formatAdminDate(user.createdAt)}
              </TableCell>
              <TableCell className="px-4 text-right">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Edit ${user.name || user.email}`}
                  className="rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
                  onClick={() => onEditUser(user)}
                >
                  <Pencil className="size-3.5" />
                </Button>
              </TableCell>
            </TableRow>
          ))}

          {users.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={7}
                className="py-12 text-center text-sm text-muted-foreground"
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

function AdminUserTag({
  children,
  tone,
}: {
  children: string;
  tone: "accent" | "neutral";
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-[4px] border px-2 font-mono text-[11px] font-semibold uppercase tracking-[0.12em]",
        tone === "accent"
          ? "border-primary/35 bg-primary/10 text-foreground"
          : "border-border bg-[var(--admin-elevated)] text-muted-foreground"
      )}
    >
      {children}
    </span>
  );
}

