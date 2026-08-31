import type { ReactNode } from "react";
import { CurrencyProvider } from "@/features/currency";

export default function AppRouteLayout({ children }: { children: ReactNode }) {
  return <CurrencyProvider>{children}</CurrencyProvider>;
}
