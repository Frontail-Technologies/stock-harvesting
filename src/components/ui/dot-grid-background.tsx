"use client";

import { useCallback, useRef, type CSSProperties, type PointerEvent, type ReactNode } from "react";
import { cn } from "@/utils/cn";

type DotGridBackgroundProps = {
  children?: ReactNode;
  className?: string;
  dotSize?: number;
  gap?: number;
  glowRadius?: number;

  dotColor?: string;
};

export function DotGridBackground({
  children,
  className,
  dotSize = 1.5,
  gap = 24,
  glowRadius = 220,
  dotColor = "#d8d3c8",
}: DotGridBackgroundProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  const handlePointerMove = useCallback((event: PointerEvent<HTMLDivElement>) => {
    const root = rootRef.current;
    if (!root) return;
    const rect = root.getBoundingClientRect();
    root.style.setProperty("--dot-x", `${event.clientX - rect.left}px`);
    root.style.setProperty("--dot-y", `${event.clientY - rect.top}px`);
  }, []);

  const handlePointerEnter = useCallback(() => {
    rootRef.current?.style.setProperty("--dot-glow-opacity", "1");
  }, []);

  const handlePointerLeave = useCallback(() => {
    rootRef.current?.style.setProperty("--dot-glow-opacity", "0");
  }, []);

  return (
    <div
      ref={rootRef}
      onPointerMove={handlePointerMove}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      className={cn("relative isolate", className)}
      style={
        {
          "--dot-size": `${dotSize}px`,
          "--dot-gap": `${gap}px`,
          "--dot-glow-radius": `${glowRadius}px`,
          "--dot-x": "50%",
          "--dot-y": "50%",
          "--dot-glow-opacity": 0,
        } as CSSProperties
      }
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-60"
        style={{

          backgroundImage: `radial-gradient(${dotColor} var(--dot-size), transparent var(--dot-size))`,
          backgroundSize: "var(--dot-gap) var(--dot-gap)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 transition-opacity duration-300 ease-out"
        style={{
          opacity: "var(--dot-glow-opacity)",
          backgroundImage:
            "radial-gradient(var(--brand-gold) var(--dot-size), transparent var(--dot-size))",
          backgroundSize: "var(--dot-gap) var(--dot-gap)",
          WebkitMaskImage:
            "radial-gradient(circle var(--dot-glow-radius) at var(--dot-x) var(--dot-y), black, transparent 100%)",
          maskImage:
            "radial-gradient(circle var(--dot-glow-radius) at var(--dot-x) var(--dot-y), black, transparent 100%)",
        }}
      />
      {children}
    </div>
  );
}
