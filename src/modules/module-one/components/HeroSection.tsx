import React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CampaignPreview, HeroContent } from "../types";
import { CampaignPreviewCard } from "./CampaignPreviewCard";

interface HeroSectionProps extends React.HTMLAttributes<HTMLElement> {
  hero: HeroContent;
  campaign: CampaignPreview;
}

export function HeroSection({ hero, campaign, className, ...props }: HeroSectionProps) {
  return (
    <section
      id="campaigns"
      className={cn(
        "relative isolate overflow-hidden bg-background px-4 py-20 sm:px-6 lg:px-8 lg:py-28",
        className,
      )}
      aria-labelledby="giverr-hero-heading"
      aria-label={hero.ariaLabel}
      {...props}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.16),transparent_36rem)]"
      />
      <div
        aria-hidden="true"
        className="absolute right-0 top-10 -z-10 h-72 w-72 rounded-full bg-primary/10 blur-3xl"
      />

      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.82fr)]">
        <div className="max-w-3xl space-y-8 text-center lg:text-left">
          <div className="space-y-5">
            <p className="mx-auto inline-flex rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground shadow-sm lg:mx-0">
              {hero.label}
            </p>

            <div className="space-y-5">
              <h1
                id="giverr-hero-heading"
                className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl"
              >
                {hero.title}
              </h1>
              <p className="mx-auto max-w-2xl text-pretty text-lg leading-8 text-muted-foreground lg:mx-0">
                {hero.description}
              </p>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
            <Button asChild size="lg">
              <a href={hero.primaryCta.href} aria-label={hero.primaryCta.ariaLabel ?? hero.primaryCta.label}>
                {hero.primaryCta.label}
              </a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href={hero.secondaryCta.href} aria-label={hero.secondaryCta.ariaLabel ?? hero.secondaryCta.label}>
                {hero.secondaryCta.label}
              </a>
            </Button>
          </div>

          <div className="flex flex-col items-center gap-4 text-sm text-muted-foreground sm:flex-row sm:justify-center lg:justify-start">
            <div className="flex -space-x-2" aria-hidden="true">
              {["G", "N", "D", "+"].map((initial) => (
                <span
                  key={initial}
                  className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-background bg-secondary text-xs font-semibold text-secondary-foreground shadow-sm"
                >
                  {initial}
                </span>
              ))}
            </div>
            <p>{hero.socialProof}</p>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-md lg:max-w-none" aria-label={hero.visualLabel}>
          <div
            aria-hidden="true"
            className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-br from-primary/20 via-accent/40 to-secondary/50 blur-2xl"
          />
          <CampaignPreviewCard campaign={campaign} className="lg:translate-y-4" />
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
