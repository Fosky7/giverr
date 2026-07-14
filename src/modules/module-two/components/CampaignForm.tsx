import React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { createCampaign, normalizeCampaignError } from "../api/campaigns";
import { moduleTwoContent } from "../moduleTwoContent";
import type { Campaign, CampaignCategory, CampaignFormValues, CampaignOrganizer } from "../types";
import { CampaignFormField, getCampaignFieldDescribedBy } from "./CampaignFormField";

interface CampaignFormProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  isSubmitting?: boolean;
  /**
   * Compatibility hook for parent-owned persistence. Without it, this form calls
   * the typed campaign creation API wrapper directly.
   */
  onSubmit?: (values: CampaignFormValues) => Promise<void> | void;
  onCreated?: (campaign: Campaign) => void;
  requireAuthentication?: boolean;
  defaultSubmitForReview?: boolean;
  detailBaseHref?: string;
}

type CampaignFormStatus = "idle" | "checking_auth" | "submitting" | "success" | "error";

interface CampaignCreationFormValues extends CampaignFormValues {
  beneficiaryType: string;
  coverImageUrl: string;
  evidenceUrlsText: string;
  startsAt: string;
  submitForReview: boolean;
}

type FieldErrors = Partial<Record<keyof CampaignCreationFormValues | "form", string>>;

const categoryOptions = moduleTwoContent.categoryOptions;
const beneficiaryTypeOptions = moduleTwoContent.beneficiaryTypeOptions;
const validationMessages = moduleTwoContent.validationMessages;
const helperText = moduleTwoContent.formHelperText;

const organizerTypes: Array<{ value: CampaignOrganizer["type"]; label: string }> = [
  { value: "individual", label: "Individual" },
  { value: "community", label: "Community group" },
  { value: "ngo", label: "NGO / nonprofit" },
];

const today = new Date().toISOString().slice(0, 10);

const defaultValues: CampaignCreationFormValues = {
  title: "",
  summary: "",
  story: "",
  category: "community",
  beneficiaryType: "community",
  goalAmount: 10000,
  currency: "USD",
  location: "",
  beneficiaryName: "",
  organizerName: "",
  organizerType: "individual",
  coverImageUrl: "",
  evidenceUrlsText: "",
  startsAt: today,
  endsAt: "",
  submitForReview: false,
};

const fieldClassName =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50";

