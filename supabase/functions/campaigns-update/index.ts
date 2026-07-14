// supabase/functions/campaigns-update/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { handleCorsPreflight } from "../_shared/cors.ts";
import { errorResponse, jsonResponse } from "../_shared/responses.ts";

type CampaignStatus = "draft" | "submitted" | "published" | "paused" | "completed" | "rejected";

type MutableCampaignField =
  | "title"
  | "summary"
  | "story"
  | "category"
  | "beneficiary_type"
  | "goal_amount"
  | "currency"
  | "location"
  | "cover_image_url"
  | "evidence_urls"
  | "starts_at"
  | "ends_at";

interface CampaignRow {
  id: string;
  owner_id: string;
  title: string;
  slug: string;
  summary: string;
  story: string;
  category: string;
  beneficiary_type: string;
  goal_amount: number | string;
  raised_amount?: number | string;
  currency: string;
  location: string | null;
  status: CampaignStatus;
  cover_image_url: string | null;
  evidence_urls: unknown;
  starts_at: string | null;
  ends_at: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

interface UpdateRequestBody extends Record<string, unknown> {
  id?: unknown;
  campaign_id?: unknown;
  campaignId?: unknown;
  slug?: unknown;
  updates?: unknown;
  submit_for_review?: unknown;
  submitForReview?: unknown;
  status?: unknown;
}

interface ValidatedUpdate {
  values: Partial<Record<MutableCampaignField, unknown>>;
  nextStatus?: CampaignStatus;
}

const MUTABLE_FIELDS = new Set<MutableCampaignField>([
  "title",
  "summary",
  "story",
  "category",
  "beneficiary_type",
  "goal_amount",
  "currency",
  "location",
  "cover_image_url",
  "evidence_urls",
  "starts_at",
  "ends_at",
]);

const ALLOWED_TOP_LEVEL_FIELDS = new Set([
  "id",
  "campaign_id",
  "campaignId",
  "slug",
  "updates",
  "submit_for_review",
  "submitForReview",
  "status",
  "title",
  "summary",
  "story",
  "category",
  "beneficiary_type",
  "beneficiaryType",
  "goal_amount",
  "goalAmount",
  "currency",
  "location",
  "cover_image_url",
  "coverImageUrl",
  "evidence_urls",
  "evidenceUrls",
  "starts_at",
  "startsAt",
  "ends_at",
  "endsAt",
]);

const CAMEL_TO_SNAKE_FIELD_MAP: Record<string, MutableCampaignField> = {
  beneficiaryType: "beneficiary_type",
  goalAmount: "goal_amount",
  coverImageUrl: "cover_image_url",
  evidenceUrls: "evidence_urls",
  startsAt: "starts_at",
  endsAt: "ends_at",
};

const IMMUTABLE_OR_SERVER_MANAGED_FIELDS = new Set([
  "owner_id",
  "ownerId",
  "slug",
  "raised_amount",
  "raisedAmount",
  "published_at",
  "publishedAt",
  "created_at",
  "createdAt",
  "updated_at",
  "updatedAt",
  "donor_count",
  "donorCount",
]);

const EDITABLE_STATUSES = new Set<CampaignStatus>(["draft", "submitted"]);
const MAX_GOAL_AMOUNT = 100_000_000;
const MAX_EVIDENCE_URLS = 12;

function getSupabaseEnv(): { supabaseUrl: string; anonKey: string; serviceRoleKey: string } | Response {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    console.error("Missing Supabase environment variables for campaigns-update");
    return errorResponse("Server configuration error", {
      status: 500,
      code: "SERVER_CONFIGURATION_ERROR",
    });
  }

  return { supabaseUrl, anonKey, serviceRoleKey };
}

function normalizeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeNullableString(value: unknown): string | null {
  if (value === null) return null;
  const normalized = normalizeString(value);
  return normalized.length > 0 ? normalized : null;
}

function normalizeDate(value: unknown, fieldName: string, errors: Record<string, string>): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;

  const text = normalizeString(value);
  const date = new Date(text);

  if (!text || Number.isNaN(date.getTime())) {
    errors[fieldName] = `${fieldName} must be a valid date or null.`;
    return undefined;
  }

  return date.toISOString();
}

