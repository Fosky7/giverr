// supabase/functions/campaigns-list/index.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

type SortOption =
  | "newest"
  | "oldest"
  | "goal_desc"
  | "goal_asc"
  | "raised_desc"
  | "raised_asc"
  | "ending_soon"
  | "title";

interface CampaignRow {
  [key: string]: unknown;
  id?: string;
  slug?: string;
  title?: string;
  summary?: string;
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

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 12;
const MAX_PAGE_SIZE = 50;
const DEFAULT_SORT: SortOption = "newest";

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

function parsePositiveInt(value: string | null, fallback: number, max?: number): number {
  if (!value) return fallback;

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;

  return typeof max === "number" ? Math.min(parsed, max) : parsed;
}

function normalizeText(value: string | null, maxLength = 120): string | null {
  if (!value) return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  return trimmed.slice(0, maxLength);
}

function normalizeSort(value: string | null): SortOption {
  const allowed = new Set<SortOption>([
    "newest",
    "oldest",
    "goal_desc",
    "goal_asc",
    "raised_desc",
    "raised_asc",
    "ending_soon",
    "title",
  ]);

  return allowed.has(value as SortOption) ? (value as SortOption) : DEFAULT_SORT;
}

function isOwnerScopedQuery(searchParams: URLSearchParams): boolean {
  const mine = searchParams.get("mine")?.toLowerCase();
  const owner = searchParams.get("owner")?.toLowerCase();
  const scope = searchParams.get("scope")?.toLowerCase();

  return mine === "true" || mine === "1" || owner === "me" || scope === "mine" || scope === "owner";
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

function toCampaignSummary(row: CampaignRow) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
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
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      console.error("Missing Supabase environment variables for campaigns-list");
      return jsonResponse({ error: "Server configuration error" }, { status: 500 });
    }

    const url = new URL(req.url);
    const searchParams = url.searchParams;
    const page = parsePositiveInt(searchParams.get("react-router-dom"), DEFAULT_PAGE);
    const pageSize = parsePositiveInt(searchParams.get("pageSize"), DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const category = normalizeText(searchParams.get("category"));
    const requestedStatus = normalizeText(searchParams.get("status"), 40)?.toLowerCase() ?? null;
    const search = normalizeText(searchParams.get("search"), 100);
    const sort = normalizeSort(searchParams.get("sort"));
    const ownerScoped = isOwnerScopedQuery(searchParams);

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

    if (ownerScoped && !userId) {
      return jsonResponse({ error: "Authentication required for owner-scoped campaign queries" }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Query rows with the service role, then explicitly sanitize output. This keeps owner queries
    // reliable under RLS while ensuring private fields such as story/evidence/owner_id are not returned.
    let query = supabase.from("campaigns").select("*", { count: "exact" });

    if (ownerScoped && userId) {
      query = query.eq("owner_id", userId);
      if (requestedStatus && requestedStatus !== "all") {
        query = query.eq("status", requestedStatus);
      }
    } else {
      // Public and non-owner authenticated list requests only expose published campaigns.
      query = query.eq("status", "published");
    }

    if (category) {
      query = query.eq("category", category);
    }

    if (search) {
      const escapedSearch = search.replaceAll("%", "\\%").replaceAll("_", "\\_");
      query = query.or(
        `title.ilike.%${escapedSearch}%,summary.ilike.%${escapedSearch}%,location.ilike.%${escapedSearch}%`,
      );
    }

    switch (sort) {
      case "oldest":
        query = query.order("created_at", { ascending: true });
        break;
      case "goal_desc":
        query = query.order("goal_amount", { ascending: false }).order("created_at", { ascending: false });
        break;
      case "goal_asc":
        query = query.order("goal_amount", { ascending: true }).order("created_at", { ascending: false });
        break;
      case "raised_desc":
        query = query.order("raised_amount", { ascending: false }).order("created_at", { ascending: false });
        break;
      case "raised_asc":
        query = query.order("raised_amount", { ascending: true }).order("created_at", { ascending: false });
        break;
      case "ending_soon":
        query = query.order("ends_at", { ascending: true, nullsFirst: false }).order("created_at", { ascending: false });
        break;
      case "title":
        query = query.order("title", { ascending: true });
        break;
      case "newest":
      default:
        query = query.order("created_at", { ascending: false });
        break;
    }

    const { data, error, count } = await query.range(from, to);

    if (error) {
      console.error("campaigns-list query failed", error);
      return jsonResponse({ error: "Unable to list campaigns" }, { status: 500 });
    }

    const campaigns = (data ?? []).map((row) => toCampaignSummary(row as CampaignRow));

    return jsonResponse({
      data: campaigns,
      pagination: {
        page,
        pageSize,
        total: count ?? campaigns.length,
        totalPages: count === null || typeof count === "undefined" ? null : Math.ceil(count / pageSize),
      },
      filters: {
        category,
        status: ownerScoped ? requestedStatus ?? "all" : "published",
        search,
        sort,
        ownerScoped,
      },
    });
  } catch (error) {
    console.error("Unexpected campaigns-list error", error);
    return jsonResponse({ error: "Unexpected server error" }, { status: 500 });
  }
});
