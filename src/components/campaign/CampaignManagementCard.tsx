// src/components/campaign/CampaignManagementCard.tsx
//
// Per-campaign management view for the creator dashboard. Shows the campaign's
// title, status badge, and funding progress (via CampaignProgress) alongside a
// row of quick actions:
//   * Edit           → /campaigns/:id/edit (built in a later step; link is safe)
//   * View           → public detail page /campaigns/:id
//   * Post update    → opens PostUpdateDialog (createCampaignUpdate)
//   * View donations → stubbed (donations module lands later) with a tooltip
//   * Withdraw funds → stubbed / gated until a campaign is funded
//
// Purely presentational aside from owning the PostUpdateDialog open state; data
// comes from the passed Campaign.

import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Banknote,
  Eye,
  HandCoins,
  Megaphone,
  MoreHorizontal,
  Pencil,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { CampaignProgress } from "@/components/campaign/CampaignProgress";
import { PostUpdateDialog } from "@/components/campaign/PostUpdateDialog";
import type { Campaign, CampaignStatus } from "@/types/campaign";

interface CampaignManagementCardProps {
  campaign: Campaign;
  className?: string;
}

/** Visual treatment per lifecycle status, using design tokens only. */
const STATUS_STYLES: Record<CampaignStatus, { label: string; className: string }> = {
  draft: {
    label: "Draft",
    className: "bg-muted text-muted-foreground",
  },
  active: {
    label: "Active",
    className: "bg-primary/10 text-primary",
  },
  funded: {
    label: "Funded",
    className: "bg-primary text-primary-foreground",
  },
  expired: {
    label: "Expired",
    className: "bg-secondary text-secondary-foreground",
  },
  closed: {
    label: "Closed",
    className: "bg-secondary text-secondary-foreground",
  },
};

export function CampaignManagementCard({
  campaign,
  className,
}: CampaignManagementCardProps) {
  const [updateOpen, setUpdateOpen] = useState(false);

  const status = STATUS_STYLES[campaign.status] ?? STATUS_STYLES.draft;
  // Withdrawals only make sense once funds have been raised / campaign funded.
  const canWithdraw = campaign.status === "funded" || campaign.raisedAmount > 0;

  return (
    <>
      <Card className={cn("border-border/60", className)}>
        <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                  status.className
                )}
              >
                {status.label}
              </span>
              <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                {campaign.category}
              </span>
            </div>
            <h3 className="truncate text-lg font-semibold leading-snug text-foreground">
              {campaign.title}
            </h3>
          </div>

          {/* Overflow menu mirrors the inline quick actions for compact views. */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                aria-label="More actions"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link to={`/campaigns/${campaign.id}/edit`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit campaign
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={`/campaigns/${campaign.id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  View page
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setUpdateOpen(true)}>
                <Megaphone className="mr-2 h-4 w-4" />
                Post update
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled>
                <HandCoins className="mr-2 h-4 w-4" />
                View donations (soon)
              </DropdownMenuItem>
              <DropdownMenuItem disabled={!canWithdraw}>
                <Banknote className="mr-2 h-4 w-4" />
                Withdraw funds
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>

        <CardContent className="space-y-5">
          <CampaignProgress campaign={campaign} hideHeadline />

          {/* Primary quick actions (visible on wider cards). */}
          <div className="flex flex-wrap gap-2 border-t border-border/60 pt-4">
            <Button asChild variant="outline" size="sm">
              <Link to={`/campaigns/${campaign.id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>

            <Button asChild variant="outline" size="sm">
              <Link to={`/campaigns/${campaign.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                View
              </Link>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setUpdateOpen(true)}
            >
              <Megaphone className="mr-2 h-4 w-4" />
              Post update
            </Button>

            {/* Donations view arrives with the donations module — stub it. */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button variant="ghost" size="sm" disabled aria-disabled>
                      <HandCoins className="mr-2 h-4 w-4" />
                      Donations
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>Viewing donations is coming soon.</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {/* Withdraw is gated until there are funds to withdraw. */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled
                      aria-disabled
                    >
                      <Banknote className="mr-2 h-4 w-4" />
                      Withdraw
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  {canWithdraw
                    ? "Withdrawals are coming soon."
                    : "You can withdraw once your campaign raises funds."}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardContent>
      </Card>

      <PostUpdateDialog
        campaignId={campaign.id}
        campaignTitle={campaign.title}
        open={updateOpen}
        onOpenChange={setUpdateOpen}
      />
    </>
  );
}

export default CampaignManagementCard;
