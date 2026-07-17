// src/components/campaign/CampaignFormSteps/Step2Details.tsx
//
// Wizard Step 2 — Details. Collects the rich long description and campaign
// story via the RichTextEditor, plus a required cover image and optional
// gallery/video media through the MediaUploader. All state lives in the shared
// react-hook-form context; validation is centralized in detailsSchema.

import { useFormContext } from "react-hook-form";

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RichTextEditor } from "@/components/campaign/RichTextEditor";
import { MediaUploader } from "@/components/campaign/MediaUploader";
import type { CampaignFormValues } from "@/types/campaign";

interface StepProps {
  disabled?: boolean;
}

/**
 * Step 2 lets creators tell their story. The long description is the primary
 * narrative rendered on the detail page; the optional story field adds extra
 * context. A cover image is required and additional media is optional.
 */
export function Step2Details({ disabled }: StepProps) {
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
                onBlur={field.onBlur}
                disabled={disabled}
                placeholder="Describe your campaign in detail — what you're raising for, why it matters, and how funds will be used."
              />
            </FormControl>
            <FormDescription>
              This is the main content shown on your campaign page. Use headings
              and lists to make it easy to read.
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
            <FormLabel>Your story (optional)</FormLabel>
            <FormControl>
              <RichTextEditor
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                disabled={disabled}
                placeholder="Share the personal story behind this campaign…"
              />
            </FormControl>
            <FormDescription>
              A personal story helps supporters connect with your cause.
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
              {/* Single-file uploader: MediaUploader returns the public URL(s)
                  from the campaign-media bucket. We store the first as cover. */}
              <MediaUploader
                value={field.value ? [field.value] : []}
                onChange={(urls) => field.onChange(urls[0] ?? "")}
                multiple={false}
                accept="image/*"
                disabled={disabled}
                label="Upload a cover image"
                helperText="A high-quality banner image (JPG or PNG, up to 5MB) shown at the top of your campaign."
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="mediaUrls"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Gallery &amp; videos (optional)</FormLabel>
            <FormControl>
              <MediaUploader
                value={field.value ?? []}
                onChange={field.onChange}
                multiple
                accept="image/*,video/*"
                disabled={disabled}
                label="Add more images or videos"
                helperText="Additional media to bring your campaign to life."
              />
            </FormControl>
            <FormDescription>
              Supporters engage more with campaigns that include photos and
              video.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}

export default Step2Details;
