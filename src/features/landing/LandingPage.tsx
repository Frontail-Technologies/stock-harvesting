import { AdPlacement, AdsenseScript } from "@/features/adsense";
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
    <div className="t">
      <SmoothScroll />
      <Navbar />
      <AdsenseScript placementKeys={["landing_primary", "landing_secondary"]} />
      <main>
        <HeroSection />
        <AnalysisSection />
        <ChartWorkspaceSection />
        <AdPlacement placementKey="landing_primary" variant="landing" />
        <ReviewWorkflowSection />
        <MarketCoverageSection />
        <AdPlacement placementKey="landing_secondary" variant="landing" />
        <FaqSection />
        <FinalCtaSection />
      </main>
      <Footer />
    </div>
  );
}
