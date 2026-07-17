// src/components/campaigns/CampaignCard.tsx
import { Link } from "react-router-dom";
import { ArrowRight, Users } from "lucide-react";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { type Campaign, campaignProgress } from "@/types/campaign";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const backersFormatter = new Intl.NumberFormat("en-US");

interface CampaignCardProps {
  campaign: Campaign;
  /** Extra classes for the outer Card (e.g. layout tweaks in a carousel). */
  className?: string;
}

/**
 * Reusable campaign card shared by Explore, the home FeaturedCampaigns section,
 * and the creator dashboard. Presents the category pill, title, description,
 * funding progress bar, raised/goal + percent, backer count, and a real
 * "View" link to the campaign detail page at /campaigns/:id.
 *
 * Purely presentational — it derives everything from the passed {@link Campaign}
 * and holds no data-fetching concerns.
 */
export function CampaignCard({ campaign, className }: CampaignCardProps) {
  const percent = campaignProgress(campaign);

  return (
    <Card
      className={cn(
        "flex flex-col overflow-hidden border-border/60 transition-shadow hover:shadow-lg",
        className
      )}
    >
      {/* Decorative media banner using design-token gradient. */}
      <div className="aspect-video w-full bg-gradient-to-br from-primary/20 via-secondary to-primary/5" />

      <CardHeader className="space-y-2">
        <span className="w-fit rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
          {campaign.category}
        </span>
        <CardTitle className="text-lg leading-snug">
          {campaign.title}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 space-y-4">
        {campaign.description ? (
          <p className="line-clamp-3 text-sm text-muted-foreground">
            {campaign.description}
          </p>
        ) : null}

        <div className="space-y-2">
          <Progress value={percent} aria-label={`${percent}% funded`} />
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-foreground">
              {currency.format(campaign.raised)}
            </span>
            <span className="text-muted-foreground">
              {percent}% of {currency.format(campaign.goal)}
            </span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between border-t border-border/60 pt-4 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Users className="h-4 w-4" />
          {backersFormatter.format(campaign.backers)} backers
        </span>
        <Button asChild variant="ghost" size="sm">
          <Link to={`/campaigns/${campaign.id}`}>
            View
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

export default CampaignCard;
