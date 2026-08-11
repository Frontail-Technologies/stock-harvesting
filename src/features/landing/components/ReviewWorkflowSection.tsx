"use client";

import { motion } from "framer-motion";
import { Reveal } from "./Reveal";

// Three connected workflow visuals (search → review → save/share). These are
// abstractions of real capabilities already shown individually in 02 / Chart
// Workspace, recomposed to tell the flow between them. Coordinates are
// deterministic (sine-based, not Math.random) so server and client render
// identical markup.

// 01 / Search — mixed global result list to show the product works across
// markets. Country names as metadata; no exchange-provider names.
const SEARCH_RESULTS = [
  { symbol: "RELIANCE", name: "Reliance Industries Limited · India", active: true },
  { symbol: "AAPL", name: "Apple Inc. · United States", active: false },
  { symbol: "BHP", name: "BHP Group · Australia", active: false },
  { symbol: "HSBC", name: "HSBC Holdings · United Kingdom", active: false },
  { symbol: "SONY", name: "Sony Group · Japan", active: false },
];

function SearchVisual() {
  const panel = { x: 24, y: 70, width: 320, height: 230 };
  const rowHeight = panel.height / SEARCH_RESULTS.length;
  const glyph = { x: 440, y: 116, width: 106, height: 90 };

  return (
    <svg
      viewBox="0 0 560 360"
      className="relative w-full h-full"
      role="img"
      aria-label="Illustration of a global symbol search with matching results across markets, the top match connecting into a small chart review preview"
    >
      <rect x="24" y="22" width="320" height="36" rx="6" fill="rgb(255 255 255 / 0.035)" stroke="rgb(255 255 255 / 0.28)" />
      <circle cx="44" cy="40" r="6" stroke="rgb(255 255 255 / 0.45)" fill="none" />
      <line x1="49" y1="45" x2="55" y2="51" stroke="rgb(255 255 255 / 0.45)" />
      <text x="64" y="46" fontFamily="var(--font-mono)" fontSize="13" fill="rgb(255 255 255 / 0.85)">
        REL
      </text>

      <rect
        x={panel.x}
        y={panel.y}
        width={panel.width}
        height={panel.height}
        rx="7"
        fill="rgb(255 255 255 / 0.02)"
        stroke="rgb(255 255 255 / 0.14)"
      />

      <motion.g
        initial={{ opacity: 0, y: 6 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.5, delay: 0.15 }}
      >
        {SEARCH_RESULTS.map((result, i) => {
          const rowY = panel.y + i * rowHeight;
          return (
            <g key={result.symbol}>
              {result.active ? (
                <rect
                  x={panel.x + 1}
                  y={rowY + 1}
                  width={panel.width - 2}
                  height={rowHeight - 2}
                  fill="rgb(245 184 0 / 0.08)"
                />
              ) : null}
              {i > 0 ? (
                <line x1={panel.x} y1={rowY} x2={panel.x + panel.width} y2={rowY} stroke="rgb(255 255 255 / 0.06)" />
              ) : null}
              <text x={panel.x + 14} y={rowY + rowHeight * 0.42} fontFamily="var(--font-sans)" fontWeight="700" fontSize="13" fill="rgb(255 255 255 / 0.92)">
                {result.symbol}
              </text>
              <text x={panel.x + 14} y={rowY + rowHeight * 0.74} fontFamily="var(--font-sans)" fontSize="10" fill="rgb(255 255 255 / 0.48)">
                {result.name}
              </text>
            </g>
          );
        })}
      </motion.g>

      <line
        x1={panel.x + panel.width + 8}
        y1={panel.y + rowHeight / 2}
        x2={glyph.x}
        y2={glyph.y + glyph.height / 2}
        stroke="rgb(255 255 255 / 0.32)"
        strokeWidth="1.25"
      />
      <motion.circle
        cx={(panel.x + panel.width + glyph.x) / 2}
        cy={(panel.y + rowHeight / 2 + glyph.y + glyph.height / 2) / 2}
        r="3.5"
        fill="var(--brand-gold)"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.3, delay: 0.6 }}
      />

      <rect x={glyph.x} y={glyph.y} width={glyph.width} height={glyph.height} fill="none" stroke="rgb(245 184 0 / 0.4)" />
      {[18, 38, 58, 78, 96].map((dx, i) => {
        const h = 16 + ((i * 10) % 34);
        return (
          <line
            key={dx}
            x1={glyph.x + dx}
            y1={glyph.y + glyph.height - 12}
            x2={glyph.x + dx}
            y2={glyph.y + glyph.height - 12 - h}
            stroke={i % 2 === 0 ? "var(--brand-green)" : "var(--brand-red)"}
            strokeOpacity="0.55"
            strokeWidth="3.5"
          />
        );
      })}

      <text x="24" y="14" className="landing-analysis-label">
        SEARCH
      </text>
      <text x={glyph.x} y={glyph.y - 12} className="landing-analysis-label landing-analysis-label-active">
        OPEN REVIEW
      </text>
    </svg>
  );
}

