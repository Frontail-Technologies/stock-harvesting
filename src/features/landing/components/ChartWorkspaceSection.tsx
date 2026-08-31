import { Reveal } from "./Reveal";

const CHART_CANDLES = Array.from({ length: 26 }, (_, i) => {
  const x = 16 + i * 24;
  const wave = Math.sin(i * 0.42) * 54 + Math.sin(i * 0.15 + 1.4) * 28;
  const center = 148 - wave;
  const bodyHalf = 6 + ((i * 5) % 9);
  const wickHalf = bodyHalf + 5 + ((i * 3) % 7);
  const up = Math.sin(i * 0.9) > 0;
  return {
    x,
    wickTop: center - wickHalf,
    wickBottom: center + wickHalf,
    bodyTop: center - bodyHalf,
    bodyBottom: center + bodyHalf,
    volume: 6 + ((i * 7) % 20),
    up,
  };
});

const HIGHLIGHT_RANGES = [
  { from: 5, to: 8 },
  { from: 17, to: 19 },
];

function ChartReviewIllustration() {
  return (
    <svg
      viewBox="0 0 640 300"
      className="relative w-full h-full"
      role="img"
      aria-label="Illustration of a weekly candlestick chart with a few detected areas highlighted"
    >
      {HIGHLIGHT_RANGES.map((range) => {
        const from = CHART_CANDLES[range.from].x - 10;
        const to = CHART_CANDLES[range.to].x + 10;
        return (
          <rect
            key={range.from}
            x={from}
            y={30}
            width={to - from}
            height={210}
            fill="var(--landing-highlight-fill)"
          />
        );
      })}

      <line x1="0" y1="240" x2="640" y2="240" stroke="var(--landing-border)" />
      {[60, 120, 180].map((y) => (
        <line key={y} x1="624" y1={y} x2="636" y2={y} stroke="var(--landing-diagram-secondary)" />
      ))}

      <g
      >
        {CHART_CANDLES.map((c) => (
          <g key={c.x}>
            <line
              x1={c.x}
              y1={c.wickTop}
              x2={c.x}
              y2={c.wickBottom}
              stroke={c.up ? "var(--brand-green)" : "var(--brand-red)"}
              strokeOpacity="0.4"
            />
            <rect
              x={c.x - 3.5}
              y={c.bodyTop}
              width="7"
              height={Math.max(2, c.bodyBottom - c.bodyTop)}
              fill={c.up ? "var(--brand-green)" : "var(--brand-red)"}
              fillOpacity="0.62"
            />
            <rect
              x={c.x - 3.5}
              y={290 - c.volume}
              width="7"
              height={c.volume}
              fill="var(--landing-diagram-secondary)"
            />
          </g>
        ))}
      </g>

      <text x="16" y="18" className="landing-analysis-label">
        O · H · L · C · WEEKLY
      </text>
      <text x="490" y="18" className="landing-analysis-label landing-analysis-label-active">
        CHART CONTEXT
      </text>
    </svg>
  );
}

function MiniChartMarks({ frame }: { frame: { x: number; y: number; width: number; height: number } }) {
  const centerY = frame.y + frame.height / 2;
  return (
    <g>
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const x = frame.x + 16 + i * ((frame.width - 28) / 5);
        const h = 12 + ((i * 7) % 16);
        const up = i % 2 === 0;
        return (
          <rect
            key={i}
            x={x - 2}
            y={centerY - h / 2}
            width="4"
            height={h}
            fill={up ? "var(--brand-green)" : "var(--brand-red)"}
            fillOpacity="0.4"
          />
        );
      })}
    </g>
  );
}

function SaveExportIllustration() {
  const frame = { x: 20, y: 34, width: 132, height: 82 };
  const out = { x: 288, y: 46, width: 108, height: 58 };
  const corner = 11;
  const midY = 75;
  const connectStart = frame.x + frame.width + 8;
  const midX = (connectStart + out.x) / 2;

  return (
    <svg
      viewBox="0 0 440 145"
      className="relative w-full h-full"
      role="img"
      aria-label="Illustration of a chart view being captured and saved as a separate exported output"
    >
      <rect
        x={frame.x}
        y={frame.y}
        width={frame.width}
        height={frame.height}
        fill="none"
        stroke="var(--landing-border-strong)"
      />
      <MiniChartMarks frame={frame} />

      <g
        stroke="var(--brand-gold)"
        strokeWidth="1.5"
        fill="none"
      >
        <path d={`M${frame.x - 6} ${frame.y - 6 + corner} V${frame.y - 6} H${frame.x - 6 + corner}`} />
        <path d={`M${frame.x + frame.width + 6 - corner} ${frame.y - 6} H${frame.x + frame.width + 6} V${frame.y - 6 + corner}`} />
        <path d={`M${frame.x - 6} ${frame.y + frame.height + 6 - corner} V${frame.y + frame.height + 6} H${frame.x - 6 + corner}`} />
        <path d={`M${frame.x + frame.width + 6 - corner} ${frame.y + frame.height + 6} H${frame.x + frame.width + 6} V${frame.y + frame.height + 6 - corner}`} />
      </g>

      <line
        x1={connectStart}
        y1={midY}
        x2={out.x}
        y2={midY}
        stroke="var(--landing-diagram-primary)"
        strokeDasharray="3 3"
      />
      <rect
        x={midX - 3}
        y={midY - 3}
        width="6"
        height="6"
        fill="var(--brand-gold)"
      />

      <g
      >
        <rect x={out.x} y={out.y} width={out.width} height={out.height} fill="none" stroke="var(--landing-border-strong)" />
        <rect x={out.x + out.width / 2 - 3} y={out.y + out.height / 2 - 3} width="6" height="6" fill="var(--brand-gold)" />
      </g>

      <text x={frame.x} y="24" className="landing-analysis-label landing-analysis-label-active">
        CAPTURE
      </text>
      <text x={midX} y="60" textAnchor="middle" className="landing-analysis-label">
        SAVE
      </text>
      <text x={out.x} y="126" className="landing-analysis-label">
        EXPORT
      </text>
    </svg>
  );
}

