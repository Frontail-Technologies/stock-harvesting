"use client";

import {
  createContext,
  useEffect,
  useContext,
  useMemo,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";

type SidebarContextValue = {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  toggle: () => void;
};

const SidebarContext = createContext<SidebarContextValue | null>(null);

function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within SidebarProvider");
  }
  return context;
}

function SidebarProvider({
  defaultCollapsed = true,
  storageKey,
  children,
}: {
  defaultCollapsed?: boolean;
  storageKey?: string;
  children: ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined" || !storageKey) return defaultCollapsed;
    const storedValue = window.localStorage.getItem(storageKey);
    if (storedValue === "true") return true;
    if (storedValue === "false") return false;
    return defaultCollapsed;
  });

  useEffect(() => {
    if (!storageKey) return;
    window.localStorage.setItem(storageKey, String(collapsed));
  }, [collapsed, storageKey]);

  const value = useMemo(
    () => ({
      collapsed,
      setCollapsed,
      toggle: () => setCollapsed((current) => !current),
    }),
    [collapsed]
  );

  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );
}

function Sidebar({ className, children, ...props }: ComponentProps<"aside">) {
  const { collapsed } = useSidebar();

  return (
    <aside
      data-collapsed={collapsed}
      className={cn(
        "group/sidebar flex h-[100dvh] shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 ease-out",
        collapsed ? "w-16" : "w-64",
        className
      )}
      {...props}
    >
      {children}
    </aside>
  );
}

function SidebarHeader({ className, ...props }: ComponentProps<"div">) {
  const { collapsed } = useSidebar();

  return (
    <div
      className={cn(
        "flex h-[4.5rem] shrink-0 items-center border-b border-sidebar-border px-3",
        collapsed ? "justify-center" : "justify-start",
        className
      )}
      {...props}
    />
  );
}

function SidebarContent({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("flex min-h-0 flex-1 flex-col gap-1 px-2 py-4", className)}
      {...props}
    />
  );
}

function SidebarFooter({ className, ...props }: ComponentProps<"div">) {
  const { collapsed } = useSidebar();

  return (
    <div
      className={cn(
        "flex shrink-0 flex-col gap-3 border-t border-sidebar-border px-2 py-3",
        collapsed ? "items-center" : "items-stretch",
        className
      )}
      {...props}
    />
  );
}

function SidebarTrigger({ className }: { className?: string }) {
  const { collapsed, toggle } = useSidebar();
  const Icon = collapsed ? PanelLeftOpen : PanelLeftClose;

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      onClick={toggle}
      className={cn(
        "size-8 rounded-md text-sidebar-foreground/65 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        className
      )}
    >
      <Icon className="size-4" />
    </Button>
  );
}

function SidebarMenu({ className, ...props }: ComponentProps<"nav">) {
  return <nav className={cn("flex flex-col gap-1", className)} {...props} />;
}

function SidebarMenuItem({
  active,
  disabled,
  className,
  ...props
}: ComponentProps<"span"> & {
  active?: boolean;
  disabled?: boolean;
}) {
  const { collapsed } = useSidebar();

  return (
    <span
      data-active={active}
      data-disabled={disabled}
      className={cn(
        "relative flex h-9 items-center rounded-md text-[13px] font-medium transition-colors duration-150",
        collapsed ? "justify-center px-0" : "justify-start gap-3 px-3",
        active &&
          "bg-sidebar-accent/80 text-sidebar-accent-foreground before:absolute before:left-0 before:top-1.5 before:h-6 before:w-0.5 before:rounded-full before:bg-primary",
        !active &&
          !disabled &&
          "text-sidebar-foreground/62 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
        disabled && "cursor-not-allowed text-sidebar-foreground/25",
        className
      )}
      {...props}
    />
  );
}

function SidebarLabel({ className, ...props }: ComponentProps<"span">) {
  const { collapsed } = useSidebar();

  if (collapsed) return null;
  return <span className={cn("truncate", className)} {...props} />;
}

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
};

