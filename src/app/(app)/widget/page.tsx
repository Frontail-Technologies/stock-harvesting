import type { Metadata } from "next";
import { AppPage, AppShell } from "@/features/layout";
import { WidgetPage } from "@/features/widget";

export const metadata: Metadata = {
  title: "Widget",
  description: "Quick view of stocks across your selected Segments.",
  alternates: {
    canonical: "/widget",
  },
};

export default function Page() {
  return (
    <AppShell>
      <AppPage className="px-3 py-8 font-sans sm:px-4 lg:px-6" contentClassName="max-w-none gap-8">
        <WidgetPage />
      </AppPage>
    </AppShell>
  );
}
