import React from "react";

import { moduleOneContent } from "./moduleOneContent";
import { Header } from "./components/Header";
import { HeroSection } from "./components/HeroSection";
import { StatsStrip } from "./components/StatsStrip";
import { FeatureGrid } from "./components/FeatureGrid";
import { HowItWorks } from "./components/HowItWorks";
import { TrustSection } from "./components/TrustSection";
import { FinalCTA } from "./components/FinalCTA";
import { Footer } from "./components/Footer";

export function ModuleOnePage() {
  const content = moduleOneContent;

  return (
    <div id="top" className="min-h-screen bg-background text-foreground">
      <Header
        brandName={content.brandName}
        navItems={content.navItems}
        primaryCta={content.hero.primaryCta}
        secondaryCta={content.hero.secondaryCta}
      />

      <main>
        <HeroSection hero={content.hero} campaign={content.featuredCampaign} />
        <StatsStrip stats={content.stats} />
        <FeatureGrid features={content.features} />
        <HowItWorks steps={content.processSteps} />
        <TrustSection trustItems={content.trustItems} />
        <FinalCTA content={content.finalCta} />
      </main>

      <Footer
        brandName={content.brandName}
        description={content.footerDescription}
        groups={content.footerGroups}
      />
    </div>
  );
}

export default ModuleOnePage;
