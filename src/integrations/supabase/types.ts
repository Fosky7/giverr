// src/integrations/supabase/types.ts
//
// Database types for the Supabase client. This module is normally generated
// by the Supabase CLI (`supabase gen types typescript`). Until that is wired
// into CI, we maintain a hand-written `Database` type here so client calls are
// fully typed. Module 3 introduces the `profiles` table — its Row/Insert/Update
// shapes are defined below and mirror `supabase/migrations/0003_profiles.sql`.
//
// Keep this in sync with new migrations. UI-facing helper types live in
// `src/types/profile.ts`.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/**
 * Notification preferences persisted on the `profiles.notification_preferences`
 * JSONB column. Mirrors `NotificationPreferences` in `src/types/profile.ts`.
 */
export interface NotificationPreferencesJson {
  marketingEmails: boolean;
  campaignUpdates: boolean;
  donationReceipts: boolean;
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          role: string;
          notification_preferences: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          role?: string;
          notification_preferences?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          role?: string;
          notification_preferences?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// ---------------------------------------------------------------------------
// Convenience helper types (mirrors the shape emitted by the Supabase CLI).
// ---------------------------------------------------------------------------

type PublicSchema = Database["public"];

export type Tables<
  TableName extends keyof PublicSchema["Tables"]
> = PublicSchema["Tables"][TableName]["Row"];

export type TablesInsert<
  TableName extends keyof PublicSchema["Tables"]
> = PublicSchema["Tables"][TableName]["Insert"];

export type TablesUpdate<
  TableName extends keyof PublicSchema["Tables"]
> = PublicSchema["Tables"][TableName]["Update"];

/** Direct alias for the profiles Row shape. */
export type ProfileRow = Tables<"profiles">;
