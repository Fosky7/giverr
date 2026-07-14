import { supabase } from "@/integrations/supabase/client";
import type { Campaign, CampaignFiltersState, CampaignFormValues } from "../types";

export type CampaignIdentifier = string | { id: string; slug?: never } | { slug: string; id?: never };

export type CampaignApiFunctionName =
  | "campaigns-list"
  | "campaigns-get"
  | "campaigns-create"
  | "campaigns-update";

export interface CampaignApiErrorPayload {
  message?: string;
  code?: string;
  status?: number;
  details?: unknown;
  fields?: Record<string, string>;
}

export interface CampaignApiDetailUpdate {
  id: string;
  campaignId: string;
  title: string;
  body: string;
  isPublic: boolean;
  evidenceUrls: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CampaignApiDetail extends Campaign {
  updates: CampaignApiDetailUpdate[];
  evidenceUrls: string[];
  isOwner: boolean;
  publishedAt: string | null;
}

export class CampaignApiError extends Error {
  readonly code: string;
  readonly status?: number;
  readonly details?: unknown;
  readonly fields?: Record<string, string>;

  constructor(message: string, payload: CampaignApiErrorPayload = {}) {
    super(message);
    this.name = "CampaignApiError";
    this.code = payload.code ?? "CAMPAIGN_API_ERROR";
    this.status = payload.status;
    this.details = payload.details;
    this.fields = payload.fields;
  }
}

export type UpdateCampaignInput = Partial<CampaignFormValues> & {
  status?: string;
  submit?: boolean;
  submitForReview?: boolean;
  coverImageUrl?: string | null;
  evidenceUrls?: string[];
  startsAt?: string | null;
  endsAt?: string | null;
};

interface InvokeFunctionOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  query?: Record<string, string | number | boolean | null | undefined>;
  body?: unknown;
  headers?: Record<string, string>;
}

type UnknownRecord = Record<string, unknown>;

const DEFAULT_CURRENCY = "USD";

function readViteEnv(): Record<string, string | undefined> {
  return ((import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env ?? {}) as Record<
    string,
    string | undefined
  >;
}

function assertSupabaseEnvironment() {
  const env = readViteEnv();
  const url = env.VITE_SUPABASE_URL?.trim();
  const anonKey = env.VITE_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) {
    throw new CampaignApiError(
      "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY before using campaign APIs.",
      { code: "SUPABASE_CONFIGURATION_ERROR" },
    );
  }
}

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

function asNullableString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function asNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0).map((item) => item.trim());
}

function buildQueryString(query?: InvokeFunctionOptions["query"]): string {
  if (!query) {
    return "";
  }

  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value === null || typeof value === "undefined" || value === "") {
      return;
    }

    params.set(key, String(value));
  });

  const queryString = params.toString();
  return queryString ? `?${queryString}` : "";
}

async function readFunctionError(error: unknown): Promise<CampaignApiErrorPayload | null> {
  if (!isRecord(error)) {
    return null;
  }

  const context = error.context;

  if (context instanceof Response) {
    const status = context.status;

    try {
      const payload = (await context.clone().json()) as unknown;

      if (isRecord(payload)) {
        const nestedError = payload.error;

        if (isRecord(nestedError)) {
          return {
            message: asString(nestedError.message, asString(payload.message, context.statusText)),
            code: asString(nestedError.code, asString(payload.code, "FUNCTION_HTTP_ERROR")),
            status,
            details: nestedError.details ?? payload.details,
            fields: isRecord(payload.fields) ? (payload.fields as Record<string, string>) : undefined,
          };
        }

        return {
          message: asString(payload.message, asString(payload.error, context.statusText)),
          code: asString(payload.code, "FUNCTION_HTTP_ERROR"),
          status,
          details: payload.details,
          fields: isRecord(payload.fields) ? (payload.fields as Record<string, string>) : undefined,
        };
      }
    } catch {
      return {
        message: context.statusText || "Campaign request failed.",
        code: "FUNCTION_HTTP_ERROR",
        status,
      };
    }
  }

  return null;
}

export function normalizeCampaignError(error: unknown): CampaignApiError {
  if (error instanceof CampaignApiError) {
    return error;
  }

  if (error instanceof Error) {
    return new CampaignApiError(error.message || "Unable to complete the campaign request.", {
      code: isRecord(error) ? asString(error.code, "CAMPAIGN_API_ERROR") : "CAMPAIGN_API_ERROR",
      details: error,
    });
  }

  if (isRecord(error)) {
    const nestedError = error.error;

    if (isRecord(nestedError)) {
      return new CampaignApiError(asString(nestedError.message, "Unable to complete the campaign request."), {
        code: asString(nestedError.code, "CAMPAIGN_API_ERROR"),
        status: typeof nestedError.status === "number" ? nestedError.status : typeof error.status === "number" ? error.status : undefined,
        details: nestedError.details,
        fields: isRecord(nestedError.fields) ? (nestedError.fields as Record<string, string>) : undefined,
      });
    }

    return new CampaignApiError(asString(error.message, asString(error.error, "Unable to complete the campaign request.")), {
      code: asString(error.code, "CAMPAIGN_API_ERROR"),
      status: typeof error.status === "number" ? error.status : undefined,
      details: error.details,
      fields: isRecord(error.fields) ? (error.fields as Record<string, string>) : undefined,
    });
  }

  return new CampaignApiError("Unable to complete the campaign request.");
}

