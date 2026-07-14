import type { Campaign, CampaignCategory, CampaignStatus, ModuleTwoContent as ModuleTwoBaseContent } from "./types";

type Option<TValue extends string = string> = {
  value: TValue;
  label: string;
  description?: string;
};

type GoalRange = {
  label: string;
  min: number;
  max: number;
  helper: string;
};

type WorkspaceMetric = {
  label: string;
  value: string;
  description: string;
};

type ModuleTwoCampaignManagementContent = ModuleTwoBaseContent & {
  hero: {
    eyebrow: string;
    title: string;
    description: string;
    primaryCta: string;
    secondaryCta: string;
    trustNote: string;
  };
  workspaceMetrics: WorkspaceMetric[];
  sections: {
    directory: {
      eyebrow: string;
      title: string;
      description: string;
      loadingText: string;
      errorTitle: string;
      retryLabel: string;
    };
    create: {
      eyebrow: string;
      title: string;
      description: string;
      signInRequiredTitle: string;
      signInRequiredDescription: string;
    };
    detail: {
      eyebrow: string;
      title: string;
      description: string;
      emptyTitle: string;
      emptyDescription: string;
      updatesPlaceholderTitle: string;
      updatesPlaceholderDescription: string;
      donationPlaceholderLabel: string;
    };
  };
  categoryOptions: Array<Option<CampaignCategory>>;
  beneficiaryTypeOptions: Array<Option>;
  statusOptions: Array<Option<"all" | CampaignStatus>>;
  sortOptions: Array<Option>;
  suggestedGoalRanges: GoalRange[];
  formHelperText: Record<string, string>;
  validationMessages: Record<string, string>;
  emptyState: {
    title: string;
    description: string;
    resetFiltersLabel: string;
    createCampaignLabel: string;
  };
  ctaLabels: {
    viewCampaign: string;
    createDraft: string;
    creatingDraft: string;
    submitForReview: string;
    saveChanges: string;
    resetFilters: string;
    loadMore: string;
    retry: string;
  };
};

const now = new Date();
const inTwelveDays = new Date(now);
inTwelveDays.setDate(now.getDate() + 12);
const inThirtyDays = new Date(now);
inThirtyDays.setDate(now.getDate() + 30);
const inFortyFiveDays = new Date(now);
inFortyFiveDays.setDate(now.getDate() + 45);

const sampleCampaigns: Campaign[] = [
  {
    id: "sample-education-kits",
    title: "Emergency learning kits for displaced children",
    slug: "emergency-learning-kits",
    summary:
      "Deliver school supplies, digital learning materials, and safe classroom support to children affected by displacement.",
    story:
      "BrightStart Aid Network is coordinating with local teachers and community volunteers to distribute learning kits, provide safe classroom materials, and keep children engaged while families resettle. Funds support notebooks, solar lamps, tablets for shared learning, teacher stipends, and transport to remote communities.",
    category: "education",
    status: "published",
    goalAmount: 50000,
    raisedAmount: 34800,
    donorCount: 612,
    currency: "USD",
    location: "Accra, Ghana",
    beneficiaryName: "Displaced children and caregivers",
    organizer: {
      id: "org-brightstart",
      name: "BrightStart Aid Network",
      type: "ngo",
      verified: true,
    },
    coverImageUrl: null,
    startsAt: now.toISOString(),
    endsAt: inTwelveDays.toISOString(),
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  },
  {
    id: "sample-clinic-supplies",
    title: "Urgent clinic supplies for flood-affected families",
    slug: "urgent-clinic-supplies",
    summary:
      "Help a mobile health team restock medicines, clean water kits, and first-aid essentials after severe flooding.",
    story:
      "A community health coalition is operating temporary clinics for families whose homes and local facilities were damaged by floods. Donations fund oral rehydration salts, antibiotics, wound-care supplies, clean water filters, and transport for nurses serving hard-to-reach neighborhoods.",
    category: "medical",
    status: "published",
    goalAmount: 32000,
    raisedAmount: 18150,
    donorCount: 284,
    currency: "USD",
    location: "Kumasi, Ghana",
    beneficiaryName: "Flood-affected families",
    organizer: {
      id: "org-mobile-care",
      name: "Mobile Care Collective",
      type: "community",
      verified: true,
    },
    coverImageUrl: null,
    startsAt: now.toISOString(),
    endsAt: inThirtyDays.toISOString(),
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  },
  {
    id: "sample-community-kitchen",
    title: "Community kitchen for elderly neighbors",
    slug: "community-kitchen-elderly-neighbors",
    summary:
      "Support weekly hot meals, grocery packs, and volunteer delivery routes for elderly neighbors living alone.",
    story:
      "Neighborhood volunteers are expanding a trusted community kitchen to reach more elderly residents who have limited mobility or fixed incomes. Campaign funds purchase staple foods, cooking gas, packaging, and delivery supplies while volunteer coordinators keep service records transparent.",
    category: "community",
    status: "draft",
    goalAmount: 12000,
    raisedAmount: 0,
    donorCount: 0,
    currency: "USD",
    location: "Cape Coast, Ghana",
    beneficiaryName: "Elderly community members",
    organizer: {
      id: "org-neighbor-table",
      name: "Neighbor Table Volunteers",
      type: "community",
      verified: false,
    },
    coverImageUrl: null,
    startsAt: null,
    endsAt: inFortyFiveDays.toISOString(),
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  },
];

