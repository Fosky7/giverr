import React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { listCampaigns, normalizeCampaignError } from "../api/campaigns";
import type { ModuleTwoCampaignManagementContent } from "../moduleTwoContent";
import type { Campaign, CampaignFiltersState } from "../types";
import { CampaignCard } from "./CampaignCard";
import { CampaignFilters } from "./CampaignFilters";

interface CampaignDirectoryProps extends React.HTMLAttributes<HTMLElement> {
  content: ModuleTwoCampaignManagementContent;
  pageSize?: number;
  selectedCampaignId?: string | null;
  onSelectCampaign?: (campaign: Campaign) => void;
}

const DEFAULT_PAGE_SIZE = 12;

const defaultFilters: CampaignFiltersState = {
  query: "",
  category: "all",
  status: "all",
  sortBy: "newest",
};

function LoadingSkeleton() {
  return (
    <div className="grid gap-5 xl:grid-cols-2" aria-hidden="true">
      {Array.from({ length: 4 }, (_, index) => (
        <Card key={index} className="overflow-hidden border-border/80 bg-card">
          <div className="h-44 animate-pulse bg-muted" />
          <CardContent className="space-y-4 p-6">
            <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
            <div className="h-6 w-4/5 animate-pulse rounded bg-muted" />
            <div className="space-y-2">
              <div className="h-3 w-full animate-pulse rounded bg-muted" />
              <div className="h-3 w-5/6 animate-pulse rounded bg-muted" />
            </div>
            <div className="h-3 w-full animate-pulse rounded-full bg-muted" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function EmptyState({ content, onResetFilters }: { content: ModuleTwoCampaignManagementContent; onResetFilters: () => void }) {
  return (
    <Card className="border-dashed border-border bg-card/70">
      <CardContent className="p-8 text-center">
        <h3 className="text-xl font-semibold text-foreground">{content.emptyState.title}</h3>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">{content.emptyState.description}</p>
        <Button type="button" variant="outline" className="mt-5" onClick={onResetFilters}>
          {content.emptyState.resetFiltersLabel}
        </Button>
      </CardContent>
    </Card>
  );
}

export function CampaignDirectory({
  content,
  pageSize = DEFAULT_PAGE_SIZE,
  selectedCampaignId,
  onSelectCampaign,
  className,
  ...props
}: CampaignDirectoryProps) {
  const [campaigns, setCampaigns] = React.useState<Campaign[]>([]);
  const [filters, setFilters] = React.useState<CampaignFiltersState>(defaultFilters);
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(false);
  const [internalSelectedCampaignId, setInternalSelectedCampaignId] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const requestSequenceRef = React.useRef(0);

  const activeSelectedCampaignId = selectedCampaignId ?? internalSelectedCampaignId;

  const fetchCampaigns = React.useCallback(
    async (nextPage: number, nextFilters: CampaignFiltersState, mode: "replace" | "append") => {
      const requestId = requestSequenceRef.current + 1;
      requestSequenceRef.current = requestId;

      if (mode === "replace") {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }

      setError(null);

      try {
        const apiFilters = {
          ...nextFilters,
          page: nextPage,
          pageSize,
        } as Partial<CampaignFiltersState>;
        const result = await listCampaigns(apiFilters);

        if (requestSequenceRef.current !== requestId) {
          return;
        }

        setCampaigns((current) => (mode === "append" ? [...current, ...result] : result));
        setHasMore(result.length >= pageSize);

        if (mode === "replace") {
          setInternalSelectedCampaignId(selectedCampaignId ?? null);
        }
      } catch (caughtError) {
        if (requestSequenceRef.current !== requestId) {
          return;
        }

        const normalizedError = normalizeCampaignError(caughtError);
        setError(normalizedError.message);
        setHasMore(false);

        if (mode === "replace") {
          setCampaigns([]);
          setInternalSelectedCampaignId(null);
        }
      } finally {
        if (requestSequenceRef.current === requestId) {
          setIsLoading(false);
          setIsLoadingMore(false);
        }
      }
    },
    [pageSize, selectedCampaignId],
  );

  React.useEffect(() => {
    void fetchCampaigns(page, filters, page === 1 ? "replace" : "append");
  }, [fetchCampaigns, filters, page]);

  const handleFiltersChange = React.useCallback((nextFilters: CampaignFiltersState) => {
    setFilters(nextFilters);
    setPage(1);
  }, []);

  const resetFilters = React.useCallback(() => {
    setFilters(defaultFilters);
    setPage(1);
  }, []);

  const retry = React.useCallback(() => {
    void fetchCampaigns(page, filters, page === 1 ? "replace" : "append");
  }, [fetchCampaigns, filters, page]);

  const handleSelectCampaign = React.useCallback(
    (campaign: Campaign) => {
      setInternalSelectedCampaignId(campaign.id);
      onSelectCampaign?.(campaign);
    },
    [onSelectCampaign],
  );

  const hasCampaigns = campaigns.length > 0;

  return (
    <section
      className={cn("bg-background py-12 sm:py-16", className)}
      aria-labelledby="module-two-directory-heading"
      {...props}
    >
      <div className="mx-auto w-full max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">
        <div className="space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
            {content.sections.directory.eyebrow}
          </p>
          <div className="space-y-3">
            <h2 id="module-two-directory-heading" className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {content.sections.directory.title}
            </h2>
            <p className="max-w-3xl text-base leading-7 text-muted-foreground sm:text-lg">
              {content.sections.directory.description}
            </p>
          </div>
        </div>

        <CampaignFilters filters={filters} onFiltersChange={handleFiltersChange} isLoading={isLoading && !hasCampaigns} />

        {error ? (
          <Card className="border-destructive/30 bg-destructive/10">
            <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-semibold text-foreground">{content.sections.directory.errorTitle}</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{error}</p>
              </div>
              <Button type="button" variant="outline" onClick={retry} disabled={isLoading || isLoadingMore}>
                {content.sections.directory.retryLabel}
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {isLoading && !hasCampaigns ? (
          <div role="status" aria-live="polite" aria-label={content.sections.directory.loadingText}>
            <p className="sr-only">{content.sections.directory.loadingText}</p>
            <LoadingSkeleton />
          </div>
        ) : null}

        {!isLoading && !error && !hasCampaigns ? <EmptyState content={content} onResetFilters={resetFilters} /> : null}

        {hasCampaigns ? (
          <div className="space-y-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
                Showing {campaigns.length} campaign{campaigns.length === 1 ? "" : "s"}
              </p>
              {isLoading ? <p className="text-sm text-muted-foreground">Refreshing results…</p> : null}
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3" aria-live="polite">
              {campaigns.map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  ctaLabel={content.ctaLabels.viewCampaign}
                  isSelected={activeSelectedCampaignId === campaign.id}
                  onSelect={() => handleSelectCampaign(campaign)}
                />
              ))}
            </div>

            {hasMore ? (
              <div className="flex justify-center pt-2">
                <Button type="button" variant="outline" onClick={() => setPage((current) => current + 1)} disabled={isLoadingMore}>
                  {isLoadingMore ? content.sections.directory.loadingText : content.ctaLabels.loadMore}
                </Button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default CampaignDirectory;
