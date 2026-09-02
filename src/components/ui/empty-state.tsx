import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/utils/cn";

type EmptyStateActionIcon = ComponentType<{ className?: string }>;

type EmptyStateAction = {
  label: string;
  icon?: EmptyStateActionIcon;
  href?: string;
  onClick?: () => void;
};

type EmptyStateProps = {
  illustration?: ReactNode;
  eyebrow?: string;
  title: string;
  description?: string;
  primaryAction?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  size?: "default" | "compact";
  className?: string;
};

function ActionContent({ action }: { action: EmptyStateAction }) {
  const Icon = action.icon;
  return (
    <>
      {Icon && <Icon className="size-4" />}
      {action.label}
    </>
  );
}

function PrimaryAction({ action }: { action: EmptyStateAction }) {
  if (action.href) {
    return (
      <Link
        href={action.href}
        className={cn(buttonVariants({ variant: "default" }), "w-full gap-1.5 sm:w-auto")}
      >
        <ActionContent action={action} />
      </Link>
    );
  }

  return (
    <Button type="button" onClick={action.onClick} className="w-full gap-1.5 sm:w-auto">
      <ActionContent action={action} />
    </Button>
  );
}

function SecondaryAction({ action }: { action: EmptyStateAction }) {
  if (action.href) {
    return (
      <Link
        href={action.href}
        className="text-xs font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
      >
        {action.label}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={action.onClick}
      className="cursor-pointer text-xs font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
    >
      {action.label}
    </button>
  );
}

export function EmptyState({
  illustration,
  eyebrow,
  title,
  description,
  primaryAction,
  secondaryAction,
  size = "default",
  className,
}: EmptyStateProps) {
  const isCompact = size === "compact";

  return (
    <div
      className={cn(
        "flex flex-col items-center text-center",
        isCompact ? "gap-3 py-6" : "gap-5 py-6 sm:py-8",
        className,
      )}
    >
      {illustration}

      <div className={cn("flex flex-col gap-1.5", isCompact ? "max-w-64" : "max-w-sm")}>
        {eyebrow && (
          <span className="font-mono text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {eyebrow}
          </span>
        )}
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {description && (
          <p className={cn("text-muted-foreground", isCompact ? "text-xs" : "text-sm")}>
            {description}
          </p>
        )}
      </div>

      {(primaryAction || secondaryAction) && (
        <div className="flex flex-col items-center gap-2 sm:flex-row">
          {primaryAction && <PrimaryAction action={primaryAction} />}
          {secondaryAction && <SecondaryAction action={secondaryAction} />}
        </div>
      )}
    </div>
  );
}

type EmptyStatePreviewCardProps = {
  label: string;
  badge?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function EmptyStatePreviewCard({
  label,
  badge,
  children,
  className,
}: EmptyStatePreviewCardProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "w-full max-w-56 rounded-xl border border-border bg-card px-4 py-3.5",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </span>
        {badge}
      </div>
      <div className="mt-3 flex flex-col gap-2.5">{children}</div>
    </div>
  );
}
