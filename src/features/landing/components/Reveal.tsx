import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/utils/cn";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  from?: "bottom" | "left" | "right" | "none";
};

const OFFSET = 20;

function getOffset(from: RevealProps["from"]) {
  if (from === "left") return { x: -OFFSET, y: 0 };
  if (from === "right") return { x: OFFSET, y: 0 };
  if (from === "none") return { x: 0, y: 0 };
  return { x: 0, y: OFFSET };
}

export function Reveal({ children, className, delay = 0, from = "bottom" }: RevealProps) {
  const offset = getOffset(from);
  const style = {
    "--landing-reveal-delay": `${delay}s`,
    "--landing-reveal-x": `${offset.x}px`,
    "--landing-reveal-y": `${offset.y}px`,
  } as CSSProperties;

  return (
    <div className={cn("landing-reveal", className)} style={style}>
      {children}
    </div>
  );
}

type StaggerProps = {
  children: ReactNode;
  className?: string;
  stagger?: number;
};

export function Stagger({ children, className, stagger = 0.08 }: StaggerProps) {
  const style = { "--landing-stagger-gap": `${stagger}s` } as CSSProperties;

  return (
    <div className={cn("landing-stagger", className)} style={style}>
      {children}
    </div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("landing-stagger-item", className)}>{children}</div>;
}
