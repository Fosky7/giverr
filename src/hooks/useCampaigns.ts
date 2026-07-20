// src/hooks/useCampaigns.ts
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import {
  type Campaign,
  type CampaignRow,
  type CategoryFilter,
  mapRowToCampaign,
} from "@/types/campaign";
import { mockCampaigns } from "@/mocks/campaigns";

export interface UseCampaignsOptions {
  query?: string;
  category?: CategoryFilter;
  creatorId?: string;
}

export interface UseCampaignsResult {
  campaigns: Campaign[];
  loading: boolean;
  error: string | null;
  isMock: boolean;
  refetch: () => void;
}

const DEBOUNCE_MS = 250;

/**
 * Shared campaigns data hook. Falls back to realistic mock data from
 * `@/mocks/campaigns` whenever the real query errors (missing table, RLS,
 * network) OR returns zero rows, so Explore is never blank/broken. Real rows
 * automatically replace mocks once they exist. End-users can ask the AI to
 * "remove all mock data" to opt out permanently.
 */
export function useCampaigns(
  options: UseCampaignsOptions = {}
): UseCampaignsResult {
  const { query = "", category = "All", creatorId } = options;

  const [rows, setRows] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMock, setIsMock] = useState(false);

  const [reloadToken, setReloadToken] = useState(0);
  const refetch = useCallback(() => setReloadToken((n) => n + 1), []);

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

        if (creatorId) builder = builder.eq("creator_id", creatorId);
        if (category && category !== "All") builder = builder.eq("category", category);
        if (normalizedQuery.length > 0) {
          const safe = normalizedQuery.replace(/[%_]/g, (m) => `\\${m}`);
          builder = builder.or(`title.ilike.%${safe}%,description.ilike.%${safe}%`);
        }

        const { data, error: queryError } = await builder;
        if (!active || requestId !== requestIdRef.current) return;
        if (queryError) throw new Error(queryError.message);

        const mapped = ((data ?? []) as CampaignRow[]).map(mapRowToCampaign);

        if (mapped.length === 0) {
          if (creatorId) {
            setRows([]);
            setIsMock(false);
          } else {
            setRows(mockCampaigns);
            setIsMock(true);
          }
        } else {
          setRows(mapped);
          setIsMock(false);
        }
      } catch (err) {
        if (!active || requestId !== requestIdRef.current) return;
        console.warn("[useCampaigns] falling back to mock data:", err);
        if (creatorId) {
          setError(
            err instanceof Error
              ? err.message
              : "Something went wrong while loading campaigns."
          );
          setRows([]);
          setIsMock(false);
        } else {
          setRows(mockCampaigns);
          setIsMock(true);
          setError(null);
        }
      } finally {
        if (active && requestId === requestIdRef.current) setLoading(false);
      }
    };

    const timer = window.setTimeout(run, DEBOUNCE_MS);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [normalizedQuery, category, creatorId, reloadToken]);

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

  return { campaigns, loading, error, isMock, refetch };
}

export default useCampaigns;
