// src/services/donations.ts

/**
 * Donations data-access layer (Module 4).
 *
 * Thin async wrappers over the Supabase `donations` table, mirroring the shape
 * and error-handling style of src/services/campaigns.ts. Every function throws
 * an Error with a human-readable message on failure so callers (hooks) can
 * surface it inline.
 *
 * Persisting a donation also bumps the parent campaign's `raised_amount` and
 * `backers_count`. We attempt this via an atomic RPC (`increment_campaign_totals`)
 * and fall back to a best-effort read-modify-write if the RPC is unavailable,
 * so the UI totals stay correct even before the migration adds the function.
 */

import { supabase } from "@/integrations/supabase/client";
import {
  ANONYMOUS_BACKER_NAME,
  mapDonationRow,
  type Donation,
  type DonationInput,
  type DonationRow,
} from "@/types/donation";

const DONATIONS_TABLE = "donations";
const CAMPAIGNS_TABLE = "campaigns";

/** Columns selected for the normalized {@link Donation} mapper. */
const DONATION_COLUMNS =
  "id, campaign_id, backer_id, amount, display_name, message, created_at";

/**
 * Attempt to atomically increment a campaign's running totals after a donation.
 * Prefers an RPC; on failure (e.g. function not present) it falls back to a
 * non-atomic read-modify-write. Failures here are logged but never thrown —
 * the donation itself already succeeded and the UI refetches totals anyway.
 */
async function bumpCampaignTotals(
  campaignId: string,
  amount: number
): Promise<void> {
  // Preferred path: atomic server-side increment.
  const { error: rpcError } = await supabase.rpc("increment_campaign_totals", {
    p_campaign_id: campaignId,
    p_amount: amount,
  });

  if (!rpcError) return;

  // Fallback: best-effort read-modify-write.
  try {
    const { data: current, error: readError } = await supabase
      .from(CAMPAIGNS_TABLE)
      .select("raised_amount, backers_count")
      .eq("id", campaignId)
      .single();

    if (readError || !current) return;

    const nextRaised = Number(current.raised_amount ?? 0) + amount;
    const nextBackers = Number(current.backers_count ?? 0) + 1;

    await supabase
      .from(CAMPAIGNS_TABLE)
      .update({ raised_amount: nextRaised, backers_count: nextBackers })
      .eq("id", campaignId);
  } catch {
    // Swallow — totals will reconcile on next fetch.
  }
}

/**
 * Record a contribution to a campaign and update the campaign totals.
 *
 * @param input        campaignId + amount (required); displayName/message optional.
 * @param backerId     Supabase auth user id when logged in, otherwise null.
 * @returns the newly created, normalized Donation.
 */
export async function createDonation(
  input: DonationInput,
  backerId: string | null = null
): Promise<Donation> {
  const amount = Number(input.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Contribution amount must be a positive number.");
  }

  const displayName = input.displayName?.trim() || ANONYMOUS_BACKER_NAME;
  const message = input.message?.trim() || null;

  const { data, error } = await supabase
    .from(DONATIONS_TABLE)
    .insert({
      campaign_id: input.campaignId,
      backer_id: backerId,
      amount,
      display_name: displayName,
      message,
    })
    .select(DONATION_COLUMNS)
    .single();

  if (error || !data) {
    throw new Error(
      error?.message ??
        "We couldn't process your contribution. Please try again."
    );
  }

  // Keep campaign totals in sync (non-blocking correctness — see helper).
  await bumpCampaignTotals(input.campaignId, amount);

  return mapDonationRow(data as DonationRow);
}

/**
 * List the most recent donations for a single campaign (newest first).
 *
 * @param campaignId campaign to list backers for.
 * @param limit      max rows to return (default 20).
 */
export async function fetchCampaignDonations(
  campaignId: string,
  limit = 20
): Promise<Donation[]> {
  const { data, error } = await supabase
    .from(DONATIONS_TABLE)
    .select(DONATION_COLUMNS)
    .eq("campaign_id", campaignId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message || "Failed to load recent backers.");
  }

  return (data as DonationRow[] | null)?.map(mapDonationRow) ?? [];
}

/**
 * List every donation made by the signed-in user (newest first), used to
 * surface a user's contributions in the Dashboard.
 *
 * @param backerId Supabase auth user id.
 */
export async function fetchUserDonations(
  backerId: string
): Promise<Donation[]> {
  const { data, error } = await supabase
    .from(DONATIONS_TABLE)
    .select(DONATION_COLUMNS)
    .eq("backer_id", backerId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message || "Failed to load your contributions.");
  }

  return (data as DonationRow[] | null)?.map(mapDonationRow) ?? [];
}
