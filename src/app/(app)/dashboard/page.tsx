import { Suspense } from "react";
import { DashboardPage } from "@/features/dashboard";
import { AppPage, AppShell } from "@/features/layout";

export default function Dashboard() {
  return (
    <AppShell>

      <AppPage className="px-3 py-3 sm:px-4 sm:py-6 lg:px-6" contentClassName="max-w-none gap-3 sm:gap-6">
        <Suspense fallback={null}>
          <DashboardPage />
        </Suspense>
      </AppPage>
    </AppShell>
  );
}
