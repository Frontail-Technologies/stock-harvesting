import type { Metadata } from "next";
import { AppPage, AppShell } from "@/features/layout";
import { WatchlistsPage } from "@/features/watchlists";

export const metadata: Metadata = {
  title: "Watchlists",
  description:
    "Group stocks you track and open them directly in Charts.",
  alternates: {
    canonical: "/watchlists",
  },
};

export default function Page() {
  return (
    <AppShell>

      <AppPage
        className="px-3 pt-3 pb-6 font-sans sm:px-4 sm:pt-6 sm:pb-8 lg:px-6"
        contentClassName="max-w-none gap-3 sm:gap-8"
      >
        <WatchlistsPage />
      </AppPage>
    </AppShell>
  );
}
