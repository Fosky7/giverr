// src/components/dashboard/CreatorCampaigns.tsx
import { Link } from "react-router-dom";
import { AlertCircle, Plus, RefreshCw, Rocket } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCreatorCampaigns } from "@/hooks/useCreatorCampaigns";
import { CampaignCard } from "@/components/campaigns/CampaignCard";
import { CampaignCardSkeleton } from "@/components/campaigns/CampaignCardSkeleton";

// Number of skeleton cards shown while the creator's campaigns load.
const SKELETON_COUNT = 3;

/**
 * Dashboard "My Campaigns" section. Lists the signed-in creator's own
 * campaigns via {@link useCreatorCampaigns}, closing the loop between the Start
 * (create) flow and the dashboard (manage) view.
 *
 * States handled:
 *  - loading → skeleton grid
 *  - error   → inline AlertCircle panel with a retry button
 *  - empty   → "You haven't created any campaigns yet" + CTA to /start
 *  - success → responsive grid of CampaignCards (each links to its detail page)
 */
export function CreatorCampaigns() {
  const { data: campaigns, loading, error, refetch } = useCreatorCampaigns();

  return (
    <div className="space-y-6">
      {/* Section header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            My Campaigns
          </h2>
          <p className="text-muted-foreground">
            Manage the campaigns you&apos;ve created and track their progress.
          </p>
        </div>

        {campaigns.length > 0 ? (
          <Button asChild>
            <Link to="/start">
              <Plus className="mr-2 h-4 w-4" />
              New Campaign
            </Link>
          </Button>
        ) : null}
      </div>

      {/* Content states */}
      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
            <CampaignCardSkeleton key={index} />
          ))}
        </div>
      ) : error ? (
        <div
          role="alert"
          className="flex flex-col items-center rounded-xl border border-border bg-secondary/30 px-6 py-12 text-center"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <AlertCircle className="h-7 w-7" />
          </span>
          <h3 className="mt-5 text-lg font-semibold text-foreground">
            Couldn&apos;t load your campaigns
          </h3>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            {error} Please check your connection and try again.
          </p>
          <Button variant="outline" className="mt-6" onClick={refetch}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      ) : campaigns.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {campaigns.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-border bg-secondary/30 px-6 py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Rocket className="h-7 w-7" />
          </span>
          <h3 className="mt-5 text-lg font-semibold text-foreground">
            You haven&apos;t created any campaigns yet
          </h3>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Launch your first campaign to start raising funds for the ideas and
            causes you care about.
          </p>
          <Button asChild className="mt-6">
            <Link to="/start">
              <Rocket className="mr-2 h-4 w-4" />
              Start a Campaign
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}

export default CreatorCampaigns;
