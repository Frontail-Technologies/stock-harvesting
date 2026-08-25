import type { ReactNode } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CurrencyProvider } from "@/features/currency";
import { ThemeProvider } from "@/features/theme/components/ThemeProvider";

// AuthBootstrap and QueryProvider both now live in the root layout
// (src/app/layout.tsx) - session resolution and React Query need to be
// available on every route, landing included (the landing hero search and
// the global Ctrl+K panel both use useQuery), not just once a protected
// (app) route happens to mount.
export default function AppRouteLayout({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <CurrencyProvider>
        <TooltipProvider>{children}</TooltipProvider>
      </CurrencyProvider>
    </ThemeProvider>
  );
}
