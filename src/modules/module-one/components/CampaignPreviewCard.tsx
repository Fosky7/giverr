import React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { CampaignPreview } from "../types";

interface CampaignPreviewCardProps extends React.HTMLAttributes<HTMLDivElement> {
  campaign: CampaignPreview;
}

const currencyFormatter = new Intl.NumberFormat("en", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const compactNumberFormatter = new Intl.NumberFormat("en", {
  notation: "compact",
  maximumFractionDigits: 1,
});

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function CampaignPreviewCard({ campaign, className, ...props }: CampaignPreviewCardProps) {
  const progressId = React.useId();
  const raised = Math.max(0, campaign.raised);
  const goal = Math.max(0, campaign.goal);

  // Guard against divide-by-zero and over-funded campaigns while keeping the real amounts visible.
  const rawProgress = goal > 0 ? (raised / goal) * 100 : 0;
  const progressPercentage = clamp(rawProgress, 0, 100);
  const roundedProgress = Math.round(progressPercentage);

  const formattedRaised = currencyFormatter.format(raised);
  const formattedGoal = currencyFormatter.format(goal);
  const formattedDonors = compactNumberFormatter.format(Math.max(0, campaign.donors));
  const progressLabel = `${formattedRaised} raised of ${formattedGoal} goal, ${roundedProgress}% funded`;

  return (
    <Card
      className={cn(
        "overflow-hidden border-border/80 bg-card/95 shadow-xl shadow-primary/10 backdrop-blur",
        className,
      )}
      aria-label={campaign.ariaLabel ?? `Campaign preview: ${campaign.title}`}
      {...props}
    >
      <div className="relative min-h-48 overflow-hidden bg-muted">
        <div
          aria-hidden="true"
          className="flex h-48 w-full items-center justify-center bg-gradient-to-br from-primary/20 via-accent to-secondary/40"
        >
          <div className="rounded-2xl border border-background/70 bg-background/70 px-5 py-4 text-center shadow-lg backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {campaign.visualLabel}
            </p>
            <p className="mt-2 text-3xl font-bold text-primary">{roundedProgress}%</p>
          </div>
        </div>

        <div className="absolute left-4 top-4 rounded-full border border-border/70 bg-background/90 px-3 py-1 text-xs font-medium text-foreground shadow-sm backdrop-blur">
          {campaign.category}
        </div>
        <div className="absolute bottom-4 right-4 rounded-full border border-border/70 bg-background/90 px-3 py-1 text-xs font-medium text-primary shadow-sm backdrop-blur">
          {campaign.status}
        </div>
      </div>

      <CardHeader className="space-y-3">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {campaign.location} · {campaign.beneficiaryType}
          </p>
          <CardTitle className="text-xl leading-tight text-card-foreground">
            {campaign.title}
          </CardTitle>
        </div>
        <p className="text-sm leading-6 text-muted-foreground">{campaign.description}</p>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="space-y-3">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-2xl font-bold tracking-tight text-card-foreground">{formattedRaised}</p>
              <p className="text-sm text-muted-foreground">raised of {formattedGoal}</p>
            </div>
            <p className="text-sm font-semibold text-primary">{roundedProgress}%</p>
          </div>

          <div
            className="h-3 overflow-hidden rounded-full bg-secondary"
            role="progressbar"
            aria-labelledby={progressId}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={roundedProgress}
            aria-valuetext={progressLabel}
          >
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-700 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <span id={progressId} className="sr-only">
            {progressLabel}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3 rounded-lg border border-border/80 bg-muted/40 p-3 text-center">
          <div>
            <p className="text-sm font-semibold text-foreground">{formattedDonors}</p>
            <p className="text-xs text-muted-foreground">donors</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{campaign.daysLeft}</p>
            <p className="text-xs text-muted-foreground">days left</p>
          </div>
          <div>
            <p className="truncate text-sm font-semibold text-foreground">{campaign.status}</p>
            <p className="text-xs text-muted-foreground">status</p>
          </div>
        </div>

        <div className="flex items-center gap-3 border-t border-border/70 pt-4">
          <div
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary"
          >
            {campaign.organizer.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{campaign.organizer}</p>
            <p className="text-xs text-muted-foreground">Organizer verified by Giverr</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default CampaignPreviewCard;
