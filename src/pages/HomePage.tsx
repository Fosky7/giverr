// src/pages/HomePage.tsx
//
// Landing page. Kept dependency-light and self-contained so it always resolves
// as the default-exported route target referenced in src/App.tsx.

import { Link } from "react-router-dom";
import { ArrowRight, Rocket, ShieldCheck, Users } from "lucide-react";

import { Button } from "@/components/ui/button";

const FEATURES = [
  {
    icon: Rocket,
    title: "Launch in minutes",
    description:
      "Create a campaign, set your goal, and start collecting backers with a guided setup flow.",
  },
  {
    icon: ShieldCheck,
    title: "Secure by design",
    description:
      "Authentication, payments, and payouts are protected with row-level security and verified providers.",
  },
  {
    icon: Users,
    title: "Built for community",
    description:
      "Rally supporters, share updates, and grow an audience that believes in what you're building.",
  },
] as const;

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="bg-background">
        <div className="mx-auto flex max-w-5xl flex-col items-center px-4 py-20 text-center sm:py-28">
          <span className="mb-4 inline-flex items-center rounded-full border border-border bg-muted px-3 py-1 text-sm text-muted-foreground">
            Fund what matters
          </span>
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
            Bring your ideas to life
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
            Launch a crowdfunding campaign, connect with backers, and turn your
            vision into reality — all in one place.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link to="/explore">
                Explore campaigns
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/login">Get started</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border bg-muted/30">
        <div className="mx-auto grid max-w-5xl gap-8 px-4 py-16 sm:grid-cols-3">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="rounded-lg border border-border bg-card p-6 text-card-foreground shadow-sm"
              >
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
