// src/components/campaign/CampaignFormSteps.tsx
//
// Presentational step components for the multi-step Create/Edit Campaign wizard.
//
// Each step reads/writes the SINGLE react-hook-form instance owned by the
// orchestrator page (CreateCampaignPage / EditCampaignPage) via the shared
// FormContext (useFormContext), so no props need to be threaded through.
//
// Step 1 (Basic info) renders the campaign's `category` as a selectable
// shadcn Select dropdown backed by the shared CAMPAIGN_CATEGORIES constant
// (exported from src/types/campaign.ts). The control is fully controlled
// (value={field.value}) so the persisted category is shown on load in the
// Edit flow, and a missing selection is blocked by the per-step zod schema.

import { useFormContext } from "react-hook-form";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RichTextEditor } from "@/components/campaign/RichTextEditor";
import { MediaUploader } from "@/components/campaign/MediaUploader";
import { CAMPAIGN_CATEGORIES } from "@/types/campaign";
import type { CampaignFormValues } from "@/types/campaign";

/* ------------------------------------------------------------------------- *
 * Step 1 — Basic info
 * ------------------------------------------------------------------------- */

/**
 * Collects the campaign's title, short description, category, and target
 * audience. `category` renders as a selectable dropdown sourced from the
 * shared CAMPAIGN_CATEGORIES constant so it stays in sync with the Explore
 * filters. Shared by both the Create and Edit flows.
 */
export function Step1BasicInfo() {
  const form = useFormContext<CampaignFormValues>();

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
                placeholder="e.g. Help rebuild the community garden"
                autoComplete="off"
                {...field}
              />
            </FormControl>
            <FormDescription>
              A clear, compelling title that captures your cause.
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
                rows={3}
                placeholder="Summarize your campaign in a sentence or two."
                {...field}
              />
            </FormControl>
            <FormDescription>
              This appears on campaign cards and in search results.
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
            {/* Controlled Select — `value` reflects persisted category in the
                Edit flow; onValueChange writes back to form state. */}
            <Select
              value={field.value || undefined}
              onValueChange={field.onChange}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
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
              Choose the category that best fits your campaign.
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
                {...field}
              />
            </FormControl>
            <FormDescription>
              Who benefits from this campaign?
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

/* ------------------------------------------------------------------------- *
 * Step 2 — Details (rich text + media)
 * ------------------------------------------------------------------------- */

/**
 * Collects the long description, creator story (both rich text), a cover image,
 * and an optional media gallery. Media is uploaded eagerly by the uploader
 * components, which store the returned public URLs into form state.
 */
export function Step2Details() {
  const form = useFormContext<CampaignFormValues>();

  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="longDescription"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Full description</FormLabel>
            <FormControl>
              <RichTextEditor
                value={field.value}
                onChange={field.onChange}
                placeholder="Describe your campaign in detail…"
              />
            </FormControl>
            <FormDescription>
              Explain the who, what, and why behind your campaign.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="story"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Your story</FormLabel>
            <FormControl>
              <RichTextEditor
                value={field.value}
                onChange={field.onChange}
                placeholder="Share the personal story behind your cause…"
              />
            </FormControl>
            <FormDescription>
              A personal story helps backers connect with your cause.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="coverImageUrl"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Cover image</FormLabel>
            <FormControl>
              <MediaUploader
                value={field.value ? [field.value] : []}
                onChange={(urls) => field.onChange(urls[0] ?? "")}
                maxFiles={1}
                accept="image/*"
              />
            </FormControl>
            <FormDescription>
              A striking banner image shown at the top of your campaign.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="mediaUrls"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Gallery (optional)</FormLabel>
            <FormControl>
              <MediaUploader
                value={field.value}
                onChange={field.onChange}
                maxFiles={8}
              />
            </FormControl>
            <FormDescription>
              Add up to 8 additional photos or videos.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

/* ------------------------------------------------------------------------- *
 * Step 3 — Goal & deadline
 * ------------------------------------------------------------------------- */

/**
 * Collects the funding goal, currency, deadline, and the donor-wall toggle.
 */
export function Step3GoalDeadline() {
  const form = useFormContext<CampaignFormValues>();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-[1fr_140px]">
        <FormField
          control={form.control}
          name="goalAmount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Funding goal</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  step="1"
                  placeholder="10000"
                  value={field.value === 0 ? "" : field.value}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value === "" ? 0 : Number(e.target.value)
                    )
                  }
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                />
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
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="USD" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
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
          <FormItem>
            <FormLabel>Deadline</FormLabel>
            <FormControl>
              <Input type="date" {...field} />
            </FormControl>
            <FormDescription>
              When should your campaign stop accepting contributions?
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
            <div className="space-y-0.5">
              <FormLabel>Show donor wall</FormLabel>
              <FormDescription>
                Publicly display the backers who support your campaign.
              </FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  );
}

/* ------------------------------------------------------------------------- *
 * Step 4 — Bank details
 * ------------------------------------------------------------------------- */

/**
 * Collects disbursement bank details. In edit mode these are intentionally left
 * blank on load (the full account number never returns to the client) — leaving
 * the account number blank keeps existing details untouched.
 */
export function Step4BankDetails() {
  const form = useFormContext<CampaignFormValues>();

  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="accountHolderName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Account holder name</FormLabel>
            <FormControl>
              <Input placeholder="Full legal name" {...field} />
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
              <Input placeholder="e.g. First National Bank" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="accountNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Account number</FormLabel>
              <FormControl>
                <Input
                  placeholder="••••••••"
                  autoComplete="off"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="routingNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Routing number (optional)</FormLabel>
              <FormControl>
                <Input placeholder="9 digits" autoComplete="off" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="swiftBic"
          render={({ field }) => (
            <FormItem>
              <FormLabel>SWIFT / BIC (optional)</FormLabel>
              <FormControl>
                <Input placeholder="For international transfers" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="country"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Country</FormLabel>
              <FormControl>
                <Input placeholder="e.g. United States" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
