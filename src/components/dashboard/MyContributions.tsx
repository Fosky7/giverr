// src/components/dashboard/MyContributions.tsx
import { Link } from "react-router-dom";
import { AlertCircle, HeartHandshake, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useUserDonations } from "@/hooks/useDonations";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

/**
 * "Your contributions" dashboard section. Gives backers (not just creators) a
 * personalized view of the campaigns they've supported, mirroring the
 * CreatorCampaigns section style: a titled Card containing a list of donations
 * with a campaign-title link, amount, and date.
 *
 * States handled (matching the established patterns):
 *  - loading → row skeletons
 *  - error   → inline alert + retry
 *  - empty   → friendly message + link to /explore
 *  - success → the contributions list
 */
export function MyContributions() {
  const { donations, loading, error, refetch } = useUserDonations();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HeartHandshake className="h-5 w-5 text-primary" />
          Your contributions
        </CardTitle>
        <CardDescription>
          Campaigns you&apos;ve backed and the impact you&apos;ve made.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {/* ── Loading ─────────────────────────────────────────────────── */}
        {loading ? (
          <ul className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <li
                key={index}
                className="flex items-center justify-between gap-4 rounded-lg border border-border p-4"
              >
                <div className="min-w-0 space-y-2">
                  <div className="h-4 w-40 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                </div>
                <div className="h-5 w-16 animate-pulse rounded bg-muted" />
              </li>
            ))}
          </ul>
        ) : error ? (
          /* ── Error ─────────────────────────────────────────────────── */
          <div
            role="alert"
            className="flex flex-col items-center gap-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-8 text-center"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
              <AlertCircle className="h-6 w-6" />
            </span>
            <div>
              <p className="text-sm font-medium text-foreground">
                Couldn&apos;t load your contributions
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{error}</p>
            </div>
            <Button variant="outline" size="sm" onClick={refetch}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        ) : donations.length === 0 ? (
          /* ── Empty ─────────────────────────────────────────────────── */
          <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed border-border px-4 py-10 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
              <HeartHandshake className="h-6 w-6" />
            </span>
            <div>
              <p className="text-sm font-medium text-foreground">
                You haven&apos;t backed any campaigns yet
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Find a cause worth supporting and make your first contribution.
              </p>
            </div>
            <Button asChild size="sm">
              <Link to="/explore">Explore campaigns</Link>
            </Button>
          </div>
        ) : (
          /* ── Success ───────────────────────────────────────────────── */
          <ul className="space-y-3">
            {donations.map((donation) => (
              <li
                key={donation.id}
                className="flex items-center justify-between gap-4 rounded-lg border border-border p-4 transition-colors hover:bg-secondary/40"
              >
                <div className="min-w-0">
                  <Link
                    to={`/campaigns/${donation.campaignId}`}
                    className="truncate font-medium text-foreground transition-colors hover:text-primary hover:underline"
                  >
                    {donation.campaignTitle?.trim() || "View campaign"}
                  </Link>
                  {donation.createdAt ? (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {dateFormatter.format(new Date(donation.createdAt))}
                    </p>
                  ) : null}
                </div>
                <span className="shrink-0 font-semibold text-primary">
                  {currency.format(donation.amount)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export default MyContributions;
