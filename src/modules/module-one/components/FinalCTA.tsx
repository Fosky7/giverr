import React from "react";

import { Button } from "@/components/ui/button";
import type { FinalCtaContent } from "../types";

interface FinalCTAProps extends React.HTMLAttributes<HTMLElement> {
  content: FinalCtaContent;
}

export function FinalCTA({ content, ...props }: FinalCTAProps) {
  return (
    <section
      id="start-campaign"
      className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
      aria-labelledby="final-cta-heading"
      {...props}
    >
      <div className="mx-auto max-w-7xl overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary via-primary to-primary/80 px-6 py-14 text-primary-foreground shadow-2xl sm:px-10 lg:px-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 id="final-cta-heading" className="text-3xl font-bold tracking-tight sm:text-4xl">
            {content.title}
          </h2>
          <p className="mt-4 text-lg leading-8 text-primary-foreground/85">{content.description}</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" variant="secondary">
              <a href={content.primaryCta.href} aria-label={content.primaryCta.ariaLabel ?? content.primaryCta.label}>
                {content.primaryCta.label}
              </a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              <a href={content.secondaryCta.href} aria-label={content.secondaryCta.ariaLabel ?? content.secondaryCta.label}>
                {content.secondaryCta.label}
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default FinalCTA;