// 02 / Review — the state AFTER a stock has been selected: a single
// simplified price path with one already-surfaced area highlighted and a
// crosshair marking active inspection. Not a "market noise -> detected
// areas" composition (that's 01 / Proprietary Analysis's job).
const REVIEW_PRICE_D =
  "M24 270 C 110 200, 170 300, 240 230 S 380 110, 460 190 S 500 160 516 168";

const REVIEW_PATH_MARKERS = [
  { x: 90, y: 233 },
  { x: 160, y: 273 },
  { x: 240, y: 230 },
  { x: 320, y: 145 },
  { x: 400, y: 165 },
  { x: 470, y: 178 },
];

const REVIEW_HIGHLIGHT = { x: 210, y: 76, width: 130, height: 262 };
const REVIEW_CROSSHAIR = { x: 275, y: 190 };

function ReviewVisual() {
  return (
    <svg
      viewBox="0 0 540 338"
      className="relative w-full h-full"
      role="img"
      aria-label="Illustration of a single simplified price path with one already-surfaced area highlighted and a crosshair marking the point under review"
    >
      {[80, 150, 220, 290].map((y) => (
        <line key={y} x1="516" y1={y} x2="528" y2={y} stroke="rgb(255 255 255 / 0.2)" />
      ))}

      <path d={REVIEW_PRICE_D} stroke="rgb(255 255 255 / 0.22)" strokeWidth="1.5" fill="none" />

      {REVIEW_PATH_MARKERS.map((m) => (
        <circle key={m.x} cx={m.x} cy={m.y} r="2" fill="rgb(255 255 255 / 0.28)" />
      ))}

      <motion.g
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <rect
          x={REVIEW_HIGHLIGHT.x}
          y={REVIEW_HIGHLIGHT.y}
          width={REVIEW_HIGHLIGHT.width}
          height={REVIEW_HIGHLIGHT.height}
          fill="rgb(245 184 0 / 0.09)"
          stroke="rgb(245 184 0 / 0.3)"
        />

        <g stroke="rgb(255 255 255 / 0.55)" strokeWidth="1">
          <line x1={REVIEW_CROSSHAIR.x - 12} y1={REVIEW_CROSSHAIR.y} x2={REVIEW_CROSSHAIR.x + 12} y2={REVIEW_CROSSHAIR.y} />
          <line x1={REVIEW_CROSSHAIR.x} y1={REVIEW_CROSSHAIR.y - 12} x2={REVIEW_CROSSHAIR.x} y2={REVIEW_CROSSHAIR.y + 12} />
        </g>
        <circle cx={REVIEW_CROSSHAIR.x} cy={REVIEW_CROSSHAIR.y} r="4" fill="var(--brand-gold)" />
      </motion.g>

      <text x="24" y="20" className="landing-analysis-label">
        CHART CONTEXT
      </text>
      <text x={REVIEW_HIGHLIGHT.x} y="316" className="landing-analysis-label landing-analysis-label-active">
        DETECTED AREA
      </text>
    </svg>
  );
}

// A tiny abstract chart snapshot drawn inside a framed rectangle.
function MiniCandles({ frame }: { frame: { x: number; y: number; width: number; height: number } }) {
  const centerY = frame.y + frame.height / 2;
  return (
    <g>
      {[0, 1, 2, 3, 4, 5, 6].map((i) => {
        const x = frame.x + 18 + i * ((frame.width - 36) / 6);
        const h = 14 + ((i * 9) % 22);
        const up = i % 2 === 0;
        return (
          <rect
            key={i}
            x={x - 2.5}
            y={centerY - h / 2}
            width="5"
            height={h}
            fill={up ? "var(--brand-green)" : "var(--brand-red)"}
            fillOpacity="0.42"
          />
        );
      })}
    </g>
  );
}

// 03 / Save & Share — review → saved view → shared review, left to right.
const SHARE_NODES = [
  { x: 574, y: 125 },
  { x: 574, y: 180 },
  { x: 574, y: 235 },
];

