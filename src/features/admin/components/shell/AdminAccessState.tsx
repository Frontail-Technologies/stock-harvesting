"use client";

import Link from "next/link";
import { Shield } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export function AdminLoadingState() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-6 text-foreground">
      <div className="rounded-lg border border-border bg-card px-5 py-4 text-sm text-muted-foreground shadow-sm">
        Loading admin workspace...
      </div>
    </div>
  );
}

export function AdminForbiddenState() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-6 text-foreground">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 text-card-foreground shadow-sm">
        <div className="flex size-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
          <Shield className="size-5" />
        </div>
        <h1 className="mt-4 text-xl font-semibold">Admin access required</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your account does not have permission to open this workspace.
        </p>
        <Link href="/scanner" className={buttonVariants({ className: "mt-5" })}>
          Back to app
        </Link>
      </div>
    </div>
  );
}