function unwrapFunctionPayload<TData>(payload: unknown): TData {
  if (isRecord(payload)) {
    if (payload.success === false) {
      throw normalizeCampaignError(payload);
    }

    if (payload.success === true && "data" in payload) {
      return payload.data as TData;
    }

    // Current campaign Edge Functions return `{ data: ... }`. Preserve compatibility
    // with that shape while also supporting direct payloads from future functions.
    if ("data" in payload && !("campaign" in payload) && !("campaigns" in payload)) {
      return payload.data as TData;
    }
  }

  return payload as TData;
}

export async function invokeFunction<TData>(
  functionName: CampaignApiFunctionName,
  options: InvokeFunctionOptions = {},
): Promise<TData> {
  assertSupabaseEnvironment();

  const functionPath = `${functionName}${buildQueryString(options.query)}`;

  try {
    const { data, error } = await supabase.functions.invoke<unknown>(functionPath, {
      method: options.method ?? (options.body ? "POST" : "GET"),
      body: options.body,
      headers: options.headers,
    });

    if (error) {
      const parsedError = await readFunctionError(error);
      throw normalizeCampaignError(parsedError ?? error);
    }

    if (typeof data === "undefined" || data === null) {
      throw new CampaignApiError("Campaign API returned an empty response.", { code: "EMPTY_FUNCTION_RESPONSE" });
    }

    return unwrapFunctionPayload<TData>(data);
  } catch (error) {
    throw normalizeCampaignError(error);
  }
}

function normalizeStatus(status: unknown): Campaign["status"] {
  const value = asString(status, "draft").toLowerCase();

  // The database uses submitted/published/rejected while early UI scaffolding used
  // active/archived. These casts keep the wrapper compatible with both type sets.
  if (value === "published") {
    return "active" as Campaign["status"];
  }

  if (value === "submitted") {
    return "draft" as Campaign["status"];
  }

  if (value === "rejected") {
    return "archived" as Campaign["status"];
  }

  return value as Campaign["status"];
}

function statusToApiStatus(status: CampaignFiltersState["status"] | undefined): string | undefined {
  if (!status || status === "all") {
    return undefined;
  }

  if (status === "active") {
    return "published";
  }

  if (status === "archived") {
    return "rejected";
  }

  return status;
}

function normalizeOrganizerType(value: unknown): Campaign["organizer"]["type"] {
  const text = asString(value, "individual").toLowerCase();

  if (text === "ngo" || text === "nonprofit" || text === "organization") {
    return "ngo";
  }

  if (text === "community" || text === "family") {
    return "community";
  }

  return "individual";
}

function fallbackSlug(title: string): string {
  const slug = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  return slug || "campaign";
}

