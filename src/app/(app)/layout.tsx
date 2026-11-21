import type { Metadata } from "next";
import type { ReactNode } from "react";
import { CurrencyProvider } from "@/features/currency";

// Everything in this group is the signed-in app, the admin portal, or an auth screen -
// nothing a search result should land on. `robots` replaces the root layout's value
// for every page below (metadata keys merge shallowly), so pages here don't repeat it.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AppRouteLayout({ children }: { children: ReactNode }) {
  return <CurrencyProvider>{children}</CurrencyProvider>;
}
