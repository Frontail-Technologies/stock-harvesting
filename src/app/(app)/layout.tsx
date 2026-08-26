import type { ReactNode } from "react";
import { CurrencyProvider } from "@/features/currency";

// AuthBootstrap, QueryProvider, ThemeProvider and TooltipProvider all now
// live in the root layout (src/app/layout.tsx) - session resolution,
// React Query, theme and tooltips need to be available on every route,
// landing/login included (the landing navbar's account menu reads
// useTheme() and renders Tooltip-wrapped controls; the global Ctrl+K panel
// uses useQuery), not just once a protected (app) route happens to mount.
// CurrencyProvider stays scoped here - landing/login never render
// currency-formatted values.
export default function AppRouteLayout({ children }: { children: ReactNode }) {
  return <CurrencyProvider>{children}</CurrencyProvider>;
}