function toCampaign(row: unknown, fallback: Partial<Campaign> = {}): Campaign {
  if (!isRecord(row)) {
    throw new CampaignApiError("Campaign API returned an invalid campaign record.", { code: "INVALID_CAMPAIGN_PAYLOAD" });
  }

  const now = new Date().toISOString();
  const title = asString(row.title, fallback.title ?? "Untitled campaign");
  const beneficiaryType = asString(row.beneficiary_type ?? row.beneficiaryType, fallback.organizer?.type ?? "individual");
  const organizer = isRecord(row.organizer) ? row.organizer : undefined;

  return {
    id: asString(row.id, fallback.id ?? `campaign-${fallbackSlug(title)}`),
    title,
    slug: asString(row.slug, fallback.slug ?? fallbackSlug(title)),
    summary: asString(row.summary, fallback.summary ?? "Campaign summary pending."),
    story: asString(row.story, fallback.story ?? asString(row.summary, "Campaign story pending.")),
    category: asString(row.category, fallback.category ?? "other") as Campaign["category"],
    status: normalizeStatus(row.status ?? fallback.status),
    goalAmount: asNumber(row.goalAmount ?? row.goal_amount, fallback.goalAmount ?? 0),
    raisedAmount: asNumber(row.raisedAmount ?? row.raised_amount ?? row.current_amount ?? row.amount_raised, fallback.raisedAmount ?? 0),
    donorCount: asNumber(row.donorCount ?? row.donor_count ?? row.donors_count, fallback.donorCount ?? 0),
    currency: asString(row.currency, fallback.currency ?? DEFAULT_CURRENCY).toUpperCase(),
    location: asString(row.location, fallback.location ?? "Location pending"),
    beneficiaryName: asString(
      row.beneficiaryName ?? row.beneficiary_name ?? row.beneficiary ?? row.beneficiary_type,
      fallback.beneficiaryName ?? "Campaign beneficiaries",
    ),
    organizer: {
      id: asNullableString(organizer?.id ?? row.owner_id) ?? fallback.organizer?.id,
      name: asString(organizer?.name ?? row.organizer_name, fallback.organizer?.name ?? "Giverr campaign organizer"),
      type: normalizeOrganizerType(organizer?.type ?? row.organizer_type ?? beneficiaryType),
      verified: Boolean(organizer?.verified ?? row.organizer_verified ?? row.is_verified ?? fallback.organizer?.verified ?? false),
    },
    coverImageUrl: asNullableString(row.coverImageUrl ?? row.cover_image_url ?? row.image_url) ?? fallback.coverImageUrl ?? null,
    startsAt: asNullableString(row.startsAt ?? row.starts_at ?? row.start_date) ?? fallback.startsAt ?? null,
    endsAt: asNullableString(row.endsAt ?? row.ends_at ?? row.end_date) ?? fallback.endsAt ?? null,
    createdAt: asString(row.createdAt ?? row.created_at, fallback.createdAt ?? now),
    updatedAt: asString(row.updatedAt ?? row.updated_at, fallback.updatedAt ?? now),
  };
}

function toCampaignUpdate(row: unknown): CampaignApiDetailUpdate {
  if (!isRecord(row)) {
    const now = new Date().toISOString();
    return {
      id: `update-${now}`,
      campaignId: "",
      title: "Campaign update",
      body: "Update details are not available.",
      isPublic: true,
      evidenceUrls: [],
      createdAt: now,
      updatedAt: now,
    };
  }

  const now = new Date().toISOString();

  return {
    id: asString(row.id, `update-${now}`),
    campaignId: asString(row.campaignId ?? row.campaign_id),
    title: asString(row.title, "Campaign update"),
    body: asString(row.body ?? row.content, "Update details are not available."),
    isPublic: Boolean(row.isPublic ?? row.is_public ?? true),
    evidenceUrls: asStringArray(row.evidenceUrls ?? row.evidence_urls),
    createdAt: asString(row.createdAt ?? row.created_at, now),
    updatedAt: asString(row.updatedAt ?? row.updated_at, now),
  };
}

function toCampaignDetail(row: unknown, fallback: Partial<Campaign> = {}): CampaignApiDetail {
  if (!isRecord(row)) {
    throw new CampaignApiError("Campaign API returned an invalid campaign detail.", { code: "INVALID_CAMPAIGN_DETAIL" });
  }

  const campaign = toCampaign(row, fallback);
  const updatesValue = row.updates ?? row.campaign_updates ?? row.campaignUpdates;

  return {
    ...campaign,
    updates: Array.isArray(updatesValue) ? updatesValue.map((update) => toCampaignUpdate(update)) : [],
    evidenceUrls: asStringArray(row.evidenceUrls ?? row.evidence_urls),
    isOwner: Boolean(row.isOwner ?? row.is_owner),
    publishedAt: asNullableString(row.publishedAt ?? row.published_at),
  };
}

function getCampaignArray(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (isRecord(payload)) {
    if (Array.isArray(payload.campaigns)) {
      return payload.campaigns;
    }

    if (Array.isArray(payload.items)) {
      return payload.items;
    }

    if (Array.isArray(payload.data)) {
      return payload.data;
    }
  }

  throw new CampaignApiError("Campaign API returned an invalid campaign list.", { code: "INVALID_CAMPAIGN_LIST" });
}

function getCampaignRecord(payload: unknown): unknown {
  if (isRecord(payload) && "campaign" in payload) {
    return payload.campaign;
  }

  return payload;
}

function normalizeSort(sortBy?: CampaignFiltersState["sortBy"]): string | undefined {
  switch (sortBy) {
    case "mostFunded":
      return "raised_desc";
    case "endingSoon":
      return "ending_soon";
    case "goalAmount":
      return "goal_desc";
    case "newest":
      return "newest";
    default:
      return undefined;
  }
}

function filtersToQuery(filters: Partial<CampaignFiltersState> = {}): InvokeFunctionOptions["query"] {
  return {
    search: filters.query,
    category: filters.category && filters.category !== "all" ? filters.category : undefined,
    status: statusToApiStatus(filters.status),
    sort: normalizeSort(filters.sortBy),
  };
}

