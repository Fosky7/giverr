// src/hooks/useDonations.ts

/**
 * Donation data hooks (Module 4).
 *
 * These mirror the loading/error/data + refetch conventions established by
 * useCampaigns / useCampaign, and reuse the existing {@link useAuth} hook so a
 * backer's user id is attached automatically when they're signed in.
 *
 *  - useDonateToCampaign()          → { donate, submitting, error, reset }
 *  - useCampaignDonations(id, limit) → { donations, loading, error, refetch }
 *  - useUserDonations()              → { donations, loading, error, refetch }
 */

import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import {
  createDonation,
  fetchCampaignDonations,
  fetchUserDonations,
} from "@/services/donations";
import type { Donation, DonationInput } from "@/types/donation";

/** Normalize an unknown thrown value into a user-facing message. */
function toMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}

// ── useDonateToCampaign ──────────────────────────────────────────────────────

export interface UseDonateToCampaignResult {
  /** Persist a contribution; resolves with the created Donation on success. */
  donate: (input: DonationInput) => Promise<Donation>;
  /** True while the insert is in flight. */
  submitting: boolean;
  /** Inline server/validation error from the last attempt, if any. */
  error: string | null;
  /** Clear the current error state (e.g. when reopening a dialog). */
  reset: () => void;
}

/**
 * Action hook that performs a donation. Attaches the signed-in user's id as the
 * backerId automatically (null for guests). Callers drive UI from `submitting`
 * and `error`; the returned promise rejects on failure so a form can also
 * await it if preferred.
 */
export function useDonateToCampaign(): UseDonateToCampaignResult {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => setError(null), []);

  const donate = useCallback(
    async (input: DonationInput): Promise<Donation> => {
      setSubmitting(true);
      setError(null);
      try {
        const donation = await createDonation(input, user?.id ?? null);
        return donation;
      } catch (err) {
        const message = toMessage(
          err,
          "We couldn't process your contribution. Please try again."
        );
        setError(message);
        throw err instanceof Error ? err : new Error(message);
      } finally {
        setSubmitting(false);
      }
    },
    [user?.id]
  );

  return { donate, submitting, error, reset };
}

// ── useCampaignDonations ─────────────────────────────────────────────────────

export interface UseCampaignDonationsResult {
  donations: Donation[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * List the most recent backers for a campaign. Refetches when the campaign id
 * changes; exposes a manual refetch for post-donation refreshes.
 */
export function useCampaignDonations(
  campaignId: string | undefined,
  limit = 20
): UseCampaignDonationsResult {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState<boolean>(Boolean(campaignId));
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!campaignId) {
      setDonations([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const rows = await fetchCampaignDonations(campaignId, limit);
      setDonations(rows);
    } catch (err) {
      setError(toMessage(err, "Failed to load recent backers."));
    } finally {
      setLoading(false);
    }
  }, [campaignId, limit]);

  useEffect(() => {
    let active = true;
    void (async () => {
      if (!active) return;
      await load();
    })();
    return () => {
      active = false;
    };
  }, [load]);

  return { donations, loading, error, refetch: load };
}

// ── useUserDonations ─────────────────────────────────────────────────────────

export interface UseUserDonationsResult {
  donations: Donation[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * List the signed-in user's contributions for the Dashboard. Returns an empty,
 * non-loading result when no user is authenticated.
 */
export function useUserDonations(): UseUserDonationsResult {
  const { user } = useAuth();
  const backerId = user?.id ?? null;

  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState<boolean>(Boolean(backerId));
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!backerId) {
      setDonations([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const rows = await fetchUserDonations(backerId);
      setDonations(rows);
    } catch (err) {
      setError(toMessage(err, "Failed to load your contributions."));
    } finally {
      setLoading(false);
    }
  }, [backerId]);

  useEffect(() => {
    let active = true;
    void (async () => {
      if (!active) return;
      await load();
    })();
    return () => {
      active = false;
    };
  }, [load]);

  return { donations, loading, error, refetch: load };
}
