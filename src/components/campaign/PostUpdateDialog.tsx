// src/components/campaign/PostUpdateDialog.tsx
//
// Lightweight dialog for creators to publish a campaign update / blog post.
// Wraps a react-hook-form + zod validated form and calls createCampaignUpdate.
// On success it closes, resets, and notifies the parent so it can refetch the
// update feed if it's displaying one.

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, Loader2, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { createCampaignUpdate } from "@/services/campaigns";
import type { CampaignUpdate } from "@/types/campaign";

/** Validation for the update form — a concise title and a body. */
const updateSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Give your update a short title.")
    .max(120, "Title must be 120 characters or fewer."),
  body: z
    .string()
    .trim()
    .min(10, "Write at least a sentence for your update.")
    .max(5000, "Update is too long."),
});

type UpdateFormValues = z.infer<typeof updateSchema>;

interface PostUpdateDialogProps {
  campaignId: string;
  campaignTitle: string;
  /** Controlled open state. */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the created update after a successful post. */
  onPosted?: (update: CampaignUpdate) => void;
}

/**
 * Dialog form that posts a new campaign update. Kept controlled so the
 * management card can own the open/close state alongside its own action menu.
 */
export function PostUpdateDialog({
  campaignId,
  campaignTitle,
  open,
  onOpenChange,
  onPosted,
}: PostUpdateDialogProps) {
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm<UpdateFormValues>({
    resolver: zodResolver(updateSchema),
    defaultValues: { title: "", body: "" },
    mode: "onSubmit",
  });

  const { isSubmitting } = form.formState;

  const handleSubmit = async (values: UpdateFormValues) => {
    setFormError(null);
    try {
      const update = await createCampaignUpdate(campaignId, {
        title: values.title.trim(),
        body: values.body.trim(),
      });
      onPosted?.(update);
      form.reset();
      onOpenChange(false);
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "Couldn't post your update. Please try again."
      );
    }
  };

  // Reset transient state whenever the dialog is dismissed.
  const handleOpenChange = (next: boolean) => {
    if (!next && !isSubmitting) {
      form.reset();
      setFormError(null);
    }
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Post an update</DialogTitle>
          <DialogDescription>
            Share progress or news with supporters of{" "}
            <span className="font-medium text-foreground">{campaignTitle}</span>.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            noValidate
            className="space-y-4"
          >
            {formError ? (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            ) : null}

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. We hit 50% of our goal!"
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Update</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell supporters what's new…"
                      rows={6}
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    This will appear in the Updates section of your campaign
                    page.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Posting…
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Post update
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default PostUpdateDialog;
