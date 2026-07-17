// src/components/dashboard/MyCampaignsList.tsx
//
// Creator dashboard "My Campaigns" management surface. Loads the signed-in
// creator's campaigns via useCreatorCampaigns and renders a stack of
// CampaignManagementCards — each exposing Edit / View / Post update / (stubbed)
// donations + withdraw actions.
//
// States mirror the existing CreatorCampaigns component:
//   loading → skeleton cards
//   error   → inline alert + retry
//   empty   → CTA to start a campaign
//   success → management cards
//
// This is the richer, action-oriented counterpart to CreatorCampaigns (which
// is a read-only grid of public CampaignCards).

import { Link } from "react-router-dom";
import { AlertCircle, Plus, RefreshCw, Rocket } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useCreatorCampaigns } from "@/hooks/useCreatorCampaigns";
import { CampaignManagementCard } from "@/components/campaign/CampaignManagementCard";

const SKELETON_COUNT = 2;

/** Loading placeholder shaped like a management card. */
function ManagementCardSkeleton() {
  return (
    <Card className="border-border/60" aria-hidden="true">
      <CardHeader className="space-y-2">
        <div className="flex gap-2">
          <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
          <div className="h-5 w-20 animate-pulse rounded-full bg-muted" />
        </div>
        <div className="h-6 w-2/3 animate-pulse rounded bg-muted" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-2 w-full animate-pulse rounded-full bg-muted" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-12 animate-pulse rounded-lg bg-muted" />
          <div className="h-12 animate-pulse rounded-lg bg-muted" />
        </div>
        <div className="flex gap-2 border-t border-border/60 pt-4">
          <div className="h-8 w-16 animate-pulse rounded bg-muted" />
          <div className="h-8 w-16 animate-pulse rounded bg-muted" />
          <div className="h-8 w-24 animate-pulse rounded bg-muted" />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Management-focused list of the creator's own campaigns. Reuses
 * useCreatorCampaigns for data (RLS scopes results to the current user).
 */
export function MyCampaignsList() {
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
            View, edit, and manage the campaigns you&apos;ve created.
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
        <div className="space-y-4">
          {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
            <ManagementCardSkeleton key={index} />
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
        <div className="space-y-4">
          {campaigns.map((campaign) => (
            <CampaignManagementCard key={campaign.id} campaign={campaign} />
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

export default MyCampaignsList;
