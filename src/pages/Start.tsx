// src/pages/Start.tsx
import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AlertCircle, Info, Loader2, Rocket } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { CAMPAIGN_CATEGORIES } from "@/types/campaign";
import { createCampaign } from "@/services/campaigns";

/** Local shape of the create-campaign form. */
interface CampaignFormState {
  title: string;
  category: string;
  goalAmount: string;
  description: string;
}

const INITIAL_STATE: CampaignFormState = {
  title: "",
  category: "",
  goalAmount: "",
  description: "",
};

/** Per-field validation errors keyed by form field. */
type FieldErrors = Partial<Record<keyof CampaignFormState, string>>;

/**
 * Validate the form client-side, returning a map of field → message. An empty
 * object means the form is valid. Mirrors the inline-error pattern used by
 * AuthForm/ForgotPassword.
 */
function validate(form: CampaignFormState): FieldErrors {
  const errors: FieldErrors = {};

  if (!form.title.trim()) {
    errors.title = "Please enter a campaign title.";
  }

  if (!form.category) {
    errors.category = "Please choose a category.";
  }

  const goal = Number(form.goalAmount);
  if (!form.goalAmount.trim()) {
    errors.goalAmount = "Please enter a funding goal.";
  } else if (!Number.isFinite(goal) || goal <= 0) {
    errors.goalAmount = "Funding goal must be a positive number.";
  }

  if (!form.description.trim()) {
    errors.description = "Please add a short description.";
  }

  return errors;
}

/**
 * Start a Campaign page. A real, auth-gated create-campaign form:
 *  - Client-side validation with inline per-field errors.
 *  - Unauthenticated users are redirected to /login on submit, preserving
 *    intent via router state (so the app can return them here afterwards).
 *  - Authenticated submit persists via {@link createCampaign}, shows a loading
 *    spinner, surfaces server errors inline, and navigates to the new
 *    campaign's detail page on success.
 */
export function Start() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState<CampaignFormState>(INITIAL_STATE);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (field: keyof CampaignFormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Clear the field's error as the user edits it.
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setServerError(null);

    // Gate on auth: bounce to /login preserving where we came from so the
    // login flow can bring the user back to /start.
    if (!user) {
      navigate("/login", { state: { from: location.pathname } });
      return;
    }

    const errors = validate(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    setSubmitting(true);
    try {
      const campaign = await createCampaign({
        title: form.title,
        category: form.category,
        goalAmount: Number(form.goalAmount),
        description: form.description,
      });
      navigate(`/campaigns/${campaign.id}`);
    } catch (err) {
      setServerError(
        err instanceof Error
          ? err.message
          : "Something went wrong while publishing your campaign. Please try again."
      );
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Start a Campaign"
        description="Tell the community what you're raising for. Fill in the essentials to publish your campaign."
        eyebrow={
          <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5 text-sm font-medium text-secondary-foreground">
            <Rocket className="h-4 w-4" />
            Launch your idea
          </span>
        }
      />

      <section className="container mx-auto px-4 py-14">
        <div className="mx-auto max-w-2xl">
          {/* Auth gating notice for signed-out visitors. */}
          {!user ? (
            <div className="mb-8 flex items-start gap-3 rounded-lg border border-border bg-secondary/40 p-4">
              <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
              <p className="text-sm text-muted-foreground">
                Publishing a campaign requires an account. Please{" "}
                <Link
                  to="/login"
                  state={{ from: location.pathname }}
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  log in
                </Link>{" "}
                to publish. You can still draft the details below.
              </p>
            </div>
          ) : null}

          {/* Server-side error (create failure). */}
          {serverError ? (
            <div
              role="alert"
              className="mb-6 flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{serverError}</span>
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <div className="space-y-2">
              <Label htmlFor="title">Campaign title</Label>
              <Input
                id="title"
                name="title"
                placeholder="e.g. Clean water for Riverside village"
                value={form.title}
                onChange={(e) => handleChange("title", e.target.value)}
                disabled={submitting}
                aria-invalid={Boolean(fieldErrors.title)}
                className={cn(fieldErrors.title && "border-destructive")}
              />
              {fieldErrors.title ? (
                <p className="text-sm text-destructive">{fieldErrors.title}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={form.category}
                onValueChange={(value) => handleChange("category", value)}
                disabled={submitting}
              >
                <SelectTrigger
                  id="category"
                  aria-invalid={Boolean(fieldErrors.category)}
                  className={cn(fieldErrors.category && "border-destructive")}
                >
                  <SelectValue placeholder="Choose a category" />
                </SelectTrigger>
                <SelectContent>
                  {CAMPAIGN_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldErrors.category ? (
                <p className="text-sm text-destructive">
                  {fieldErrors.category}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="goalAmount">Funding goal (USD)</Label>
              <Input
                id="goalAmount"
                name="goalAmount"
                type="number"
                min="1"
                inputMode="decimal"
                placeholder="e.g. 5000"
                value={form.goalAmount}
                onChange={(e) => handleChange("goalAmount", e.target.value)}
                disabled={submitting}
                aria-invalid={Boolean(fieldErrors.goalAmount)}
                className={cn(fieldErrors.goalAmount && "border-destructive")}
              />
              {fieldErrors.goalAmount ? (
                <p className="text-sm text-destructive">
                  {fieldErrors.goalAmount}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Short description</Label>
              <Textarea
                id="description"
                name="description"
                rows={5}
                placeholder="Briefly describe your campaign and why it matters."
                value={form.description}
                onChange={(e) => handleChange("description", e.target.value)}
                disabled={submitting}
                aria-invalid={Boolean(fieldErrors.description)}
                className={cn(fieldErrors.description && "border-destructive")}
              />
              {fieldErrors.description ? (
                <p className="text-sm text-destructive">
                  {fieldErrors.description}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button type="submit" size="lg" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Publishing…
                  </>
                ) : (
                  <>
                    <Rocket className="mr-2 h-5 w-5" />
                    {user ? "Publish campaign" : "Continue"}
                  </>
                )}
              </Button>
              {!user ? (
                <Button asChild variant="outline" size="lg">
                  <Link to="/login" state={{ from: location.pathname }}>
                    Log in to publish
                  </Link>
                </Button>
              ) : null}
            </div>
          </form>
        </div>
      </section>
    </>
  );
}

export default Start;
