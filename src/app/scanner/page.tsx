import type { Metadata } from "next";
import { Suspense } from "react";
import { ScannerPage } from "@/features/scanner";

export const metadata: Metadata = {
  title: "Scanner",
  description:
    "Full-screen stock scanner with weekly candles, scan highlights, drawing tools, and AI chart review.",
  alternates: {
    canonical: "/scanner",
  },
};

export default function Page() {
  // This Suspense boundary exists only because ScannerPage reads
  // useSearchParams() (a Next.js static-rendering requirement) — it isn't
  // covering real async work, so it resolves as soon as the client can read
  // the URL. No fallback UI: AuthGuard's own "Checking session" state
  // (delay-gated, so it doesn't flash for fast checks) is the first real
  // loading state a visitor should see, not a second spinner ahead of it.
  return (
    <Suspense fallback={null}>
      <ScannerPage />
    </Suspense>
  );
}
