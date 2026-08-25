"use client";

import { Shield } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { getSiteUrl } from "@/utils/seo";

export function AdminLoadingState() {
  return (
    <div className="admin-shell flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
      <div className="rounded-md border border-border bg-card px-5 py-4 font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground">
        Loading admin workspace...
      </div>
    </div>
  );
}

export function AdminForbiddenState() {
  // The admin panel can live on its own host - "back to app" always means
  // the main site's Scanner, which is a cross-origin destination there, so
  // this can't be a relative <Link>.
  const scannerUrl = `${getSiteUrl().origin}/scanner`;

  return (
    <div className="admin-shell flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
      <div className="w-full max-w-md rounded-md border border-border bg-card p-6 text-card-foreground">
        <div className="flex size-10 items-center justify-center rounded-md border border-destructive/25 bg-destructive/10 text-destructive">
          <Shield className="size-5" />
        </div>
        <h1 className="mt-4 text-xl font-semibold">Administrator access required.</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your account does not have permission to open this workspace.
        </p>
        <a href={scannerUrl} className={buttonVariants({ className: "mt-5 rounded-md" })}>
          Back to Stock Harvesting
        </a>
      </div>
    </div>
  );
}

