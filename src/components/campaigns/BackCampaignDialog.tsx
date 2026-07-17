// src/components/campaigns/BackCampaignDialog.tsx
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { AlertCircle, CheckCircle2, HeartHandshake, Loader2 } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { useDonateToCampaign } from "@/hooks/useDonations";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  PRESET_DONATION_AMOUNTS,
  type Donation,
} from "@/types/donation";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

/** Per-field client-side validation errors. */
interface FieldErrors {
  amount?: string;
  displayName?: string;
}

export interface BackCampaignDialogProps {
  /** Controlled open state. */
  open: boolean;
  /** Open/close handler (also fired on overlay / escape). */
  onOpenChange: (open: boolean) => void;
  /** Campaign being backed. */
  campaignId: string;
  /** Campaign title, shown in the dialog copy. */
  campaignTitle: string;
  /**
   * Called after a successful contribution so the parent can refetch campaign
   * totals (raisedAmount + backersCount) and recent backers.
   */
  onSuccess?: (donation: Donation) => void;
}

/** Best-effort friendly first name / handle from the auth profile metadata. */
function deriveDefaultName(
  user: ReturnType<typeof useAuth>["user"]
): string {
  if (!user) return "";
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const candidate =
    (typeof meta.full_name === "string" && meta.full_name) ||
    (typeof meta.name === "string" && meta.name) ||
    (typeof meta.display_name === "string" && meta.display_name) ||
    "";
  if (candidate) return candidate;
  // Fall back to the local part of the email address.
  return user.email ? user.email.split("@")[0] : "";
}

/**
 * BackCampaignDialog — the Module 4 contribution form.
 *
 * Reuses the form patterns from Start.tsx: client-side validation with inline
 * per-field errors, a Loader2 submit spinner, and disabled inputs while
 * submitting. Offers preset amount chips plus a custom amount, an optional
 * display name (prefilled from the signed-in profile), and an optional message.
 *
 * On success it swaps to a CheckCircle2 thank-you state and fires `onSuccess`
 * so the parent (CampaignDetail) can refetch totals.
 */
