import React from "react";

import type { ProcessStep } from "../types";

interface HowItWorksProps extends React.HTMLAttributes<HTMLElement> {
  steps: ProcessStep[];
}

export function HowItWorks({ steps, ...props }: HowItWorksProps) {
  return (
    <section
      id="how-it-works"
      className="bg-muted/30 py-20 sm:py-24"
      aria-labelledby="how-it-works-heading"
      {...props}
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div className="lg:sticky lg:top-24">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">How it works</p>
            <h2 id="how-it-works-heading" className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              From campaign idea to supported cause in five clear steps
            </h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
              Giverr keeps fundraising approachable for first-time creators and structured enough for organizations that need a repeatable process.
            </p>
          </div>

          <ol className="relative space-y-4" aria-label="Campaign creation process">
            {steps.map((step) => (
              <li
                key={step.title}
                className="group relative rounded-xl border border-border/80 bg-card p-6 shadow-sm transition-all duration-300 hover:border-primary/40 hover:shadow-md"
                aria-label={step.ariaLabel}
              >
                <div className="flex gap-4">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground"
                    aria-hidden="true"
                  >
                    {step.label.replace("Step ", "")}
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{step.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">{step.description}</p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;
