// src/components/dashboard/DashboardOverview.tsx
import { Link } from "react-router-dom";
import {
  Megaphone,
  HandCoins,
  TrendingUp,
  Rocket,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface SummaryStat {
  label: string;
  value: string;
  helper: string;
  icon: LucideIcon;
}

/**
 * Placeholder summary metrics. Real figures arrive once the campaigns and
 * donations modules are wired up — the layout is intentionally shaped to
 * accept live data without markup changes.
 */
const SUMMARY_STATS: SummaryStat[] = [
  {
    label: "Active campaigns",
    value: "0",
    helper: "You have no live campaigns yet.",
    icon: Megaphone,
  },
  {
    label: "Total raised",
    value: "$0",
    helper: "Across all of your campaigns.",
    icon: TrendingUp,
  },
  {
    label: "Donations made",
    value: "0",
    helper: "Causes you've backed so far.",
    icon: HandCoins,
  },
];

/**
 * Dashboard landing view: a personalized greeting card plus a grid of summary
 * stat cards and a primary call-to-action to start a campaign.
 */
export function DashboardOverview() {
  const { profile, user } = useAuth();

  const firstName =
    profile?.fullName?.trim().split(" ")[0] ||
    user?.email?.split("@")[0] ||
    "there";

  return (
    <div className="space-y-8">
      {/* Greeting / intro card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Hi {firstName} 👋</CardTitle>
          <CardDescription>
            Here&apos;s a quick snapshot of your Rayze activity. Launch a new
            campaign or discover causes to support.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <Button asChild>
            <Link to="/start">
              <Rocket className="mr-2 h-4 w-4" />
              Start a Campaign
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/explore">
              Explore Campaigns
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Summary stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {SUMMARY_STATS.map(({ label, value, helper, icon: Icon }) => (
          <Card key={label} className="border-border/60">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {label}
              </CardTitle>
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-4 w-4" />
              </span>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">{value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{helper}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default DashboardOverview;
