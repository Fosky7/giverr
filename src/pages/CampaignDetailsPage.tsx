// src/pages/CampaignDetailsPage.tsx
//
// Module 4 · Step 10 — the upgraded public Campaign Details page at
// /campaigns/:id. Replaces the original CampaignDetail with a richer layout
// composed from the presentational components built in step 9:
//
//   * Hero banner (cover image with a design-token gradient fallback)
//   * Category pill + title + creator line
//   * Safely-sanitized rich long description / story (HTML from the wizard)
//   * CampaignProgress panel (raised/goal, percent, backers, days-left)
//   * ShareButtons (copy link + social share)
//   * CampaignUpdates feed (creator blog, newest-first)
//   * DonorWall (rendered only when the creator enabled it)
//   * A foreshadowed, disabled "Donate Now" CTA (donations land in a later
//     module) — mirrors the existing tooltip pattern.
//
// Preserves the original loading (skeleton), not-found, and error (retry)
// states so behaviour on the happy/unhappy paths stays consistent.

import { Link, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  HeartHandshake,
  RefreshCw,
  SearchX,
} from "lucide-react";

import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CampaignProgress } from "@/components/campaign/CampaignProgress";
import { CampaignUpdates } from "@/components/campaign/CampaignUpdates";
import { DonorWall } from "@/components/campaign/DonorWall";
import { ShareButtons } from "@/components/campaign/ShareButtons";
import { useCampaign } from "@/hooks/useCampaign";

/**
 * Minimal allow-list HTML sanitizer for creator-authored rich text (long
 * description / story). Parses in a detached document, strips dangerous tags,
 * removes on* event handlers, and neutralizes javascript: URLs. Defense in
 * depth — the author is the creator, but the content renders publicly, so we
 * never trust it verbatim.
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
    Array.from(node.children).forEach((child) => {
      if (FORBIDDEN_TAGS.has(child.tagName)) {
        child.remove();
        return;
      }
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

/**
 * Heuristic: treat a string as HTML (from the RichTextEditor) when it contains
 * a tag. Plain-text stories from legacy records are rendered as paragraphs
 * instead, preserving line breaks.
 */
