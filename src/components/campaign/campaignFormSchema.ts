// src/components/campaign/campaignFormSchema.ts
//
// Central validation + constants module for the multi-step Create Campaign
// wizard. This module owns the zod schemas, the per-step field lists, the form
// defaults, and all UI-facing constant lists (categories, currencies,
// countries). It intentionally has NO dependency on pages/hooks/services so it
// can be imported freely without risk of a circular import.

import { z } from "zod";

import type { CampaignFormValues } from "@/types/campaign";

/**
 * Canonical list of campaign categories shown in the Create Campaign wizard
 * (Step 1) and reused wherever a category selector is needed. This is the
 * single source of truth for category values across the app.
 */
export const CAMPAIGN_CATEGORIES = [
  "Community",
  "Education",
  "Environment",
  "Health",
  "Animals",
  "Emergencies",
  "Arts & Culture",
  "Sports",
  "Technology",
  "Other",
] as const;

/**
 * Category options for the Explore page filter bar. Derived directly from
 * {@link CAMPAIGN_CATEGORIES} (no duplication) with a leading "All" option that
 * consumers treat as "no filter". Kept co-located with the categories so the
 * two never drift apart.
 */
export const CATEGORY_FILTERS = ["All", ...CAMPAIGN_CATEGORIES] as const;

/** Supported currencies with display label and symbol for the goal input. */
export const CURRENCY_OPTIONS = [
  { value: "USD", label: "USD ($)", symbol: "$" },
  { value: "EUR", label: "EUR (\u20ac)", symbol: "\u20ac" },
  { value: "GBP", label: "GBP (\u00a3)", symbol: "\u00a3" },
  { value: "CAD", label: "CAD ($)", symbol: "$" },
  { value: "AUD", label: "AUD ($)", symbol: "$" },
  { value: "INR", label: "INR (\u20b9)", symbol: "\u20b9" },
] as const;

/** Country options for the bank-details step. */
export const COUNTRY_OPTIONS = [
  "United States",
  "Canada",
  "United Kingdom",
  "Australia",
  "Germany",
  "France",
  "India",
  "Other",
] as const;

// ── Per-step schemas ────────────────────────────────────────────────────────

export const basicInfoSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, "Please enter a title of at least 5 characters.")
    .max(120, "Title must be 120 characters or fewer."),
  description: z
    .string()
    .trim()
    .min(10, "Please enter a short description of at least 10 characters.")
    .max(280, "Description must be 280 characters or fewer."),
  category: z
    .string()
    .min(1, "Please choose a category."),
  targetAudience: z
    .string()
    .trim()
    .min(3, "Please describe your target audience.")
    .max(120, "Keep this to 120 characters or fewer."),
});

export const detailsSchema = z.object({
  longDescription: z
    .string()
    .trim()
    .min(20, "Please add a fuller description of at least 20 characters."),
  story: z.string().optional().default(""),
  coverImageUrl: z
    .string()
    .min(1, "A cover image is required."),
  mediaUrls: z.array(z.string()).optional().default([]),
});

export const goalDeadlineSchema = z.object({
  goalAmount: z
    .number({ invalid_type_error: "Please enter a valid amount." })
    .positive("Your goal must be greater than zero."),
  currency: z.string().min(1, "Please choose a currency."),
  deadline: z.string().min(1, "Please choose a deadline."),
  donorWallEnabled: z.boolean().default(true),
});

export const bankDetailsSchema = z.object({
  accountHolderName: z
    .string()
    .trim()
    .min(2, "Please enter the account holder's name."),
  bankName: z.string().trim().min(2, "Please enter your bank name."),
  accountNumber: z
    .string()
    .trim()
    .min(4, "Please enter a valid account number."),
  routingNumber: z.string().optional().default(""),
  swiftBic: z.string().optional().default(""),
  country: z.string().min(1, "Please choose the bank's country."),
});

/** Complete campaign form schema — merge of all step schemas. */
export const campaignFormSchema = basicInfoSchema
  .merge(detailsSchema)
  .merge(goalDeadlineSchema)
  .merge(bankDetailsSchema);

/** Ordered step metadata used by the stepper and the orchestrator. */
export const CAMPAIGN_FORM_STEPS = [
  {
    id: "basicInfo",
    title: "Basic Info",
    description: "Title, summary, and category.",
    fields: ["title", "description", "category", "targetAudience"],
  },
  {
    id: "details",
    title: "Details",
    description: "Tell your story and add media.",
    fields: ["longDescription", "story", "coverImageUrl", "mediaUrls"],
  },
  {
    id: "goalDeadline",
    title: "Goal & Deadline",
    description: "Set your target and timeline.",
    fields: ["goalAmount", "currency", "deadline", "donorWallEnabled"],
  },
  {
    id: "bankDetails",
    title: "Bank Details",
    description: "Where funds are disbursed.",
    fields: [
      "accountHolderName",
      "bankName",
      "accountNumber",
      "routingNumber",
      "swiftBic",
      "country",
    ],
  },
] as const;

/** Default values seeding the single react-hook-form instance. */
export const CAMPAIGN_FORM_DEFAULTS: CampaignFormValues = {
  title: "",
  description: "",
  category: "",
  targetAudience: "",
  longDescription: "",
  story: "",
  coverImageUrl: "",
  mediaUrls: [],
  goalAmount: 0,
  currency: "USD",
  deadline: "",
  donorWallEnabled: true,
  accountHolderName: "",
  bankName: "",
  accountNumber: "",
  routingNumber: "",
  swiftBic: "",
  country: "",
};
