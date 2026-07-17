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
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { CAMPAIGN_CATEGORIES } from "@/types/campaign";
import { createCampaign } from "@/services/campaigns";

/** Local shape of the create-campaign form. */
interface CampaignFormState {
  title: string;
  /** Multi-select category selection (checkable chips). */
  categories: string[];
  goalAmount: string;
  description: string;
}

const INITIAL_STATE: CampaignFormState = {
  title: "",
  categories: [],
  goalAmount: "",
  description: "",
};

/** Per-field validation errors keyed by form field. */
type FieldErrors = Partial<Record<keyof CampaignFormState, string>>;

/** String-only fields editable via the generic {@link Start} `handleChange`. */
type StringField = "title" | "goalAmount" | "description";

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

  if (form.categories.length === 0) {
    errors.categories = "Please choose at least one category.";
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
 *  - Categories are a checkable (multi-select) group of checkbox chips; at
 *    least one selection is required.
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

  /** Clear a field's error (shared clear-on-edit helper). */
  const clearFieldError = (field: keyof CampaignFormState) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleChange = (field: StringField, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Clear the field's error as the user edits it.
    clearFieldError(field);
  };

  /**
   * Toggle a category in/out of the selection immutably, and clear any
   * existing categories error (mirrors the clear-on-edit pattern above).
   */
  const toggleCategory = (category: string) => {
    setForm((prev) => {
      const isSelected = prev.categories.includes(category);
      const categories = isSelected
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category];
      return { ...prev, categories };
    });
    clearFieldError("categories");
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
        // createCampaign currently accepts a single `category` string. Until a
        // categories[] column exists, deterministically send the primary
        // (first) selection to avoid silent data loss.
        category: form.categories[0],
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

            {/* Checkable multi-select category group (replaces the Select). */}
            <div className="space-y-2">
              <Label id="category-group-label" asChild>
                <span>Category</span>
              </Label>
              <div
                role="group"
                aria-labelledby="category-group-label"
                aria-invalid={Boolean(fieldErrors.categories)}
                className={cn(
                  "flex flex-wrap gap-2 rounded-md border border-input bg-background p-3",
                  fieldErrors.categories && "border-destructive"
                )}
              >
                {CAMPAIGN_CATEGORIES.map((category) => {
                  const checkboxId = `category-${category
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")}`;
                  const checked = form.categories.includes(category);
                  return (
                    <Label
                      key={category}
                      htmlFor={checkboxId}
                      className={cn(
                        "inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                        checked
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                        submitting && "cursor-not-allowed opacity-60"
                      )}
                    >
                      <Checkbox
                        id={checkboxId}
                        checked={checked}
                        onCheckedChange={() => toggleCategory(category)}
                        disabled={submitting}
                      />
                      {category}
                    </Label>
                  );
                })}
              </div>
              {fieldErrors.categories ? (
                <p className="text-sm text-destructive">
                  {fieldErrors.categories}
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
