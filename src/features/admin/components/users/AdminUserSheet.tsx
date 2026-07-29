"use client";

import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { UserPlan, UserRole } from "@/features/auth";
import { formatAdminDate } from "../../lib/admin-formatters";
import type { AdminUser } from "../../types";
import { AdminSelect } from "./AdminSelect";

type AdminUserSheetProps = {
  user: AdminUser | null;
  onOpenChange: (open: boolean) => void;
  rolePending: boolean;
  planPending: boolean;
  deletePending: boolean;
  deleteError: string | null;
  onRoleChange: (input: { id: string; role: UserRole }) => void;
  onPlanChange: (input: { id: string; plan: UserPlan }) => void;
  onDelete: (id: string) => void;
};

export function AdminUserSheet({
  user,
  onOpenChange,
  rolePending,
  planPending,
  deletePending,
  deleteError,
  onRoleChange,
  onPlanChange,
  onDelete,
}: AdminUserSheetProps) {
  return (
    <Sheet open={Boolean(user)} onOpenChange={onOpenChange}>
      <SheetContent>
        {user && (
          <>
            <SheetHeader>
              <SheetTitle>{user.name}</SheetTitle>
              <SheetDescription>{user.email}</SheetDescription>
            </SheetHeader>

            <div className="flex flex-1 flex-col gap-4">
              <div className="rounded-lg border border-border bg-background/60 px-3 py-2">
                <div className="text-xs font-medium text-muted-foreground">Joined</div>
                <div className="mt-1 text-sm font-semibold text-foreground">
                  {formatAdminDate(user.createdAt)}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">Role</span>
                <AdminSelect
                  label="Role"
                  value={user.role}
                  onChange={(value) => onRoleChange({ id: user.id, role: value as UserRole })}
                  options={[
                    { value: "user", label: "User" },
                    { value: "admin", label: "Admin" },
                  ]}
                  disabled={rolePending}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">Plan</span>
                <AdminSelect
                  label="Plan"
                  value={user.plan}
                  onChange={(value) => onPlanChange({ id: user.id, plan: value as UserPlan })}
                  options={[
                    { value: "free", label: "Free" },
                    { value: "pro", label: "Pro" },
                  ]}
                  disabled={planPending}
                />
              </div>
            </div>

            <SheetFooter className="flex-col items-stretch gap-3 sm:flex-col sm:items-stretch">
              {deleteError && (
                <p className="text-xs text-danger">{deleteError}</p>
              )}
              <DeleteUserFooter
                key={user.id}
                user={user}
                deletePending={deletePending}
                onDelete={onDelete}
              />
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function DeleteUserFooter({
  user,
  deletePending,
  onDelete,
}: {
  user: AdminUser;
  deletePending: boolean;
  onDelete: (id: string) => void;
}) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  if (!confirmingDelete) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5 self-start text-danger hover:bg-danger/10 hover:text-danger"
        onClick={() => setConfirmingDelete(true)}
      >
        <Trash2 className="size-3.5" />
        Delete user
      </Button>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-danger/30 bg-danger/10 p-3">
      <p className="text-sm text-danger">Delete {user.name}? This can&apos;t be undone.</p>
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setConfirmingDelete(false)}
          disabled={deletePending}
        >
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          className="gap-1.5 bg-danger text-white hover:bg-danger/90"
          onClick={() => onDelete(user.id)}
          disabled={deletePending}
        >
          {deletePending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Trash2 className="size-3.5" />
          )}
          Confirm delete
        </Button>
      </div>
    </div>
  );
}
