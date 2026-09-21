import type { Metadata } from "next";
import { AppPage, AppShell } from "@/features/layout";
import { ProfilePage } from "@/features/profile";

export const metadata: Metadata = {
  title: "Profile",
};

export default function Page() {
  return (
    <AppShell>
      <AppPage className="px-3 py-3 sm:px-6 sm:py-6" contentClassName="max-w-2xl gap-3 sm:gap-5">
        <ProfilePage />
      </AppPage>
    </AppShell>
  );
}
