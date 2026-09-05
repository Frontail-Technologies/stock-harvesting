"use client";

import { motion } from "framer-motion";
import { cn } from "@/utils/cn";

const SIGNAL_NOISE = Array.from({ length: 42 }, (_, i) => {
  const col = i % 6;
  const row = Math.floor(i / 6);
  return {
    x: 40 + col * 76 + Math.sin(i * 11.3) * 16,
    y: 20 + row * 50 + Math.cos(i * 6.1) * 14,
    size: 2 + ((i * 5) % 3),
    opacity: 0.07 + ((i * 3) % 6) * 0.03,
  };
});

const SIGNAL_PATHS = [
  "M100 40 C 140 160, 160 280, 190 400",
  "M400 50 C 360 170, 330 280, 300 400",
];

const FIELD_STALKS = Array.from({ length: 30 }, (_, i) => {
  const col = i % 6;
  const row = Math.floor(i / 6);
  const groundY = 458 + row * 72 + Math.sin(i * 3.7) * 10;
  const height = 34 + ((i * 7) % 26);
  const x = 56 + col * 76 + Math.cos(i * 2.9) * 10;
  return { x, groundY, topY: groundY - height };
});

const MATURE_STALK_INDEXES = new Set([1, 3, 8, 10, 12]);

const FIELD_ROW_LINES = [458, 530, 602, 674, 746].map(
  (y, i) => `M16 ${y} Q 250 ${y + (i % 2 === 0 ? 7 : -7)} 484 ${y}`,
);

function GrainHead({
  x,
  y,
  mature,
  delay,
}: {
  x: number;
  y: number;
  mature: boolean;
  delay: number;
}) {
  const armLength = mature ? 7 : 5;
  const strokeColor = mature
    ? "rgb(245 184 0 / 0.55)"
    : "var(--landing-diagram-secondary)";
  const arms = mature
    ? [
        [x, y, x - armLength, y - armLength * 0.7],
        [x, y, x + armLength, y - armLength * 0.7],
        [x, y, x, y - armLength],
      ]
    : [
        [x, y, x - armLength, y - armLength * 0.6],
        [x, y, x + armLength, y - armLength * 0.6],
      ];

  const content = (
    <g filter={mature ? "url(#signal-grain-glow)" : undefined}>
      {arms.map(([x1, y1, x2, y2], idx) => (
        <line
          key={idx}
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={strokeColor}
          strokeWidth={mature ? 1.25 : 1}
        />
      ))}
      <circle
        cx={x}
        cy={y}
        r={mature ? 3 : 2}
        fill={mature ? "var(--brand-gold)" : "var(--landing-diagram-secondary)"}
      />
    </g>
  );

  if (!mature) return content;

  return (
    <motion.g
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay }}
      style={{ transformOrigin: `${x}px ${y}px` }}
    >
      {content}
    </motion.g>
  );
}

export function AuthVisual({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 500 900"
      preserveAspectRatio="xMidYMid slice"
      className={cn("absolute inset-0 h-full w-full", className)}
      aria-hidden="true"
    >
      <defs>
        <filter
          id="signal-grain-glow"
          x="-200%"
          y="-200%"
          width="500%"
          height="500%"
        >
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {SIGNAL_PATHS.map((d, i) => (
        <motion.path
          key={d}
          d={d}
          stroke="var(--landing-diagram-secondary)"
          strokeWidth="1"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{
            duration: 2.2,
            delay: 0.3 + i * 0.3,
            ease: "easeInOut",
          }}
        />
      ))}

      {SIGNAL_NOISE.map((p) => (
        <rect
          key={`${p.x}-${p.y}`}
          x={p.x}
          y={p.y}
          width={p.size}
          height={p.size}
          fill={`rgb(var(--landing-fg-rgb) / calc(${p.opacity} * var(--landing-noise-scale)))`}
        />
      ))}

      {FIELD_ROW_LINES.map((d) => (
        <path
          key={d}
          d={d}
          stroke="var(--landing-grid-line)"
          strokeWidth="1"
          fill="none"
        />
      ))}

      {FIELD_STALKS.map((s, i) => {
        const mature = MATURE_STALK_INDEXES.has(i);
        return (
          <g key={`${s.x}-${s.groundY}`}>
            <line
              x1={s.x}
              y1={s.groundY}
              x2={s.x}
              y2={s.topY}
              stroke={
                mature ? "rgb(245 184 0 / 0.4)" : "var(--landing-diagram-faint)"
              }
              strokeWidth="1"
            />
            <GrainHead
              x={s.x}
              y={s.topY}
              mature={mature}
              delay={1.1 + i * 0.05}
            />
          </g>
        );
      })}
    </svg>
  );
}
