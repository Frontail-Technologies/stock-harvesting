import { Reveal, Stagger, StaggerItem } from "./Reveal";

const SUPPORTING_ROWS = [
  {
    label: "Focused Review",
    text: "Less market information to manually inspect.",
  },
  {
    label: "Chart Context",
    text: "Move directly from a result into full chart review.",
  },
];

const NOISE_POINTS = Array.from({ length: 46 }, (_, i) => {
  const col = i % 9;
  const row = Math.floor(i / 9);
  const x = 20 + col * 60 + Math.sin(i * 12.9) * 16;
  const y = 16 + row * 58 + Math.cos(i * 7.3) * 14;
  const density = 1 - (x / 560) * 0.55 - (y / 460) * 0.25;
  return {
    x,
    y,
    size: 3 + ((i * 5) % 3),
    opacity: Math.max(0.05, Math.min(0.32, density * 0.34)),
  };
});

const FOCUS_POINTS = [
  { x: 402, y: 336 },
  { x: 438, y: 358 },
  { x: 470, y: 344 },
  { x: 500, y: 372 },
];

const LABELED_SOURCES = [
  { label: "FII", x: 60, y: 66, anchor: "start" as const, path: "M60 66 C 180 140, 300 250, 402 336" },
  { label: "DII", x: 168, y: 46, anchor: "start" as const, path: "M168 46 C 260 150, 350 260, 430 352" },
  { label: "Technicals", x: 286, y: 64, anchor: "start" as const, path: "M286 64 C 350 150, 410 260, 458 344" },
  { label: "Fundamentals", x: 150, y: 138, anchor: "start" as const, path: "M150 138 C 250 210, 360 290, 444 340" },
  { label: "Fund Size", x: 352, y: 150, anchor: "start" as const, path: "M352 150 C 410 220, 450 300, 486 360" },
  { label: "Ownership", x: 452, y: 86, anchor: "end" as const, path: "M452 86 C 484 180, 482 280, 470 368" },
];

export function AnalysisSection() {
  return (
    <section
      id="scanner-method"
      className="landing-section relative overflow-hidden"
      aria-labelledby="analysis-heading"
    >
      <div className="absolute inset-0 landing-container" aria-hidden="true">
        <div className="landing-frame-line landing-frame-line-left" />
        <div className="landing-frame-line landing-frame-line-right" />
      </div>

      <div className="landing-container relative landing-analysis-grid">
        <div>
          <Reveal>
            <p className="landing-eyebrow">01 / Professional Analysis</p>
          </Reveal>

          <Reveal delay={0.05}>
            <h2
              id="analysis-heading"
              className="landing-section-heading mt-4 max-w-md text-balance"
            >
              Intelligence that narrows the market
            </h2>
          </Reveal>

          <Reveal delay={0.1}>
            <p className="landing-section-subheading mt-4 max-w-md">
              Stock Harvesting brings multiple layers of market context
              together to surface relevant behaviour, helping traders focus
              their review instead of manually searching through large amounts
              of market data.
            </p>
          </Reveal>

          <Stagger className="mt-8 max-w-md">
            {SUPPORTING_ROWS.map((row) => (
              <StaggerItem key={row.label}>
                <div className="landing-analysis-copy-row">
                  <p className="landing-analysis-row-label">{row.label}</p>
                  <p className="landing-analysis-row-text">{row.text}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>

        <Reveal from="right" delay={0.15}>
          <div className="landing-analysis-field">
            <div className="landing-analysis-field-grid" aria-hidden="true" />
            <svg
              viewBox="0 0 560 460"
              className="relative w-full h-full"
              role="img"
              aria-label="Illustration of many faint market observations gradually narrowing into a small set of highlighted signals"
            >
              <defs>
                <filter id="analysis-glow" x="-100%" y="-100%" width="300%" height="300%">
                  <feGaussianBlur stdDeviation="5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {LABELED_SOURCES.map((source) => (
                <path
                  key={source.path}
                  d={source.path}
                  stroke="var(--landing-diagram-primary)"
                  strokeWidth="1"
                  fill="none"
                />
              ))}

              {NOISE_POINTS.map((p) => (
                <rect
                  key={`${p.x}-${p.y}`}
                  x={p.x}
                  y={p.y}
                  width={p.size}
                  height={p.size}
                  fill={`rgb(var(--landing-fg-rgb) / calc(${p.opacity} * var(--landing-noise-scale)))`}
                />
              ))}

              {LABELED_SOURCES.map((source) => (
                <g key={source.label}>
                  <rect
                    x={source.x - 2}
                    y={source.y - 2}
                    width="4"
                    height="4"
                    fill="var(--landing-diagram-primary)"
                  />
                  <text
                    x={source.anchor === "end" ? source.x - 8 : source.x + 8}
                    y={source.y + 3}
                    textAnchor={source.anchor}
                    className="landing-analysis-label"
                  >
                    {source.label}
                  </text>
                </g>
              ))}

              <g
                filter="url(#analysis-glow)"
              >
                {FOCUS_POINTS.map((p) => (
                  <rect
                    key={`${p.x}-${p.y}`}
                    x={p.x}
                    y={p.y}
                    width="6"
                    height="6"
                    fill="var(--brand-gold)"
                  />
                ))}
              </g>

              <text x="18" y="20" className="landing-analysis-label">
                MARKET DATA
              </text>
              <text
                x="378"
                y="410"
                className="landing-analysis-label landing-analysis-label-active"
              >
                DETECTED AREA
              </text>
            </svg>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

