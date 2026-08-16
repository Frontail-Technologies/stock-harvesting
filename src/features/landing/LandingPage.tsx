import { ADSENSE_SLOTS, AdsenseAd, AdsenseScript } from "@/features/adsense";
import {
  Navbar,
  HeroSection,
  AnalysisSection,
  ChartWorkspaceSection,
  ReviewWorkflowSection,
  MarketCoverageSection,
  FaqSection,
  FinalCtaSection,
  Footer,
} from "./components";
import { SmoothScroll } from "./components/SmoothScroll";

export function LandingPage() {
  return (
    <div className="landing-root">
      <SmoothScroll />
      <Navbar />
      <AdsenseScript
        slots={[
          ADSENSE_SLOTS.landingPrimary,
          ADSENSE_SLOTS.landingSecondary,
        ]}
      />
      <main>
        <HeroSection />
        <AnalysisSection />
        <ChartWorkspaceSection />
        <AdsenseAd
          slot={ADSENSE_SLOTS.landingPrimary}
          placement="landing-primary-after-chart-workspace"
          variant="landing"
        />
        <ReviewWorkflowSection />
        <MarketCoverageSection />
        <AdsenseAd
          slot={ADSENSE_SLOTS.landingSecondary}
          placement="landing-secondary-after-market-coverage"
          variant="landing"
        />
        <FaqSection />
        <FinalCtaSection />
      </main>
      <Footer />
    </div>
  );
}
