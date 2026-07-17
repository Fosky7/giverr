// src/types/campaign.ts
//
// Central types, constants, and helpers for the Campaign Management module.
// Consumers import named exports from here (e.g. Campaign, CampaignFormValues,
// CAMPAIGN_CATEGORIES, CATEGORY_FILTERS, mapRowToCampaign, campaignProgress).
//
// NOTE: This file is the single source of truth for campaign category options.
// The Create/Edit Campaign wizard (Step 1) renders CAMPAIGN_CATEGORIES as a
// selectable dropdown, and the Explore filters use CATEGORY_FILTERS.

import type { Database } from "@/integrations/supabase/types";

// ─────────────────────────────────────────────────────────────────────────────
// Category constants
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The selectable campaign categories, in display order. Used by the campaign
 * creation/edit wizard's category <Select> and validated by the form schema.
 *
 * Kept as a readonly tuple so a union type can be derived when needed while the
 * `category` form field itself remains a plain string.
 */
export const CAMPAIGN_CATEGORIES = [
  "Medical",
  "Education",
  "Community",
  "Emergency",
  "Animals",
  "Environment",
  "Nonprofit",
  "Business",
  "Creative",
  "Sports",
  "Faith",
  "Memorial",
  "Family",
  "Technology",
  "Other",
] as const;

/** Union of the valid category labels (derived from the constant above). */
export type CampaignCategory = (typeof CAMPAIGN_CATEGORIES)[number];

/**
 * Category options for the Explore filter bar. Includes an "All" pseudo-option
 * up front so the filter can represent "no category filter" without special
 * casing at every call site.
 */
export const CATEGORY_FILTERS = [
  "All",
  ...CAMPAIGN_CATEGORIES,
] as const;

export type CategoryFilter = (typeof CATEGORY_FILTERS)[number];

// ─────────────────────────────────────────────────────────────────────────────
// Domain types
// ─────────────────────────────────────────────────────────────────────────────

export type CampaignStatus = "draft" | "active" | "paused" | "closed";

/** The public/domain shape of a campaign used across pages and components. */
export interface Campaign {
  id: string;
  creatorId: string | null;
  title: string;
  description: string;
  category: string;
  targetAudience: string;

  longDescription: string;
  story: string;
  coverImageUrl: string;
  mediaUrls: string[];

  goalAmount: number;
  currency: string;
  deadline: string;

  raisedAmount: number;
  backersCount: number;

  status: CampaignStatus;
  donorWallEnabled: boolean;

  createdAt: string;
  updatedAt: string;
}

/**
 * The values collected by the multi-step Create/Edit Campaign wizard. The
 * `category` field is intentionally a plain string (validated against
 * CAMPAIGN_CATEGORIES by the zod schema) so the Select control can bind to it
 * directly without extra coercion.
 */
export interface CampaignFormValues {
  // Step 1 — basic info
  title: string;
  description: string;
  category: string;
  targetAudience: string;

  // Step 2 — details
  longDescription: string;
  story: string;
  coverImageUrl: string;
  mediaUrls: string[];

  // Step 3 — goal & deadline
  goalAmount: number;
  currency: string;
  deadline: string;
  donorWallEnabled: boolean;

  // Step 4 — bank details
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  routingNumber: string;
  swiftBic: string;
  country: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Row mapping + helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Convenience alias for the raw campaigns table row shape. */
export type CampaignRow = Database["public"]["Tables"]["campaigns"]["Row"];

/**
 * Map a raw Supabase `campaigns` row (snake_case) into the camelCase domain
 * {@link Campaign} used throughout the UI. Missing/nullable columns are
 * normalized to safe defaults so consumers never have to null-check basics.
 */
export function mapRowToCampaign(row: CampaignRow): Campaign {
  return {
    id: row.id,
    creatorId: row.creator_id ?? null,
    title: row.title ?? "",
    description: row.description ?? "",
    category: row.category ?? "",
    targetAudience: row.target_audience ?? "",

    longDescription: row.long_description ?? "",
    story: row.story ?? "",
    coverImageUrl: row.cover_image_url ?? "",
    mediaUrls: (row.media_urls as string[] | null) ?? [],

    goalAmount: Number(row.goal_amount ?? 0),
    currency: row.currency ?? "USD",
    deadline: row.deadline ?? "",

    raisedAmount: Number(row.raised_amount ?? 0),
    backersCount: Number(row.backers_count ?? 0),

    status: (row.status as CampaignStatus) ?? "draft",
    donorWallEnabled: row.donor_wall_enabled ?? true,

    createdAt: row.created_at ?? "",
    updatedAt: row.updated_at ?? "",
  };
}

/** Funding progress summary for a campaign, used by progress panels/cards. */
export interface CampaignProgressResult {
  percent: number;
  raised: number;
  goal: number;
  backers: number;
  daysLeft: number | null;
}

/**
 * Compute clamped funding progress for a campaign. Percent is an integer in
 * the 0–100 range (guards against a 0 goal). `daysLeft` is null when there is
 * no deadline; otherwise it is the whole number of days remaining (>= 0).
 */
export function campaignProgress(campaign: Campaign): CampaignProgressResult {
  const goal = campaign.goalAmount > 0 ? campaign.goalAmount : 0;
  const raised = campaign.raisedAmount ?? 0;
  const percent =
    goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : 0;

  let daysLeft: number | null = null;
  if (campaign.deadline) {
    const end = new Date(campaign.deadline).getTime();
    if (!Number.isNaN(end)) {
      const diffMs = end - Date.now();
      daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    }
  }

  return {
    percent,
    raised,
    goal,
    backers: campaign.backersCount ?? 0,
    daysLeft,
  };
}

// ── Auto-generated by KrossBuild named-export gate ──
// These bindings were imported elsewhere but missing here. Preserved blocks
// are recovered verbatim from the prior version of this file (sticky export
// invariant); unknown names are safe stubs. Replace stubs with real logic.
// [sticky-export] CampaignUpdate — recovered from prior version
export interface CampaignUpdate {
  id: string;
  campaignId: string;
  title: string;
  /** Rich-text (HTML) body — sanitized before rendering. */
  body: string;
  createdAt: string;
}
// [sticky-export] CampaignCurrency — recovered from prior version
export type CampaignCurrency = "USD" | "EUR" | "GBP" | "CAD" | "AUD";
