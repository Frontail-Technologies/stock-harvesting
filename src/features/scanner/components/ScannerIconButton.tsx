"use client";

import type { MouseEvent } from "react";
import type { ComponentType, SVGProps } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/utils/cn";

type ScannerIconButtonProps = {
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  active?: boolean;
  className?: string;
  disabled?: boolean;
  onClick: (event: MouseEvent<HTMLElement>) => void;
};

export function ScannerIconButton({
  label,
  icon: Icon,
  active = false,
  className,
  disabled = false,
  onClick,
}: ScannerIconButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        type="button"

        aria-disabled={disabled || undefined}
        onClick={disabled ? undefined : onClick}
        aria-label={label}
        className={cn(
          "relative flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary/60",
          !disabled && "cursor-pointer hover:bg-muted hover:text-foreground",
          active &&
            "bg-muted text-primary after:absolute after:top-1/2 after:left-0 after:h-4 after:w-0.5 after:-translate-y-1/2 after:rounded-full after:bg-primary",
          disabled && "cursor-not-allowed opacity-35 hover:bg-transparent hover:text-muted-foreground",
          className
        )}
      >
        <Icon className="size-4" />
      </TooltipTrigger>
      <TooltipContent side="right" className="scanner-portal">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}