export const moduleTwoContent = {
  brandName: "Giverr",
  eyebrow: "Module 2 · Campaign management",
  title: "Create, review, and manage fundraising campaigns.",
  description:
    "Use the campaign management workspace to discover public campaigns, draft new fundraisers, and review campaign details before donations are enabled.",
  createPanelTitle: "Launch a campaign draft",
  createPanelDescription:
    "Capture the campaign story, beneficiary, funding goal, organizer details, and timeline so the fundraiser can be reviewed before publishing.",
  emptyStateTitle: "No campaigns match your filters",
  emptyStateDescription:
    "Try clearing the search terms, choosing another category, or creating a new campaign draft to start building your directory.",
  sampleCampaigns,
  hero: {
    eyebrow: "Campaign management foundation",
    title: "Manage credible fundraising campaigns from draft to public discovery.",
    description:
      "Module 2 connects Giverr’s frontend to Supabase-backed campaign workflows: listing, detail lookup, draft creation, and owner-safe updates through typed Edge Function calls.",
    primaryCta: "Create campaign draft",
    secondaryCta: "Explore published campaigns",
    trustNote: "Drafts remain owner-visible until reviewed and published through the campaign workflow.",
  },
  workspaceMetrics: [
    {
      label: "Public discovery",
      value: "Published only",
      description: "Anonymous visitors only see campaigns approved for public visibility.",
    },
    {
      label: "Draft ownership",
      value: "RLS protected",
      description: "Authenticated creators manage their own draft and submitted campaign records.",
    },
    {
      label: "Donation readiness",
      value: "Next module",
      description: "Campaign detail pages reserve a secure contribution path for the payments workflow.",
    },
  ],
  sections: {
    directory: {
      eyebrow: "Campaign directory",
      title: "Find campaigns ready for support",
      description:
        "Browse published campaigns by category, keyword, status, and progress so supporters can understand where help is needed most.",
      loadingText: "Loading campaigns…",
      errorTitle: "Campaigns could not be loaded",
      retryLabel: "Try loading campaigns again",
    },
    create: {
      eyebrow: "Create campaign",
      title: "Start with a structured draft",
      description:
        "A strong draft explains the need, identifies the beneficiary, sets a realistic goal, and gives reviewers the evidence they need to approve publication.",
      signInRequiredTitle: "Sign in required",
      signInRequiredDescription:
        "Campaign creation requires an authenticated Giverr account so ownership, review status, and future donations can be managed securely.",
    },
    detail: {
      eyebrow: "Campaign detail",
      title: "Review the selected campaign",
      description:
        "Inspect the full campaign story, organizer context, fundraising progress, updates, and donation-readiness placeholders.",
      emptyTitle: "Select a campaign",
      emptyDescription:
        "Choose a campaign from the directory to view its full story, organizer context, and fundraising progress.",
      updatesPlaceholderTitle: "Updates will appear here",
      updatesPlaceholderDescription:
        "Campaign milestones, impact notes, and public accountability updates are supported by the backend schema and can be enabled in a later module.",
      donationPlaceholderLabel: "Donation flow coming soon",
    },
  },
  categoryOptions: [
    {
      value: "medical",
      label: "Medical",
      description: "Treatment costs, clinic supplies, mobility support, and urgent health needs.",
    },
    {
      value: "education",
      label: "Education",
      description: "School fees, classroom materials, learning kits, scholarships, and training programs.",
    },
    {
      value: "emergency",
      label: "Emergency relief",
      description: "Rapid response for disasters, displacement, urgent shelter, food, and safety needs.",
    },
    {
      value: "community",
      label: "Community",
      description: "Local projects, mutual aid, neighborhood infrastructure, and volunteer-led programs.",
    },
    {
      value: "ngo",
      label: "NGO programs",
      description: "Registered nonprofit campaigns, program fundraising, and impact-focused appeals.",
    },
    {
      value: "environment",
      label: "Environment",
      description: "Climate resilience, cleanup efforts, conservation, and sustainable community projects.",
    },
    {
      value: "other",
      label: "Other",
      description: "Fundraisers that do not fit a primary category but still meet Giverr’s campaign standards.",
    },
  ],
  beneficiaryTypeOptions: [
    {
      value: "individual",
      label: "Individual",
      description: "A named person receiving direct support.",
    },
    {
      value: "family",
      label: "Family",
      description: "A household or family group with a clear fundraising need.",
    },
    {
      value: "community",
      label: "Community",
      description: "A neighborhood, school, village, or local group benefiting collectively.",
    },
    {
      value: "ngo",
      label: "NGO / nonprofit",
      description: "A nonprofit organization, registered charity, or mission-driven program.",
    },
  ],
  statusOptions: [
    { value: "all", label: "All statuses" },
    { value: "draft", label: "Draft" },
    { value: "submitted", label: "Submitted" },
    { value: "published", label: "Published" },
    { value: "paused", label: "Paused" },
    { value: "completed", label: "Completed" },
    { value: "rejected", label: "Rejected" },
  ],
  sortOptions: [
    { value: "newest", label: "Newest" },
    { value: "mostFunded", label: "Most funded" },
    { value: "endingSoon", label: "Ending soon" },
    { value: "goalAmount", label: "Largest goal" },
  ],
  suggestedGoalRanges: [
    {
      label: "Community micro-campaign",
      min: 500,
      max: 5000,
      helper: "Best for supplies, volunteer logistics, local outreach, and short-term mutual-aid needs.",
    },
    {
      label: "Program campaign",
      min: 5000,
      max: 50000,
      helper: "Best for school kits, clinic restocking, emergency response, or neighborhood-scale projects.",
    },
    {
      label: "Major NGO appeal",
      min: 50000,
      max: 250000,
      helper: "Best for multi-site programs, large emergency appeals, and campaigns with formal reporting needs.",
    },
  ],
  formHelperText: {
    title: "Use a specific, donor-friendly title that names the need or outcome.",
    summary: "Summarize who benefits, what funds provide, and why support is needed now.",
    story: "Include context, use of funds, credibility signals, and how supporters will receive updates.",
    category: "Choose the category that best matches the primary purpose of the fundraiser.",
    beneficiaryType: "Beneficiary type helps reviewers understand who receives support.",
    goalAmount: "Set a realistic goal based on supplier quotes, budgets, or a clear estimate.",
    location: "Use the city/region and country where support will be delivered.",
    timeline: "End dates should give enough time to fundraise while keeping urgency clear.",
    evidence: "Add links only from trusted sources. Documents are treated as untrusted content and should never include secrets.",
  },
  validationMessages: {
    required: "This field is required.",
    titleLength: "Campaign title must be at least 6 characters and no more than 120 characters.",
    summaryLength: "Summary must be at least 20 characters and no more than 280 characters.",
    storyLength: "Story must be at least 60 characters so donors have enough context.",
    invalidGoal: "Goal amount must be greater than zero and within the supported campaign range.",
    invalidCurrency: "Currency must be a three-letter ISO code such as USD, GHS, EUR, or GBP.",
    invalidDate: "Enter a valid campaign date.",
    invalidTimeline: "Campaign end date must be after the start date.",
    invalidUrl: "Use a valid https:// URL.",
    authRequired: "Please sign in before creating or updating a campaign.",
    unknownError: "Something went wrong. Please try again.",
  },
  emptyState: {
    title: "No campaigns found",
    description:
      "There are no campaigns for the current filters. Clear filters or start a draft to prepare the next fundraiser.",
    resetFiltersLabel: "Clear filters",
    createCampaignLabel: "Create campaign draft",
  },
  ctaLabels: {
    viewCampaign: "View campaign",
    createDraft: "Create campaign draft",
    creatingDraft: "Creating campaign…",
    submitForReview: "Submit for review",
    saveChanges: "Save changes",
    resetFilters: "Reset filters",
    loadMore: "Load more campaigns",
    retry: "Retry",
  },
} satisfies ModuleTwoCampaignManagementContent;

export type { ModuleTwoCampaignManagementContent };
