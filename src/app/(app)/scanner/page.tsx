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
  return (
    <Suspense fallback={null}>
      <ScannerPage />
    </Suspense>
  );
}
