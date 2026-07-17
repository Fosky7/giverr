// src/pages/Explore.tsx
//
// Public campaign discovery page (route "/explore"). Fetches published
// campaigns from Supabase and renders them with the shared CampaignCard.
// Handles loading, empty, and error states so the build has no placeholder /
// mock data paths.
//
// Module update: the campaigns fetch now flows through `useRetryableAsync`, so a
// transient network failure renders an in-place <RetryState> whose "Try again"
// button re-runs the same select query (same ordering) without a full reload.
// The dedicated empty state is preserved and only shown on a successful fetch
// that returns zero rows.
//
// Default export so App.tsx can import (or lazy-load) it directly.

import { useCallback } from "react";
import { Loader2, SearchX } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { CampaignCard } from "@/components/CampaignCard";
import { RetryState } from "@/components/feedback/RetryState";
import { useRetryableAsync } from "@/hooks/useRetryableAsync";

// Minimal row shape used for rendering. Kept local so this page does not depend
// on a generated type that may not exist yet, while still being fully typed.
interface CampaignRow {
  id: string;
  title: string | null;
  description: string | null;
  goal_amount: number | null;
  current_amount: number | null;
  cover_image_url: string | null;
  deadline: string | null;
}

/**
 * Lists published campaigns pulled live from Supabase.
 */
export default function Explore() {
  // The fetch operation is stable across renders so the hook's guards behave.
  const fetchCampaigns = useCallback(async (): Promise<CampaignRow[]> => {
    const { data, error } = await supabase
      .from("campaigns")
      .select(
        "id, title, description, goal_amount, current_amount, cover_image_url, deadline"
      )
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []) as CampaignRow[];
  }, []);

  const { data, status, error, retry } = useRetryableAsync<CampaignRow[]>(
    fetchCampaigns,
    {
      immediate: true,
      fallbackError:
        "We couldn't load campaigns right now. Please try again shortly.",
    }
  );

  const campaigns = data ?? [];
  const isLoading = status === "loading" || status === "idle";

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <section className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Explore campaigns
        </h1>
        <p className="mt-2 text-muted-foreground">
          Discover projects and back the ones you believe in.
        </p>
      </section>

      {isLoading && (
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Loading campaigns…
        </div>
      )}

      {status === "error" && (
        <div className="py-12">
          <RetryState
            title="Couldn't load campaigns"
            description={error}
            onRetry={retry}
            retrying={false}
          />
        </div>
      )}

      {status === "ready" && campaigns.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-24 text-center text-muted-foreground">
          <SearchX className="mb-3 h-8 w-8" />
          <p className="text-lg font-medium text-foreground">
            No campaigns yet
          </p>
          <p className="mt-1 text-sm">Be the first to launch one.</p>
        </div>
      )}

      {status === "ready" && campaigns.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              id={campaign.id}
              title={campaign.title ?? "Untitled campaign"}
              description={campaign.description ?? ""}
              goalAmount={campaign.goal_amount ?? 0}
              currentAmount={campaign.current_amount ?? 0}
              coverImageUrl={campaign.cover_image_url ?? undefined}
              deadline={campaign.deadline ?? undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}