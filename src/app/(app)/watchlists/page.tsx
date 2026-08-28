import type { Metadata } from "next";
import { AppPage, AppShell } from "@/features/layout";
import { WatchlistsPage } from "@/features/watchlists";

export const metadata: Metadata = {
  title: "Watchlists",
  description:
    "Group stocks you track and open them directly inside the scanner.",
  alternates: {
    canonical: "/watchlists",
  },
};

export default function Page() {
  return (
    <AppShell>
      <AppPage
        className="px-4 py-8 sm:px-8 sm:py-10 lg:px-8"
        contentClassName=" gap-8"
      >
        <WatchlistsPage />
      </AppPage>
    </AppShell>
  );
}
