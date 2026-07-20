import { HeroSection } from "@/components/home/HeroSection";
import { Features } from "@/components/home/Features";
import { HowItWorks } from "@/components/home/HowItWorks";
import { Stats } from "@/components/home/Stats";
import { FeaturedCampaigns } from "@/components/home/FeaturedCampaigns";
import { TestimonialsSection } from "@/components/home/TestimonialsSection";
import { CallToActionSection } from "@/components/home/CallToActionSection";

/**
 * Canonical landing page for Rayze (Module 2). Purely composes the individual
 * home sections in order; each section owns its own spacing and background.
 */
export function HomePage() {
  return (
    <>
      <HeroSection />
      <Features />
      <HowItWorks />
      <Stats />
      <FeaturedCampaigns />
      <TestimonialsSection />
      <CallToActionSection />
    </>
  );
}

export default HomePage;
