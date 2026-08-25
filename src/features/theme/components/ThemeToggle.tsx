"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/utils/cn";
import { useTheme } from "./ThemeProvider";

type ThemeToggleProps = {
  className?: string;
  // The tooltip is portaled to document.body, outside any .scanner-shell
  // ancestor, so it can't inherit scanner theme tokens through the DOM -
  // only the scanner's own callers pass "scanner-portal" (same pattern as
  // MarketSelector's portalClassName). AppHeader/AdminSidebar omit it and
  // get the regular app tooltip styling.
  tooltipPortalClassName?: string;
};

export function ThemeToggle({ className, tooltipPortalClassName }: ThemeToggleProps = {}) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const Icon = isDark ? Sun : Moon;
  const label = isDark ? "Switch to light mode" : "Switch to dark mode";

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={label}
            onClick={toggleTheme}
            className={cn(
              "size-9 border border-border text-muted-foreground hover:text-foreground",
              className
            )}
          />
        }
      >
        <Icon className="size-4" />
      </TooltipTrigger>
      <TooltipContent side="bottom" className={tooltipPortalClassName}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}
