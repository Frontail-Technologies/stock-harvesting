"use client";

import { useEffect } from "react";

export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let active = true;
    let frame = 0;
    let destroy: (() => void) | undefined;

    void import("lenis").then(({ default: Lenis }) => {
      if (!active) return;

      const lenis = new Lenis({
        lerp: 0.1,
        smoothWheel: true,
      });

      destroy = () => lenis.destroy();

      const loop = (time: number) => {
        lenis.raf(time);
        frame = requestAnimationFrame(loop);
      };

      frame = requestAnimationFrame(loop);
    });

    return () => {
      active = false;
      if (frame) cancelAnimationFrame(frame);
      destroy?.();
    };
  }, []);

  return null;
}
