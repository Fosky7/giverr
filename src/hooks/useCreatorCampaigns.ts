// src/hooks/useCreatorCampaigns.ts
import { useCallback, useEffect, useRef, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import { listCampaignsByCreator } from "@/services/campaigns";
import type { Campaign } from "@/types/campaign";

/** Shape returned by {@link useCreatorCampaigns}. */
export interface UseCreatorCampaignsResult {
  data: Campaign[];
  loading: boolean;
  error: string | null;
  /** Manually re-run the fetch for the current user. */
  refetch: () => void;
}

/**
 * Data-fetching hook for the creator dashboard's "My Campaigns" list. Fetches
 * the campaigns owned by the currently signed-in user (via `useAuth().user`).
 *
 * If there is no authenticated user, the hook resolves to an empty list
 * without hitting the network. Uses the mounted-guard/cleanup pattern so a
 * late response (after unmount or a user change) can't clobber current state.
 */
export function useCreatorCampaigns(): UseCreatorCampaignsResult {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [data, setData] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(Boolean(userId));
  const [error, setError] = useState<string | null>(null);

  const [reloadToken, setReloadToken] = useState(0);

  const refetch = useCallback(() => {
    setReloadToken((token) => token + 1);
  }, []);

  const requestIdRef = useRef(0);

  useEffect(() => {
    // Not signed in — present an empty (non-loading) list.
    if (!userId) {
      setData([]);
      setError(null);
      setLoading(false);
      return;
    }

    let mounted = true;
    const requestId = ++requestIdRef.current;

    setLoading(true);
    setError(null);

    listCampaignsByCreator(userId)
      .then((result) => {
        if (!mounted || requestId !== requestIdRef.current) return;
        setData(result);
      })
      .catch((err: unknown) => {
        if (!mounted || requestId !== requestIdRef.current) return;
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load your campaigns. Please try again."
        );
        setData([]);
      })
      .finally(() => {
        if (!mounted || requestId !== requestIdRef.current) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [userId, reloadToken]);

  return { data, loading, error, refetch };
}

export default useCreatorCampaigns;
