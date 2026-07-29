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
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        title={label}
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
          active && "bg-primary/15 text-primary",
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
