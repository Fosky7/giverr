import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

/**
 * Shape of a campaign record consumed by {@link CampaignCard}. Intentionally
 * shaped to accept real campaign records (from Supabase in a later module)
 * without any markup changes.
 */
export interface Campaign {
  id: string;
  title: string;
  category: string;
  description: string;
  raised: number;
  goal: number;
  backers: number;
  /** Optional banner image. Falls back to a gradient placeholder when absent. */
  imageUrl?: string;
}

interface CampaignCardProps {
  campaign: Campaign;
  /** Destination for the "Learn more" CTA. Defaults to the explore route. */
  href?: string;
}

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

/**
 * Compute a clamped percentage funded, guarding against a zero goal to avoid
 * NaN / Infinity, and capping at 100% when a campaign is over-funded.
 */
function computePercent(raised: number, goal: number): number {
  if (!goal || goal <= 0) return 0;
  return Math.min(100, Math.round((raised / goal) * 100));
}

/**
 * Reusable, presentational campaign card. Renders a banner (image or gradient
 * placeholder), category pill, title, description, funding progress, and a
 * "Learn more" CTA. Includes subtle hover elevation for a glossy feel.
 */
export function CampaignCard({ campaign, href = "/explore" }: CampaignCardProps) {
  const percent = computePercent(campaign.raised, campaign.goal);

  return (
    <Card className="group flex flex-col overflow-hidden border-border/60 transition-shadow hover:shadow-lg">
      {/* Banner: real image when provided, otherwise a gradient placeholder. */}
      <div className="aspect-video w-full overflow-hidden">
        {campaign.imageUrl ? (
          <img
            src={campaign.imageUrl}
            alt={campaign.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary/20 via-secondary to-primary/5 transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100" />
        )}
      </div>

      <CardHeader className="space-y-2">
        <span className="w-fit rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
          {campaign.category}
        </span>
        <CardTitle className="text-lg leading-snug line-clamp-2">
          {campaign.title}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-3">
          {campaign.description}
        </p>
        <div className="space-y-2">
          <Progress value={percent} />
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
        <span>{campaign.backers} backers</span>
        <Button asChild variant="ghost" size="sm">
          <Link to={href}>
            Learn more
            <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

export default CampaignCard;
