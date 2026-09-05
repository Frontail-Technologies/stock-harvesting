"use client";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

function GoogleIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
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

type GoogleAuthButtonProps = {
  pending: boolean;
  disabled: boolean;
  onClick: () => void | Promise<void>;
};

/**
 * The "OR" divider + Continue with Google control shared by the login and
 * register cards, so the markup and loading state exist in exactly one place.
 */
export function GoogleAuthButton({ pending, disabled, onClick }: GoogleAuthButtonProps) {
  return (
    <>
      <div className="my-4 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-landing-text-subtle">
        <span className="h-px flex-1 bg-landing-border" />
        OR
        <span className="h-px flex-1 bg-landing-border" />
      </div>

      <Button
        type="button"
        variant="outline"
        className="h-10 w-full cursor-pointer gap-3 rounded-lg border-landing-border-strong bg-white text-[13px] font-semibold text-slate-950 shadow-sm hover:bg-neutral-50 disabled:cursor-not-allowed dark:bg-white dark:text-slate-950 dark:hover:bg-neutral-100"
        onClick={onClick}
        disabled={disabled}
      >
        {pending ? <Spinner size="sm" /> : <GoogleIcon className="size-5" />}
        {pending ? "Connecting..." : "Continue with Google"}
      </Button>
    </>
  );
}
