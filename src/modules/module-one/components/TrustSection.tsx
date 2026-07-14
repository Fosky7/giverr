import React from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { TrustItem } from "../types";

interface TrustSectionProps extends React.HTMLAttributes<HTMLElement> {
  trustItems: TrustItem[];
}

export function TrustSection({ trustItems, ...props }: TrustSectionProps) {
  const [primaryItem, ...supportingItems] = trustItems;

  return (
    <section id="trust" className="bg-background py-20 sm:py-24" aria-labelledby="trust-heading" {...props}>
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr] lg:items-stretch">
          <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-card to-secondary/20">
            <CardHeader className="p-8 sm:p-10">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Trust by design</p>
              <CardTitle id="trust-heading" className="mt-4 text-3xl leading-tight tracking-tight sm:text-4xl">
                Designed to make public fundraising feel clear, accountable, and safe
              </CardTitle>
              <CardDescription className="mt-4 text-base leading-7 sm:text-lg">
                Giverr’s home experience explains how campaigns can earn confidence before money changes hands. Verification and payment systems can be connected later without changing the trust-first story donors see today.
              </CardDescription>
            </CardHeader>
            {primaryItem ? (
              <CardContent className="px-8 pb-8 sm:px-10 sm:pb-10">
                <div className="rounded-xl border border-border/80 bg-background/80 p-5 shadow-sm backdrop-blur">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                    {primaryItem.label}
                  </p>
                  <h3 className="mt-3 text-xl font-semibold text-foreground">{primaryItem.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{primaryItem.description}</p>
                </div>
              </CardContent>
            ) : null}
          </Card>

          <div className="grid gap-4 sm:grid-cols-2">
            {supportingItems.map((item) => (
              <Card
                key={item.title}
                className="h-full border-border/80 bg-card/95 transition-all duration-300 hover:border-primary/40 hover:shadow-md"
                aria-label={item.ariaLabel ?? item.title}
              >
                <CardHeader>
                  <span className="inline-flex w-fit rounded-full bg-secondary px-3 py-1 text-xs font-semibold uppercase tracking-wide text-secondary-foreground">
                    {item.label}
                  </span>
                  <div className="pt-3 text-sm font-medium text-primary">{item.visualLabel}</div>
                  <CardTitle className="text-xl leading-tight">{item.title}</CardTitle>
                  <CardDescription className="text-sm leading-6">{item.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default TrustSection;
