import { FaqAccordion } from "./FaqAccordion";
import { Reveal } from "./Reveal";

export function FaqSection() {
  return (
    <section
      id="faq"
      className="landing-section relative overflow-hidden border-t border-white/8"
      aria-labelledby="faq-heading"
    >
      <div className="absolute inset-0 landing-container" aria-hidden="true">
        <div className="landing-frame-line landing-frame-line-left" />
        <div className="landing-frame-line landing-frame-line-right" />
      </div>

      <div className="landing-container relative landing-faq-grid">
        <div>
          <Reveal>
            <p className="landing-eyebrow">05 / FAQ</p>
          </Reveal>
          <Reveal delay={0.05}>
            <h2 id="faq-heading" className="landing-section-heading mt-4 max-w-sm text-balance">
              Questions before you start?
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="landing-section-subheading mt-4 max-w-sm">
              Everything you need to know before opening the workspace.
            </p>
          </Reveal>
        </div>

        <Reveal delay={0.1} from="right">
          <FaqAccordion />
        </Reveal>
      </div>
    </section>
  );
}
