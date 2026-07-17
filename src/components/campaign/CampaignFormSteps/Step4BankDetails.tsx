// src/components/campaign/CampaignFormSteps/Step4BankDetails.tsx
//
// Wizard Step 4 — Bank Details. Collects the disbursement account. A prominent
// security notice explains that these details are transmitted over an
// encrypted connection and stored server-side via the `save-bank-details` edge
// function — the full account number is never exposed to the browser after
// submission (only the last 4 digits are retained for display).
//
// This step renders inputs bound to the shared react-hook-form context;
// validation lives in bankDetailsSchema. The actual saveBankDetails() call is
// performed by the orchestrator on final submit, not here.

import { useFormContext } from "react-hook-form";
import { ShieldCheck } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { COUNTRY_OPTIONS } from "@/components/campaign/campaignFormSchema";
import type { CampaignFormValues } from "@/types/campaign";

interface StepProps {
  disabled?: boolean;
}

/**
 * Step 4 captures where funds will be disbursed. Sensitive by nature, so we
 * lead with a clear security notice and use appropriate autocomplete/inputmode
 * attributes. Nothing sensitive is logged or stored client-side.
 */
export function Step4BankDetails({ disabled }: StepProps) {
  const form = useFormContext<CampaignFormValues>();

  return (
    <div className="space-y-6">
      {/* Security notice — reassures creators and sets expectations. */}
      <div className="flex items-start gap-3 rounded-lg border border-primary/40 bg-primary/10 px-4 py-3 text-sm">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div className="space-y-1">
          <p className="font-medium text-foreground">
            Your banking information is secure
          </p>
          <p className="text-muted-foreground">
            These details are sent over an encrypted connection and stored
            securely on our servers. For your protection, only the last 4 digits
            of your account number are ever shown back to you.
          </p>
        </div>
      </div>

      <FormField
        control={form.control}
        name="accountHolderName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Account holder name</FormLabel>
            <FormControl>
              <Input
                placeholder="Full name as it appears on the account"
                autoComplete="name"
                disabled={disabled}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="bankName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Bank name</FormLabel>
            <FormControl>
              <Input
                placeholder="e.g. First National Bank"
                autoComplete="off"
                disabled={disabled}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="accountNumber"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Account number</FormLabel>
            <FormControl>
              <Input
                inputMode="numeric"
                autoComplete="off"
                placeholder="Your bank account number"
                disabled={disabled}
                {...field}
              />
            </FormControl>
            <FormDescription>
              We&apos;ll only ever display the last 4 digits after saving.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="routingNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Routing number / IBAN (optional)</FormLabel>
              <FormControl>
                <Input
                  autoComplete="off"
                  placeholder="Routing number or IBAN"
                  disabled={disabled}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="swiftBic"
          render={({ field }) => (
            <FormItem>
              <FormLabel>SWIFT / BIC (optional)</FormLabel>
              <FormControl>
                <Input
                  autoComplete="off"
                  placeholder="For international transfers"
                  disabled={disabled}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="country"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Bank country</FormLabel>
            <Select
              value={field.value || undefined}
              onValueChange={field.onChange}
              disabled={disabled}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select the account's country" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {COUNTRY_OPTIONS.map((country) => (
                  <SelectItem key={country} value={country}>
                    {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

export default Step4BankDetails;
