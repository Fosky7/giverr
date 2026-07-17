// src/pages/CampaignDetail.tsx
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  HeartHandshake,
  RefreshCw,
  SearchX,
  Users,
} from "lucide-react";

import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BackCampaignDialog } from "@/components/campaigns/BackCampaignDialog";
import { useCampaign } from "@/hooks/useCampaign";
import { useCampaignDonations } from "@/hooks/useDonations";
import type { Campaign } from "@/types/campaign";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const backersFormatter = new Intl.NumberFormat("en-US");

const relativeDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

/** Clamp funding progress to a 0–100 integer, guarding against a 0 goal. */
function progressPercent(campaign: Campaign): number {
  if (!campaign.goalAmount || campaign.goalAmount <= 0) return 0;
  return Math.min(
    100,
    Math.round((campaign.raisedAmount / campaign.goalAmount) * 100)
  );
}

/** Best-effort display name for a donation's backer. */
function backerLabel(donation: {
  backerName?: string | null;
  anonymous?: boolean | null;
}): string {
  if (donation.anonymous) return "Anonymous backer";
  return donation.backerName?.trim() || "A generous backer";
}

/**
 * Public campaign detail page at /campaigns/:id.
 *
 * Fetches a single campaign (by id or slug) via {@link useCampaign} and renders
 * a hero banner, category pill, creator line, full story, and a prominent
 * funding progress panel with a live "Back this campaign" CTA that opens
 * {@link BackCampaignDialog}. On a successful donation we refetch the campaign
 * so raisedAmount, backersCount, and the Progress bar update, and we refresh
 * the compact recent-backers list beneath the CTA.
 *
 * Handles three non-happy states: loading (skeleton), not-found (friendly
 * message + link back to Explore), and error (inline alert + retry).
 */
export function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: campaign, loading, error, refetch } = useCampaign(id);

  const [backOpen, setBackOpen] = useState(false);

  // Recent backers for this campaign (only meaningful once we have an id).
  const {
    donations: recentDonations,
    loading: donationsLoading,
    refetch: refetchDonations,
  } = useCampaignDonations(campaign?.id);

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return <CampaignDetailSkeleton />;
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  // A genuine fetch failure (network/query) — distinct from "not found".
  if (error && !campaign && error.toLowerCase() !== "campaign not found.") {
    return (
      <section className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
        <span
          role="alert"
          className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive"
        >
          <AlertCircle className="h-8 w-8" />
        </span>
        <h1 className="mt-6 text-2xl font-semibold text-foreground">
          Couldn&apos;t load this campaign
        </h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          {error} Please check your connection and try again.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button onClick={refetch}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
          <Button asChild variant="outline">
            <Link to="/explore">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Explore
            </Link>
          </Button>
        </div>
      </section>
    );
  }

  // ── Not found ─────────────────────────────────────────────────────────────
  if (!campaign) {
    return (
      <section className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
          <SearchX className="h-8 w-8" />
        </span>
        <h1 className="mt-6 text-2xl font-semibold text-foreground">
          Campaign not found
        </h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          The campaign you&apos;re looking for doesn&apos;t exist or may have
          been removed.
        </p>
        <Button asChild className="mt-8">
          <Link to="/explore">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Explore
          </Link>
        </Button>
      </section>
    );
  }

  // ── Success ───────────────────────────────────────────────────────────────
  const percent = progressPercent(campaign);
  const story = campaign.longDescription?.trim() || campaign.description;

  // On a successful donation, refetch the campaign totals (raisedAmount,
  // backersCount → Progress) and the recent-backers list.
  const handleDonationSuccess = () => {
    void refetch();
    void refetchDonations();
  };

  return (
    <>
      {/* Hero banner — cover image with a design-token gradient fallback. */}
      <div className="relative aspect-[3/1] w-full overflow-hidden bg-gradient-to-br from-primary/20 via-secondary to-primary/5 sm:aspect-[4/1]">
        {campaign.coverImageUrl ? (
          <img
            src={campaign.coverImageUrl}
            alt={campaign.title}
            className="h-full w-full object-cover"
          />
        ) : null}
      </div>

      <section className="container mx-auto px-4 py-10">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="mb-6 -ml-2 text-muted-foreground"
        >
          <Link to="/explore">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Explore
          </Link>
        </Button>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
          {/* Main content */}
          <div className="min-w-0">
            <span className="inline-flex w-fit items-center rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
              {campaign.category}
            </span>

            <PageHeader title={campaign.title} className="mt-4" />

            <p className="mt-3 text-sm text-muted-foreground">
              Organized by{" "}
              <span className="font-medium text-foreground">
                {campaign.creatorId
                  ? "a verified creator"
                  : "the Rayze community"}
              </span>
            </p>

            <div className="mt-8 space-y-4">
              <h2 className="text-xl font-semibold text-foreground">
                About this campaign
              </h2>
              {story
                .split(/\n{2,}/)
                .filter((paragraph) => paragraph.trim().length > 0)
                .map((paragraph, index) => (
                  <p
                    key={index}
                    className="whitespace-pre-line leading-relaxed text-muted-foreground"
                  >
                    {paragraph}
                  </p>
                ))}
            </div>
          </div>

          {/* Progress + CTA panel */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">
                  {currency.format(campaign.raisedAmount)}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  raised of {currency.format(campaign.goalAmount)} goal
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Progress value={percent} aria-label={`${percent}% funded`} />
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-foreground">
                      {percent}% funded
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      {backersFormatter.format(campaign.backersCount)} backers
                    </span>
                  </div>
                </div>

                {/* Live donation CTA — opens the BackCampaignDialog. */}
                <Button
                  size="lg"
                  className="w-full"
                  onClick={() => setBackOpen(true)}
                >
                  <HeartHandshake className="mr-2 h-5 w-5" />
                  Back this campaign
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  Your support goes directly to this cause. Thank you for
                  backing it.
                </p>

                {/* Compact recent-backers list. */}
                <RecentBackers
                  loading={donationsLoading}
                  donations={recentDonations}
                />
              </CardContent>
            </Card>
          </aside>
        </div>
      </section>

      {/* Donation dialog — controlled by the CTA above. */}
      <BackCampaignDialog
        open={backOpen}
        onOpenChange={setBackOpen}
        campaign={campaign}
        onSuccess={handleDonationSuccess}
      />
    </>
  );
}

