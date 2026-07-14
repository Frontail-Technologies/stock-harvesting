"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ChevronDown, Wheat } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/features/theme";
import { cn } from "@/utils/cn";

type NavItem = {
  label: string;
  href: string;
  disabled?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Stocks", href: "/stocks" },
  { label: "Scanner", href: "/scanner" },
  { label: "Signals", href: "/signals", disabled: true },
  { label: "Profile", href: "/profile" },
];

export function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="h-16 shrink-0 border-b border-border bg-background/95 text-foreground backdrop-blur supports-[backdrop-filter]:bg-background/85">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link href="/scanner" className="flex items-center gap-2">
            <Wheat className="size-5 text-primary" />
            <span className="text-base font-semibold tracking-tight">
              Stock Harvesting
            </span>
          </Link>

          <nav className="flex items-center gap-6">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname?.startsWith(item.href);

              if (item.disabled) {
                return (
                  <span
                    key={item.href}
                    title="Coming soon"
                    className="cursor-not-allowed text-sm font-medium text-muted-foreground/45"
                  >
                    {item.label}
                  </span>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative py-5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                    isActive && "text-foreground"
                  )}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex h-9 items-center gap-1.5 rounded-md border border-border bg-card/60 px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              India Only / NSE
              <ChevronDown className="size-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>India Only / NSE</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <ThemeToggle />

          <Button
            type="button"
            variant="ghost"
            size="icon"
            title="Notifications"
            className="size-9 border border-border text-muted-foreground hover:text-foreground"
          >
            <Bell className="size-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