const REVIEWER_NODES = [
  { x: 326, y: 46 },
  { x: 326, y: 73 },
  { x: 326, y: 100 },
];

function ShareReviewIllustration() {
  const frame = { x: 20, y: 30, width: 140, height: 86 };
  const centerY = frame.y + frame.height / 2;
  const trunkEnd = 248;
  const branchX = 316;

  return (
    <svg
      viewBox="0 0 440 145"
      className="relative w-full h-full"
      role="img"
      aria-label="Illustration of a saved chart review shared through connecting lines to a few reviewer nodes"
    >
      <rect
        x={frame.x}
        y={frame.y}
        width={frame.width}
        height={frame.height}
        fill="none"
        stroke="var(--landing-border-strong)"
      />
      <MiniChartMarks frame={frame} />

      <g
        stroke="var(--landing-diagram-primary)"
        strokeWidth="1"
        fill="none"
      >
        <line x1={frame.x + frame.width} y1={centerY} x2={trunkEnd} y2={centerY} />
        <line x1={trunkEnd} y1={REVIEWER_NODES[0].y} x2={trunkEnd} y2={REVIEWER_NODES[2].y} />
        {REVIEWER_NODES.map((n) => (
          <line key={n.y} x1={trunkEnd} y1={n.y} x2={branchX} y2={n.y} />
        ))}
      </g>

      <rect
        x={frame.x + frame.width - 3}
        y={centerY - 3}
        width="6"
        height="6"
        fill="var(--brand-gold)"
      />

      <g
      >
        {REVIEWER_NODES.map((n) => (
          <g key={n.y}>
            <circle cx={n.x} cy={n.y} r="8" fill="none" stroke="var(--landing-diagram-primary)" strokeWidth="1" />
            <circle cx={n.x} cy={n.y} r="1.6" fill="var(--landing-diagram-primary)" />
          </g>
        ))}
      </g>

      <text x={frame.x} y="20" className="landing-analysis-label landing-analysis-label-active">
        SHARED REVIEW
      </text>
      <text x="298" y="20" className="landing-analysis-label">
        REVIEWERS
      </text>
    </svg>
  );
}

export function ChartWorkspaceSection() {
  return (
    <section
      id="chart-workspace"
      className="landing-section relative overflow-hidden border-t border-landing-border"
      aria-labelledby="workspace-heading"
    >
      <div className="absolute inset-0 landing-container" aria-hidden="true">
        <div className="landing-frame-line landing-frame-line-left" />
        <div className="landing-frame-line landing-frame-line-right" />
      </div>

      <div className="landing-container relative">
        <Reveal>
          <p className="landing-eyebrow">02 / Chart Workspace</p>
        </Reveal>

        <Reveal delay={0.05}>
          <h2
            id="workspace-heading"
            className="landing-section-heading mt-4 max-w-xl text-balance"
          >
            Everything you need to review a stock, in one workspace.
          </h2>
        </Reveal>

        <Reveal delay={0.1}>
          <p className="landing-section-subheading mt-4 max-w-lg">
            Move from a surfaced result to detailed chart review without
            switching between multiple tools.
          </p>
        </Reveal>

        <div className="landing-workspace-grid mt-10 md:mt-12">
          <Reveal delay={0.15} className="landing-workspace-block landing-workspace-block-primary">
            <div className="landing-workspace-block-media">
              <div className="landing-workspace-illustration landing-workspace-illustration-primary">
                <ChartReviewIllustration />
              </div>
            </div>
            <div className="landing-workspace-block-body">
              <p className="landing-workspace-block-label">01 / Chart Review</p>
              <p className="landing-workspace-block-text">
                Review surfaced market context with the surrounding chart in one focused workspace.
              </p>
            </div>
          </Reveal>

          <div className="landing-workspace-secondary">
            <Reveal delay={0.2} from="right" className="landing-workspace-block">
              <div className="landing-workspace-block-media">
                <div className="landing-workspace-illustration landing-workspace-illustration-secondary">
                  <SaveExportIllustration />
                </div>
              </div>
              <div className="landing-workspace-block-body">
                <p className="landing-workspace-block-label">02 / Save &amp; Export</p>
                <p className="landing-workspace-block-text">
                  Capture and save a clean chart view when you want to keep the
                  review for later.
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.25} from="right" className="landing-workspace-block">
              <div className="landing-workspace-block-media">
                <div className="landing-workspace-illustration landing-workspace-illustration-secondary">
                  <ShareReviewIllustration />
                </div>
              </div>
              <div className="landing-workspace-block-body">
                <p className="landing-workspace-block-label">03 / Share Review</p>
                <p className="landing-workspace-block-text">
                  Share a saved review with others so everyone can inspect the
                  same chart context.
                </p>
              </div>
            </Reveal>
          </div>
        </div>

        <p className="landing-workspace-meta mt-8">Dark / Light chart themes</p>
      </div>
    </section>
  );
}

