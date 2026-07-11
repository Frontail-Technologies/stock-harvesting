import { AppShell } from "@/components/layout/AppShell";
import { ProfileOverview } from "@/components/profile/ProfileOverview";
import { UsageOverview } from "@/components/profile/UsageOverview";
import { PlanCard } from "@/components/profile/PlanCard";
import type { UsageStats, UserProfile } from "@/types/user";

const mockUser: UserProfile = {
  name: "Rahul Sharma",
  email: "rahul.sharma@example.com",
  plan: "Pro",
  renewsOn: "24 Aug 2026",
  avatarInitials: "RS",
};

const mockUsage: UsageStats = {
  dailyScanLimit: 200,
  scansUsedToday: 68,
  savedSignals: 128,
  activeAlerts: 12,
  apiAccessEnabled: true,
};

export default function ProfilePage() {
  return (
    <AppShell>
      <div className="flex-1 bg-muted/40 px-6 py-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-6">
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
        </div>
      </div>
    </AppShell>
  );
}
