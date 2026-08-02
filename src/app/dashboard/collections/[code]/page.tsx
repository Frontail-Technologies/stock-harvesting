import { redirect } from "next/navigation";
import { DashboardCollectionPage } from "@/features/dashboard";
import { AppPage, AppShell } from "@/features/layout";
import { IS_PRODUCTION_LOCKDOWN } from "@/utils/production-lockdown";

export default async function DashboardCollectionRoute({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  if (IS_PRODUCTION_LOCKDOWN) {
    redirect("/scanner");
  }

  const { code } = await params;

  return (
    <AppShell>
      <AppPage>
        <DashboardCollectionPage code={code} />
      </AppPage>
    </AppShell>
  );
}
