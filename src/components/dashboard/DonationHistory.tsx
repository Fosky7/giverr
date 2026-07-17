// src/components/dashboard/DonationHistory.tsx
import { Link } from "react-router-dom";
import { HandCoins, Search } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/**
 * Shape of a single donation record. Kept here so this placeholder table can
 * be swapped for live Supabase-backed data (donations module) without any
 * markup changes.
 */
interface DonationRecord {
  id: string;
  campaignTitle: string;
  campaignHref: string;
  amount: number;
  date: string;
  status: "completed" | "pending" | "refunded";
}

/**
 * Placeholder donation history. Empty for a new donor — real records arrive in
 * a later module.
 */
const DONATIONS: DonationRecord[] = [];

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

/**
 * "Donations" dashboard section. Renders the donor's giving history in a
 * responsive table, or a friendly empty state prompting them to explore
 * campaigns to support.
 */
export function DonationHistory() {
  const hasDonations = DONATIONS.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          Donation History
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          A record of the campaigns you&apos;ve supported.
        </p>
      </div>

      {hasDonations ? (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Campaign</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {DONATIONS.map((donation) => (
                  <tr
                    key={donation.id}
                    className="border-b border-border/60 last:border-0"
                  >
                    <td className="px-4 py-3">
                      <Link
                        to={donation.campaignHref}
                        className="font-medium text-foreground transition-colors hover:text-primary"
                      >
                        {donation.campaignTitle}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {dateFormatter.format(new Date(donation.date))}
                    </td>
                    <td className="px-4 py-3 font-semibold text-foreground">
                      {currency.format(donation.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium capitalize text-secondary-foreground">
                        {donation.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardHeader className="items-center text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <HandCoins className="h-6 w-6" />
            </span>
            <CardTitle className="text-lg">No donations yet</CardTitle>
            <CardDescription>
              You haven&apos;t backed any campaigns. Discover impactful causes
              and make your first contribution.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button asChild variant="outline">
              <Link to="/explore">
                <Search className="mr-2 h-4 w-4" />
                Explore Campaigns
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default DonationHistory;
