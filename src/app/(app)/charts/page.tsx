import type { Metadata } from "next";
import { Suspense } from "react";
import { ScannerPage } from "@/features/scanner";

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
