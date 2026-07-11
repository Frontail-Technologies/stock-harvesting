"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ChevronDown, Wheat } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

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
    <header className="h-16 shrink-0 border-b border-brand-border bg-brand-navy text-white">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link href="/scanner" className="flex items-center gap-2">
            <Wheat className="size-5 text-brand-gold" />
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
                    className="cursor-not-allowed text-sm font-medium text-white/30"
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
                    "relative py-5 text-sm font-medium text-white/60 transition-colors hover:text-white",
                    isActive && "text-white"
                  )}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-brand-gold" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1.5 rounded-md border border-brand-border px-3 py-1.5 text-sm font-medium text-white/80 transition-colors hover:bg-white/5 hover:text-white">
              India Only / NSE
              <ChevronDown className="size-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>India Only / NSE</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            type="button"
            title="Notifications"
            className="flex size-9 items-center justify-center rounded-md border border-brand-border text-white/70 transition-colors hover:bg-white/5 hover:text-white"
          >
            <Bell className="size-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
