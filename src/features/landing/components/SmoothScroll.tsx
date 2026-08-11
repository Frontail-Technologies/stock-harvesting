"use client";

import { useEffect } from "react";
import Lenis from "lenis";

// Global smooth scroll for the landing page. Lenis eases the *native* window
// scroll (it doesn't transform a wrapper), so window.scrollY stays accurate —
// IntersectionObserver, framer-motion whileInView reveals, the native
// scrollbar, keyboard scrolling and hash anchors all keep working. Renders
// nothing; it's a lifecycle-only side effect scoped to the landing route, so
// the scanner/admin apps keep their own native scrolling.
export function SmoothScroll() {
  useEffect(() => {
    // Respect reduced-motion: no interpolation, fall back to native scroll.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      lerp: 0.1,
      smoothWheel: true,
      // syncTouch defaults to false → mobile keeps natural native touch scroll.
    });

    let frame = 0;
    const loop = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
    };
  }, []);

  return null;
}
