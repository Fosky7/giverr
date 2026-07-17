// src/types/profile.ts

/**
 * Notification preferences stored on a user's profile. Extend this shape as
 * new preference toggles are introduced elsewhere in the app.
 */
export interface NotificationPreferences {
  /** Product / marketing emails. */
  marketing: boolean;
  /** Transactional updates for campaigns the user backs or owns. */
  campaignUpdates: boolean;
  /** Receipts and donation confirmations. */
  donationReceipts: boolean;
}

/**
 * Default notification preferences applied to newly-provisioned profiles and
 * used as a fallback when the stored value is missing / malformed.
 */
export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  marketing: true,
  campaignUpdates: true,
  donationReceipts: true,
};

/**
 * A single user profile row. Mirrors the `public.profiles` table created in
 * the Supabase migration. `id` matches `auth.users.id`.
 */
export interface Profile {
  id: string;
  /** Public display name. Nullable until the user sets one. */
  fullName: string | null;
  /** Mirror of the auth email for convenient reads (kept in sync on signup). */
  email: string | null;
  /** Public URL (or storage path) of the user's avatar image. */
  avatarUrl: string | null;
  /** Free-form short bio shown on public profile surfaces. */
  bio: string | null;
  /** Persisted notification toggles. */
  notificationPreferences: NotificationPreferences;
  createdAt: string;
  updatedAt: string;
}

/**
 * Raw row shape as returned by Supabase (snake_case columns). Kept internal to
 * the data layer; the rest of the app consumes the camelCased {@link Profile}.
 */
export interface ProfileRow {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  bio: string | null;
  notification_preferences: Partial<NotificationPreferences> | null;
  created_at: string;
  updated_at: string;
}

/**
 * Normalize a raw Supabase row into the app-facing {@link Profile} shape,
 * filling in default notification preferences when the stored JSON is absent
 * or partial.
 */
export function mapProfileRow(row: ProfileRow): Profile {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    avatarUrl: row.avatar_url,
    bio: row.bio,
    notificationPreferences: {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      ...(row.notification_preferences ?? {}),
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
