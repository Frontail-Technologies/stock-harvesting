import { Suspense } from "react";
import { DashboardPage } from "@/features/dashboard";
import { AppPage, AppShell } from "@/features/layout";

export default function Dashboard() {
  return (
    <AppShell>

      <AppPage className="px-3 py-6 sm:px-4 lg:px-6" contentClassName="max-w-none">
        <Suspense fallback={null}>
          <DashboardPage />
        </Suspense>
      </AppPage>
    </AppShell>
  );
}
