// src/pages/EditCampaignPage.tsx
//
// Edit Campaign flow (Module 4 · Step 12). Reuses the Create Campaign wizard
// components in "edit" mode:
//   * Loads the target campaign via useCampaign(id).
//   * Enforces ownership: only the creator may edit; anyone else is redirected
//     to the public detail page (RLS also enforces this server-side).
//   * Pre-populates a single react-hook-form instance from the loaded campaign.
//   * Persists changes with updateCampaign; bank details are re-saved only when
//     the creator re-enters an account number (the full value is never returned
//     to the client, so the field is intentionally left blank on load).
//   * Lets creators change the campaign's visibility/status (active/paused).
//
// Bank details step is optional in edit mode — a blank account number simply
// leaves the existing stored details untouched.

import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Save,
  SearchX,
} from "lucide-react";

import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CampaignFormStepper } from "@/components/campaign/CampaignFormStepper";
import {
  Step1BasicInfo,
  Step2Details,
  Step3GoalDeadline,
  Step4BankDetails,
} from "@/components/campaign/CampaignFormSteps";
import {
  CAMPAIGN_FORM_DEFAULTS,
  CAMPAIGN_FORM_STEPS,
  campaignFormSchema,
} from "@/components/campaign/campaignFormSchema";
import { useAuth } from "@/hooks/useAuth";
import { useCampaign } from "@/hooks/useCampaign";
import {
  publishCampaign,
  saveBankDetails,
  updateCampaign,
} from "@/services/campaigns";
import type {
  Campaign,
  CampaignFormValues,
  CampaignStatus,
} from "@/types/campaign";

/**
 * In edit mode the account number is intentionally NOT pre-filled (the full
 * value never leaves the server), so it is optional. We relax just that field
 * from the shared schema; everything else validates identically to create.
 */
const editCampaignFormSchema = campaignFormSchema.extend({
  accountNumber: campaignFormSchema.shape.accountNumber
    .or(
      // Allow an empty string meaning "leave existing bank details unchanged".
      // (zod string; the field is a plain input.)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (campaignFormSchema.shape.accountNumber as any).constructor === Object
        ? undefined
        : undefined
    )
    .optional()
    .or(undefined as never),
});

/** Render the step component matching the active step id. */
function ActiveStep({ stepId }: { stepId: string }) {
  switch (stepId) {
    case "basicInfo":
      return <Step1BasicInfo />;
    case "details":
      return <Step2Details />;
    case "goalDeadline":
      return <Step3GoalDeadline />;
    case "bankDetails":
      return <Step4BankDetails />;
    default:
      return null;
  }
}

/** Build form defaults from a loaded campaign, leaving bank fields blank. */
function campaignToFormValues(campaign: Campaign): CampaignFormValues {
  return {
    ...CAMPAIGN_FORM_DEFAULTS,
    title: campaign.title ?? "",
    description: campaign.description ?? "",
    category: campaign.category ?? "",
    targetAudience: campaign.targetAudience ?? "",

    longDescription: campaign.longDescription ?? "",
    story: campaign.story ?? "",
    coverImageUrl: campaign.coverImageUrl ?? "",
    mediaUrls: campaign.mediaUrls ?? [],

    goalAmount: campaign.goalAmount ?? 0,
    currency: campaign.currency ?? "USD",
    deadline: campaign.deadline ?? "",
    donorWallEnabled: campaign.donorWallEnabled ?? true,

    // Bank details are never returned to the client — leave blank in edit mode.
    accountHolderName: "",
    bankName: "",
    accountNumber: "",
    routingNumber: "",
    swiftBic: "",
    country: "",
  };
}

/** The statuses a creator may switch between from the editor. */
const EDITABLE_STATUSES: { value: CampaignStatus; label: string }[] = [
  { value: "active", label: "Active — visible to everyone" },
  { value: "paused", label: "Paused — hidden from Explore" },
  { value: "closed", label: "Closed — no longer accepting support" },
];

