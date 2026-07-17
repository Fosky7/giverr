// src/components/campaign/CampaignFormSteps/Step3GoalDeadline.tsx
//
// Wizard Step 3 — Goal & Deadline. Collects the numeric fundraising goal (with
// a currency-aware symbol prefix), the currency, the campaign deadline via the
// DatePicker, and the donor-wall preference. All bound to the shared
// react-hook-form context; validated by goalDeadlineSchema.

import { useFormContext } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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
import { DatePicker } from "@/components/ui/date-picker";
import { CURRENCY_OPTIONS } from "@/components/campaign/campaignFormSchema";
import type { CampaignCurrency, CampaignFormValues } from "@/types/campaign";

interface StepProps {
  disabled?: boolean;
}

/**
 * Step 3 sets the financial target and timeline. The goal input shows the
 * currency symbol as a prefix so creators see amounts in context, and the
 * deadline picker prevents choosing past dates.
 */
export function Step3GoalDeadline({ disabled }: StepProps) {
  const form = useFormContext<CampaignFormValues>();

  const currency = form.watch("currency") as CampaignCurrency;
  const symbol =
    CURRENCY_OPTIONS.find((c) => c.value === currency)?.symbol ?? "$";

  // Disable dates before tomorrow — deadlines must be in the future.
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-[1fr_220px]">
        <FormField
          control={form.control}
          name="goalAmount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fundraising goal</FormLabel>
              <FormControl>
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm font-medium text-muted-foreground">
                    {symbol}
                  </span>
                  <Input
                    type="number"
                    inputMode="decimal"
                    min={1}
                    step="any"
                    placeholder="10,000"
                    className="pl-9"
                    disabled={disabled}
                    value={
                      field.value === 0 || field.value === undefined
                        ? ""
                        : field.value
                    }
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === "" ? 0 : Number(e.target.value)
                      )
                    }
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                  />
                </div>
              </FormControl>
              <FormDescription>
                The total amount you aim to raise.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="currency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Currency</FormLabel>
              <Select
                value={field.value || undefined}
                onValueChange={field.onChange}
                disabled={disabled}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Currency" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {CURRENCY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="deadline"
        render={({ field }) => (
          <FormItem className="flex flex-col">
            <FormLabel>Deadline</FormLabel>
            <FormControl>
              <DatePicker
                // Store an ISO date string in the form; DatePicker works with Date.
                value={field.value ? new Date(field.value) : undefined}
                onChange={(date) =>
                  field.onChange(date ? date.toISOString() : "")
                }
                disabled={disabled}
                placeholder="Pick an end date"
                fromDate={startOfToday}
              />
            </FormControl>
            <FormDescription>
              Campaigns run until this date. Choose a realistic timeframe.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="donorWallEnabled"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border/60 p-4">
            <div className="space-y-0.5 pr-4">
              <FormLabel>Show a donor wall</FormLabel>
              <FormDescription>
                Display supporters on your campaign page. Donors can still choose
                to remain anonymous.
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={disabled}
              />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  );
}

export default Step3GoalDeadline;
