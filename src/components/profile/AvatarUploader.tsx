// src/components/profile/AvatarUploader.tsx
import { useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

/** Allowed avatar mime types. */
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
/** Max avatar size in bytes (2MB). */
const MAX_SIZE_BYTES = 2 * 1024 * 1024;

interface AvatarUploaderProps {
  /** The current user's id — used as the storage folder prefix. */
  userId: string;
  /** Current avatar URL (or null) shown as the preview. */
  avatarUrl: string | null;
  /** Display name used to derive fallback initials. */
  fullName?: string | null;
  /**
   * Called once the file has been uploaded and a public URL obtained. The
   * parent is responsible for persisting the URL to the profiles row.
   */
  onUploaded: (publicUrl: string) => Promise<void> | void;
  /** Disable the uploader while the parent form is busy. */
  disabled?: boolean;
}

/** Derive two-letter initials from a full name for the avatar fallback. */
function initialsFrom(name?: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Avatar preview + uploader. Validates file type/size client-side, uploads the
 * image to the `avatars` Storage bucket under `${userId}/...`, retrieves the
 * public URL, and hands it back to the parent via {@link onUploaded}.
 */
export function AvatarUploader({
  userId,
  avatarUrl,
  fullName,
  onUploaded,
  disabled = false,
}: AvatarUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Local preview so the UI updates instantly after a successful upload.
  const [previewUrl, setPreviewUrl] = useState<string | null>(avatarUrl);

  const handlePick = () => {
    if (disabled || uploading) return;
    inputRef.current?.click();
  };

  const handleChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Reset the input so selecting the same file again re-triggers change.
    event.target.value = "";
    if (!file) return;

    setError(null);

    // --- Client-side validation ---
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("Please choose a PNG, JPG, WEBP, or GIF image.");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError("Image is too large. Maximum size is 2MB.");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "png";
      // Store under the user's uid folder (RLS enforces this prefix). A
      // timestamp in the filename busts CDN caches when replacing an avatar.
      const path = `${userId}/avatar-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, {
          cacheControl: "3600",
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) {
        setError(uploadError.message);
        return;
      }

      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const publicUrl = data.publicUrl;

      setPreviewUrl(publicUrl);
      await onUploaded(publicUrl);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to upload the image. Please try again."
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <Avatar className="h-20 w-20">
        {previewUrl ? (
          <AvatarImage src={previewUrl} alt={fullName ?? "Avatar"} />
        ) : null}
        <AvatarFallback className="text-lg font-medium text-muted-foreground">
          {initialsFrom(fullName)}
        </AvatarFallback>
      </Avatar>

      <div className="space-y-2">
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          className="hidden"
          onChange={handleChange}
          disabled={disabled || uploading}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handlePick}
          disabled={disabled || uploading}
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading…
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Change avatar
            </>
          )}
        </Button>
        <p className="text-xs text-muted-foreground">
          PNG, JPG, WEBP or GIF. Max 2MB.
        </p>
        {error ? (
          <p className="text-xs font-medium text-destructive">{error}</p>
        ) : null}
      </div>
    </div>
  );
}

export default AvatarUploader;
