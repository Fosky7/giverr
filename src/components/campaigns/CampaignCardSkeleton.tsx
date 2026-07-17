// src/components/campaigns/CampaignCardSkeleton.tsx
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface CampaignCardSkeletonProps {
  className?: string;
}

/**
 * Loading placeholder that mirrors the layout of {@link CampaignCard}. Uses the
 * shared `bg-muted` token with `animate-pulse` so it stays on-brand in both
 * light and dark themes without hardcoding colors.
 */
export function CampaignCardSkeleton({ className }: CampaignCardSkeletonProps) {
  return (
    <Card
      className={cn(
        "flex flex-col overflow-hidden border-border/60",
        className
      )}
      aria-hidden="true"
    >
      {/* Media banner */}
      <div className="aspect-video w-full animate-pulse bg-muted" />

      <CardHeader className="space-y-2">
        {/* Category pill */}
        <div className="h-5 w-20 animate-pulse rounded-full bg-muted" />
        {/* Title lines */}
        <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
      </CardHeader>

      <CardContent className="flex-1 space-y-4">
        <div className="space-y-2">
          <div className="h-3 w-full animate-pulse rounded bg-muted" />
          <div className="h-3 w-5/6 animate-pulse rounded bg-muted" />
          <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
        </div>

        <div className="space-y-2">
          {/* Progress bar */}
          <div className="h-2 w-full animate-pulse rounded-full bg-muted" />
          <div className="flex items-center justify-between">
            <div className="h-4 w-16 animate-pulse rounded bg-muted" />
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between border-t border-border/60 pt-4">
        <div className="h-4 w-20 animate-pulse rounded bg-muted" />
        <div className="h-8 w-16 animate-pulse rounded bg-muted" />
      </CardFooter>
    </Card>
  );
}

export default CampaignCardSkeleton;
