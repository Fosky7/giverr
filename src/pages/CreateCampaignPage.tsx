// src/pages/CreateCampaignPage.tsx
//
// Orchestrator for the multi-step Create Campaign wizard (Module 4).
//
// Owns a SINGLE react-hook-form instance seeded with CAMPAIGN_FORM_DEFAULTS and
// validated by the per-step zod schemas. It renders the CampaignFormStepper and
// the active step component, and manages Next/Back navigation:
//   * Next validates only the current step's fields (form.trigger(fields)) so
//     untouched later steps never block progress.
//   * On the final step, submit runs full validation, then:
//       1. createCampaign(draft)   → inserts the campaigns row (status: draft)
//       2. saveBankDetails(...)     → secure edge function writes bank details
//       3. publishCampaign(id)      → flips status to active
//     and navigates to /campaigns/:id.
//
// Media in Step 2 is uploaded eagerly by the MediaUploader/RichTextEditor step
// components, which store the returned public URLs into form state.

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Rocket,
} from "lucide-react";

import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
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
import type { CampaignFormValues } from "@/types/campaign";
import {
  createCampaign,
  publishCampaign,
  saveBankDetails,
} from "@/services/campaigns";

/** Render the step component that matches the active step id. */
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

export function CreateCampaignPage() {
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignFormSchema),
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

  /** Validate only the active step's fields before advancing. */
  const handleNext = async () => {
    setSubmitError(null);
    const valid = await form.trigger(
      activeStep.fields as unknown as (keyof CampaignFormValues)[]
    );
    if (!valid) return;
    setCurrentStep((s) => Math.min(s + 1, steps.length - 1));
    // Scroll to top so the next step's fields are visible.
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBack = () => {
    setSubmitError(null);
    setCurrentStep((s) => Math.max(s - 1, 0));
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  /**
   * Final submit. Runs only on the last step (the form's onSubmit is bound to
   * the primary button which is type=submit only when isLastStep).
   */
  const handleSubmit = async (values: CampaignFormValues) => {
    setSubmitError(null);

    try {
      // 1. Create the draft campaign row.
      const campaign = await createCampaign({
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

      // 2. Persist bank details securely via the edge function.
      await saveBankDetails({
        campaignId: campaign.id,
        accountHolderName: values.accountHolderName,
        bankName: values.bankName,
        accountNumber: values.accountNumber,
        routingNumber: values.routingNumber || undefined,
        swiftBic: values.swiftBic || undefined,
        country: values.country,
      });

      // 3. Publish so it appears publicly.
      await publishCampaign(campaign.id);

      navigate(`/campaigns/${campaign.id}`);
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Something went wrong while creating your campaign. Please try again."
      );
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  };

  return (
    <section className="container mx-auto max-w-3xl px-4 py-10">
      <PageHeader
        eyebrow="Start a campaign"
        title="Create your campaign"
        description="Tell your story, set a goal, and start raising funds. You can edit most details later."
      />

      <div className="mt-8">
        <CampaignFormStepper
          steps={stepperSteps}
          currentStep={currentStep}
          onStepClick={(index) => {
            // Allow jumping back to any already-completed step.
            if (index < currentStep) {
              setSubmitError(null);
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

              {/* Active step heading */}
              <div className="space-y-1">
                <h2 className="text-xl font-semibold text-foreground">
                  {activeStep.title}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {activeStep.description}
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
                        Publishing…
                      </>
                    ) : (
                      <>
                        <Rocket className="mr-2 h-4 w-4" />
                        Publish Campaign
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
    </section>
  );
}

export default CreateCampaignPage;
