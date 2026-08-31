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
      {/* Matches Dashboard's page shell exactly: same px-3/sm:px-4/lg:px-6
          edge treatment as AppHeader itself (so content lines up with the
          navbar's logo/nav edges), and `max-w-none` in place of AppPage's
          default max-w-screen-2xl cap - full navbar width, not inset.
          Typography audit: this page already inherits Geist (the app
          sans) from the single global rule in globals.css
          (`html { @apply font-sans }`) - the ONLY thing anywhere in this
          codebase that ever applies the Manrope/editorial font is
          `.landing-root`, scoped to LandingPage.tsx alone (grep-verified,
          nothing in AppShell/AppPage/(app)/layout.tsx/this page
          references it). `font-sans` here is a belt-and-suspenders
          assertion at the one page-level root - not a per-element
          override - making the intent explicit rather than relying
          purely on implicit cascade. */}
      <AppPage
        className="px-3 py-8 font-sans sm:px-4 lg:px-6"
        contentClassName="max-w-none gap-8"
      >
        <WatchlistsPage />
      </AppPage>
    </AppShell>
  );
}
