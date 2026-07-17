// src/components/campaign/DonorWall.tsx
//
// Optional donor wall shown on the campaign detail page. Rendered only when the
// creator enables it (campaign.donorWallEnabled) and honors the campaign's
// donor_privacy preference:
//   * "public"    → show donor name + amount
//   * "amount"    → hide names ("Anonymous"), show amounts
//   * "anonymous" → hide donors entirely, show only an aggregate summary
//
// The donations module lands later, so this component accepts an optional list
// of donors and gracefully renders an empty/coming-soon state when none are
// provided — keeping the layout stable for when live data arrives.

import { Heart, Lock } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Campaign } from "@/types/campaign";

/** Privacy modes matching the campaigns.donor_privacy column constraint. */
export type DonorPrivacy = "public" | "amount" | "anonymous";

export interface DonorEntry {
  id: string;
  name: string;
  amount: number;
  /** Whether this individual donor opted to stay anonymous. */
  anonymous?: boolean;
  createdAt?: string;
}

interface DonorWallProps {
  campaign: Campaign;
  /** Live donors (from the donations module). Defaults to empty. */
  donors?: DonorEntry[];
  /** Overrides the campaign's stored privacy mode if provided. */
  privacy?: DonorPrivacy;
  className?: string;
}

function currencyFormatter(currency: string): Intl.NumberFormat {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 0,
    });
  } catch {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });
  }
}

/** Initials for the avatar chip, guarding against empty names. */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export function DonorWall({
  campaign,
  donors = [],
  privacy,
  className,
}: DonorWallProps) {
  // Respect the creator's opt-out entirely.
  if (!campaign.donorWallEnabled) return null;

  const mode: DonorPrivacy =
    // The Campaign type may not carry donor_privacy; fall back to the prop or
    // a sensible default.
    privacy ??
    ((campaign as unknown as { donorPrivacy?: DonorPrivacy }).donorPrivacy ||
      "public");

  const currency = currencyFormatter(campaign.currency);

  return (
    <Card className={cn(className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-lg">Donors</CardTitle>
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Heart className="h-4 w-4" />
        </span>
      </CardHeader>

      <CardContent>
        {/* Anonymous mode: show only aggregate counts, never individuals. */}
        {mode === "anonymous" ? (
          <div className="flex flex-col items-center rounded-lg border border-dashed border-border bg-secondary/30 px-4 py-8 text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Lock className="h-5 w-5" />
            </span>
            <p className="mt-3 text-sm font-medium text-foreground">
              {campaign.backersCount} generous{" "}
              {campaign.backersCount === 1 ? "backer" : "backers"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              This campaign keeps its donor list private.
            </p>
          </div>
        ) : donors.length === 0 ? (
          <div className="flex flex-col items-center rounded-lg border border-dashed border-border bg-secondary/30 px-4 py-8 text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Heart className="h-5 w-5" />
            </span>
            <p className="mt-3 text-sm font-medium text-foreground">
              Be the first to donate
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Support this cause and your name could appear here.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {donors.map((donor) => {
              // A donor is shown by name only when the campaign is fully public
              // AND the donor didn't individually opt out.
              const showName = mode === "public" && !donor.anonymous;
              const displayName = showName ? donor.name : "Anonymous";

              return (
                <li
                  key={donor.id}
                  className="flex items-center justify-between gap-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
                      {showName ? initials(donor.name) : "?"}
                    </span>
                    <span className="truncate text-sm font-medium text-foreground">
                      {displayName}
                    </span>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-foreground">
                    {currency.format(donor.amount)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export default DonorWall;
