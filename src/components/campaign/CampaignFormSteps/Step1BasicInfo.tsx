// src/components/campaign/CampaignFormSteps/Step1BasicInfo.tsx
//
// Wizard Step 1 — Basic Info. A controlled fragment of the shared Create
// Campaign form: it reads the react-hook-form context via useFormContext and
// wires each field through the Shadcn FormField primitives. Validation is
// centralized in `campaignFormSchema.ts` (basicInfoSchema); this component only
// renders inputs and messages.

import { useFormContext } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { CAMPAIGN_CATEGORIES } from "@/components/campaign/campaignFormSchema";
import type { CampaignFormValues } from "@/types/campaign";

interface StepProps {
  /** Disables all inputs (e.g. while the wizard is submitting). */
  disabled?: boolean;
}

/**
 * Step 1 collects the campaign's headline details: a clear title, a short
 * summary shown on cards, the category, and the intended audience.
 */
export function Step1BasicInfo({ disabled }: StepProps) {
  // The orchestrator owns the single useForm instance and wraps steps in
  // <Form {...form}>, so we read the shared context here.
  const form = useFormContext<CampaignFormValues>();

  const description = form.watch("description") ?? "";

  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Campaign title</FormLabel>
            <FormControl>
              <Input
                placeholder="e.g. Help rebuild the Riverside Community Library"
                autoComplete="off"
                disabled={disabled}
                {...field}
              />
            </FormControl>
            <FormDescription>
              A clear, specific title helps supporters understand your cause at a
              glance.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Short description</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Summarize your campaign in a sentence or two…"
                rows={3}
                maxLength={280}
                disabled={disabled}
                {...field}
              />
            </FormControl>
            <FormDescription className="flex items-center justify-between">
              <span>This appears on campaign cards and previews.</span>
              <span className="tabular-nums text-muted-foreground">
                {description.length}/280
              </span>
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="category"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Category</FormLabel>
            <Select
              value={field.value || undefined}
              onValueChange={field.onChange}
              disabled={disabled}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a category" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {CAMPAIGN_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormDescription>
              Categorizing your campaign helps the right supporters discover it.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="targetAudience"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Target audience</FormLabel>
            <FormControl>
              <Input
                placeholder="e.g. Local families, students, small businesses"
                autoComplete="off"
                disabled={disabled}
                {...field}
              />
            </FormControl>
            <FormDescription>
              Who benefits from this campaign, or who you hope will support it.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

export default Step1BasicInfo;
