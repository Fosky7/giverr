// supabase/functions/campaigns-create/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

type CampaignStatus = "draft" | "submitted";

interface CampaignCreatePayload {
  title?: unknown;
  summary?: unknown;
  story?: unknown;
  category?: unknown;
  beneficiary_type?: unknown;
  goal_amount?: unknown;
  currency?: unknown;
  location?: unknown;
  timeline?: unknown;
  starts_at?: unknown;
  ends_at?: unknown;
  start_date?: unknown;
  end_date?: unknown;
  image_url?: unknown;
  cover_image_url?: unknown;
  status?: unknown;
  submit?: unknown;
}

interface TimelinePayload {
  starts_at?: unknown;
  ends_at?: unknown;
  start_date?: unknown;
  end_date?: unknown;
}

interface ValidationResult<T> {
  value?: T;
  errors: Record<string, string>;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

const BENEFICIARY_TYPES = new Set(["individual", "family", "community", "ngo", "nonprofit", "organization"]);
const CAMPAIGN_STATUSES = new Set<CampaignStatus>(["draft", "submitted"]);
const MAX_GOAL_AMOUNT = 100_000_000;

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
      ...(init.headers ?? {}),
    },
  });
}

function normalizeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeDateInput(value: unknown): string {
  const text = normalizeString(value);
  if (!text) return "";

  const date = new Date(text);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function normalizeCurrency(value: unknown): string {
  return normalizeString(value).toUpperCase();
}

function parseGoalAmount(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number.parseFloat(value);
  return Number.NaN;
}

function getTimeline(payload: CampaignCreatePayload): TimelinePayload {
  if (payload.timeline && typeof payload.timeline === "object" && !Array.isArray(payload.timeline)) {
    return payload.timeline as TimelinePayload;
  }

  return {
    starts_at: payload.starts_at ?? payload.start_date,
    ends_at: payload.ends_at ?? payload.end_date,
  };
}

function validatePayload(payload: CampaignCreatePayload): ValidationResult<{
  title: string;
  summary: string;
  story: string;
  category: string;
  beneficiary_type: string;
  goal_amount: number;
  currency: string;
  location: string;
  starts_at: string;
  ends_at: string;
  image_url: string | null;
  status: CampaignStatus;
}> {
  const errors: Record<string, string> = {};

  const title = normalizeString(payload.title);
  if (title.length < 5 || title.length > 120) {
    errors.title = "Title must be between 5 and 120 characters.";
  }

  const summary = normalizeString(payload.summary);
  if (summary.length < 20 || summary.length > 280) {
    errors.summary = "Summary must be between 20 and 280 characters.";
  }

  const story = normalizeString(payload.story);
  if (story.length < 50 || story.length > 10000) {
    errors.story = "Story must be between 50 and 10,000 characters.";
  }

  const category = normalizeString(payload.category);
  if (category.length < 2 || category.length > 80) {
    errors.category = "Category must be between 2 and 80 characters.";
  }

  const beneficiaryType = normalizeString(payload.beneficiary_type).toLowerCase();
  if (!BENEFICIARY_TYPES.has(beneficiaryType)) {
    errors.beneficiary_type = "Beneficiary type must be one of: individual, family, community, ngo, nonprofit, organization.";
  }

  const goalAmount = parseGoalAmount(payload.goal_amount);
  if (!Number.isFinite(goalAmount) || goalAmount <= 0 || goalAmount > MAX_GOAL_AMOUNT) {
    errors.goal_amount = "Goal amount must be greater than 0 and no more than 100,000,000.";
  }

  const currency = normalizeCurrency(payload.currency);
  if (!/^[A-Z]{3}$/.test(currency)) {
    errors.currency = "Currency must be a valid three-letter ISO currency code.";
  }

  const location = normalizeString(payload.location);
  if (location.length < 2 || location.length > 160) {
    errors.location = "Location must be between 2 and 160 characters.";
  }

  const timeline = getTimeline(payload);
  const startsAt = normalizeDateInput(timeline.starts_at ?? timeline.start_date);
  const endsAt = normalizeDateInput(timeline.ends_at ?? timeline.end_date);

  if (!startsAt) {
    errors.starts_at = "Timeline start date is required and must be a valid date.";
  }

  if (!endsAt) {
    errors.ends_at = "Timeline end date is required and must be a valid date.";
  }

  if (startsAt && endsAt) {
    const start = new Date(startsAt).getTime();
    const end = new Date(endsAt).getTime();

    if (end <= start) {
      errors.ends_at = "Timeline end date must be after the start date.";
    }
  }

  const requestedStatus = normalizeString(payload.status).toLowerCase();
  const status: CampaignStatus = CAMPAIGN_STATUSES.has(requestedStatus as CampaignStatus)
    ? (requestedStatus as CampaignStatus)
    : payload.submit === true
      ? "submitted"
      : "draft";

  const imageUrl = normalizeString(payload.image_url ?? payload.cover_image_url);
  if (imageUrl && !/^https?:\/\//i.test(imageUrl)) {
    errors.image_url = "Image URL must be an absolute http(s) URL.";
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  return {
    errors,
    value: {
      title,
      summary,
      story,
      category,
      beneficiary_type: beneficiaryType,
      goal_amount: Math.round(goalAmount * 100) / 100,
      currency,
      location,
      starts_at: startsAt,
      ends_at: endsAt,
      image_url: imageUrl || null,
      status,
    },
  };
}

function slugify(title: string): string {
  const slug = title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 72)
    .replace(/-+$/g, "");

  return slug || "campaign";
}

function shortSuffix(): string {
  const bytes = new Uint8Array(4);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(36).padStart(2, "0")).join("").slice(0, 8);
}

