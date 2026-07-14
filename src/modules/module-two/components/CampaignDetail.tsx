import React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CampaignApiError, getCampaign, type CampaignApiDetail, type CampaignIdentifier } from "../api/campaigns";
import type { Campaign } from "../types";
import { CampaignProgress, formatCampaignCurrency } from "./CampaignProgress";

interface CampaignDetailProps extends React.HTMLAttributes<HTMLElement> {
  /** Optional already-loaded campaign used as an immediate fallback/preview. */
  campaign?: Campaign | CampaignApiDetail | null;
  /** Explicit campaign id to fetch through the Supabase Edge Function. */
  campaignId?: string | null;
  /** Explicit campaign slug to fetch through the Supabase Edge Function. */
  slug?: string | null;
  /** Alternative typed identifier for callers that already know whether they have id or slug. */
  identifier?: CampaignIdentifier | null;
  emptyTitle?: string;
  emptyDescription?: string;
  updatesPlaceholderTitle?: string;
  updatesPlaceholderDescription?: string;
  donationCtaLabel?: string;
  onRetry?: () => void;
}

type DetailState = {
  campaign: CampaignApiDetail | null;
  isLoading: boolean;
  error: CampaignDetailError | null;
};

type CampaignDetailError = {
  title: string;
  message: string;
  code?: string;
  status?: number;
  isUnavailable: boolean;
};