function looksLikeHtml(value: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

export function CampaignDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { data: campaign, loading, error, refetch } = useCampaign(id);

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return <CampaignDetailsSkeleton />;
  }

  // ── Error ─────────────────────────────────────────────────────────────────
  // A genuine fetch failure (network/query) — distinct from "not found".
  if (error && !campaign && error.toLowerCase() !== "campaign not found.") {
    return (
      <section className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
        <span
          role="alert"
          className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive"
        >
          <AlertCircle className="h-8 w-8" />
        </span>
        <h1 className="mt-6 text-2xl font-semibold text-foreground">
          Couldn&apos;t load this campaign
        </h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          {error} Please check your connection and try again.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button onClick={refetch}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
          <Button asChild variant="outline">
            <Link to="/explore">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Explore
            </Link>
          </Button>
        </div>
      </section>
    );
  }

  // ── Not found ─────────────────────────────────────────────────────────────
  if (!campaign) {
    return (
      <section className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary text-secondary-foreground">
          <SearchX className="h-8 w-8" />
        </span>
        <h1 className="mt-6 text-2xl font-semibold text-foreground">
          Campaign not found
        </h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          The campaign you&apos;re looking for doesn&apos;t exist or may have
          been removed.
        </p>
        <Button asChild className="mt-8">
          <Link to="/explore">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Explore
          </Link>
        </Button>
      </section>
    );
  }

  // ── Success ───────────────────────────────────────────────────────────────
  // Prefer the rich long description; fall back to the short description.
  const body =
    campaign.longDescription?.trim() || campaign.description || "";
  const story = campaign.story?.trim() || "";

  return (
    <>
      {/* Hero banner — cover image with a design-token gradient fallback. */}
      <div className="relative aspect-[3/1] w-full overflow-hidden bg-gradient-to-br from-primary/20 via-secondary to-primary/5 sm:aspect-[4/1]">
        {campaign.coverImageUrl ? (
          <img
            src={campaign.coverImageUrl}
            alt={campaign.title}
            className="h-full w-full object-cover"
          />
        ) : null}
      </div>

      <section className="container mx-auto px-4 py-10">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="mb-6 -ml-2 text-muted-foreground"
        >
          <Link to="/explore">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Explore
          </Link>
        </Button>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
          {/* ── Main content ───────────────────────────────────────────── */}
          <div className="min-w-0 space-y-10">
            <div>
              <span className="inline-flex w-fit items-center rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                {campaign.category}
              </span>

              <PageHeader title={campaign.title} className="mt-4" />

              <p className="mt-3 text-sm text-muted-foreground">
                Organized by{" "}
                <span className="font-medium text-foreground">
                  {campaign.creatorId
                    ? "a verified creator"
                    : "the Rayze community"}
                </span>
                {campaign.targetAudience ? (
                  <>
                    {" · "}
                    <span>for {campaign.targetAudience}</span>
                  </>
                ) : null}
              </p>

              {/* Share controls */}
              <div className="mt-6">
                <ShareButtons title={campaign.title} />
              </div>
            </div>

            {/* About / full description */}
            {body ? (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-foreground">
                  About this campaign
                </h2>
                {looksLikeHtml(body) ? (
                  <div
                    className="prose prose-sm max-w-none leading-relaxed text-muted-foreground [&_a]:text-primary [&_a]:underline"
                    // Content is sanitized above before rendering.
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(body) }}
                  />
                ) : (
                  body
                    .split(/\n{2,}/)
                    .filter((paragraph) => paragraph.trim().length > 0)
                    .map((paragraph, index) => (
                      <p
                        key={index}
                        className="whitespace-pre-line leading-relaxed text-muted-foreground"
                      >
                        {paragraph}
                      </p>
                    ))
                )}
              </div>
            ) : null}

            {/* Creator story */}
            {story ? (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-foreground">
                  Our story
                </h2>
                {looksLikeHtml(story) ? (
                  <div
                    className="prose prose-sm max-w-none leading-relaxed text-muted-foreground [&_a]:text-primary [&_a]:underline"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(story) }}
                  />
                ) : (
                  story
                    .split(/\n{2,}/)
                    .filter((paragraph) => paragraph.trim().length > 0)
                    .map((paragraph, index) => (
                      <p
                        key={index}
                        className="whitespace-pre-line leading-relaxed text-muted-foreground"
                      >
                        {paragraph}
                      </p>
                    ))
                )}
              </div>
            ) : null}

            {/* Additional media gallery */}
            {campaign.mediaUrls.length > 0 ? (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-foreground">Gallery</h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {campaign.mediaUrls.map((url) => {
                    const isVideo = /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url);
                    return (
                      <div
                        key={url}
                        className="aspect-video overflow-hidden rounded-lg border border-border/60 bg-muted"
                      >
                        {isVideo ? (
                          <video
                            src={url}
                            className="h-full w-full object-cover"
                            controls
                          />
                        ) : (
                          <img
                            src={url}
                            alt={`${campaign.title} media`}
                            loading="lazy"
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {/* Updates / blog feed */}
            <CampaignUpdates campaignId={campaign.id} />
          </div>

          {/* ── Progress + CTA + Donor wall (sticky sidebar) ───────────── */}
          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Support this campaign</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <CampaignProgress campaign={campaign} />

                {/* Donation flow arrives in a later module — stub the CTA with
                    a disabled state + explanatory tooltip. */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      {/* span wrapper so the tooltip still fires on a disabled
                          button (disabled elements don't emit pointer events) */}
                      <span className="block">
                        <Button
                          size="lg"
                          className="w-full"
                          disabled
                          aria-disabled="true"
                        >
                          <HeartHandshake className="mr-2 h-5 w-5" />
                          Donate Now
                        </Button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      Donations are coming soon.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <p className="text-center text-xs text-muted-foreground">
                  Secure donations are launching soon. Check back to support
                  this cause.
                </p>
              </CardContent>
            </Card>

            {/* Donor wall — only rendered when the creator enabled it. */}
            {campaign.donorWallEnabled ? (
              <DonorWall campaign={campaign} />
            ) : null}
          </aside>
        </div>
      </section>
    </>
  );
}

/**
 * Loading placeholder mirroring the hero + two-column layout using the shared
 * `bg-muted` token with `animate-pulse`.
 */
function CampaignDetailsSkeleton() {
  return (
    <>
      <div className="aspect-[3/1] w-full animate-pulse bg-muted sm:aspect-[4/1]" />
      <section className="container mx-auto px-4 py-10">
        <div className="mb-6 h-8 w-32 animate-pulse rounded bg-muted" />
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0 space-y-4">
            <div className="h-5 w-24 animate-pulse rounded-full bg-muted" />
            <div className="h-9 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-4 w-40 animate-pulse rounded bg-muted" />
            <div className="h-9 w-48 animate-pulse rounded bg-muted" />
            <div className="mt-8 space-y-3">
              <div className="h-6 w-48 animate-pulse rounded bg-muted" />
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
              <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
            </div>
          </div>
          <aside>
            <Card>
              <CardHeader className="space-y-2">
                <div className="h-6 w-40 animate-pulse rounded bg-muted" />
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="h-8 w-32 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-40 animate-pulse rounded bg-muted" />
                  <div className="h-2 w-full animate-pulse rounded-full bg-muted" />
                </div>
                <div className="h-11 w-full animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          </aside>
        </div>
      </section>
    </>
  );
}

export default CampaignDetailsPage;
