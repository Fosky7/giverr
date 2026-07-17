// src/services/campaigns.ts
//
// Data-access layer for the `campaigns` table. Centralizes the Supabase queries
// and row->Campaign normalization so hooks and pages stay thin. Always reuse
// the shared Supabase client and the shared mapRowToCampaign mapper.

import { supabase } from "@/integrations/supabase/client";
import {
  type Campaign,
  type CampaignRow,
  type CampaignUpdate,
  mapRowToCampaign,
} from "@/types/campaign";

// Column list kept in sync with useCampaigns.ts for consistent row shapes.
const CAMPAIGN_COLUMNS =
  "id, title, category, description, raised, goal, backers, creator_id, created_at";

// Richer column list including the extended detail/wizard fields. Used by the
// edit flow so patched values round-trip back into the normalized model.
const CAMPAIGN_COLUMNS_FULL =
  "id, title, category, description, raised, goal, backers, creator_id, created_at, status, target_audience, long_description, story, cover_image_url, media_urls, currency, deadline, donor_wall_enabled";

// Supabase Storage bucket for campaign media (cover images / gallery).
const CAMPAIGN_MEDIA_BUCKET = "campaign-media";

/**
 * Fetch every campaign owned by a specific creator, newest first. Used by the
 * creator dashboard's "My Campaigns" surface via useCreatorCampaigns.
 *
 * Throws on query error so the caller's `.catch` can surface a message.
 */
export async function listCampaignsByCreator(
  creatorId: string
): Promise<Campaign[]> {
  const { data, error } = await supabase
    .from("campaigns")
    .select(CAMPAIGN_COLUMNS)
    .eq("creator_id", creatorId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as CampaignRow[]).map(mapRowToCampaign);
}


/**
 * Fetch a single campaign by id. Returns null when no row matches so callers
 * can render a "not found" state instead of throwing.
 */
export async function getCampaign(idOrSlug: string): Promise<Campaign | null> {
  const { data, error } = await supabase
    .from("campaigns")
    .select(CAMPAIGN_COLUMNS)
    .eq("id", idOrSlug)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapRowToCampaign(data as CampaignRow) : null;
}

/** Input shape for {@link createCampaign}, mirroring Start.tsx's form state. */
export interface CreateCampaignInput {
  title: string;
  category: string;
  goalAmount: number;
  description: string;
}

/**
 * Insert a new campaign owned by the currently-authenticated user and return
 * the normalized {@link Campaign}. Throws when the caller is signed out or the
 * insert fails so the form can surface a server error.
 */
export async function createCampaign(input: CreateCampaignInput): Promise<Campaign> {
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr) {
    throw new Error(userErr.message);
  }
  const userId = userData.user?.id;
  if (!userId) {
    throw new Error("You must be signed in to publish a campaign.");
  }

  const { data, error } = await supabase
    .from("campaigns")
    .insert({
      title: input.title,
      category: input.category,
      goal: input.goalAmount,
      description: input.description,
      creator_id: userId,
    })
    .select(CAMPAIGN_COLUMNS)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapRowToCampaign(data as CampaignRow);
}

// ─────────────────────────────────────────────────────────────────────────────
// Campaign updates (creator update / blog feed)
// ─────────────────────────────────────────────────────────────────────────────

/** Raw row shape for the `campaign_updates` table. */
interface CampaignUpdateRow {
  id: string;
  campaign_id: string;
  title: string;
  body: string | null;
  created_at: string | null;
}

/** Normalize a raw update row into the camelCase {@link CampaignUpdate}. */
function mapRowToCampaignUpdate(row: CampaignUpdateRow): CampaignUpdate {
  return {
    id: row.id,
    campaignId: row.campaign_id,
    title: row.title ?? "",
    body: row.body ?? "",
    createdAt: row.created_at ?? "",
  };
}

/**
 * Fetch the update feed for a campaign, newest first. Consumed by
 * CampaignUpdates.tsx on the public detail page.
 */
export async function getCampaignUpdates(
  campaignId: string
): Promise<CampaignUpdate[]> {
  const { data, error } = await supabase
    .from("campaign_updates")
    .select("id, campaign_id, title, body, created_at")
    .eq("campaign_id", campaignId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as CampaignUpdateRow[]).map(mapRowToCampaignUpdate);
}

/** Input for {@link createCampaignUpdate}, matching PostUpdateDialog.tsx. */
export interface CreateCampaignUpdateInput {
  campaignId: string;
  title: string;
  body: string;
}

/**
 * Insert a new update for a campaign and return the normalized record. RLS
 * enforces that only the campaign owner may post updates.
 */
export async function createCampaignUpdate(
  input: CreateCampaignUpdateInput
): Promise<CampaignUpdate> {
  const { data, error } = await supabase
    .from("campaign_updates")
    .insert({
      campaign_id: input.campaignId,
      title: input.title,
      body: input.body,
    })
    .select("id, campaign_id, title, body, created_at")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapRowToCampaignUpdate(data as CampaignUpdateRow);
}