function normalizeCurrency(value: unknown, errors: Record<string, string>): string | undefined {
  if (value === undefined) return undefined;

  const currency = normalizeString(value).toUpperCase();

  if (!/^[A-Z]{3}$/.test(currency)) {
    errors.currency = "Currency must be a valid three-letter ISO currency code.";
    return undefined;
  }

  return currency;
}

function normalizeGoalAmount(value: unknown, errors: Record<string, string>): number | undefined {
  if (value === undefined) return undefined;

  const amount = typeof value === "number" ? value : typeof value === "string" ? Number.parseFloat(value) : Number.NaN;

  if (!Number.isFinite(amount) || amount <= 0 || amount > MAX_GOAL_AMOUNT) {
    errors.goal_amount = "Goal amount must be greater than 0 and no more than 100,000,000.";
    return undefined;
  }

  return Math.round(amount * 100) / 100;
}

function normalizeAbsoluteUrl(value: unknown, fieldName: string, errors: Record<string, string>): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;

  const url = normalizeString(value);

  if (!/^https?:\/\//i.test(url)) {
    errors[fieldName] = `${fieldName} must be an absolute http(s) URL or null.`;
    return undefined;
  }

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      errors[fieldName] = `${fieldName} must use http or https.`;
      return undefined;
    }
  } catch {
    errors[fieldName] = `${fieldName} must be a valid URL.`;
    return undefined;
  }

  return url;
}

function normalizeEvidenceUrls(value: unknown, errors: Record<string, string>): string[] | undefined {
  if (value === undefined) return undefined;

  if (!Array.isArray(value)) {
    errors.evidence_urls = "Evidence URLs must be an array of absolute http(s) URLs.";
    return undefined;
  }

  if (value.length > MAX_EVIDENCE_URLS) {
    errors.evidence_urls = `Evidence URLs cannot include more than ${MAX_EVIDENCE_URLS} items.`;
    return undefined;
  }

  const urls: string[] = [];

  value.forEach((item, index) => {
    const normalized = normalizeAbsoluteUrl(item, `evidence_urls[${index}]`, errors);
    if (typeof normalized === "string") {
      urls.push(normalized);
    }
  });

  return urls;
}

function normalizeInputObject(body: UpdateRequestBody): Record<string, unknown> {
  const nestedUpdates = body.updates && typeof body.updates === "object" && !Array.isArray(body.updates)
    ? (body.updates as Record<string, unknown>)
    : {};

  return {
    ...body,
    ...nestedUpdates,
  };
}

function extractIdentifier(req: Request, body: UpdateRequestBody): { column: "id" | "slug"; value: string } | null {
  const url = new URL(req.url);
  const queryId = normalizeString(url.searchParams.get("id"));
  const querySlug = normalizeString(url.searchParams.get("slug"));
  const bodyId = normalizeString(body.id ?? body.campaign_id ?? body.campaignId);
  const bodySlug = normalizeString(body.slug);

  if (queryId) return { column: "id", value: queryId };
  if (bodyId) return { column: "id", value: bodyId };
  if (querySlug) return { column: "slug", value: querySlug };
  if (bodySlug) return { column: "slug", value: bodySlug };

  return null;
}

function validateUnsupportedFields(input: Record<string, unknown>, errors: Record<string, string>): void {
  for (const key of Object.keys(input)) {
    if (IMMUTABLE_OR_SERVER_MANAGED_FIELDS.has(key)) {
      errors[key] = `${key} is server-managed and cannot be updated by campaign owners.`;
      continue;
    }

    if (!ALLOWED_TOP_LEVEL_FIELDS.has(key)) {
      errors[key] = `${key} is not a supported campaign update field.`;
    }
  }
}

function readField(input: Record<string, unknown>, snakeCaseField: MutableCampaignField): unknown {
  if (snakeCaseField in input) {
    return input[snakeCaseField];
  }

  const camelEntry = Object.entries(CAMEL_TO_SNAKE_FIELD_MAP).find(([, mapped]) => mapped === snakeCaseField);
  return camelEntry ? input[camelEntry[0]] : undefined;
}

