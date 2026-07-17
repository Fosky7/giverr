// src/components/home/FeaturedCampaigns.tsx
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCampaigns } from "@/hooks/useCampaigns";
import { CampaignCard } from "@/components/campaigns/CampaignCard";
import { CampaignCardSkeleton } from "@/components/campaigns/CampaignCardSkeleton";

// How many featured campaigns to surface on the landing page.
const FEATURED_LIMIT = 3;

/**
 * Home page "Featured Campaigns" section. Reflects live, database-backed
 * campaigns via {@link useCampaigns} using the shared {@link CampaignCard}.
 *
 * Resilience is the priority here — the landing page must always render:
 *  - loading → show a small skeleton grid
 *  - error   → hide the section entirely (never break the home page)
 *  - empty   → hide the section entirely
 *  - success → show up to FEATURED_LIMIT active campaigns
 */
export function FeaturedCampaigns() {
  const { campaigns, loading, error } = useCampaigns();

  // On failure or when there are no campaigns, render nothing so the landing
  // page flows straight from the previous section to the next.
  if (error || (!loading && campaigns.length === 0)) {
    return null;
  }

  const featured = campaigns.slice(0, FEATURED_LIMIT);

  return (
    <section className="border-t border-border bg-secondary/30">
      <div className="container mx-auto px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center rounded-full bg-secondary px-3 py-1 text-xs font-semibold uppercase tracking-wide text-secondary-foreground">
            Featured
          </span>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Campaigns making an impact
          </h2>
          <p className="mt-3 text-muted-foreground">
            Discover a few of the causes and projects the Rayze community is
            backing right now.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {loading
            ? Array.from({ length: FEATURED_LIMIT }).map((_, index) => (
                <CampaignCardSkeleton key={index} />
              ))
            : featured.map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))}
        </div>

        {!loading && featured.length > 0 ? (
          <div className="mt-12 flex justify-center">
            <Button asChild variant="outline" size="lg">
              <Link to="/explore">
                Explore all campaigns
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default FeaturedCampaigns;