function formatDate(value?: string | null): string {
  if (!value) {
    return "Not set";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Date pending";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatLabel(value?: string | null): string {
  if (!value) {
    return "Pending";
  }

  return value
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function getExplicitIdentifier({ campaignId, slug, identifier }: CampaignDetailProps): CampaignIdentifier | null {
  if (identifier) {
    return identifier;
  }

  if (campaignId?.trim()) {
    return { id: campaignId.trim() };
  }

  if (slug?.trim()) {
    return { slug: slug.trim() };
  }

  return null;
}

function getIdentifierKey(identifier: CampaignIdentifier | null): string {
  if (!identifier) {
    return "none";
  }

  if (typeof identifier === "string") {
    return identifier;
  }

  if ("id" in identifier && identifier.id) {
    return `id:${identifier.id}`;
  }

  if ("slug" in identifier && identifier.slug) {
    return `slug:${identifier.slug}`;
  }

  return "none";
}

function toDetailCampaign(campaign: Campaign | CampaignApiDetail | null | undefined): CampaignApiDetail | null {
  if (!campaign) {
    return null;
  }

  const maybeDetail = campaign as CampaignApiDetail;

  return {
    ...campaign,
    updates: Array.isArray(maybeDetail.updates) ? maybeDetail.updates : [],
    evidenceUrls: Array.isArray(maybeDetail.evidenceUrls) ? maybeDetail.evidenceUrls : [],
    isOwner: Boolean(maybeDetail.isOwner),
    publishedAt: maybeDetail.publishedAt ?? null,
  };
}

function toDetailError(error: unknown): CampaignDetailError {
  if (error instanceof CampaignApiError) {
    const isUnavailable = error.status === 401 || error.status === 403 || error.status === 404;

    if (isUnavailable) {
      return {
        title: "Campaign not available",
        message:
          "This campaign could not be found or is not publicly available. Draft and submitted campaigns are only visible to their owner.",
        code: error.code,
        status: error.status,
        isUnavailable: true,
      };
    }

    return {
      title: "Campaign details could not be loaded",
      message: error.message || "Please try again in a moment.",
      code: error.code,
      status: error.status,
      isUnavailable: false,
    };
  }

  return {
    title: "Campaign details could not be loaded",
    message: error instanceof Error ? error.message : "Please try again in a moment.",
    isUnavailable: false,
  };
}

function getOrganizerInitial(campaign: CampaignApiDetail): string {
  return campaign.organizer.name.trim().charAt(0).toUpperCase() || "G";
}

function getTimelineText(campaign: CampaignApiDetail): string {
  const start = formatDate(campaign.startsAt);
  const end = formatDate(campaign.endsAt);

  if (start === "Not set" && end === "Not set") {
    return "Open-ended campaign timeline";
  }

  return `${start} – ${end}`;
}

function renderDetailError(error: CampaignDetailError, onRetry?: () => void, className?: string) {
  return (
    <Card className={cn("border-border bg-card", className)} role="status" aria-live="polite">
      <CardHeader>
        <CardTitle>{error.title}</CardTitle>
        <CardDescription className="text-sm leading-6">{error.message}</CardDescription>
      </CardHeader>
      {!error.isUnavailable && onRetry ? (
        <CardContent>
          <Button type="button" variant="outline" onClick={onRetry}>
            Retry campaign details
          </Button>
        </CardContent>
      ) : null}
    </Card>
  );
}

export function CampaignDetail({
  campaign,
  campaignId,
  slug,
  identifier,
  emptyTitle = "Campaign details",
  emptyDescription = "Select a campaign from the directory to review its story, organizer context, updates, and donation readiness.",
  updatesPlaceholderTitle = "Updates will appear here",
  updatesPlaceholderDescription =
    "Campaign milestones, impact notes, and accountability updates are supported by the backend and will show here once published.",
  donationCtaLabel = "Donation flow coming soon",
  onRetry,
  className,
  ...props
}: CampaignDetailProps) {
  const explicitIdentifier = React.useMemo(
    () => getExplicitIdentifier({ campaign, campaignId, slug, identifier }),
    [campaign, campaignId, identifier, slug],
  );
  const identifierKey = React.useMemo(() => getIdentifierKey(explicitIdentifier), [explicitIdentifier]);
  const initialCampaign = React.useMemo(() => toDetailCampaign(campaign), [campaign]);

  const [state, setState] = React.useState<DetailState>({
    campaign: initialCampaign,
    isLoading: Boolean(explicitIdentifier),
    error: null,
  });

  const loadDetail = React.useCallback(async () => {
    if (!explicitIdentifier) {
      setState({ campaign: initialCampaign, isLoading: false, error: null });
      return;
    }

    setState((current) => ({
      campaign: current.campaign ?? initialCampaign,
      isLoading: true,
      error: null,
    }));

    try {
      const fetchedCampaign = await getCampaign(explicitIdentifier);
      setState({ campaign: fetchedCampaign, isLoading: false, error: null });
    } catch (error) {
      setState({
        campaign: initialCampaign,
        isLoading: false,
        error: toDetailError(error),
      });
    }
  }, [explicitIdentifier, initialCampaign]);

  React.useEffect(() => {
    let isMounted = true;

    async function run() {
      if (!explicitIdentifier) {
        if (isMounted) {
          setState({ campaign: initialCampaign, isLoading: false, error: null });
        }
        return;
      }

      if (isMounted) {
        setState((current) => ({
          campaign: current.campaign ?? initialCampaign,
          isLoading: true,
          error: null,
        }));
      }

      try {
        const fetchedCampaign = await getCampaign(explicitIdentifier);
        if (isMounted) {
          setState({ campaign: fetchedCampaign, isLoading: false, error: null });
        }
      } catch (error) {
        if (isMounted) {
          setState({ campaign: initialCampaign, isLoading: false, error: toDetailError(error) });
        }
      }
    }

    void run();

    return () => {
      isMounted = false;
    };
  }, [explicitIdentifier, identifierKey, initialCampaign]);

  const handleRetry = React.useCallback(() => {
    onRetry?.();
    void loadDetail();
  }, [loadDetail, onRetry]);

  if (state.isLoading && !state.campaign) {
    return (
      <Card className={cn("border-border bg-card", className)} aria-busy="true" {...props}>
        <CardHeader>
          <CardTitle>Loading campaign details…</CardTitle>
          <CardDescription>Fetching the latest story, progress, and campaign updates.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-4 w-2/3 rounded-full bg-muted" />
          <div className="h-4 w-full rounded-full bg-muted" />
          <div className="h-4 w-5/6 rounded-full bg-muted" />
        </CardContent>
      </Card>
    );
  }

  if (state.error && !state.campaign) {
    return renderDetailError(state.error, handleRetry, className);
  }

  if (!state.campaign) {
    return (
      <Card className={cn("border-dashed border-border bg-card/70", className)} {...props}>
        <CardHeader>
          <CardTitle>{emptyTitle}</CardTitle>
          <CardDescription className="text-sm leading-6">{emptyDescription}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const detail = state.campaign;
  const hasUpdates = detail.updates.length > 0;

  return (
    <Card className={cn("border-border/80 bg-card", className)} aria-label={`Details for ${detail.title}`} {...props}>
      <CardHeader className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
            {formatLabel(detail.category)}
          </span>
          <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold uppercase tracking-wide text-secondary-foreground">
            {formatLabel(detail.status)}
          </span>
          <span className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground">
            {detail.organizer.verified ? "Verified organizer" : "Organizer verification pending"}
          </span>
        </div>

        <div>
          <CardTitle className="text-2xl leading-tight sm:text-3xl">{detail.title}</CardTitle>
          <CardDescription className="mt-3 text-base leading-7">{detail.summary}</CardDescription>
        </div>

        {state.isLoading ? (
          <p className="text-xs font-medium text-muted-foreground" role="status">
            Refreshing campaign detail…
          </p>
        ) : null}
        {state.error ? (
          <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs leading-5 text-muted-foreground" role="status">
            Showing the latest available preview. Live detail refresh failed: {state.error.message}
          </div>
        ) : null}
      </CardHeader>

      <CardContent className="space-y-8">
        <CampaignProgress
          raisedAmount={detail.raisedAmount}
          goalAmount={detail.goalAmount}
          currency={detail.currency}
          donorCount={detail.donorCount}
        />

        <div className="grid gap-3 rounded-2xl border border-border/80 bg-muted/30 p-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Goal</p>
            <p className="mt-1 font-semibold text-foreground">{formatCampaignCurrency(detail.goalAmount, detail.currency)}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Raised</p>
            <p className="mt-1 font-semibold text-foreground">{formatCampaignCurrency(detail.raisedAmount, detail.currency)}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Location</p>
            <p className="mt-1 font-semibold text-foreground">{detail.location || "Location pending"}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Timeline</p>
            <p className="mt-1 font-semibold text-foreground">{getTimelineText(detail)}</p>
          </div>
        </div>

        <section aria-labelledby="campaign-story-heading">
          <h3 id="campaign-story-heading" className="text-lg font-semibold text-foreground">
            Campaign story
          </h3>
          <p className="mt-3 whitespace-pre-line text-sm leading-7 text-muted-foreground sm:text-base">{detail.story}</p>
        </section>

        <section className="rounded-2xl border border-border/80 p-4" aria-labelledby="campaign-organizer-heading">
          <h3 id="campaign-organizer-heading" className="text-lg font-semibold text-foreground">
            Organizer
          </h3>
          <div className="mt-4 flex items-center gap-3">
            <span
              aria-hidden="true"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary"
            >
              {getOrganizerInitial(detail)}
            </span>
            <div>
              <p className="font-medium text-foreground">{detail.organizer.name}</p>
              <p className="text-sm capitalize text-muted-foreground">
                {formatLabel(detail.organizer.type)} · {detail.organizer.verified ? "Verified by Giverr" : "Verification pending"}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border/80 bg-muted/20 p-4" aria-labelledby="campaign-updates-heading">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 id="campaign-updates-heading" className="text-lg font-semibold text-foreground">
                Campaign updates
              </h3>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Public milestones and impact notes help supporters track how funds are used.
              </p>
            </div>
            <span className="w-fit rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
              {detail.updates.length} update{detail.updates.length === 1 ? "" : "s"}
            </span>
          </div>

          {hasUpdates ? (
            <ol className="mt-5 space-y-4">
              {detail.updates.map((update) => (
                <li key={update.id} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <h4 className="font-semibold text-foreground">{update.title}</h4>
                    <time className="text-xs text-muted-foreground" dateTime={update.createdAt}>
                      {formatDate(update.createdAt)}
                    </time>
                  </div>
                  <p className="mt-2 whitespace-pre-line text-sm leading-6 text-muted-foreground">{update.body}</p>
                </li>
              ))}
            </ol>
          ) : (
            <div className="mt-5 rounded-xl border border-dashed border-border bg-background/70 p-4">
              <h4 className="font-medium text-foreground">{updatesPlaceholderTitle}</h4>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{updatesPlaceholderDescription}</p>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-primary/20 bg-primary/10 p-5" aria-labelledby="campaign-donation-heading">
          <h3 id="campaign-donation-heading" className="text-lg font-semibold text-foreground">
            Ready to support this campaign?
          </h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Donation checkout will be connected in a later module. This placeholder keeps the campaign detail flow ready for secure contributions.
          </p>
          <Button type="button" className="mt-4 w-full sm:w-auto" disabled aria-disabled="true">
            {donationCtaLabel}
          </Button>
        </section>
      </CardContent>
    </Card>
  );
}

export default CampaignDetail;