function validateUpdate(body: UpdateRequestBody, currentCampaign: CampaignRow): ValidatedUpdate | { errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const input = normalizeInputObject(body);
  const values: Partial<Record<MutableCampaignField, unknown>> = {};

  validateUnsupportedFields(input, errors);

  const title = readField(input, "title");
  if (title !== undefined) {
    const normalized = normalizeString(title);
    if (normalized.length < 5 || normalized.length > 120) {
      errors.title = "Title must be between 5 and 120 characters.";
    } else {
      values.title = normalized;
    }
  }

  const summary = readField(input, "summary");
  if (summary !== undefined) {
    const normalized = normalizeString(summary);
    if (normalized.length < 20 || normalized.length > 280) {
      errors.summary = "Summary must be between 20 and 280 characters.";
    } else {
      values.summary = normalized;
    }
  }

  const story = readField(input, "story");
  if (story !== undefined) {
    const normalized = normalizeString(story);
    if (normalized.length < 50 || normalized.length > 10_000) {
      errors.story = "Story must be between 50 and 10,000 characters.";
    } else {
      values.story = normalized;
    }
  }

  const category = readField(input, "category");
  if (category !== undefined) {
    const normalized = normalizeString(category).toLowerCase();
    if (normalized.length < 2 || normalized.length > 80) {
      errors.category = "Category must be between 2 and 80 characters.";
    } else {
      values.category = normalized;
    }
  }

  const beneficiaryType = readField(input, "beneficiary_type");
  if (beneficiaryType !== undefined) {
    const normalized = normalizeString(beneficiaryType).toLowerCase();
    if (normalized.length < 2 || normalized.length > 80) {
      errors.beneficiary_type = "Beneficiary type must be between 2 and 80 characters.";
    } else {
      values.beneficiary_type = normalized;
    }
  }

  const goalAmount = normalizeGoalAmount(readField(input, "goal_amount"), errors);
  if (goalAmount !== undefined) values.goal_amount = goalAmount;

  const currency = normalizeCurrency(readField(input, "currency"), errors);
  if (currency !== undefined) values.currency = currency;

  const location = readField(input, "location");
  if (location !== undefined) {
    const normalized = normalizeNullableString(location);
    if (normalized !== null && (normalized.length < 2 || normalized.length > 160)) {
      errors.location = "Location must be between 2 and 160 characters when provided.";
    } else {
      values.location = normalized;
    }
  }

  const coverImageUrl = normalizeAbsoluteUrl(readField(input, "cover_image_url"), "cover_image_url", errors);
  if (coverImageUrl !== undefined) values.cover_image_url = coverImageUrl;

  const evidenceUrls = normalizeEvidenceUrls(readField(input, "evidence_urls"), errors);
  if (evidenceUrls !== undefined) values.evidence_urls = evidenceUrls;

  const startsAt = normalizeDate(readField(input, "starts_at"), "starts_at", errors);
  if (startsAt !== undefined) values.starts_at = startsAt;

  const endsAt = normalizeDate(readField(input, "ends_at"), "ends_at", errors);
  if (endsAt !== undefined) values.ends_at = endsAt;

  const effectiveStartsAt = (values.starts_at as string | null | undefined) ?? currentCampaign.starts_at;
  const effectiveEndsAt = (values.ends_at as string | null | undefined) ?? currentCampaign.ends_at;

  if (effectiveStartsAt && effectiveEndsAt) {
    const startTime = new Date(effectiveStartsAt).getTime();
    const endTime = new Date(effectiveEndsAt).getTime();

    if (Number.isFinite(startTime) && Number.isFinite(endTime) && endTime <= startTime) {
      errors.ends_at = "Campaign end date must be after the start date.";
    }
  }

  const requestedStatus = normalizeString(input.status).toLowerCase();
  const submitForReview = input.submit_for_review === true || input.submitForReview === true || requestedStatus === "submitted";
  let nextStatus: CampaignStatus | undefined;

  if (submitForReview) {
    if (currentCampaign.status !== "draft") {
      errors.status = "Only draft campaigns can be submitted for review.";
    } else {
      nextStatus = "submitted";
    }
  } else if (requestedStatus && requestedStatus !== currentCampaign.status) {
    errors.status = "Campaign owners can only change status by submitting a draft for review.";
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  return { values, nextStatus };
}

function toCampaignSummary(row: CampaignRow) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    category: row.category,
    beneficiary_type: row.beneficiary_type,
    goal_amount: Number(row.goal_amount),
    raised_amount: Number(row.raised_amount ?? 0),
    currency: row.currency,
    location: row.location,
    status: row.status,
    cover_image_url: row.cover_image_url,
    starts_at: row.starts_at,
    ends_at: row.ends_at,
    published_at: row.published_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

Deno.serve(async (req) => {
  const preflight = handleCorsPreflight(req);
  if (preflight) return preflight;

  if (req.method !== "PATCH" && req.method !== "POST") {
    return errorResponse("Method not allowed", {
      request: req,
      status: 405,
      code: "METHOD_NOT_ALLOWED",
      headers: { Allow: "PATCH, POST, OPTIONS" },
    });
  }

  const env = getSupabaseEnv();
  if (env instanceof Response) return env;

  try {
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      return errorResponse("Authentication required", {
        request: req,
        status: 401,
        code: "AUTHENTICATION_REQUIRED",
      });
    }

    const authClient = createClient(env.supabaseUrl, env.anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: userData, error: authError } = await authClient.auth.getUser();

    if (authError || !userData.user) {
      return errorResponse("Invalid or expired session", {
        request: req,
        status: 401,
        code: "INVALID_SESSION",
      });
    }

    let body: UpdateRequestBody;
    try {
      body = (await req.json()) as UpdateRequestBody;
    } catch {
      return errorResponse("Request body must be valid JSON", {
        request: req,
        status: 400,
        code: "INVALID_JSON",
      });
    }

    const identifier = extractIdentifier(req, body);

    if (!identifier) {
      return errorResponse("Campaign id or slug is required", {
        request: req,
        status: 400,
        code: "CAMPAIGN_IDENTIFIER_REQUIRED",
      });
    }

    const supabase = createClient(env.supabaseUrl, env.serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: campaign, error: fetchError } = await supabase
      .from("campaigns")
      .select("*")
      .eq(identifier.column, identifier.value)
      .maybeSingle();

    if (fetchError) {
      console.error("campaigns-update fetch failed", fetchError);
      return errorResponse("Unable to retrieve campaign", {
        request: req,
        status: 500,
        code: "CAMPAIGN_FETCH_FAILED",
      });
    }

    if (!campaign) {
      return errorResponse("Campaign not found", {
        request: req,
        status: 404,
        code: "CAMPAIGN_NOT_FOUND",
      });
    }

    const currentCampaign = campaign as CampaignRow;

    if (currentCampaign.owner_id !== userData.user.id) {
      // Use a generic not-found response to avoid leaking private campaign existence.
      return errorResponse("Campaign not found", {
        request: req,
        status: 404,
        code: "CAMPAIGN_NOT_FOUND",
      });
    }

    const validation = validateUpdate(body, currentCampaign);

    if ("errors" in validation) {
      return errorResponse("Validation failed", {
        request: req,
        status: 422,
        code: "VALIDATION_FAILED",
        details: validation.errors,
      });
    }

    const hasEditableFieldUpdates = Object.keys(validation.values).some((key) => MUTABLE_FIELDS.has(key as MutableCampaignField));
    const hasStatusUpdate = Boolean(validation.nextStatus);

    if (!hasEditableFieldUpdates && !hasStatusUpdate) {
      return jsonResponse(
        {
          data: toCampaignSummary(currentCampaign),
          meta: { unchanged: true },
        },
        { request: req, status: 200 },
      );
    }

    if (!EDITABLE_STATUSES.has(currentCampaign.status)) {
      return errorResponse("Campaign content can only be updated while it is draft or submitted.", {
        request: req,
        status: 409,
        code: "CAMPAIGN_STATUS_LOCKED",
      });
    }

    const updatePayload: Record<string, unknown> = {
      ...validation.values,
      ...(validation.nextStatus ? { status: validation.nextStatus } : {}),
    };

    const { data: updatedCampaign, error: updateError } = await supabase
      .from("campaigns")
      .update(updatePayload)
      .eq("id", currentCampaign.id)
      .select("*")
      .single();

    if (updateError || !updatedCampaign) {
      console.error("campaigns-update update failed", updateError);
      return errorResponse("Unable to update campaign", {
        request: req,
        status: 500,
        code: "CAMPAIGN_UPDATE_FAILED",
      });
    }

    return jsonResponse(
      {
        data: toCampaignSummary(updatedCampaign as CampaignRow),
        meta: {
          submitted_for_review: validation.nextStatus === "submitted",
        },
      },
      { request: req, status: 200 },
    );
  } catch (error) {
    console.error("Unexpected campaigns-update error", error);
    return errorResponse("Unexpected server error", {
      request: req,
      status: 500,
      code: "UNEXPECTED_SERVER_ERROR",
      details: error instanceof Error ? { message: error.message } : undefined,
    });
  }
});
