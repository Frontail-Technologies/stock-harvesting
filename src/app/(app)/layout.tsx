import type { ReactNode } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryProvider } from "@/features/api";
import { AuthBootstrap } from "@/features/auth";
import { CurrencyProvider } from "@/features/currency";
import { ThemeProvider } from "@/features/theme/components/ThemeProvider";

export default function AppRouteLayout({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <CurrencyProvider>
          <AuthBootstrap />
          <TooltipProvider>{children}</TooltipProvider>
        </CurrencyProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
