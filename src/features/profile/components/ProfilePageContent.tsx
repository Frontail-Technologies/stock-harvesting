"use client";

import { Spinner } from "@/components/ui/spinner";
import { useProfile } from "../hooks/use-profile";
import { PlanCard } from "./PlanCard";
import { ProfileOverview } from "./ProfileOverview";

export function ProfilePageContent() {
  const { user, isError, isPending } = useProfile();

  if (isPending && !user) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-card-foreground shadow-sm">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Spinner size="sm" />
          Loading profile...
        </div>
      </div>
    );
  }

  if (!user || isError) {
    return (
      <div className="rounded-lg border border-border bg-card p-6 text-card-foreground shadow-sm">
        <h2 className="text-base font-semibold text-foreground">
          Profile unavailable
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          We could not load your profile. Please refresh or sign in again.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(280px,380px)_minmax(0,1fr)]">
      <ProfileOverview user={user} />
      <PlanCard plan={user.plan} />
    </div>
  );
}
