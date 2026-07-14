export type CampaignStatus = "draft" | "submitted" | "published" | "paused" | "completed" | "rejected";

export type CampaignCategory =
  | "medical"
  | "education"
  | "emergency"
  | "community"
  | "ngo"
  | "environment"
  | "other";

export type BeneficiaryType = "individual" | "family" | "community" | "ngo" | "nonprofit" | "organization";

export type CampaignSort =
  | "newest"
  | "oldest"
  | "goal_desc"
  | "goal_asc"
  | "raised_desc"
  | "raised_asc"
  | "ending_soon"
  | "title";

export interface CampaignOrganizer {
  id?: string;
  name: string;
  type: "individual" | "community" | "ngo";
  verified: boolean;
}

export interface CampaignTimeline {
  startsAt: string | null;
  endsAt: string | null;
  publishedAt: string | null;
}

export interface CampaignSummary {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: string;
  beneficiaryType: string;
  goalAmount: number;
  raisedAmount: number;
  donorCount: number;
  currency: string;
  location: string | null;
  status: CampaignStatus;
  coverImageUrl: string | null;
  timeline: CampaignTimeline;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignUpdate {
  id: string;
  campaignId: string;
  title: string;
  body: string;
  isPublic?: boolean;
  evidenceUrls: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CampaignDetail extends CampaignSummary {
  story: string;
  evidenceUrls: string[];
  updates: CampaignUpdate[];
  isOwner: boolean;
}

export interface CampaignFilters {
  page?: number;
  pageSize?: number;
  category?: string;
  status?: CampaignStatus | "all";
  search?: string;
  sort?: CampaignSort;
  mine?: boolean;
}

export interface CreateCampaignInput {
  title: string;
  summary: string;
  story: string;
  category: string;
  beneficiaryType: BeneficiaryType | string;
  goalAmount: number;
  currency: string;
  location: string;
  coverImageUrl?: string | null;
  evidenceUrls?: string[];
  startsAt: string;
  endsAt: string;
  submitForReview?: boolean;
}

export interface UpdateCampaignInput {
  title?: string;
  summary?: string;
  story?: string;
  category?: string;
  beneficiaryType?: BeneficiaryType | string;
  goalAmount?: number;
  currency?: string;
  location?: string | null;
  coverImageUrl?: string | null;
  evidenceUrls?: string[];
  startsAt?: string | null;
  endsAt?: string | null;
  submitForReview?: boolean;
  status?: "submitted";
}

export interface CampaignApiError {
  message: string;
  code?: string;
  status?: number;
  details?: unknown;
  fieldErrors?: Record<string, string>;
}

export interface PaginatedCampaignResponse<TCampaign = CampaignSummary> {
  data: TCampaign[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number | null;
  };
}

export type CampaignFormMode = "draft" | "submit_for_review";

export interface CampaignFormState {
  values: CreateCampaignInput;
  mode: CampaignFormMode;
  errors: Partial<Record<keyof CreateCampaignInput | "form", string>>;
  isSubmitting: boolean;
  isDirty: boolean;
  lastSavedCampaign?: Pick<CampaignSummary, "id" | "slug" | "status">;
}

/**
 * Database-only fields are intentionally separated from frontend-safe campaign
 * shapes. Avoid rendering or mutating these fields from UI components.
 */
export interface CampaignDatabaseOnlyFields {
  ownerId: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignDatabaseRow extends CampaignDatabaseOnlyFields {
  id: string;
  slug: string;
  title: string;
  summary: string;
  story: string;
  category: string;
  beneficiaryType: string;
  goalAmount: number;
  raisedAmount: number;
  donorCount: number;
  currency: string;
  location: string | null;
  status: CampaignStatus;
  coverImageUrl: string | null;
  evidenceUrls: string[];
  startsAt: string | null;
  endsAt: string | null;
}

export interface ModuleTwoContent {
  brandName: string;
  eyebrow: string;
  title: string;
  description: string;
  createPanelTitle: string;
  createPanelDescription: string;
  emptyStateTitle: string;
  emptyStateDescription: string;
  sampleCampaigns: Campaign[];
}

/*
 * Backward-compatible aliases for the early Module 2 UI scaffold. The API-facing
 * types above are the canonical shapes for Supabase Edge Function wrappers.
 */
export type LegacyCampaignStatus = CampaignStatus | "active" | "archived";

export interface Campaign {
  id: string;
  title: string;
  slug: string;
  summary: string;
  story: string;
  category: CampaignCategory;
  status: LegacyCampaignStatus;
  goalAmount: number;
  raisedAmount: number;
  donorCount: number;
  currency: string;
  location: string;
  beneficiaryName: string;
  organizer: CampaignOrganizer;
  coverImageUrl?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignFiltersState {
  query: string;
  category: "all" | CampaignCategory;
  status: "all" | LegacyCampaignStatus;
  sortBy: "newest" | "mostFunded" | "endingSoon" | "goalAmount";
}

export interface CampaignFormValues {
  title: string;
  summary: string;
  story: string;
  category: CampaignCategory;
  goalAmount: number;
  currency: string;
  location: string;
  beneficiaryName: string;
  organizerName: string;
  organizerType: CampaignOrganizer["type"];
  endsAt: string;
}

export interface CampaignListResponse {
  campaigns: Campaign[];
}

export interface CampaignDetailResponse {
  campaign: Campaign;
}

export interface CampaignCreateResponse {
  campaign: Campaign;
}

export interface CampaignApiErrorPayload {
  message?: string;
  code?: string;
  details?: unknown;
}
