// src/components/campaign/CampaignProgress.tsx
//
// Reusable funding progress panel for the campaign detail page (and anywhere a
// richer progress view than CampaignCard is needed). Derives everything from
// the passed Campaign: raised vs goal, clamped percentage, backer count, and
// days remaining until the deadline. Uses the shared Progress primitive and a
// currency-aware Intl formatter so amounts respect the campaign's stored
// currency rather than a hardcoded USD.

import { CalendarClock, Users } from "lucide-react";

import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { type Campaign, campaignProgress } from "@/types/campaign";

interface CampaignProgressProps {
  campaign: Campaign;
  /** Extra classes for the wrapper. */
  className?: string;
  /** Hide the raised/goal headline row (e.g. when a parent already shows it). */
  hideHeadline?: boolean;
}

const backersFormatter = new Intl.NumberFormat("en-US");

/** Build a currency formatter for the campaign's stored currency (fallback USD). */
function currencyFormatter(currency: string): Intl.NumberFormat {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 0,
    });
  } catch {
    // Guard against an unsupported currency code slipping through.
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });
  }
}

/**
 * Compute whole days remaining until a deadline. Returns null when there is no
 * deadline, and 0 when the deadline has passed (never negative).
 */
function daysLeft(deadline?: string | null): number | null {
  if (!deadline) return null;
  const end = new Date(deadline).getTime();
  if (Number.isNaN(end)) return null;
  const diffMs = end - Date.now();
  if (diffMs <= 0) return 0;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function CampaignProgress({
  campaign,
  className,
  hideHeadline = false,
}: CampaignProgressProps) {
  const percent = campaignProgress(campaign);
  const currency = currencyFormatter(campaign.currency);
  const remaining = daysLeft(campaign.deadline);
  const expired = remaining === 0 || campaign.status === "expired";

  return (
    <div className={cn("space-y-4", className)}>
      {!hideHeadline ? (
        <div className="space-y-1">
          <p className="text-2xl font-bold text-foreground">
            {currency.format(campaign.raisedAmount)}
          </p>
          <p className="text-sm text-muted-foreground">
            raised of {currency.format(campaign.goalAmount)} goal
          </p>
        </div>
      ) : null}

      <div className="space-y-2">
        <Progress value={percent} aria-label={`${percent}% funded`} />
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-foreground">{percent}% funded</span>
          <span className="text-muted-foreground">
            {currency.format(campaign.raisedAmount)} /{" "}
            {currency.format(campaign.goalAmount)}
          </span>
        </div>
      </div>

      {/* Meta row: backers + days left. */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-secondary/30 px-3 py-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Users className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">
              {backersFormatter.format(campaign.backersCount)}
            </p>
            <p className="truncate text-xs text-muted-foreground">backers</p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-secondary/30 px-3 py-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
            <CalendarClock className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            {remaining === null ? (
              <>
                <p className="text-sm font-semibold text-foreground">Ongoing</p>
                <p className="truncate text-xs text-muted-foreground">
                  no deadline
                </p>
              </>
            ) : expired ? (
              <>
                <p className="text-sm font-semibold text-foreground">Ended</p>
                <p className="truncate text-xs text-muted-foreground">
                  campaign closed
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-foreground">
                  {backersFormatter.format(remaining)}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {remaining === 1 ? "day left" : "days left"}
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CampaignProgress;
