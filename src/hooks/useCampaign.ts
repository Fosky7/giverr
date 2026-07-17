// src/hooks/useCampaign.ts
import { useCallback, useEffect, useRef, useState } from "react";

import { getCampaign } from "@/services/campaigns";
import type { Campaign } from "@/types/campaign";

/** Shape returned by {@link useCampaign}. */
export interface UseCampaignResult {
  data: Campaign | null;
  loading: boolean;
  error: string | null;
  /** Manually re-run the fetch for the current id/slug. */
  refetch: () => void;
}

/**
 * Data-fetching hook for the Campaign Detail page. Loads a single campaign by
 * its id or slug.
 *
 * When `idOrSlug` is falsy (e.g. the route param hasn't resolved yet) the hook
 * settles into a not-loading, no-error, null-data state rather than firing a
 * request. Uses the mounted-guard/cleanup pattern so a resolution after
 * unmount (or after the id changed) can't update stale state.
 */
export function useCampaign(
  idOrSlug: string | null | undefined
): UseCampaignResult {
  const [data, setData] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(Boolean(idOrSlug));
  const [error, setError] = useState<string | null>(null);

  const [reloadToken, setReloadToken] = useState(0);

  const refetch = useCallback(() => {
    setReloadToken((token) => token + 1);
  }, []);

  const requestIdRef = useRef(0);

  useEffect(() => {
    // No identifier yet — nothing to fetch.
    if (!idOrSlug) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    let mounted = true;
    const requestId = ++requestIdRef.current;

    setLoading(true);
    setError(null);

    getCampaign(idOrSlug)
      .then((result) => {
        if (!mounted || requestId !== requestIdRef.current) return;
        setData(result);
        if (!result) {
          setError("Campaign not found.");
        }
      })
      .catch((err: unknown) => {
        if (!mounted || requestId !== requestIdRef.current) return;
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load this campaign. Please try again."
        );
        setData(null);
      })
      .finally(() => {
        if (!mounted || requestId !== requestIdRef.current) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [idOrSlug, reloadToken]);

  return { data, loading, error, refetch };
}

export default useCampaign;