export function BackCampaignDialog({
  open,
  onOpenChange,
  campaignId,
  campaignTitle,
  onSuccess,
}: BackCampaignDialogProps) {
  const { user } = useAuth();
  const { donate, submitting, error: serverError, reset } =
    useDonateToCampaign();

  const defaultName = useMemo(() => deriveDefaultName(user), [user]);

  const [selectedPreset, setSelectedPreset] = useState<number | null>(
    PRESET_DONATION_AMOUNTS[1] ?? null
  );
  const [customAmount, setCustomAmount] = useState("");
  const [displayName, setDisplayName] = useState(defaultName);
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [completed, setCompleted] = useState<Donation | null>(null);

  // Reset the form each time the dialog is (re)opened so a fresh contribution
  // starts clean and the prefilled name reflects the current auth state.
  useEffect(() => {
    if (open) {
      setSelectedPreset(PRESET_DONATION_AMOUNTS[1] ?? null);
      setCustomAmount("");
      setDisplayName(defaultName);
      setMessage("");
      setFieldErrors({});
      setCompleted(null);
      reset();
    }
  }, [open, defaultName, reset]);

  /** Resolve the effective amount from either a preset chip or custom input. */
  const effectiveAmount = (): number => {
    if (customAmount.trim()) return Number(customAmount);
    return selectedPreset ?? NaN;
  };

  const handlePresetClick = (amount: number) => {
    setSelectedPreset(amount);
    setCustomAmount("");
    setFieldErrors((prev) => ({ ...prev, amount: undefined }));
  };

  const handleCustomChange = (value: string) => {
    setCustomAmount(value);
    if (value.trim()) setSelectedPreset(null);
    setFieldErrors((prev) => ({ ...prev, amount: undefined }));
  };

  const validate = (): FieldErrors => {
    const errors: FieldErrors = {};
    const amount = effectiveAmount();
    if (!Number.isFinite(amount) || amount <= 0) {
      errors.amount = "Please choose or enter a positive amount.";
    }
    if (displayName.length > 80) {
      errors.displayName = "Display name must be 80 characters or fewer.";
    }
    return errors;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      const donation = await donate({
        campaignId,
        amount: effectiveAmount(),
        displayName: displayName.trim() || undefined,
        message: message.trim() || undefined,
      });
      setCompleted(donation);
      onSuccess?.(donation);
    } catch {
      // Error surfaced inline via `serverError` from the hook.
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {completed ? (
          // ── Success / thank-you state ──────────────────────────────────────
          <div className="flex flex-col items-center text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <CheckCircle2 className="h-7 w-7" />
            </span>
            <DialogHeader className="mt-4 space-y-2">
              <DialogTitle className="text-center">Thank you!</DialogTitle>
              <DialogDescription className="text-center">
                Your contribution of{" "}
                <span className="font-semibold text-foreground">
                  {currency.format(completed.amount)}
                </span>{" "}
                to{" "}
                <span className="font-medium text-foreground">
                  {campaignTitle}
                </span>{" "}
                has been recorded. You&apos;re making a real difference.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-6 w-full">
              <Button
                type="button"
                className="w-full"
                onClick={() => onOpenChange(false)}
              >
                Done
              </Button>
            </DialogFooter>
          </div>
        ) : (
          // ── Contribution form ──────────────────────────────────────────────
          <form onSubmit={handleSubmit} noValidate>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <HeartHandshake className="h-5 w-5 text-primary" />
                Back this campaign
              </DialogTitle>
              <DialogDescription>
                Support{" "}
                <span className="font-medium text-foreground">
                  {campaignTitle}
                </span>{" "}
                with a contribution of any size.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 space-y-5">
              {serverError ? (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{serverError}</span>
                </div>
              ) : null}

              {/* Amount: preset chips + custom */}
              <div className="space-y-2">
                <Label>Contribution amount (USD)</Label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_DONATION_AMOUNTS.map((amount) => {
                    const active =
                      !customAmount.trim() && selectedPreset === amount;
                    return (
                      <Button
                        key={amount}
                        type="button"
                        size="sm"
                        variant={active ? "default" : "outline"}
                        className={cn("rounded-full", active && "shadow-sm")}
                        onClick={() => handlePresetClick(amount)}
                        disabled={submitting}
                      >
                        {currency.format(amount)}
                      </Button>
                    );
                  })}
                </div>
                <Input
                  id="customAmount"
                  type="number"
                  min="1"
                  step="1"
                  inputMode="decimal"
                  placeholder="Or enter a custom amount"
                  value={customAmount}
                  onChange={(e) => handleCustomChange(e.target.value)}
                  disabled={submitting}
                  aria-invalid={Boolean(fieldErrors.amount)}
                  className={cn(fieldErrors.amount && "border-destructive")}
                />
                {fieldErrors.amount ? (
                  <p className="text-sm text-destructive">
                    {fieldErrors.amount}
                  </p>
                ) : null}
              </div>

              {/* Display name */}
              <div className="space-y-2">
                <Label htmlFor="displayName">
                  Display name{" "}
                  <span className="font-normal text-muted-foreground">
                    (optional)
                  </span>
                </Label>
                <Input
                  id="displayName"
                  placeholder="Shown publicly with your support"
                  value={displayName}
                  onChange={(e) => {
                    setDisplayName(e.target.value);
                    setFieldErrors((prev) => ({
                      ...prev,
                      displayName: undefined,
                    }));
                  }}
                  disabled={submitting}
                  aria-invalid={Boolean(fieldErrors.displayName)}
                  className={cn(fieldErrors.displayName && "border-destructive")}
                />
                {fieldErrors.displayName ? (
                  <p className="text-sm text-destructive">
                    {fieldErrors.displayName}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Leave blank to appear as “Anonymous”.
                  </p>
                )}
              </div>

              {/* Message */}
              <div className="space-y-2">
                <Label htmlFor="message">
                  Message{" "}
                  <span className="font-normal text-muted-foreground">
                    (optional)
                  </span>
                </Label>
                <Textarea
                  id="message"
                  rows={3}
                  placeholder="Add a note of encouragement…"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={submitting}
                  maxLength={280}
                />
              </div>
            </div>

            <DialogFooter className="mt-6 gap-2 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing…
                  </>
                ) : (
                  <>
                    <HeartHandshake className="mr-2 h-4 w-4" />
                    Contribute
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default BackCampaignDialog;
