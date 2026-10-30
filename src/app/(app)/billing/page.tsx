import type { Metadata } from "next";
import { BillingPage } from "@/features/billing";
import { AppPage, AppShell } from "@/features/layout";

export const metadata: Metadata = { title: "Billing" };

export default function Page() {
  return <AppShell><AppPage className="px-3 py-4 sm:px-6 sm:py-6" contentClassName="max-w-7xl"><BillingPage /></AppPage></AppShell>;
}
