// src/pages/Dashboard.tsx
import { Link } from "react-router-dom";
import { Rocket } from "lucide-react";

import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { CreatorCampaigns } from "@/components/dashboard/CreatorCampaigns";
import { MyContributions } from "@/components/dashboard/MyContributions";

/**
 * Authenticated dashboard page. Composes the personalized sections a user
 * cares about:
 *  - CreatorCampaigns — campaigns the user has launched (creator view).
 *  - MyContributions  — campaigns the user has backed (backer view, added in
 *                       Module 4).
 *
 * The route is guarded by ProtectedRoute, so `user` is expected to be present;
 * we still read it defensively to greet the user by name/email.
 */
export function Dashboard() {
  const { user } = useAuth();

  const greetingName =
    (user?.user_metadata?.full_name as string | undefined)?.trim() ||
    user?.email ||
    "there";

  return (
    <>
      <PageHeader
        title="Your dashboard"
        description={`Welcome back, ${greetingName}. Manage the campaigns you've launched and the causes you support.`}
        eyebrow={
          <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5 text-sm font-medium text-secondary-foreground">
            <Rocket className="h-4 w-4" />
            Dashboard
          </span>
        }
      />

      <section className="container mx-auto px-4 py-12">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-foreground">Overview</h2>
          <Button asChild>
            <Link to="/start">
              <Rocket className="mr-2 h-4 w-4" />
              Start a campaign
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <CreatorCampaigns />
          <MyContributions />
        </div>
      </section>
    </>
  );
}

export default Dashboard;
