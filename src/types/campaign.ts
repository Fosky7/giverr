// src/types/campaign.ts
//
// Shared campaign domain types + row->model normalization. Kept framework-free
// so it can be imported by services, hooks, pages, and components alike. Type
// exports are declared with `export type` / `export interface` so they remain
// fully erasable at runtime (no bundle weight, clean `import type` resolution).

/**
 * Lifecycle status of a campaign.
 *
 * - `draft`  — created but not yet published (hidden from Explore).
 * - `active` — published and visible to everyone.
 * - `paused` — temporarily hidden from Explore.
 * - `closed` — no longer accepting support.
 *
 * Values must stay in sync with the DB `campaigns.status` column and the
 * EDITABLE_STATUSES list in EditCampaignPage.tsx.
 */
export type CampaignStatus = "draft" | "active" | "paused" | "closed";

/**
 * A creator-authored update / blog post attached to a campaign. Rendered on the
 * public detail page by CampaignUpdates.tsx (which reads id, title, body,
 * createdAt) and created via PostUpdateDialog.tsx.
 */
export interface CampaignUpdate {
  id: string;
  campaignId: string;
  title: string;
  /** Rich-text (HTML) body — sanitized before rendering. */
  body: string;
  createdAt: string;
}

/**
 * Raw row shape as returned by Supabase for the `campaigns` table. Snake-case
 * to match Postgres column names. Only the columns the app actually selects are
 * modeled; extended/optional columns are declared optional so partial selects
 * still type-check.
 */
export interface CampaignRow {
  id: string;
  title: string;
  category: string | null;
  description: string | null;
  raised: number | null;
  goal: number | null;
  backers: number | null;
  creator_id: string | null;
  created_at: string | null;

  // Extended / optional columns (present on richer selects).
  status?: CampaignStatus | null;
  target_audience?: string | null;
  long_description?: string | null;
  story?: string | null;
  cover_image_url?: string | null;
  media_urls?: string[] | null;
  currency?: string | null;
  deadline?: string | null;
  donor_wall_enabled?: boolean | null;
  updated_at?: string | null;
}

/**
 * Normalized, camelCase campaign model used throughout the UI. `raised`, `goal`,
 * and `backers` are the canonical presentational fields consumed by
 * CampaignCard; the extended fields power the create/edit wizard.
 */
export interface Campaign {
  id: string;
  title: string;
  category: string;
  description: string;
  raised: number;
  goal: number;
  backers: number;

  // Ownership / lifecycle.
  creatorId: string;
  status: CampaignStatus;
  createdAt: string;

  // Extended detail/wizard fields (optional — not every select populates them).
  targetAudience?: string;
  longDescription?: string;
  story?: string;
  coverImageUrl?: string;
  mediaUrls?: string[];
  /** Alias of `goal` used by the wizard form values. */
  goalAmount?: number;
  currency?: string;
  deadline?: string;
  donorWallEnabled?: boolean;
}

/**
 * Values collected by the multi-step Create/Edit Campaign wizard
 * (Basic Info, Details, Goal & Deadline, Bank Details).
 */
export interface CampaignFormValues {
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
  donorWallEnabled: boolean;

  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  routingNumber: string;
  swiftBic: string;
  country: string;
}

/**
 * Category filter union used by the Explore page filter chips and the
 * `useCampaigns` hook. `'All'` is the sentinel meaning "no category filter";
 * the remaining members are the eight canonical campaign categories.
 *
 * This is a pure, erasable type. Its non-`'All'` members drive
 * {@link CAMPAIGN_CATEGORIES}, and the full union drives
 * {@link CATEGORY_FILTERS}. Keep the union and those arrays in sync.
 */
export type CategoryFilter =
  | "All"
  | "Technology"
  | "Community"
  | "Education"
  | "Health"
  | "Environment"
  | "Arts"
  | "Business"
  | "Other";

/**
 * Normalize a raw Supabase row into the camelCase {@link Campaign} model,
 * applying safe numeric/string defaults so consumers never deal with nulls.
 */
export function mapRowToCampaign(row: CampaignRow): Campaign {
  const goal = Number(row.goal ?? 0);
  return {
    id: row.id,
    title: row.title ?? "",
    category: row.category ?? "",
    description: row.description ?? "",
    raised: Number(row.raised ?? 0),
    goal,
    backers: Number(row.backers ?? 0),

    creatorId: row.creator_id ?? "",
    status: (row.status ?? "active") as CampaignStatus,
    createdAt: row.created_at ?? "",

    targetAudience: row.target_audience ?? undefined,
    longDescription: row.long_description ?? undefined,
    story: row.story ?? undefined,
    coverImageUrl: row.cover_image_url ?? undefined,
    mediaUrls: row.media_urls ?? undefined,
    goalAmount: goal,
    currency: row.currency ?? undefined,
    deadline: row.deadline ?? undefined,
    donorWallEnabled:
      row.donor_wall_enabled === null || row.donor_wall_enabled === undefined
        ? undefined
        : row.donor_wall_enabled,
  };
}

/**
 * Funding progress as an integer percentage in the range [0, 100]. Guards
 * against division by zero when the goal is unset.
 */
export function campaignProgress(campaign: Campaign): number {
  if (!campaign.goal || campaign.goal <= 0) return 0;
  const pct = Math.round((campaign.raised / campaign.goal) * 100);
  return Math.max(0, Math.min(100, pct));
}

export const CAMPAIGN_CATEGORIES: readonly Exclude<CategoryFilter, "All">[] = [
  "Technology",
  "Community",
  "Education",
  "Health",
  "Environment",
  "Arts",
  "Business",
  "Other",
] as const;

export const CATEGORY_FILTERS: readonly CategoryFilter[] = [
  "All",
  ...CAMPAIGN_CATEGORIES,
] as const;
// [sticky-export] CampaignCurrency — recovered from prior version
export type CampaignCurrency = "USD" | "EUR" | "GBP" | "CAD" | "AUD";