function identifierToQuery(identifier: CampaignIdentifier): InvokeFunctionOptions["query"] {
  if (typeof identifier === "string") {
    const value = identifier.trim();

    if (!value) {
      throw new CampaignApiError("A campaign id or slug is required.", { code: "MISSING_CAMPAIGN_IDENTIFIER" });
    }

    const looksLikeUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
    return looksLikeUuid ? { id: value } : { slug: value };
  }

  if (identifier.id?.trim()) {
    return { id: identifier.id.trim() };
  }

  if (identifier.slug?.trim()) {
    return { slug: identifier.slug.trim() };
  }

  throw new CampaignApiError("A campaign id or slug is required.", { code: "MISSING_CAMPAIGN_IDENTIFIER" });
}

function campaignFormToApiPayload(input: CampaignFormValues | UpdateCampaignInput): UnknownRecord {
  const maybeInput = input as Partial<CampaignFormValues> & UpdateCampaignInput;

  return {
    title: maybeInput.title,
    summary: maybeInput.summary,
    story: maybeInput.story,
    category: maybeInput.category,
    beneficiary_type: maybeInput.organizerType ?? "individual",
    goal_amount: maybeInput.goalAmount,
    currency: maybeInput.currency,
    location: maybeInput.location,
    beneficiary_name: maybeInput.beneficiaryName,
    organizer_name: maybeInput.organizerName,
    organizer_type: maybeInput.organizerType,
    cover_image_url: maybeInput.coverImageUrl,
    evidence_urls: maybeInput.evidenceUrls,
    starts_at: maybeInput.startsAt,
    ends_at: maybeInput.endsAt,
    status: maybeInput.status,
    submit: maybeInput.submit ?? maybeInput.submitForReview,
    submit_for_review: maybeInput.submitForReview,
  };
}

function campaignFormFallback(input: CampaignFormValues | UpdateCampaignInput): Partial<Campaign> {
  const maybeInput = input as Partial<CampaignFormValues> & UpdateCampaignInput;
  const now = new Date().toISOString();
  const title = maybeInput.title ?? "Untitled campaign";

  return {
    title,
    slug: fallbackSlug(title),
    summary: maybeInput.summary ?? "Campaign summary pending.",
    story: maybeInput.story ?? maybeInput.summary ?? "Campaign story pending.",
    category: (maybeInput.category ?? "other") as Campaign["category"],
    status: "draft" as Campaign["status"],
    goalAmount: maybeInput.goalAmount ?? 0,
    raisedAmount: 0,
    donorCount: 0,
    currency: maybeInput.currency ?? DEFAULT_CURRENCY,
    location: maybeInput.location ?? "Location pending",
    beneficiaryName: maybeInput.beneficiaryName ?? "Campaign beneficiaries",
    organizer: {
      name: maybeInput.organizerName ?? "Giverr campaign organizer",
      type: normalizeOrganizerType(maybeInput.organizerType),
      verified: false,
    },
    coverImageUrl: maybeInput.coverImageUrl ?? null,
    startsAt: maybeInput.startsAt ?? null,
    endsAt: maybeInput.endsAt ?? null,
    createdAt: now,
    updatedAt: now,
  };
}

export async function listCampaigns(filters: Partial<CampaignFiltersState> = {}): Promise<Campaign[]> {
  const payload = await invokeFunction<unknown>("campaigns-list", {
    method: "GET",
    query: filtersToQuery(filters),
  });

  return getCampaignArray(payload).map((campaign) => toCampaign(campaign));
}

export async function getCampaign(identifier: CampaignIdentifier): Promise<CampaignApiDetail> {
  const payload = await invokeFunction<unknown>("campaigns-get", {
    method: "GET",
    query: identifierToQuery(identifier),
  });

  return toCampaignDetail(getCampaignRecord(payload));
}

export async function createCampaign(input: CampaignFormValues): Promise<Campaign> {
  const payload = await invokeFunction<unknown>("campaigns-create", {
    method: "POST",
    body: campaignFormToApiPayload({
      ...input,
      startsAt: new Date().toISOString(),
      endsAt: input.endsAt ? new Date(input.endsAt).toISOString() : undefined,
    } as CampaignFormValues & UpdateCampaignInput),
  });

  return toCampaign(getCampaignRecord(payload), campaignFormFallback(input));
}

export async function updateCampaign(id: string, input: UpdateCampaignInput): Promise<Campaign> {
  const trimmedId = id.trim();

  if (!trimmedId) {
    throw new CampaignApiError("A campaign id is required for updates.", { code: "MISSING_CAMPAIGN_ID" });
  }

  const payload = await invokeFunction<unknown>("campaigns-update", {
    method: "POST",
    body: {
      id: trimmedId,
      ...campaignFormToApiPayload(input),
    },
  });

  return toCampaign(getCampaignRecord(payload), { id: trimmedId, ...campaignFormFallback(input) });
}
