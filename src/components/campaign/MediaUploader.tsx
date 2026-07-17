// src/components/campaign/MediaUploader.tsx
//
// Uploads campaign media (images / videos) to the `campaign-media` Supabase
// Storage bucket and returns the resulting public URLs. Mirrors the existing
// AvatarUploader pattern (client-side type/size validation, a Supabase upload,
// then surfacing the public URL) but supports two modes:
//
//   * mode="cover"   → single file; `value` is a string URL, `onChange(url)`.
//   * mode="gallery" → many files; `value` is a string[] of URLs,
//                       `onChange(urls)`.
//
// The heavy lifting (auth check + path namespacing + getPublicUrl) lives in
// `uploadCampaignMedia` from the campaigns service, keeping this component
// focused on UX: previews, per-file progress/error, and add/remove controls.

import * as React from "react";
import { ImagePlus, Loader2, UploadCloud, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { uploadCampaignMedia } from "@/services/campaigns";

// Accepted MIME prefixes and a sane per-file size cap.
const ACCEPTED_TYPES = ["image/", "video/"];
const MAX_FILE_MB = 25;

type MediaMode = "cover" | "gallery";

interface BaseProps {
  disabled?: boolean;
  className?: string;
}

interface CoverProps extends BaseProps {
  mode: "cover";
  value: string;
  onChange: (url: string) => void;
}

interface GalleryProps extends BaseProps {
  mode: "gallery";
  value: string[];
  onChange: (urls: string[]) => void;
  /** Maximum number of gallery items. Defaults to 6. */
  maxItems?: number;
}

export type MediaUploaderProps = CoverProps | GalleryProps;

/** Validate a candidate file against type + size rules. Returns error or null. */
function validateFile(file: File): string | null {
  if (!ACCEPTED_TYPES.some((prefix) => file.type.startsWith(prefix))) {
    return "Only image or video files are allowed.";
  }
  if (file.size > MAX_FILE_MB * 1024 * 1024) {
    return `Files must be ${MAX_FILE_MB}MB or smaller.`;
  }
  return null;
}

/** Render a single media preview (image or video) with a remove button. */
function MediaPreview({
  url,
  onRemove,
  disabled,
  className,
}: {
  url: string;
  onRemove: () => void;
  disabled?: boolean;
  className?: string;
}) {
  const isVideo = /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url);

  return (
    <div
      className={cn(
        "group relative aspect-video overflow-hidden rounded-lg border border-border/60 bg-muted",
        className
      )}
    >
      {isVideo ? (
        <video src={url} className="h-full w-full object-cover" muted />
      ) : (
        <img src={url} alt="Campaign media" className="h-full w-full object-cover" />
      )}
      {!disabled ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove media"
          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-background/80 text-foreground shadow-sm transition-opacity hover:bg-background"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}

/**
 * Campaign media uploader supporting a single cover image/video or a small
 * gallery of items, uploading to the campaign-media bucket via the service.
 */
export function MediaUploader(props: MediaUploaderProps) {
  const { mode, disabled, className } = props;
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const maxItems = mode === "gallery" ? props.maxItems ?? 6 : 1;
  const currentUrls: string[] =
    mode === "cover" ? (props.value ? [props.value] : []) : props.value;

  const remainingSlots = Math.max(0, maxItems - currentUrls.length);

  const openPicker = () => {
    setError(null);
    inputRef.current?.click();
  };

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setError(null);

    // Enforce the slot limit for gallery mode.
    const files = Array.from(fileList).slice(
      0,
      mode === "cover" ? 1 : remainingSlots
    );

    if (files.length === 0) {
      setError(`You can add up to ${maxItems} items.`);
      return;
    }

    // Validate all up front so we fail fast without partial uploads.
    for (const file of files) {
      const invalid = validateFile(file);
      if (invalid) {
        setError(invalid);
        return;
      }
    }

    setUploading(true);
    try {
      const uploaded: string[] = [];
      for (const file of files) {
        // Sequential uploads keep the (optional) per-file error attribution
        // simple and avoid overwhelming the connection with large videos.
        const url = await uploadCampaignMedia(file);
        uploaded.push(url);
      }

      if (mode === "cover") {
        props.onChange(uploaded[0]);
      } else {
        props.onChange([...props.value, ...uploaded]);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Upload failed. Please try again."
      );
    } finally {
      setUploading(false);
      // Reset the input so selecting the same file again re-triggers change.
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const removeAt = (index: number) => {
    if (mode === "cover") {
      props.onChange("");
    } else {
      props.onChange(props.value.filter((_, i) => i !== index));
    }
  };

  const canAddMore = remainingSlots > 0 && !disabled;

  return (
    <div className={cn("space-y-3", className)}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        multiple={mode === "gallery"}
        className="hidden"
        disabled={disabled || uploading}
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* Cover mode: single large dropzone / preview. */}
      {mode === "cover" ? (
        currentUrls.length > 0 ? (
          <MediaPreview
            url={currentUrls[0]}
            disabled={disabled || uploading}
            onRemove={() => removeAt(0)}
          />
        ) : (
          <button
            type="button"
            onClick={openPicker}
            disabled={!canAddMore || uploading}
            className={cn(
              "flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-secondary/30 text-muted-foreground transition-colors hover:bg-secondary/50",
              (!canAddMore || uploading) && "cursor-not-allowed opacity-60"
            )}
          >
            {uploading ? (
              <Loader2 className="h-8 w-8 animate-spin" />
            ) : (
              <ImagePlus className="h-8 w-8" />
            )}
            <span className="text-sm font-medium">
              {uploading ? "Uploading…" : "Upload a cover image or video"}
            </span>
            <span className="text-xs">PNG, JPG, MP4 · up to {MAX_FILE_MB}MB</span>
          </button>
        )
      ) : (
        // Gallery mode: grid of previews + an add tile.
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {currentUrls.map((url, index) => (
            <MediaPreview
              key={url}
              url={url}
              disabled={disabled || uploading}
              onRemove={() => removeAt(index)}
            />
          ))}

          {canAddMore ? (
            <button
              type="button"
              onClick={openPicker}
              disabled={uploading}
              className={cn(
                "flex aspect-video flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border bg-secondary/30 text-muted-foreground transition-colors hover:bg-secondary/50",
                uploading && "cursor-not-allowed opacity-60"
              )}
            >
              {uploading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <UploadCloud className="h-6 w-6" />
              )}
              <span className="text-xs font-medium">
                {uploading ? "Uploading…" : "Add media"}
              </span>
            </button>
          ) : null}
        </div>
      )}

      {/* Gallery helper / limit hint. */}
      {mode === "gallery" ? (
        <p className="text-xs text-muted-foreground">
          {currentUrls.length}/{maxItems} items · images or videos up to{" "}
          {MAX_FILE_MB}MB each.
        </p>
      ) : null}

      {error ? (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export default MediaUploader;