function isValidAbsoluteHttpsUrl(value: string): boolean {
  if (!value.trim()) {
    return true;
  }

  try {
    const url = new URL(value.trim());
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

function parseEvidenceUrls(value: string): string[] {
  return value
    .split(/\r?\n|,/)
    .map((url) => url.trim())
    .filter(Boolean);
}

function toDateTime(value: string): number {
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : Number.NaN;
}

function validate(values: CampaignCreationFormValues): FieldErrors {
  const errors: FieldErrors = {};
  const validCategories = new Set(categoryOptions.map((category) => category.value));
  const validBeneficiaryTypes = new Set(beneficiaryTypeOptions.map((option) => option.value));

  if (values.title.trim().length < 6 || values.title.trim().length > 120) {
    errors.title = validationMessages.titleLength;
  }

  if (values.summary.trim().length < 20 || values.summary.trim().length > 280) {
    errors.summary = validationMessages.summaryLength;
  }

  if (values.story.trim().length < 60) {
    errors.story = validationMessages.storyLength;
  }

  if (!validCategories.has(values.category)) {
    errors.category = "Choose a valid campaign category.";
  }

  if (!validBeneficiaryTypes.has(values.beneficiaryType)) {
    errors.beneficiaryType = "Choose a valid beneficiary type.";
  }

  if (!Number.isFinite(values.goalAmount) || values.goalAmount <= 0 || values.goalAmount > 100_000_000) {
    errors.goalAmount = validationMessages.invalidGoal;
  }

  if (!/^[A-Z]{3}$/.test(values.currency.trim().toUpperCase())) {
    errors.currency = validationMessages.invalidCurrency;
  }

  if (!values.location.trim()) {
    errors.location = validationMessages.required;
  }

  if (!values.beneficiaryName.trim()) {
    errors.beneficiaryName = validationMessages.required;
  }

  if (!values.organizerName.trim()) {
    errors.organizerName = validationMessages.required;
  }

  if (!values.startsAt || Number.isNaN(toDateTime(values.startsAt))) {
    errors.startsAt = validationMessages.invalidDate;
  }

  if (!values.endsAt || Number.isNaN(toDateTime(values.endsAt))) {
    errors.endsAt = validationMessages.invalidDate;
  }

  if (values.startsAt && values.endsAt && !Number.isNaN(toDateTime(values.startsAt)) && !Number.isNaN(toDateTime(values.endsAt))) {
    if (toDateTime(values.endsAt) <= toDateTime(values.startsAt)) {
      errors.endsAt = validationMessages.invalidTimeline;
    }
  }

  if (values.coverImageUrl.trim() && !isValidAbsoluteHttpsUrl(values.coverImageUrl)) {
    errors.coverImageUrl = validationMessages.invalidUrl;
  }

  const invalidEvidenceUrl = parseEvidenceUrls(values.evidenceUrlsText).find((url) => !isValidAbsoluteHttpsUrl(url));

  if (invalidEvidenceUrl) {
    errors.evidenceUrlsText = validationMessages.invalidUrl;
  }

  return errors;
}

function toApiValues(values: CampaignCreationFormValues): CampaignFormValues {
  return {
    title: values.title.trim(),
    summary: values.summary.trim(),
    story: values.story.trim(),
    category: values.category,
    goalAmount: values.goalAmount,
    currency: values.currency.trim().toUpperCase(),
    location: values.location.trim(),
    beneficiaryName: values.beneficiaryName.trim(),
    organizerName: values.organizerName.trim(),
    organizerType: values.organizerType,
    endsAt: values.endsAt,
  };
}

export function CampaignForm({
  title = moduleTwoContent.createPanelTitle,
  description = moduleTwoContent.createPanelDescription,
  isSubmitting: externallySubmitting = false,
  onSubmit,
  onCreated,
  requireAuthentication = true,
  defaultSubmitForReview = false,
  detailBaseHref = "#campaigns",
  className,
  ...props
}: CampaignFormProps) {
  const [values, setValues] = React.useState<CampaignCreationFormValues>({
    ...defaultValues,
    submitForReview: defaultSubmitForReview,
  });
  const [errors, setErrors] = React.useState<FieldErrors>({});
  const [status, setStatus] = React.useState<CampaignFormStatus>(requireAuthentication ? "checking_auth" : "idle");
  const [isAuthenticated, setIsAuthenticated] = React.useState(!requireAuthentication);
  const [authMessage, setAuthMessage] = React.useState<string | null>(null);
  const [successCampaign, setSuccessCampaign] = React.useState<Pick<Campaign, "id" | "slug" | "status"> | null>(null);

  React.useEffect(() => {
    if (!requireAuthentication) {
      setIsAuthenticated(true);
      setStatus("idle");
      return;
    }

    let isMounted = true;

    const checkSession = async () => {
      setStatus((current) => (current === "submitting" ? current : "checking_auth"));

      try {
        const { data, error } = await supabase.auth.getSession();

        if (!isMounted) {
          return;
        }

        if (error) {
          setIsAuthenticated(false);
          setAuthMessage("We could not verify your session. Please sign in again before creating a campaign.");
        } else {
          const hasSession = Boolean(data.session?.access_token);
          setIsAuthenticated(hasSession);
          setAuthMessage(hasSession ? null : moduleTwoContent.sections.create.signInRequiredDescription);
        }
      } catch {
        if (isMounted) {
          setIsAuthenticated(false);
          setAuthMessage("Authentication is not available yet. Sign-in must be connected before campaigns can be created.");
        }
      } finally {
        if (isMounted) {
          setStatus((current) => (current === "checking_auth" ? "idle" : current));
        }
      }
    };

    void checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(Boolean(session?.access_token));
      setAuthMessage(session?.access_token ? null : moduleTwoContent.sections.create.signInRequiredDescription);
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [requireAuthentication]);

  const isBusy = externallySubmitting || status === "submitting" || status === "checking_auth";
  const canSubmit = !isBusy && (!requireAuthentication || isAuthenticated);

  const updateValue = <TKey extends keyof CampaignCreationFormValues>(key: TKey, value: CampaignCreationFormValues[TKey]) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined, form: undefined }));
    if (successCampaign) {
      setSuccessCampaign(null);
    }
  };

  const resetForm = () => {
    setValues({
      ...defaultValues,
      startsAt: new Date().toISOString().slice(0, 10),
      submitForReview: defaultSubmitForReview,
    });
    setErrors({});
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (requireAuthentication && !isAuthenticated) {
      setErrors({ form: validationMessages.authRequired });
      return;
    }

    const nextErrors = validate(values);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setStatus("error");
      return;
    }

    setErrors({});
    setStatus("submitting");

    try {
      const apiValues = toApiValues(values);

      if (onSubmit) {
        await onSubmit(apiValues);
        setSuccessCampaign({
          id: "pending",
          slug: "pending-review",
          status: values.submitForReview ? "submitted" : "draft",
        });
      } else {
        const createdCampaign = await createCampaign(apiValues);
        setSuccessCampaign({
          id: createdCampaign.id,
          slug: createdCampaign.slug,
          status: createdCampaign.status,
        });
        onCreated?.(createdCampaign);
      }

      setStatus("success");
      resetForm();
    } catch (error) {
      const normalizedError = normalizeCampaignError(error);
      setErrors({
        ...((normalizedError.fields ?? {}) as FieldErrors),
        form: normalizedError.message,
      });
      setStatus("error");
    }
  };

  return (
    <Card className={cn("border-border/80 bg-card", className)} {...props}>
      <CardHeader>
        <CardTitle className="text-2xl">{title}</CardTitle>
        <CardDescription className="text-sm leading-6">{description}</CardDescription>
      </CardHeader>

      <CardContent>
        {requireAuthentication && !isAuthenticated ? (
          <div className="mb-5 rounded-xl border border-primary/20 bg-primary/10 p-4" role="status">
            <h3 className="text-sm font-semibold text-foreground">{moduleTwoContent.sections.create.signInRequiredTitle}</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {authMessage ?? moduleTwoContent.sections.create.signInRequiredDescription}
            </p>
          </div>
        ) : null}

        {successCampaign ? (
          <div className="mb-5 rounded-xl border border-primary/20 bg-primary/10 p-4 text-sm leading-6 text-foreground" role="status">
            Campaign {successCampaign.status === "submitted" ? "submitted for review" : "draft created"} successfully.
            {successCampaign.slug !== "pending-review" ? (
              <a
                className="ml-2 font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                href={`${detailBaseHref}/${successCampaign.slug}`}
              >
                View detail
              </a>
            ) : null}
          </div>
        ) : null}

        {errors.form ? (
          <div className="mb-5 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive" role="alert">
            {errors.form}
          </div>
        ) : null}

        <form className="space-y-5" onSubmit={handleSubmit} noValidate>
          <CampaignFormField
            id="campaign-title"
            label="Campaign title"
            helperText={helperText.title}
            error={errors.title}
            required
          >
            <input
              id="campaign-title"
              className={fieldClassName}
              value={values.title}
              onChange={(event) => updateValue("title", event.target.value)}
              placeholder="Example: Clean water for rural families"
              disabled={isBusy}
              aria-invalid={Boolean(errors.title)}
              aria-describedby={getCampaignFieldDescribedBy("campaign-title", helperText.title, errors.title)}
              required
            />
          </CampaignFormField>

          <CampaignFormField
            id="campaign-summary"
            label="Short summary"
            helperText={helperText.summary}
            error={errors.summary}
            required
          >
            <textarea
              id="campaign-summary"
              className={cn(fieldClassName, "min-h-24 resize-y")}
              value={values.summary}
              onChange={(event) => updateValue("summary", event.target.value)}
              placeholder="A concise donor-facing summary of the campaign."
              disabled={isBusy}
              aria-invalid={Boolean(errors.summary)}
              aria-describedby={getCampaignFieldDescribedBy("campaign-summary", helperText.summary, errors.summary)}
              required
            />
          </CampaignFormField>

          <CampaignFormField id="campaign-story" label="Full story" helperText={helperText.story} error={errors.story} required>
            <textarea
              id="campaign-story"
              className={cn(fieldClassName, "min-h-36 resize-y")}
              value={values.story}
              onChange={(event) => updateValue("story", event.target.value)}
              placeholder="Explain the need, who benefits, how funds will be used, and how updates will be shared."
              disabled={isBusy}
              aria-invalid={Boolean(errors.story)}
              aria-describedby={getCampaignFieldDescribedBy("campaign-story", helperText.story, errors.story)}
              required
            />
          </CampaignFormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <CampaignFormField
              id="campaign-category"
              label="Category"
              helperText={helperText.category}
              error={errors.category}
              required
            >
              <select
                id="campaign-category"
                className={fieldClassName}
                value={values.category}
                onChange={(event) => updateValue("category", event.target.value as CampaignCategory)}
                disabled={isBusy}
                aria-invalid={Boolean(errors.category)}
                aria-describedby={getCampaignFieldDescribedBy("campaign-category", helperText.category, errors.category)}
              >
                {categoryOptions.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </CampaignFormField>

            <CampaignFormField
              id="campaign-beneficiary-type"
              label="Beneficiary type"
              helperText={helperText.beneficiaryType}
              error={errors.beneficiaryType}
              required
            >
              <select
                id="campaign-beneficiary-type"
                className={fieldClassName}
                value={values.beneficiaryType}
                onChange={(event) => updateValue("beneficiaryType", event.target.value)}
                disabled={isBusy}
                aria-invalid={Boolean(errors.beneficiaryType)}
                aria-describedby={getCampaignFieldDescribedBy(
                  "campaign-beneficiary-type",
                  helperText.beneficiaryType,
                  errors.beneficiaryType,
                )}
              >
                {beneficiaryTypeOptions.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </CampaignFormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <CampaignFormField
              id="campaign-goal"
              label="Goal amount"
              helperText={helperText.goalAmount}
              error={errors.goalAmount}
              required
            >
              <input
                id="campaign-goal"
                className={fieldClassName}
                type="number"
                min="1"
                max="100000000"
                step="1"
                value={values.goalAmount}
                onChange={(event) => updateValue("goalAmount", Number(event.target.value))}
                disabled={isBusy}
                aria-invalid={Boolean(errors.goalAmount)}
                aria-describedby={getCampaignFieldDescribedBy("campaign-goal", helperText.goalAmount, errors.goalAmount)}
                required
              />
            </CampaignFormField>

            <CampaignFormField id="campaign-currency" label="Currency" error={errors.currency} required>
              <input
                id="campaign-currency"
                className={fieldClassName}
                value={values.currency}
                onChange={(event) => updateValue("currency", event.target.value.toUpperCase())}
                maxLength={3}
                disabled={isBusy}
                aria-invalid={Boolean(errors.currency)}
                aria-describedby={getCampaignFieldDescribedBy("campaign-currency", undefined, errors.currency)}
                required
              />
            </CampaignFormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <CampaignFormField id="campaign-start-date" label="Start date" error={errors.startsAt} required>
              <input
                id="campaign-start-date"
                className={fieldClassName}
                type="date"
                value={values.startsAt}
                onChange={(event) => updateValue("startsAt", event.target.value)}
                disabled={isBusy}
                aria-invalid={Boolean(errors.startsAt)}
                aria-describedby={getCampaignFieldDescribedBy("campaign-start-date", undefined, errors.startsAt)}
                required
              />
            </CampaignFormField>

            <CampaignFormField
              id="campaign-end-date"
              label="End date"
              helperText={helperText.timeline}
              error={errors.endsAt}
              required
            >
              <input
                id="campaign-end-date"
                className={fieldClassName}
                type="date"
                value={values.endsAt}
                onChange={(event) => updateValue("endsAt", event.target.value)}
                disabled={isBusy}
                aria-invalid={Boolean(errors.endsAt)}
                aria-describedby={getCampaignFieldDescribedBy("campaign-end-date", helperText.timeline, errors.endsAt)}
                required
              />
            </CampaignFormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <CampaignFormField id="campaign-location" label="Location" helperText={helperText.location} error={errors.location} required>
              <input
                id="campaign-location"
                className={fieldClassName}
                value={values.location}
                onChange={(event) => updateValue("location", event.target.value)}
                placeholder="City, country"
                disabled={isBusy}
                aria-invalid={Boolean(errors.location)}
                aria-describedby={getCampaignFieldDescribedBy("campaign-location", helperText.location, errors.location)}
                required
              />
            </CampaignFormField>

            <CampaignFormField id="campaign-beneficiary" label="Beneficiary" error={errors.beneficiaryName} required>
              <input
                id="campaign-beneficiary"
                className={fieldClassName}
                value={values.beneficiaryName}
                onChange={(event) => updateValue("beneficiaryName", event.target.value)}
                placeholder="Who receives support?"
                disabled={isBusy}
                aria-invalid={Boolean(errors.beneficiaryName)}
                aria-describedby={getCampaignFieldDescribedBy("campaign-beneficiary", undefined, errors.beneficiaryName)}
                required
              />
            </CampaignFormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <CampaignFormField id="campaign-organizer" label="Organizer name" error={errors.organizerName} required>
              <input
                id="campaign-organizer"
                className={fieldClassName}
                value={values.organizerName}
                onChange={(event) => updateValue("organizerName", event.target.value)}
                placeholder="Individual, group, or NGO"
                disabled={isBusy}
                aria-invalid={Boolean(errors.organizerName)}
                aria-describedby={getCampaignFieldDescribedBy("campaign-organizer", undefined, errors.organizerName)}
                required
              />
            </CampaignFormField>

            <CampaignFormField id="campaign-organizer-type" label="Organizer type">
              <select
                id="campaign-organizer-type"
                className={fieldClassName}
                value={values.organizerType}
                onChange={(event) => updateValue("organizerType", event.target.value as CampaignOrganizer["type"])}
                disabled={isBusy}
              >
                {organizerTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </CampaignFormField>
          </div>

          <CampaignFormField id="campaign-cover-image" label="Cover image URL" error={errors.coverImageUrl}>
            <input
              id="campaign-cover-image"
              className={fieldClassName}
              type="url"
              value={values.coverImageUrl}
              onChange={(event) => updateValue("coverImageUrl", event.target.value)}
              placeholder="https://example.org/photo.jpg"
              disabled={isBusy}
              aria-invalid={Boolean(errors.coverImageUrl)}
              aria-describedby={getCampaignFieldDescribedBy("campaign-cover-image", undefined, errors.coverImageUrl)}
            />
          </CampaignFormField>

          <CampaignFormField
            id="campaign-evidence-urls"
            label="Evidence URLs"
            helperText={helperText.evidence}
            error={errors.evidenceUrlsText}
          >
            <textarea
              id="campaign-evidence-urls"
              className={cn(fieldClassName, "min-h-24 resize-y")}
              value={values.evidenceUrlsText}
              onChange={(event) => updateValue("evidenceUrlsText", event.target.value)}
              placeholder="One trusted https:// URL per line"
              disabled={isBusy}
              aria-invalid={Boolean(errors.evidenceUrlsText)}
              aria-describedby={getCampaignFieldDescribedBy(
                "campaign-evidence-urls",
                helperText.evidence,
                errors.evidenceUrlsText,
              )}
            />
          </CampaignFormField>

          <label className="flex items-start gap-3 rounded-xl border border-border/80 bg-muted/30 p-4 text-sm leading-6">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-input text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              checked={values.submitForReview}
              onChange={(event) => updateValue("submitForReview", event.target.checked)}
              disabled={isBusy}
            />
            <span>
              <span className="block font-medium text-foreground">Submit for review after creating</span>
              <span className="text-muted-foreground">
                Leave unchecked to save a private draft. Submit when the story, goal, evidence, and timeline are ready.
              </span>
            </span>
          </label>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button type="submit" className="w-full sm:flex-1" disabled={!canSubmit}>
              {isBusy
                ? moduleTwoContent.ctaLabels.creatingDraft
                : values.submitForReview
                  ? moduleTwoContent.ctaLabels.submitForReview
                  : moduleTwoContent.ctaLabels.createDraft}
            </Button>
            <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={resetForm} disabled={isBusy}>
              Reset
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default CampaignForm;
