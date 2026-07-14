import React from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { FeatureItem } from "../types";

interface FeatureGridProps extends React.HTMLAttributes<HTMLElement> {
  features: FeatureItem[];
}

export function FeatureGrid({ features, ...props }: FeatureGridProps) {
  return (
    <section
      id="for-ngos"
      className="bg-background py-20 sm:py-24"
      aria-labelledby="features-heading"
      {...props}
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
            Built for generous communities
          </p>
          <h2 id="features-heading" className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Everything individuals and NGOs need to start raising funds
          </h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
            Giverr gives campaign creators a clear path from idea to public fundraising, while giving donors the context they need to contribute with confidence.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="group flex h-full flex-col border-border/80 bg-card/95 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
              aria-label={feature.ariaLabel ?? `${feature.title}: ${feature.description}`}
            >
              <CardHeader>
                <span className="inline-flex w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                  {feature.label}
                </span>
                <div
                  className="mt-4 flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-sm font-bold text-secondary-foreground"
                  aria-hidden="true"
                >
                  {feature.visualLabel}
                </div>
                <CardTitle className="pt-3 text-xl leading-tight">{feature.title}</CardTitle>
                <CardDescription className="text-sm leading-6">{feature.description}</CardDescription>
              </CardHeader>
              <CardContent className="mt-auto">
                <ul className="space-y-2 text-sm text-muted-foreground" aria-label={`${feature.title} benefits`}>
                  {feature.points.map((detail) => (
                    <li key={detail} className="flex gap-2">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

export default FeatureGrid;
