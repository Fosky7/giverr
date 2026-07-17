// src/pages/DashboardPage.tsx
//
// Authenticated creator dashboard. Composes the greeting/overview and the
// "My Campaigns" management surface. Module 4 upgrades the campaigns section
// from the read-only CreatorCampaigns grid to the action-oriented
// MyCampaignsList (edit / view / post update / manage funds), integrated here
// as a sub-section of the dashboard.

import { DashboardOverview } from "@/components/dashboard/DashboardOverview";
import { MyCampaignsList } from "@/components/dashboard/MyCampaignsList";

/**
 * Dashboard landing page. Sections are stacked with generous spacing so the
 * overview stats and the campaign management list read as distinct areas.
 */
export function DashboardPage() {
  return (
    <section className="container mx-auto px-4 py-10">
      <div className="space-y-12">
        {/* Overview: greeting + summary stats. */}
        <DashboardOverview />

        {/* My Campaigns: manage owned campaigns (edit / update / funds). */}
        <MyCampaignsList />
      </div>
    </section>
  );
}

export default DashboardPage;