// ─────────────────────────────────────────────────────────────────────────────
// Media upload
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Upload a media file for a campaign to Supabase Storage and return its public
 * URL. Consumed by MediaUploader.tsx. Files are namespaced by campaign id when
 * available, otherwise by the signed-in user's id, to keep the bucket tidy and
 * RLS-friendly.
 */
export async function uploadCampaignMedia(
  file: File,
  campaignId?: string
): Promise<string> {
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr) {
    throw new Error(userErr.message);
  }
  const userId = userData.user?.id;
  if (!userId) {
    throw new Error("You must be signed in to upload media.");
  }

  const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  const prefix = campaignId ? `campaigns/${campaignId}` : `users/${userId}`;
  const path = `${prefix}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}.${ext}`;

  const { error: uploadErr } = await supabase.storage
    .from(CAMPAIGN_MEDIA_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || undefined,
    });

  if (uploadErr) {
    throw new Error(uploadErr.message);
  }

  const { data: publicData } = supabase.storage
    .from(CAMPAIGN_MEDIA_BUCKET)
    .getPublicUrl(path);

  return publicData.publicUrl;
}

// ─────────────────────────────────────────────────────────────────────────────
// Publish / status
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Publish a campaign by transitioning its status to `active`. RLS restricts
 * this to the campaign owner. Used by both the create flow and the
 * draft→active transition in the edit flow.
 */
export async function publishCampaign(campaignId: string): Promise<void> {
  const { error } = await supabase
    .from("campaigns")
    .update({ status: "active", updated_at: new Date().toISOString() })
    .eq("id", campaignId);

  if (error) {
    throw new Error(error.message);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Bank details (secure — routed through Edge function)
// ─────────────────────────────────────────────────────────────────────────────

/** Input for {@link saveBankDetails}, mirroring the Bank Details wizard step. */
export interface SaveBankDetailsInput {
  campaignId: string;
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  routingNumber?: string;
  swiftBic?: string;
  country: string;
}

/**
 * Securely persist a campaign's disbursement bank details. Per the project's
 * secure-bank-details constraint, the raw account number is NEVER written from
 * the client directly — the payload is handed to the `save-bank-details` Edge
 * function, which encrypts/masks and stores it server-side.
 */
export async function saveBankDetails(
  input: SaveBankDetailsInput
): Promise<void> {
  const { error } = await supabase.functions.invoke("save-bank-details", {
    body: {
      campaignId: input.campaignId,
      accountHolderName: input.accountHolderName,
      bankName: input.bankName,
      accountNumber: input.accountNumber,
      routingNumber: input.routingNumber,
      swiftBic: input.swiftBic,
      country: input.country,
    },
  });

  if (error) {
    throw new Error(error.message);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Update editable campaign fields
// ─────────────────────────────────────────────────────────────────────────────

/** Patch surface for {@link updateCampaign} — all fields optional. */
export interface UpdateCampaignInput {
  title?: string;
  description?: string;
  category?: string;
  targetAudience?: string;
  longDescription?: string;
  story?: string;
  coverImageUrl?: string;
  mediaUrls?: string[];
  goalAmount?: number;
  currency?: string;
  deadline?: string;
  donorWallEnabled?: boolean;
}

/**
 * Patch editable columns on a campaign and return the normalized {@link Campaign}.
 * Only provided keys are sent; camelCase inputs are mapped to snake_case columns.
 * RLS enforces that only the owner may update.
 */
export async function updateCampaign(
  campaignId: string,
  patch: UpdateCampaignInput
): Promise<Campaign> {
  // Map camelCase patch keys to snake_case DB columns, omitting undefined.
  const row: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (patch.title !== undefined) row.title = patch.title;
  if (patch.description !== undefined) row.description = patch.description;
  if (patch.category !== undefined) row.category = patch.category;
  if (patch.targetAudience !== undefined)
    row.target_audience = patch.targetAudience;
  if (patch.longDescription !== undefined)
    row.long_description = patch.longDescription;
  if (patch.story !== undefined) row.story = patch.story;
  if (patch.coverImageUrl !== undefined)
    row.cover_image_url = patch.coverImageUrl;
  if (patch.mediaUrls !== undefined) row.media_urls = patch.mediaUrls;
  if (patch.goalAmount !== undefined) row.goal = patch.goalAmount;
  if (patch.currency !== undefined) row.currency = patch.currency;
  if (patch.deadline !== undefined) row.deadline = patch.deadline;
  if (patch.donorWallEnabled !== undefined)
    row.donor_wall_enabled = patch.donorWallEnabled;

  const { data, error } = await supabase
    .from("campaigns")
    .update(row)
    .eq("id", campaignId)
    .select(CAMPAIGN_COLUMNS_FULL)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapRowToCampaign(data as CampaignRow);
}
