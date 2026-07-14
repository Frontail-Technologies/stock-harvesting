import { AppPage, AppShell } from "@/features/layout";
import { PlanCard, ProfileOverview, UsageOverview } from "@/features/profile";
import { mockUsage, mockUser } from "@/mocks/profile/user";

export default function ProfilePage() {
  return (
    <AppShell>
      <AppPage>
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Profile</h1>
          <p className="text-sm text-muted-foreground">
            Manage your account, usage and plan details
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="flex flex-col gap-5 lg:col-span-1">
            <ProfileOverview user={mockUser} />
            <PlanCard />
          </div>
          <div className="flex flex-col gap-5 lg:col-span-2">
            <UsageOverview usage={mockUsage} />
          </div>
        </div>
      </AppPage>
    </AppShell>
  );
}
