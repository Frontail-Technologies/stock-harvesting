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
      <main>
        <HeroSection />
        <AnalysisSection />
        <ChartWorkspaceSection />
        <ReviewWorkflowSection />
        <MarketCoverageSection />
        <FaqSection />
        <FinalCtaSection />
      </main>
      <Footer />
    </div>
  );
}
