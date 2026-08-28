import { Suspense } from "react";
import { redirect } from "next/navigation";
import { DashboardPage } from "@/features/dashboard";
import { AppPage, AppShell } from "@/features/layout";
import { IS_PRODUCTION_LOCKDOWN } from "@/utils/production-lockdown";

export default function Dashboard() {
  if (IS_PRODUCTION_LOCKDOWN) {
    redirect("/scanner");
  }

  return (
    <AppShell>
      {/* Matches AppHeader's own edge treatment exactly (px-3/sm:px-4/lg:px-6,
          no max-width cap) instead of AppPage's default max-w-screen-2xl -
          on any viewport wider than that cap the Dashboard content used to
          sit visibly inset from the navbar's logo/nav edges. */}
      <AppPage className="px-3 py-6 sm:px-4 lg:px-6" contentClassName="max-w-none">
        <Suspense fallback={null}>
          <DashboardPage />
        </Suspense>
      </AppPage>
    </AppShell>
  );
}
