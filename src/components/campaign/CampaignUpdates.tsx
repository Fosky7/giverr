// src/components/campaign/CampaignUpdates.tsx
//
// Displays the creator's update / blog feed for a campaign on the public detail
// page. Fetches via getCampaignUpdates(campaignId), rendering newest-first with
// loading, empty, and error states that mirror the patterns used elsewhere
// (CreatorCampaigns, CampaignDetail).
//
// Update bodies are rich text (HTML), so they are sanitized before rendering to
// prevent XSS. A tiny allowlist-based sanitizer keeps the dependency footprint
// minimal while stripping scripts, event handlers, and dangerous URLs.

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Megaphone, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getCampaignUpdates } from "@/services/campaigns";
import type { CampaignUpdate } from "@/types/campaign";
import { cn } from "@/lib/utils";

const SKELETON_COUNT = 2;

interface CampaignUpdatesProps {
  campaignId: string;
  className?: string;
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

/**
 * Minimal HTML sanitizer for creator-authored update bodies. Parses the markup
 * in a detached document, removes script/style/dangerous elements, strips all
 * event-handler (on*) attributes, and neutralizes javascript: URLs. This is a
 * defense-in-depth measure — the source is a creator, but the content is shown
 * publicly, so we never trust it verbatim.
 */
function sanitizeHtml(html: string): string {
  if (typeof window === "undefined" || !html) return "";

  const doc = new DOMParser().parseFromString(html, "text/html");

  const FORBIDDEN_TAGS = new Set([
    "SCRIPT",
    "STYLE",
    "IFRAME",
    "OBJECT",
    "EMBED",
    "LINK",
    "META",
    "FORM",
    "INPUT",
    "BUTTON",
  ]);

  const walk = (node: Element) => {
    // Iterate over a static copy since we mutate the tree.
    Array.from(node.children).forEach((child) => {
      if (FORBIDDEN_TAGS.has(child.tagName)) {
        child.remove();
        return;
      }

      // Strip event handlers and dangerous URL attributes.
      Array.from(child.attributes).forEach((attr) => {
        const name = attr.name.toLowerCase();
        const value = attr.value.trim().toLowerCase();
        if (name.startsWith("on")) {
          child.removeAttribute(attr.name);
        } else if (
          (name === "href" || name === "src") &&
          value.startsWith("javascript:")
        ) {
          child.removeAttribute(attr.name);
        }
      });

      walk(child);
    });
  };

  walk(doc.body);
  return doc.body.innerHTML;
}

export function CampaignUpdates({ campaignId, className }: CampaignUpdatesProps) {
  const [updates, setUpdates] = useState<CampaignUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCampaignUpdates(campaignId);
      // Service already orders newest-first, but guard anyway.
      const sorted = [...data].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setUpdates(sorted);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Couldn't load updates."
      );
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    if (!campaignId) return;
    void load();
  }, [campaignId, load]);

  return (
    <section className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Updates</h2>
        {updates.length > 0 ? (
          <span className="text-sm text-muted-foreground">
            {updates.length} {updates.length === 1 ? "post" : "posts"}
          </span>
        ) : null}
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
            <Card key={index} aria-hidden="true">
              <CardHeader className="space-y-2">
                <div className="h-5 w-1/2 animate-pulse rounded bg-muted" />
                <div className="h-3 w-24 animate-pulse rounded bg-muted" />
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="h-3 w-full animate-pulse rounded bg-muted" />
                <div className="h-3 w-5/6 animate-pulse rounded bg-muted" />
                <div className="h-3 w-2/3 animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <div
          role="alert"
          className="flex flex-col items-center rounded-xl border border-border bg-secondary/30 px-6 py-10 text-center"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <AlertCircle className="h-6 w-6" />
          </span>
          <p className="mt-4 max-w-sm text-sm text-muted-foreground">{error}</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={load}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      ) : updates.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-border bg-secondary/30 px-6 py-10 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Megaphone className="h-6 w-6" />
          </span>
          <h3 className="mt-4 text-base font-semibold text-foreground">
            No updates yet
          </h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            The creator hasn&apos;t posted any updates. Check back soon for news
            and progress.
          </p>
        </div>
      ) : (
        <ol className="space-y-4">
          {updates.map((update) => (
            <li key={update.id}>
              <Card>
                <CardHeader className="space-y-1">
                  <h3 className="text-lg font-semibold leading-snug text-foreground">
                    {update.title}
                  </h3>
                  <time
                    dateTime={update.createdAt}
                    className="text-xs text-muted-foreground"
                  >
                    {dateFormatter.format(new Date(update.createdAt))}
                  </time>
                </CardHeader>
                <CardContent>
                  <div
                    className="prose prose-sm max-w-none text-muted-foreground"
                    // Content is sanitized above before rendering.
                    dangerouslySetInnerHTML={{
                      __html: sanitizeHtml(update.body),
                    }}
                  />
                </CardContent>
              </Card>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export default CampaignUpdates;
