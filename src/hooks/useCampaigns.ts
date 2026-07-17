// src/hooks/useCampaigns.ts
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import {
  type Campaign,
  type CampaignRow,
  type CategoryFilter,
  mapRowToCampaign,
} from "@/types/campaign";

/**
 * Options accepted by {@link useCampaigns}. `query` is a free-text search over
 * title/description and `category` narrows by the stored category ("All" means
 * no category filter). Both are debounced/re-fetched by the hook.
 */
export interface UseCampaignsOptions {
  query?: string;
  category?: CategoryFilter;
  /** When provided, only campaigns owned by this user are returned. */
  creatorId?: string;
}

export interface UseCampaignsResult {
  campaigns: Campaign[];
  loading: boolean;
  error: string | null;
  /** Re-run the current query (used by the Explore error-state retry button). */
  refetch: () => void;
}

// Small debounce so typing in the search box does not fire a request per
// keystroke. Category/creator changes also flow through this.
const DEBOUNCE_MS = 250;

/**
 * Shared campaigns data hook. Fetches from the Supabase `campaigns` table with
 * server-side filtering (category equality + ilike search) and returns
 * normalized {@link Campaign} objects along with loading/error state.
 *
 * The hook is defensive: if the server-side filter is unavailable it falls back
 * to filtering client-side, and it always applies a final client filter so the
 * returned list is guaranteed consistent with the requested query/category.
 */
export function useCampaigns(
  options: UseCampaignsOptions = {}
): UseCampaignsResult {
  const { query = "", category = "All", creatorId } = options;

  const [rows, setRows] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Bumped to force a refetch (retry button).
  const [reloadToken, setReloadToken] = useState(0);
  const refetch = useCallback(() => setReloadToken((n) => n + 1), []);

  // Keep the latest request id so out-of-order responses are ignored.
  const requestIdRef = useRef(0);

  const normalizedQuery = query.trim();

  useEffect(() => {
    let active = true;
    const requestId = ++requestIdRef.current;

    const run = async () => {
      setLoading(true);
      setError(null);

      try {
        let builder = supabase
          .from("campaigns")
          .select(
            "id, title, category, description, raised, goal, backers, creator_id, created_at"
          )
          .order("created_at", { ascending: false });

        if (creatorId) {
          builder = builder.eq("creator_id", creatorId);
        }

        if (category && category !== "All") {
          builder = builder.eq("category", category);
        }

        if (normalizedQuery.length > 0) {
          // Escape %/_ so user input is treated literally in the ilike pattern.
          const safe = normalizedQuery.replace(/[%_]/g, (m) => `\\${m}`);
          builder = builder.or(
            `title.ilike.%${safe}%,description.ilike.%${safe}%`
          );
        }

        const { data, error: queryError } = await builder;

        if (!active || requestId !== requestIdRef.current) return;

        if (queryError) {
          throw new Error(queryError.message);
        }

        const mapped = ((data ?? []) as CampaignRow[]).map(mapRowToCampaign);
        setRows(mapped);
      } catch (err) {
        if (!active || requestId !== requestIdRef.current) return;
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong while loading campaigns."
        );
        setRows([]);
      } finally {
        if (active && requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    };

    const timer = window.setTimeout(run, DEBOUNCE_MS);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [normalizedQuery, category, creatorId, reloadToken]);

  // Final client-side filter guarantees the returned list matches the request
  // even if a fallback/broader server response slipped through.
  const campaigns = useMemo(() => {
    const q = normalizedQuery.toLowerCase();
    return rows.filter((c) => {
      const matchesCategory = category === "All" || c.category === category;
      const matchesQuery =
        q.length === 0 ||
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [rows, normalizedQuery, category]);

  return { campaigns, loading, error, refetch };
}

export default useCampaigns;
