// src/pages/ProfileSettingsPage.tsx
import { ProfileForm } from "@/components/profile/ProfileForm";
import { PasswordChangeForm } from "@/components/profile/PasswordChangeForm";

/**
 * Profile settings page rendered inside the dashboard's Settings section.
 * Composes the profile details form (name, bio, avatar, notification prefs)
 * and a separate password change form. Both consume the shared auth state via
 * `useAuth` so updates propagate to the Header and dashboard immediately.
 */
export function ProfileSettingsPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Settings
        </h2>
        <p className="text-muted-foreground">
          Manage your profile information and account security.
        </p>
      </div>

      <ProfileForm />
      <PasswordChangeForm />
    </div>
  );
}

export default ProfileSettingsPage;
