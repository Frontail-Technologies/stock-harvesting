"use client";

import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
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
              Sr. No.
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
                <AdminUserIdentity name={user.name} email={user.email} />
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
                    <Spinner size="md" className="text-primary" />
                    Loading users...
                  </span>
                ) : error ? (
                  "Unable to load admin users."
                ) : (
                  <EmptyState size="compact" title="No users found." className="py-0" />
                )}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

const USER_AVATAR_TONES = [
  "bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300",
  "bg-indigo-100 text-indigo-800 dark:bg-indigo-400/15 dark:text-indigo-300",
  "bg-rose-100 text-rose-800 dark:bg-rose-400/15 dark:text-rose-300",
  "bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-300",
  "bg-violet-100 text-violet-800 dark:bg-violet-400/15 dark:text-violet-300",
  "bg-orange-100 text-orange-800 dark:bg-orange-400/15 dark:text-orange-300",
  "bg-cyan-100 text-cyan-800 dark:bg-cyan-400/15 dark:text-cyan-300",
] as const;

function AdminUserIdentity({ name, email }: { name: string; email: string }) {
  const label = name.trim() || email.trim();
  const initial = label.charAt(0).toUpperCase() || "?";
  const colorIndex = [...label].reduce((total, character) => total + character.charCodeAt(0), 0) % USER_AVATAR_TONES.length;

  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <span
        aria-hidden="true"
        className={cn(
          "inline-flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
          USER_AVATAR_TONES[colorIndex],
        )}
      >
        {initial}
      </span>
      <span className="truncate text-sm font-medium text-foreground">{label}</span>
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
