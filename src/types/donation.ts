// src/types/donation.ts

/**
 * Domain types for the donation / backing flow (Module 4).
 *
 * Mirrors the conventions established by src/types/campaign.ts: a normalized
 * app-facing `Donation` model plus the raw DB row shape and a mapper so the
 * rest of the app never touches snake_case columns directly.
 */

/** App-facing, camelCase donation model used across hooks + UI. */
export interface Donation {
  id: string;
  campaignId: string;
  /** Supabase auth user id of the backer, or null for anonymous/guest gifts. */
  backerId: string | null;
  /** Contribution amount in USD (major units). Always > 0. */
  amount: number;
  /** Public display name shown in the backers list. */
  displayName: string;
  /** Optional supportive message left by the backer. */
  message: string | null;
  createdAt: string;
}

/** Raw row shape as returned by the Supabase `donations` table. */
export interface DonationRow {
  id: string;
  campaign_id: string;
  backer_id: string | null;
  amount: number | string;
  display_name: string | null;
  message: string | null;
  created_at: string;
}

/** Input accepted by the donate() action. */
export interface DonationInput {
  campaignId: string;
  amount: number;
  displayName?: string;
  message?: string;
}

/** Fallback name used when a backer contributes without providing one. */
export const ANONYMOUS_BACKER_NAME = "Anonymous";

/**
 * Preset contribution amounts (USD) surfaced as quick-pick chips in the
 * BackCampaignDialog. Kept here so the data layer and UI share one source.
 */
export const PRESET_DONATION_AMOUNTS = [10, 25, 50, 100, 250] as const;

/** Map a raw DB row into the normalized {@link Donation} model. */
export function mapDonationRow(row: DonationRow): Donation {
  const amount =
    typeof row.amount === "string" ? Number(row.amount) : row.amount;

  return {
    id: row.id,
    campaignId: row.campaign_id,
    backerId: row.backer_id,
    amount: Number.isFinite(amount) ? amount : 0,
    displayName: row.display_name?.trim() || ANONYMOUS_BACKER_NAME,
    message: row.message?.trim() ? row.message.trim() : null,
    createdAt: row.created_at,
  };
}