/** Recent backers list props — kept loose to tolerate the donation shape. */
interface RecentBackerItem {
  id: string;
  amount: number;
  createdAt?: string | null;
  backerName?: string | null;
  anonymous?: boolean | null;
}

interface RecentBackersProps {
  loading: boolean;
  donations: RecentBackerItem[];
}

/**
 * Compact recent-backers list rendered beneath the CTA. Shows up to the five
 * most recent contributions with a name, amount, and date. Silently renders
 * nothing when there are no donations yet (the CTA copy carries the empty
 * case), and a small skeleton while loading.
 */
function RecentBackers({ loading, donations }: RecentBackersProps) {
  if (loading) {
    return (
      <div className="space-y-3 border-t border-border pt-4">
        <div className="h-4 w-32 animate-pulse rounded bg-muted" />
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="h-3.5 w-24 animate-pulse rounded bg-muted" />
            <div className="h-3.5 w-14 animate-pulse rounded bg-muted" />
          </div>
        ))}
      </div>
    );
  }

  if (!donations || donations.length === 0) {
    return null;
  }

  const recent = donations.slice(0, 5);

  return (
    <div className="space-y-3 border-t border-border pt-4">
      <h3 className="text-sm font-semibold text-foreground">Recent backers</h3>
      <ul className="space-y-2.5">
        {recent.map((donation) => (
          <li
            key={donation.id}
            className="flex items-center justify-between gap-3 text-sm"
          >
            <div className="min-w-0">
              <p className="truncate font-medium text-foreground">
                {backerLabel(donation)}
              </p>
              {donation.createdAt ? (
                <p className="text-xs text-muted-foreground">
                  {relativeDate.format(new Date(donation.createdAt))}
                </p>
              ) : null}
            </div>
            <span className="shrink-0 font-semibold text-primary">
              {currency.format(donation.amount)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Loading placeholder for the detail page. Mirrors the hero + two-column layout
 * using the shared `bg-muted` token with `animate-pulse`.
 */
function CampaignDetailSkeleton() {
  return (
    <>
      <div className="aspect-[3/1] w-full animate-pulse bg-muted sm:aspect-[4/1]" />
      <section className="container mx-auto px-4 py-10">
        <div className="mb-6 h-8 w-32 animate-pulse rounded bg-muted" />
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0 space-y-4">
            <div className="h-5 w-24 animate-pulse rounded-full bg-muted" />
            <div className="h-9 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-4 w-40 animate-pulse rounded bg-muted" />
            <div className="mt-8 space-y-3">
              <div className="h-6 w-48 animate-pulse rounded bg-muted" />
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
              <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
            </div>
          </div>
          <aside>
            <Card>
              <CardHeader className="space-y-2">
                <div className="h-8 w-32 animate-pulse rounded bg-muted" />
                <div className="h-4 w-40 animate-pulse rounded bg-muted" />
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="h-2 w-full animate-pulse rounded-full bg-muted" />
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                    <div className="h-4 w-20 animate-pulse rounded bg-muted" />
                  </div>
                </div>
                <div className="h-11 w-full animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          </aside>
        </div>
      </section>
    </>
  );
}

export default CampaignDetail;
