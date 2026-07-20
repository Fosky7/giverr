import { useState } from "react";
import { AlertCircle, RefreshCw, Search, SearchX } from "lucide-react";

import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { CATEGORY_FILTERS, type CategoryFilter } from "@/types/campaign";
import { useCampaigns } from "@/hooks/useCampaigns";
import { CampaignCard } from "@/components/campaigns/CampaignCard";
import { CampaignCardSkeleton } from "@/components/campaigns/CampaignCardSkeleton";

// Number of skeleton cards to render while the initial fetch is in flight.
const SKELETON_COUNT = 6;

/**
 * Explore page. Renders a search/filter bar wired to the shared
 * {@link useCampaigns} hook (query + activeCategory feed the hook, which does
 * server-side filtering with a client fallback) and a responsive grid of
 * {@link CampaignCard}s.
 *
 * States handled:
 *  - loading  → grid of CampaignCardSkeletons
 *  - error    → inline AlertCircle panel with a retry button
 *  - empty    → "No campaigns found" with a Clear filters action
 *  - success  → the campaign grid
 */
export function Explore() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("All");

  const { campaigns, loading, error, refetch } = useCampaigns({
    query,
    category: activeCategory,
  });

  const clearFilters = () => {
    setQuery("");
    setActiveCategory("All");
  };

  const hasActiveFilters = query.trim().length > 0 || activeCategory !== "All";

  return (
    <>
      <div className="container mx-auto px-4 py-6">
        <PageHeader
          title="Explore Campaigns"
          description="Discover causes and projects from creators and organizations around the world. Find something worth backing."
        />
      </div>

      <section className="container mx-auto px-4 py-12">
        {/* Search + filters */}
        <div className="space-y-4">
          <div className="relative mx-auto max-w-xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search campaigns..."
              className="pl-9"
              aria-label="Search campaigns"
            />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {CATEGORY_FILTERS.map((category) => (
              <Button
                key={category}
                type="button"
                size="sm"
                variant={activeCategory === category ? "default" : "outline"}
                onClick={() => setActiveCategory(category)}
                className={cn(
                  "rounded-full",
                  activeCategory === category && "shadow-sm"
                )}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
              <CampaignCardSkeleton key={index} />
            ))}
          </div>
        ) : error ? (
          <div
            role="alert"
            className="mx-auto mt-16 flex max-w-md flex-col items-center text-center"
          >
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
              <AlertCircle className="h-8 w-8" />
            </span>
            <h2 className="mt-6 text-xl font-semibold text-foreground">
              Couldn&apos;t load campaigns
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {error} Please check your connection and try again.
            </p>
            <Button variant="outline" className="mt-6" onClick={refetch}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        ) : campaigns.length > 0 ? (
          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {campaigns.map((campaign) => (
              <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
          </div>
        ) : (
          <div className="mx-auto mt-16 flex max-w-md flex-col items-center text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
              <SearchX className="h-8 w-8" />
            </span>
            <h2 className="mt-6 text-xl font-semibold text-foreground">
              No campaigns found
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {hasActiveFilters
                ? "We couldn't find any campaigns matching your search. Try a different keyword or category."
                : "There are no campaigns yet. Be the first to launch one!"}
            </p>
            {hasActiveFilters ? (
              <Button variant="outline" className="mt-6" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : null}
          </div>
        )}
      </section>
    </>
  );
}

export default Explore;
