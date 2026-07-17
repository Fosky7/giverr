// src/components/profile/ProfileForm.tsx
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, CheckCircle2, Loader2, Save } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DEFAULT_NOTIFICATION_PREFERENCES } from "@/types/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { AvatarUploader } from "@/components/profile/AvatarUploader";

/** Validation schema for the editable profile fields. */
const profileSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, "Please enter your full name.")
    .max(80, "Name is too long."),
  bio: z.string().trim().max(500, "Bio must be 500 characters or fewer."),
  marketing: z.boolean(),
  campaignUpdates: z.boolean(),
  donationReceipts: z.boolean(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

/**
 * Reusable profile settings form. Reads initial values from the shared auth
 * `profile`, edits name/bio/notification preferences + avatar, upserts the
 * profiles row (RLS enforces auth.uid() = id), then calls refreshProfile so
 * the Header and dashboard reflect changes immediately.
 */
export function ProfileForm() {
  const { user, profile, refreshProfile } = useAuth();

  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: profile?.fullName ?? "",
      bio: profile?.bio ?? "",
      marketing:
        profile?.notificationPreferences.marketing ??
        DEFAULT_NOTIFICATION_PREFERENCES.marketing,
      campaignUpdates:
        profile?.notificationPreferences.campaignUpdates ??
        DEFAULT_NOTIFICATION_PREFERENCES.campaignUpdates,
      donationReceipts:
        profile?.notificationPreferences.donationReceipts ??
        DEFAULT_NOTIFICATION_PREFERENCES.donationReceipts,
    },
  });

  const { isSubmitting } = form.formState;

  // Re-sync form values when the profile finishes loading / changes.
  useEffect(() => {
    if (!profile) return;
    form.reset({
      full_name: profile.fullName ?? "",
      bio: profile.bio ?? "",
      marketing: profile.notificationPreferences.marketing,
      campaignUpdates: profile.notificationPreferences.campaignUpdates,
      donationReceipts: profile.notificationPreferences.donationReceipts,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  /**
   * Upsert the profiles row with the given partial fields. Centralizes the
   * insert-or-update logic so both the form submit and avatar upload reuse it.
   */
  const upsertProfile = async (fields: Record<string, unknown>) => {
    if (!user) return { error: "You must be signed in." };

    const { error } = await supabase.from("profiles").upsert(
      {
        id: user.id,
        email: user.email ?? null,
        ...fields,
      },
      { onConflict: "id" }
    );

    return { error: error ? error.message : null };
  };

  const handleSubmit = async (values: ProfileFormValues) => {
    setFormError(null);
    setSaved(false);

    const { error } = await upsertProfile({
      full_name: values.full_name.trim(),
      bio: values.bio.trim() || null,
      notification_preferences: {
        marketing: values.marketing,
        campaignUpdates: values.campaignUpdates,
        donationReceipts: values.donationReceipts,
      },
    });

    if (error) {
      setFormError(error);
      return;
    }

    await refreshProfile();
    setSaved(true);
  };

  /** Persist a newly-uploaded avatar URL and refresh shared state. */
  const handleAvatarUploaded = async (publicUrl: string) => {
    setFormError(null);
    setSaved(false);
    const { error } = await upsertProfile({ avatar_url: publicUrl });
    if (error) {
      setFormError(error);
      return;
    }
    await refreshProfile();
  };

  if (!user) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>
          Update your personal information and how we contact you.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            noValidate
            className="space-y-6"
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

            {saved ? (
              <div
                role="status"
                className="flex items-start gap-2 rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-foreground"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>Your profile has been saved.</span>
              </div>
            ) : null}

            {/* Avatar */}
            <div className="space-y-2">
              <p className="text-sm font-medium leading-none">Avatar</p>
              <AvatarUploader
                userId={user.id}
                avatarUrl={profile?.avatarUrl ?? null}
                fullName={form.watch("full_name") || profile?.fullName}
                onUploaded={handleAvatarUploaded}
                disabled={isSubmitting}
              />
            </div>

            <Separator />

            {/* Read-only email */}
            <div className="space-y-2">
              <FormLabel htmlFor="profile-email">Email</FormLabel>
              <Input
                id="profile-email"
                type="email"
                value={user.email ?? ""}
                readOnly
                disabled
                className="bg-muted/50"
              />
              <p className="text-sm text-muted-foreground">
                Your email address is used for sign-in and cannot be changed here.
              </p>
            </div>

            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ada Lovelace"
                      autoComplete="name"
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
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bio</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Tell the community a little about yourself…"
                      rows={4}
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    A short description shown on your public profile.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            {/* Notification preferences */}
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">
                Notification preferences
              </p>
              <p className="text-sm text-muted-foreground">
                Choose which emails you&apos;d like to receive.
              </p>
            </div>

            <FormField
              control={form.control}
              name="campaignUpdates"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border/60 p-4">
                  <div className="space-y-0.5 pr-4">
                    <FormLabel>Campaign updates</FormLabel>
                    <FormDescription>
                      Progress and news from campaigns you back or own.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="donationReceipts"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border/60 p-4">
                  <div className="space-y-0.5 pr-4">
                    <FormLabel>Donation receipts</FormLabel>
                    <FormDescription>
                      Receipts and confirmations for your donations.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="marketing"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border/60 p-4">
                  <div className="space-y-0.5 pr-4">
                    <FormLabel>Marketing emails</FormLabel>
                    <FormDescription>
                      Product news, tips, and occasional promotions.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save changes
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

export default ProfileForm;
