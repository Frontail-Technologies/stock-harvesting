import Link from "next/link";
import { Reveal } from "./Reveal";

export function FinalCtaSection() {
  return (
    <section
      id="cta"
      className="landing-section relative overflow-hidden border-t border-white/8"
      aria-labelledby="cta-heading"
    >
      <div className="absolute inset-0 landing-container" aria-hidden="true">
        <div className="landing-frame-line landing-frame-line-left" />
        <div className="landing-frame-line landing-frame-line-right" />
      </div>

      <div className="landing-container relative">
        <Reveal className="landing-cta-panel">
          <div className="landing-cta-accent" aria-hidden="true">
            <span className="landing-cta-accent-dot" />
            <span className="landing-cta-accent-rule" />
            <span className="landing-cta-accent-dot" />
          </div>

          <p className="landing-eyebrow">Ready to Review?</p>
          <h2 id="cta-heading" className="landing-cta-heading text-balance">
            Open the workspace
          </h2>
          <p className="landing-cta-copy">
            Search a stock, review the surfaced market context, and inspect
            the result directly in your chart workspace.
          </p>

          <div className="mt-9 flex justify-center">
            <Link href="/login" className="landing-btn-primary landing-btn-lg gap-2 inline-flex items-center">
              Open Workspace
              <span aria-hidden="true">-&gt;</span>
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