export function EditCampaignPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: campaign, loading, error, refetch } = useCampaign(id);

  const [currentStep, setCurrentStep] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [status, setStatus] = useState<CampaignStatus>("active");

  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(editCampaignFormSchema),
    defaultValues: CAMPAIGN_FORM_DEFAULTS,
    mode: "onTouched",
  });

  const { isSubmitting } = form.formState;

  const steps = CAMPAIGN_FORM_STEPS;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  const activeStep = steps[currentStep];

  const stepperSteps = useMemo(
    () =>
      steps.map((s) => ({
        id: s.id,
        title: s.title,
        description: s.description,
      })),
    [steps]
  );

  // Ownership guard + form pre-population once the campaign loads.
  const isOwner = Boolean(
    campaign && user && campaign.creatorId && campaign.creatorId === user.id
  );

  useEffect(() => {
    if (!campaign) return;
    form.reset(campaignToFormValues(campaign));
    setStatus(
      campaign.status === "draft" ? "active" : (campaign.status as CampaignStatus)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaign]);

  // Redirect non-owners to the public detail page once we know the answer.
  useEffect(() => {
    if (loading || authLoading) return;
    if (!campaign) return;
    if (!user || !isOwner) {
      navigate(`/campaigns/${campaign.id}`, { replace: true });
    }
  }, [loading, authLoading, campaign, user, isOwner, navigate]);

  /** Validate only the active step's fields before advancing. */
  const handleNext = async () => {
    setSubmitError(null);
    setSaved(false);

    // In edit mode, the bank step is optional unless a new account number was
    // entered — skip strict validation of an empty bank step.
    if (activeStep.id === "bankDetails" && !form.getValues("accountNumber")) {
      setCurrentStep((s) => Math.min(s + 1, steps.length - 1));
      return;
    }

    const valid = await form.trigger(
      activeStep.fields as unknown as (keyof CampaignFormValues)[]
    );
    if (!valid) return;
    setCurrentStep((s) => Math.min(s + 1, steps.length - 1));
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBack = () => {
    setSubmitError(null);
    setSaved(false);
    setCurrentStep((s) => Math.max(s - 1, 0));
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  /**
   * Persist edits. Patches the campaign row, optionally re-saves bank details
   * (only when a new account number is provided), and applies the chosen
   * status. `publishCampaign` is used for the draft→active transition so the
   * same server logic runs; other transitions go through updateCampaign.
   */
  const handleSubmit = async (values: CampaignFormValues) => {
    if (!campaign) return;
    setSubmitError(null);
    setSaved(false);

    try {
      // 1. Patch editable campaign fields.
      await updateCampaign(campaign.id, {
        title: values.title,
        description: values.description,
        category: values.category,
        targetAudience: values.targetAudience,
        longDescription: values.longDescription,
        story: values.story,
        coverImageUrl: values.coverImageUrl,
        mediaUrls: values.mediaUrls,
        goalAmount: values.goalAmount,
        currency: values.currency,
        deadline: values.deadline,
        donorWallEnabled: values.donorWallEnabled,
      });

      // 2. Re-save bank details only if a fresh account number was entered.
      if (values.accountNumber && values.accountNumber.trim().length > 0) {
        await saveBankDetails({
          campaignId: campaign.id,
          accountHolderName: values.accountHolderName,
          bankName: values.bankName,
          accountNumber: values.accountNumber,
          routingNumber: values.routingNumber || undefined,
          swiftBic: values.swiftBic || undefined,
          country: values.country,
        });
      }

      // 3. Apply status change.
      if (status !== campaign.status) {
        if (status === "active") {
          await publishCampaign(campaign.id);
        } else {
          await updateCampaign(campaign.id, {
            // status isn't part of CampaignFormValues; cast through a partial.
            // updateCampaign's toCampaignRow ignores unknown keys, so we call
            // it with a status-only patch via a targeted helper.
          } as Partial<CampaignFormValues>);
          await updateCampaignStatus(campaign.id, status);
        }
      }

      setSaved(true);
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Something went wrong while saving your changes. Please try again."
      );
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  // ── Loading ────────────────────────────────────────────────────────────
  if (loading || authLoading) {
    return (
      <section className="container mx-auto flex min-h-[50vh] items-center justify-center px-4 py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </section>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────
  if (error && !campaign) {
    return (
      <section className="container mx-auto flex min-h-[50vh] flex-col items-center justify-center px-4 py-16 text-center">
        <span
          role="alert"
          className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive"
        >
          <AlertCircle className="h-8 w-8" />
        </span>
        <h1 className="mt-6 text-2xl font-semibold text-foreground">
          Couldn&apos;t load this campaign
        </h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">{error}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button onClick={refetch}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
          <Button asChild variant="outline">
            <Link to="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </section>
    );
  }

  // ── Not found ──────────────────────────────────────────────────────────
  if (!campaign) {
    return (
      <section className="container mx-auto flex min-h-[50vh] flex-col items-center justify-center px-4 py-16 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
          <SearchX className="h-8 w-8" />
        </span>
        <h1 className="mt-6 text-2xl font-semibold text-foreground">
          Campaign not found
        </h1>
        <Button asChild className="mt-8">
          <Link to="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </section>
    );
  }

  // While the redirect effect runs for non-owners, render nothing.
  if (!isOwner) return null;

  return (
    <section className="container mx-auto max-w-3xl px-4 py-10">
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="mb-6 -ml-2 text-muted-foreground"
      >
        <Link to="/dashboard">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Dashboard
        </Link>
      </Button>

      <PageHeader
        eyebrow="Manage campaign"
        title="Edit your campaign"
        description="Update your campaign details, media, goal, and visibility. Leave bank fields blank to keep your existing disbursement details."
      />

      <div className="mt-8">
        <CampaignFormStepper
          steps={stepperSteps}
          currentStep={currentStep}
          onStepClick={(index) => {
            if (index < currentStep) {
              setSubmitError(null);
              setSaved(false);
              setCurrentStep(index);
            }
          }}
        />
      </div>

      <Card className="mt-8">
        <CardContent className="pt-6">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              noValidate
              className="space-y-6"
            >
              {submitError ? (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{submitError}</span>
                </div>
              ) : null}

              {saved ? (
                <div
                  role="status"
                  className="flex items-start gap-2 rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-foreground"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>Your changes have been saved.</span>
                </div>
              ) : null}

              {/* Active step heading */}
              <div className="space-y-1">
                <h2 className="text-xl font-semibold text-foreground">
                  {activeStep.title}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {activeStep.id === "bankDetails"
                    ? "Leave these fields blank to keep your existing bank details, or enter a new account number to replace them."
                    : activeStep.description}
                </p>
              </div>

              {/* Active step fields */}
              <ActiveStep stepId={activeStep.id} />

              {/* Navigation controls */}
              <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={isFirstStep || isSubmitting}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>

                {isLastStep ? (
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving…
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save changes
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={isSubmitting}
                  >
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Status / visibility control — separate from the wizard flow. */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Campaign status</CardTitle>
          <CardDescription>
            Control whether your campaign is publicly visible. Changes take
            effect when you save above.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-sm space-y-2">
            <Select
              value={status}
              onValueChange={(value) => {
                setStatus(value as CampaignStatus);
                setSaved(false);
              }}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {EDITABLE_STATUSES.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Current status:{" "}
              <span className="font-medium text-foreground">
                {campaign.status}
              </span>
            </p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

/**
 * Small helper to patch only the `status` column. Kept local (rather than
 * widening CampaignFormValues) so the wizard's typed patch surface stays clean.
 * Uses the shared typed client and relies on RLS to enforce ownership.
 */
async function updateCampaignStatus(
  campaignId: string,
  status: CampaignStatus
): Promise<void> {
  const { supabase } = await import("@/integrations/supabase/client");
  const { error } = await supabase
    .from("campaigns")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", campaignId);
  if (error) throw new Error(error.message);
}

export default EditCampaignPage;
