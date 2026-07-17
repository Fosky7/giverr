// src/pages/Explore.tsx
//
// Public campaign discovery page (route "/explore"). Fetches published
// campaigns from Supabase and renders them with the shared CampaignCard.
// Handles loading, empty, and error states so the build has no placeholder /
// mock data paths.
//
// Default export so App.tsx can import (or lazy-load) it directly.

import { useEffect, useState } from "react";
import { Loader2, SearchX } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { CampaignCard } from "@/components/CampaignCard";

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

type LoadState = "loading" | "ready" | "error";

/**
 * Lists published campaigns pulled live from Supabase.
 */
export default function Explore() {
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [state, setState] = useState<LoadState>("loading");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setState("loading");

      const { data, error } = await supabase
        .from("campaigns")
        .select(
          "id, title, description, goal_amount, current_amount, cover_image_url, deadline",
        )
        .order("created_at", { ascending: false });

      if (cancelled) return;

      if (error) {
        setState("error");
        return;
      }

      setCampaigns((data ?? []) as CampaignRow[]);
      setState("ready");
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Explore campaigns
        </h1>
        <p className="mt-2 text-muted-foreground">
          Discover projects and back the ones you believe in.
        </p>
      </header>

      {state === "loading" && (
        <div className="flex items-center justify-center py-24 text-muted-foreground">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Loading campaigns…
        </div>
      )}

      {state === "error" && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-8 text-center text-destructive">
          Something went wrong loading campaigns. Please try again shortly.
        </div>
      )}

      {state === "ready" && campaigns.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-24 text-center text-muted-foreground">
          <SearchX className="mb-3 h-8 w-8" />
          <p className="text-lg font-medium text-foreground">
            No campaigns yet
          </p>
          <p className="mt-1 text-sm">Be the first to launch one.</p>
        </div>
      )}

      {state === "ready" && campaigns.length > 0 && (
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
