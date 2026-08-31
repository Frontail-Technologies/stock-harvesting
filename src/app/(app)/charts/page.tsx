import type { Metadata } from "next";
import { Suspense } from "react";
import { ScannerPage } from "@/features/scanner";

// Product rename: "Scanner" -> "Charts" (user-facing name + canonical
// route only - see the internal ScannerPage/scanner-ui-store etc., which
// intentionally keep their existing internal names per this pass's own
// scope decision, listed in the migration report). Old /scanner links
// redirect here (see next.config.ts's `redirects()`), preserving every
// query param (symbol/exchange/watchlist/...) automatically.
export const metadata: Metadata = {
  title: "Charts",
  description:
    "Full-screen stock charting workspace with weekly candles, scan highlights, drawing tools, and AI chart review.",
  alternates: {
    canonical: "/charts",
  },
};

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ScannerPage />
    </Suspense>
  );
}
