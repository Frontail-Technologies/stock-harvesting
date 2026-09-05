"use client";

import type { ReactNode } from "react";
import { AuthVisual } from "./AuthVisual";

/**
 * Desktop: left illustration rail + right auth surface.
 * Mobile: illustration collapses above the same auth surface, single column.
 * `children` is the surface's own content (logo, heading, active form, etc.)
 * so this component owns layout only, not what's being authenticated.
 */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="login-split bg-landing-bg">
      <div className="login-visual" aria-hidden="true">
        <div className="login-visual-grid" />
        <AuthVisual />
      </div>

      <div className="login-auth min-w-0">
        <div className="login-visual-mobile" aria-hidden="true">
          <div className="login-visual-grid" />
          <AuthVisual />
        </div>

        <div className="login-auth-surface min-w-0 rounded-2xl border border-landing-border bg-landing-surface/92 p-5 shadow-[0_18px_60px_rgb(0_0_0_/0.08)] backdrop-blur sm:p-6 dark:shadow-[0_18px_60px_rgb(0_0_0_/0.28)]">
          {children}
        </div>
      </div>
    </div>
  );
}
