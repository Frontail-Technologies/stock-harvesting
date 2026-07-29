"use client";

import { useEffect, useState } from "react";

export function ThemeWhoosh({ active }: { active: boolean }) {
  const [mounted, setMounted] = useState(active);

  useEffect(() => {
    if (active) {
      const frameId = window.requestAnimationFrame(() => setMounted(true));
      return () => window.cancelAnimationFrame(frameId);
    }
    const timeoutId = window.setTimeout(() => setMounted(false), 150);
    return () => window.clearTimeout(timeoutId);
  }, [active]);

  if (!mounted) return null;

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-0 z-9999 overflow-hidden backdrop-blur-[2px] transition-opacity duration-150 ${
        active ? "opacity-100" : "opacity-0"
      }`}
    >
      <div
        className={`absolute inset-y-[-8%] left-0 w-[44vw] -skew-x-10 bg-primary/30 blur-3xl transition-transform ease-[cubic-bezier(0.65,0,0.35,1)] ${
          active ? "duration-420 translate-x-[125vw]" : "translate-x-[-65vw]"
        }`}
      />
      <div
        className={`absolute inset-y-0 left-0 w-[36vw] -skew-x-10 bg-linear-to-r from-transparent via-primary/55 to-transparent blur-2xl transition-transform ease-[cubic-bezier(0.65,0,0.35,1)] ${
          active ? "duration-420 translate-x-[130vw]" : "translate-x-[-55vw]"
        }`}
      />
      <div
        className={`absolute inset-y-0 left-0 w-[18vw] -skew-x-10 bg-card/35 blur-xl transition-transform ease-[cubic-bezier(0.65,0,0.35,1)] ${
          active ? "duration-360 translate-x-[118vw]" : "translate-x-[-35vw]"
        }`}
      />
    </div>
  );
}
