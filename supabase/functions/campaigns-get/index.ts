// supabase/functions/campaigns-get/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

interface CampaignRow {
  [key: string]: unknown;
  id?: string;
  owner_id?: string;
  slug?: string;
  title?: string;
  summary?: string;
  story?: string;
  category?: string;
  beneficiary_type?: string;
  goal_amount?: number | string;
  currency?: string;
  location?: string;
  status?: string;
  raised_amount?: number | string;
  current_amount?: number | string;
  amount_raised?: number | string;
  donor_count?: number | string;
  donors_count?: number | string;
  starts_at?: string | null;
  start_date?: string | null;
  ends_at?: string | null;
  end_date?: string | null;
  image_url?: string | null;
  cover_image_url?: string | null;
  created_at?: string;
  updated_at?: string;
  published_at?: string | null;
}

interface CampaignUpdateRow {
  [key: string]: unknown;
  id?: string;
  campaign_id?: string;
  title?: string;
  body?: string;
  content?: string;
  is_public?: boolean;
  created_at?: string;
  updated_at?: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

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

function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function toOptionalString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function extractIdentifier(reqUrl: string): { column: "id" | "slug"; value: string } | null {
  const url = new URL(reqUrl);
  const explicitId = url.searchParams.get("id")?.trim();
  const explicitSlug = url.searchParams.get("slug")?.trim();

  if (explicitId) return { column: "id", value: explicitId };
  if (explicitSlug) return { column: "slug", value: explicitSlug };

  // Supports path-like calls such as /functions/v1/campaigns-get/my-campaign-slug.
  const segments = url.pathname.split("/").filter(Boolean);
  const functionIndex = segments.lastIndexOf("campaigns-get");
  const pathIdentifier = functionIndex >= 0 ? segments[functionIndex + 1] : segments.at(-1);

  if (!pathIdentifier || pathIdentifier === "campaigns-get") return null;

  const decoded = decodeURIComponent(pathIdentifier).trim();
  if (!decoded) return null;

  return { column: isUuid(decoded) ? "id" : "slug", value: decoded };
}

function toCampaignDetail(row: CampaignRow, isOwner: boolean) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    story: row.story,
    category: row.category,
    beneficiary_type: row.beneficiary_type,
    goal_amount: toNumber(row.goal_amount),
    currency: row.currency,
    location: row.location,
    status: row.status,
    raised_amount: toNumber(row.raised_amount ?? row.current_amount ?? row.amount_raised),
    donor_count: toNumber(row.donor_count ?? row.donors_count),
    starts_at: toOptionalString(row.starts_at ?? row.start_date),
    ends_at: toOptionalString(row.ends_at ?? row.end_date),
    image_url: toOptionalString(row.image_url ?? row.cover_image_url),
    created_at: row.created_at,
    updated_at: row.updated_at,
    published_at: row.published_at,
    is_owner: isOwner,
  };
}

function toCampaignUpdate(row: CampaignUpdateRow, includeVisibility: boolean) {
  return {
    id: row.id,
    campaign_id: row.campaign_id,
    title: row.title,
    body: row.body ?? row.content,
    ...(includeVisibility ? { is_public: row.is_public } : {}),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "GET") {
    return jsonResponse({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const identifier = extractIdentifier(req.url);

    if (!identifier) {
      return jsonResponse({ error: "Campaign id or slug is required" }, { status: 400 });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      console.error("Missing Supabase environment variables for campaigns-get");
      return jsonResponse({ error: "Server configuration error" }, { status: 500 });
    }

    const authHeader = req.headers.get("Authorization") ?? "";
    let userId: string | null = null;

    if (authHeader) {
      const authClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
        auth: { persistSession: false, autoRefreshToken: false },
      });

      const { data } = await authClient.auth.getUser();
      userId = data.user?.id ?? null;
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: campaign, error } = await supabase
      .from("campaigns")
      .select("*")
      .eq(identifier.column, identifier.value)
      .maybeSingle();

    if (error) {
      console.error("campaigns-get query failed", error);
      return jsonResponse({ error: "Unable to retrieve campaign" }, { status: 500 });
    }

    if (!campaign) {
      return jsonResponse({ error: "Campaign not found" }, { status: 404 });
    }

    const campaignRow = campaign as CampaignRow;
    const isOwner = Boolean(userId && campaignRow.owner_id === userId);
    const isPublished = campaignRow.status === "published";

    // Return 404 for both missing and unauthorized private campaigns to avoid leaking existence.
    if (!isPublished && !isOwner) {
      return jsonResponse({ error: "Campaign not found" }, { status: 404 });
    }

    let updatesQuery = supabase
      .from("campaign_updates")
      .select("*")
      .eq("campaign_id", campaignRow.id)
      .order("created_at", { ascending: false });

    if (!isOwner) {
      updatesQuery = updatesQuery.eq("is_public", true);
    }

    const { data: updates, error: updatesError } = await updatesQuery;

    if (updatesError) {
      console.error("campaigns-get updates query failed", updatesError);
      return jsonResponse({ error: "Unable to retrieve campaign updates" }, { status: 500 });
    }

    return jsonResponse({
      data: {
        ...toCampaignDetail(campaignRow, isOwner),
        campaign_updates: (updates ?? []).map((row) => toCampaignUpdate(row as CampaignUpdateRow, isOwner)),
      },
    });
  } catch (error) {
    console.error("Unexpected campaigns-get error", error);
    return jsonResponse({ error: "Unexpected server error" }, { status: 500 });
  }
});
