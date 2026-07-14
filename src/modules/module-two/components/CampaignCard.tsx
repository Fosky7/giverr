import React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CampaignProgress, formatCampaignCurrency } from "./CampaignProgress";

export interface CampaignCardCampaign {
  id: string;
  slug?: string;
  title: string;
  summary: string;
  category: string;
  status: string;
  goalAmount?: number | null;
  goal_amount?: number | null;
  raisedAmount?: number | null;
  raised_amount?: number | null;
  donorCount?: number | null;
  donor_count?: number | null;
  currency?: string | null;
  location?: string | null;
  beneficiaryName?: string | null;
  beneficiaryType?: string | null;
  beneficiary_type?: string | null;
  organizerName?: string | null;
  organizer?: {
    name?: string | null;
    type?: string | null;
    verified?: boolean | null;
  } | null;
  coverImageUrl?: string | null;
  cover_image_url?: string | null;
  imageUrl?: string | null;
  image_url?: string | null;
  startsAt?: string | null;
  starts_at?: string | null;
  endsAt?: string | null;
  ends_at?: string | null;
  href?: string;
}

export interface CampaignCardProps extends Omit<React.HTMLAttributes<HTMLElement>, "onSelect"> {
  campaign: CampaignCardCampaign;
  isSelected?: boolean;
  ctaLabel?: string;
  href?: string;
  onSelect?: (campaign: CampaignCardCampaign) => void;
  onViewCampaign?: (campaign: CampaignCardCampaign) => void;
}

function toAmount(value: number | null | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, value) : 0;
}

function getGoalAmount(campaign: CampaignCardCampaign): number {
  return toAmount(campaign.goalAmount ?? campaign.goal_amount);
}

function getRaisedAmount(campaign: CampaignCardCampaign): number {
  return toAmount(campaign.raisedAmount ?? campaign.raised_amount);
}

function getDonorCount(campaign: CampaignCardCampaign): number {
  return toAmount(campaign.donorCount ?? campaign.donor_count);
}

function formatLabel(value: string | null | undefined): string {
  if (!value) {
    return "Campaign";
  }

  return value
    .replace(/[_-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function getSafeImageUrl(campaign: CampaignCardCampaign): string | null {
  const value = campaign.coverImageUrl ?? campaign.cover_image_url ?? campaign.imageUrl ?? campaign.image_url ?? null;

  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

function formatTimeline(endsAt?: string | null): string {
  if (!endsAt) {
    return "Open-ended";
  }

  const endTime = new Date(endsAt).getTime();

  if (Number.isNaN(endTime)) {
    return "Date pending";
  }

  const diff = endTime - Date.now();

  if (diff <= 0) {
    return "Ended";
  }

  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return `${days} day${days === 1 ? "" : "s"} left`;
}

function getOrganizerName(campaign: CampaignCardCampaign): string {
  return campaign.organizer?.name?.trim() || campaign.organizerName?.trim() || "Campaign organizer";
}

function getOrganizerType(campaign: CampaignCardCampaign): string {
  return formatLabel(campaign.organizer?.type || "fundraiser");
}

function getBeneficiaryLabel(campaign: CampaignCardCampaign): string {
  return (
    campaign.beneficiaryName?.trim() ||
    campaign.beneficiaryType?.trim() ||
    campaign.beneficiary_type?.trim() ||
    "Beneficiary"
  );
}

export function CampaignCard({
  campaign,
  isSelected = false,
  ctaLabel = "View campaign",
  href,
  onSelect,
  onViewCampaign,
  className,
  ...props
}: CampaignCardProps) {
  const titleId = React.useId();
  const imageUrl = getSafeImageUrl(campaign);
  const goalAmount = getGoalAmount(campaign);
  const raisedAmount = getRaisedAmount(campaign);
  const donorCount = getDonorCount(campaign);
  const organizerName = getOrganizerName(campaign);
  const organizerInitial = organizerName.charAt(0).toUpperCase() || "G";
  const viewHref = href ?? campaign.href;
  const handleView = () => {
    onSelect?.(campaign);
    onViewCampaign?.(campaign);
  };

  return (
    <Card
      role="article"
      aria-labelledby={titleId}
      className={cn(
        "group flex h-full flex-col overflow-hidden border-border/80 bg-card/95 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg",
        isSelected && "border-primary/60 ring-2 ring-primary/20",
        className,
      )}
      {...props}
    >
      <div className="relative min-h-44 overflow-hidden bg-muted">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            loading="lazy"
            className="h-44 w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div
            aria-hidden="true"
            className="flex h-44 w-full items-center justify-center bg-gradient-to-br from-primary/15 via-accent/40 to-secondary/50"
          >
            <div className="rounded-2xl border border-background/70 bg-background/75 px-5 py-4 text-center shadow-sm backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {formatLabel(campaign.category)}
              </p>
              <p className="mt-2 text-2xl font-bold text-primary">{formatCampaignCurrency(goalAmount, campaign.currency)}</p>
            </div>
          </div>
        )}

        <div className="absolute left-4 top-4 rounded-full border border-border/70 bg-background/90 px-3 py-1 text-xs font-medium text-foreground shadow-sm backdrop-blur">
          {formatLabel(campaign.category)}
        </div>
        <div className="absolute bottom-4 right-4 rounded-full border border-border/70 bg-background/90 px-3 py-1 text-xs font-medium text-primary shadow-sm backdrop-blur">
          {formatLabel(campaign.status)}
        </div>
      </div>

      <CardHeader className="space-y-3">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {(campaign.location?.trim() || "Location pending")} · {getBeneficiaryLabel(campaign)}
          </p>
          <CardTitle id={titleId} className="text-xl leading-tight text-card-foreground">
            {campaign.title}
          </CardTitle>
        </div>
        <p className="text-sm leading-6 text-muted-foreground">{campaign.summary}</p>
      </CardHeader>

      <CardContent className="mt-auto space-y-5">
        <CampaignProgress
          raisedAmount={raisedAmount}
          goalAmount={goalAmount}
          currency={campaign.currency ?? "USD"}
          donorCount={donorCount}
          compact
        />

        <div className="grid grid-cols-2 gap-3 rounded-lg border border-border/80 bg-muted/40 p-3 text-sm">
          <div>
            <p className="font-semibold text-foreground">{formatTimeline(campaign.endsAt ?? campaign.ends_at)}</p>
            <p className="text-xs text-muted-foreground">Timeline</p>
          </div>
          <div>
            <p className="font-semibold text-foreground">
              {campaign.organizer?.verified ? "Verified" : "Reviewing"}
            </p>
            <p className="text-xs text-muted-foreground">Organizer</p>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-border/70 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span
              aria-hidden="true"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary"
            >
              {organizerInitial}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{organizerName}</p>
              <p className="text-xs text-muted-foreground">{getOrganizerType(campaign)}</p>
            </div>
          </div>

          {viewHref ? (
            <Button asChild size="sm" variant={isSelected ? "secondary" : "outline"} className="w-full sm:w-auto">
              <a href={viewHref} aria-label={`View campaign: ${campaign.title}`} onClick={handleView}>
                {ctaLabel}
              </a>
            </Button>
          ) : onSelect || onViewCampaign ? (
            <Button
              type="button"
              size="sm"
              variant={isSelected ? "secondary" : "outline"}
              className="w-full sm:w-auto"
              aria-pressed={isSelected}
              aria-label={`View campaign: ${campaign.title}`}
              onClick={handleView}
            >
              {ctaLabel}
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

export default CampaignCard;
