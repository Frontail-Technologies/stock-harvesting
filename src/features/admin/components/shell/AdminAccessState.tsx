"use client";

import { Shield } from "lucide-react";
import { BrandLogo } from "@/components/ui/brand-logo";
import { buttonVariants } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { getSiteUrl } from "@/utils/seo";

export function AdminLoadingState() {
  return (
    <div className="admin-shell flex min-h-dvh items-center justify-center bg-background px-6 text-foreground">
      <div className="flex flex-col items-center gap-4" aria-label="Loading admin workspace">
        <BrandLogo
          size="sm"
          markClassName="h-8 sm:h-9"
          textClassName="text-xl sm:text-2xl"
        />
        <Spinner size="md" className="text-primary" />
      </div>
    </div>
  );
}

export function AdminForbiddenState() {

  const siteUrl = getSiteUrl().origin;

  return (
    <div className="admin-shell flex min-h-dvh items-center justify-center bg-background px-6 text-foreground">
      <div className="w-full max-w-md rounded-md border border-border bg-card p-6 text-card-foreground">
        <div className="flex size-10 items-center justify-center rounded-md border border-destructive/25 bg-destructive/10 text-destructive">
          <Shield className="size-5" />
        </div>
        <h1 className="mt-4 text-xl font-semibold">Administrator access required.</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your account does not have permission to open this workspace.
        </p>
        <a href={siteUrl} className={buttonVariants({ className: "mt-5 rounded-md" })}>
          Visit Stock Harvesting
        </a>
      </div>
    </div>
  );
}