function SaveShareVisual() {
  const review = { x: 24, y: 100, width: 196, height: 160 };
  const saved = { x: 282, y: 125, width: 150, height: 110 };
  const reviewCenterY = review.y + review.height / 2;
  const savedCenterY = saved.y + saved.height / 2;
  const trunkEnd = 508;
  const branchX = 556;
  const connect1Mid = (review.x + review.width + saved.x) / 2;

  return (
    <svg
      viewBox="0 0 620 360"
      className="relative w-full h-full"
      role="img"
      aria-label="Illustration of a reviewed chart being saved as a clean view and shared to a few reviewer nodes"
    >
      <rect x={review.x} y={review.y} width={review.width} height={review.height} fill="none" stroke="rgb(255 255 255 / 0.16)" />
      <MiniCandles frame={review} />
      <rect
        x={review.x + review.width * 0.5}
        y={review.y + 12}
        width={44}
        height={review.height - 24}
        fill="rgb(245 184 0 / 0.1)"
        stroke="rgb(245 184 0 / 0.3)"
      />

      <line x1={review.x + review.width} y1={reviewCenterY} x2={saved.x} y2={savedCenterY} stroke="rgb(255 255 255 / 0.3)" strokeDasharray="3 3" />
      <motion.rect
        x={connect1Mid - 3}
        y={(reviewCenterY + savedCenterY) / 2 - 3}
        width="6"
        height="6"
        fill="var(--brand-gold)"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.3, delay: 0.4 }}
      />

      <motion.g
        initial={{ opacity: 0, x: -8 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <rect x={saved.x} y={saved.y} width={saved.width} height={saved.height} fill="none" stroke="rgb(255 255 255 / 0.28)" />
        <rect x={saved.x + saved.width / 2 - 3.5} y={savedCenterY - 3.5} width="7" height="7" fill="var(--brand-gold)" />
      </motion.g>

      <motion.g
        stroke="rgb(255 255 255 / 0.28)"
        strokeWidth="1"
        fill="none"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.6, delay: 0.75 }}
      >
        <line x1={saved.x + saved.width} y1={savedCenterY} x2={trunkEnd} y2={savedCenterY} />
        <line x1={trunkEnd} y1={SHARE_NODES[0].y} x2={trunkEnd} y2={SHARE_NODES[2].y} />
        {SHARE_NODES.map((n) => (
          <line key={n.y} x1={trunkEnd} y1={n.y} x2={branchX} y2={n.y} />
        ))}
      </motion.g>

      <motion.g
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.5, delay: 1 }}
      >
        {SHARE_NODES.map((n) => (
          <g key={n.y}>
            <circle cx={n.x} cy={n.y} r="9" fill="none" stroke="rgb(255 255 255 / 0.4)" strokeWidth="1" />
            <circle cx={n.x} cy={n.y} r="1.8" fill="rgb(255 255 255 / 0.45)" />
          </g>
        ))}
      </motion.g>

      <text x={review.x} y="86" className="landing-analysis-label">
        REVIEW
      </text>
      <text x={saved.x} y="110" className="landing-analysis-label landing-analysis-label-active">
        SAVED VIEW
      </text>
      <text x={trunkEnd} y="110" className="landing-analysis-label">
        SHARED REVIEW
      </text>
    </svg>
  );
}

const STEPS = [
  {
    id: "search",
    label: "01 / Search",
    heading: "Find the stock you want to inspect",
    text: "Search across markets and move directly into the stock context you want to review.",
    Visual: SearchVisual,
    aspect: "560 / 360",
    reverse: false,
  },
  {
    id: "review",
    label: "02 / Review",
    heading: "Focus on what deserves attention",
    text: "Review the surfaced area together with the surrounding market context before forming your own view.",
    Visual: ReviewVisual,
    aspect: "540 / 338",
    reverse: true,
  },
  {
    id: "save-share",
    label: "03 / Save & Share",
    heading: "Keep the review. Share the context.",
    text: "Save a clean review and share the same chart context with others when needed.",
    Visual: SaveShareVisual,
    aspect: "620 / 360",
    reverse: false,
  },
];

export function ReviewWorkflowSection() {
  return (
    <section
      id="workflow"
      className="landing-section relative overflow-hidden border-t border-white/8"
      aria-labelledby="workflow-heading"
    >
      <div className="absolute inset-0 landing-container" aria-hidden="true">
        <div className="landing-frame-line landing-frame-line-left" />
        <div className="landing-frame-line landing-frame-line-right" />
      </div>

      <div className="landing-container relative">
        <Reveal>
          <p className="landing-eyebrow">03 / Review Workflow</p>
        </Reveal>

        <Reveal delay={0.05}>
          <h2
            id="workflow-heading"
            className="landing-section-heading mt-4 max-w-xl text-balance"
          >
            From search to review, without breaking your flow.
          </h2>
        </Reveal>

        <Reveal delay={0.1}>
          <p className="landing-section-subheading mt-4 max-w-lg">
            Search across markets, inspect what Stock Harvesting surfaces, and
            save or share the review — all inside the same workspace.
          </p>
        </Reveal>

        <div className="landing-workflow-rows mt-20 md:mt-24">
          {STEPS.map((step) => (
            <div
              key={step.id}
              className={
                step.reverse
                  ? "landing-workflow-row landing-workflow-row-reverse"
                  : "landing-workflow-row"
              }
            >
              <Reveal className="landing-workflow-copy">
                <p className="landing-workflow-step-label">{step.label}</p>
                <h3 className="landing-workflow-step-heading">{step.heading}</h3>
                <p className="landing-workflow-step-text">{step.text}</p>
              </Reveal>

              <Reveal from={step.reverse ? "left" : "right"} delay={0.1} className="landing-workflow-visual">
                <div className="landing-workflow-visual-grid" aria-hidden="true" />
                <div className="relative w-full" style={{ aspectRatio: step.aspect }}>
                  <step.Visual />
                </div>
              </Reveal>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
