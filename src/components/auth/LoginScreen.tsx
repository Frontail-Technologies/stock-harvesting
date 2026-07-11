"use client";

import { useRouter } from "next/navigation";
import { Wheat } from "lucide-react";
import { Button } from "@/components/ui/button";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="size-4" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20.4H24v7.2h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.1-5.1C34.5 6.2 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l5.9 4.3C13.9 15.4 18.6 12 24 12c3.1 0 5.9 1.2 8 3.1l5.1-5.1C34.5 6.2 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.4 0 10.3-2.1 14-5.5l-6.5-5.5c-2 1.4-4.6 2.3-7.5 2.3-5.3 0-9.7-3.4-11.3-8.1l-6.1 4.7C9.6 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20.4H24v7.2h11.3c-.8 2.3-2.2 4.3-4.1 5.7l6.5 5.5C41.5 36 44 30.5 44 24c0-1.3-.1-2.7-.4-3.5z"
      />
    </svg>
  );
}

export function LoginScreen() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-brand-navy px-6 py-16 text-white">
      <div className="flex flex-col items-center text-center">
        <div className="flex size-20 items-center justify-center rounded-full border-2 border-brand-gold/40 bg-brand-gold/10">
          <Wheat className="size-9 text-brand-gold" />
        </div>

        <h1 className="mt-6 text-3xl font-bold tracking-tight">
          STOCK <span className="text-brand-gold">HARVESTING</span>
        </h1>
        <p className="mt-2 max-w-xs text-sm text-white/60">
          Scan. Identify. Harvest. Opportunities in every market.
        </p>
      </div>

      <div className="mt-10 w-full max-w-sm rounded-xl border border-brand-border bg-brand-panel p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-white">Welcome back</h2>
        <p className="mt-1 text-sm text-white/60">
          Sign in to continue to Stock Harvesting
        </p>

        <Button
          className="mt-6 w-full gap-2 bg-white text-brand-text-dark hover:bg-white/90"
          onClick={() => router.push("/dashboard")}
        >
          <GoogleIcon />
          Continue with Google
        </Button>
      </div>

      <footer className="mt-10 flex flex-col items-center gap-1.5 text-xs text-white/40">
        <span>© 2026 Stock Harvesting. All rights reserved.</span>
        <span className="flex items-center gap-3">
          <a href="#" className="hover:text-white/70">
            Privacy Policy
          </a>
          <span>·</span>
          <a href="#" className="hover:text-white/70">
            Terms of Use
          </a>
        </span>
      </footer>
    </div>
  );
}