function isUniqueViolation(error: { code?: string; message?: string } | null): boolean {
  return error?.code === "23505" || /duplicate key|unique/i.test(error?.message ?? "");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      console.error("Missing Supabase environment variables for campaigns-create");
      return jsonResponse({ error: "Server configuration error" }, { status: 500 });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Authentication required" }, { status: 401 });
    }

    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: userData, error: authError } = await authClient.auth.getUser();
    const user = userData.user;

    if (authError || !user) {
      return jsonResponse({ error: "Invalid or expired session" }, { status: 401 });
    }

    let payload: CampaignCreatePayload;
    try {
      payload = (await req.json()) as CampaignCreatePayload;
    } catch {
      return jsonResponse({ error: "Request body must be valid JSON" }, { status: 400 });
    }

    const validation = validatePayload(payload);
    if (!validation.value) {
      return jsonResponse({ error: "Validation failed", fields: validation.errors }, { status: 422 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const baseSlug = slugify(validation.value.title);
    let lastError: { code?: string; message?: string } | null = null;

    for (let attempt = 0; attempt < 4; attempt += 1) {
      const slug = `${baseSlug}-${shortSuffix()}`;

      const insertPayload = {
        owner_id: user.id,
        slug,
        title: validation.value.title,
        summary: validation.value.summary,
        story: validation.value.story,
        category: validation.value.category,
        beneficiary_type: validation.value.beneficiary_type,
        goal_amount: validation.value.goal_amount,
        currency: validation.value.currency,
        location: validation.value.location,
        starts_at: validation.value.starts_at,
        ends_at: validation.value.ends_at,
        image_url: validation.value.image_url,
        status: validation.value.status,
      };

      const { data, error } = await supabase
        .from("campaigns")
        .insert(insertPayload)
        .select("id, slug, status")
        .single();

      if (!error && data) {
        return jsonResponse({ data }, { status: 201 });
      }

      lastError = error;
      if (!isUniqueViolation(error)) {
        console.error("campaigns-create insert failed", error);
        return jsonResponse({ error: "Unable to create campaign" }, { status: 500 });
      }
    }

    console.error("campaigns-create slug collision retries exhausted", lastError);
    return jsonResponse({ error: "Unable to generate a unique campaign slug" }, { status: 409 });
  } catch (error) {
    console.error("Unexpected campaigns-create error", error);
    return jsonResponse({ error: "Unexpected server error" }, { status: 500 });
  }
});
