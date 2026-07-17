// src/components/campaign/ShareButtons.tsx
//
// Share controls for a campaign: a copy-link button (with a transient "Copied!"
// confirmation) plus quick links to share on Twitter/X, Facebook, LinkedIn, and
// WhatsApp. When the Web Share API is available (mobile browsers) a native
// share button is offered too. Purely presentational — the caller passes the
// campaign title and an optional explicit URL (defaults to the current page).

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Check,
  Copy,
  Facebook,
  Linkedin,
  Share2,
  Twitter,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface ShareButtonsProps {
  /** Campaign title used as the share text. */
  title: string;
  /** URL to share. Defaults to the current page (window.location.href). */
  url?: string;
  className?: string;
}

export function ShareButtons({ title, url, className }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Resolve the URL lazily so SSR/first render doesn't touch window.
  const shareUrl =
    url ?? (typeof window !== "undefined" ? window.location.href : "");

  const shareText = `Support: ${title}`;

  useEffect(() => {
    setCanNativeShare(
      typeof navigator !== "undefined" && typeof navigator.share === "function"
    );
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        // Legacy fallback for browsers without the async clipboard API.
        const el = document.createElement("textarea");
        el.value = shareUrl;
        el.setAttribute("readonly", "");
        el.style.position = "absolute";
        el.style.left = "-9999px";
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
      }
      setCopied(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      // Silently ignore — the social buttons remain available.
    }
  }, [shareUrl]);

  const handleNativeShare = useCallback(async () => {
    try {
      await navigator.share({ title, text: shareText, url: shareUrl });
    } catch {
      // User cancelled or share failed — no-op.
    }
  }, [title, shareText, shareUrl]);

  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedText = encodeURIComponent(shareText);

  const socials = [
    {
      label: "Share on X",
      icon: Twitter,
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`,
    },
    {
      label: "Share on Facebook",
      icon: Facebook,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      label: "Share on LinkedIn",
      icon: Linkedin,
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    },
    {
      label: "Share on WhatsApp",
      icon: Share2,
      href: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
    },
  ];

  return (
    <TooltipProvider>
      <div className={cn("flex flex-wrap items-center gap-2", className)}>
        {/* Copy link */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopy}
              aria-label="Copy campaign link"
            >
              {copied ? (
                <>
                  <Check className="mr-2 h-4 w-4 text-primary" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy link
                </>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Copy the campaign link to your clipboard</TooltipContent>
        </Tooltip>

        {/* Native share (mobile) */}
        {canNativeShare ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleNativeShare}
            aria-label="Share campaign"
          >
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
        ) : null}

        {/* Social share icons */}
        {socials.map(({ label, icon: Icon, href }) => (
          <Tooltip key={label}>
            <TooltipTrigger asChild>
              <Button
                asChild
                variant="outline"
                size="icon"
                className="h-9 w-9"
              >
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                >
                  <Icon className="h-4 w-4" />
                </a>
              </Button>
            </TooltipTrigger>
            <TooltipContent>{label}</TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}

export default ShareButtons;
