// src/pages/HomePage.tsx
//
// Landing page for the crowdfunding platform. Referenced by src/App.tsx as the
// home route (`import HomePage from "@/pages/HomePage"`).

import { Link } from "react-router-dom";
import { ArrowRight, Rocket, ShieldCheck, Users } from "lucide-react";

interface Feature {
  icon: typeof Rocket;
  title: string;
  description: string;
}

const FEATURES: Feature[] = [
  {
    icon: Rocket,
    title: "Launch in minutes",
    description:
      "Create a campaign, tell your story, and start collecting backers with a guided multi-step form.",
  },
  {
    icon: ShieldCheck,
    title: "Secure by design",
    description:
      "Authentication, row-level security, and encrypted bank details keep creators and backers protected.",
  },
  {
    icon: Users,
    title: "Built for community",
    description:
      "Backers can discover, fund, and follow the campaigns they care about from a single dashboard.",
  },
];

/**
 * Public landing page rendered at the site root.
 */
export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-background">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-4 py-24 text-center">
          <span className="rounded-full border border-border bg-muted px-4 py-1 text-sm font-medium text-muted-foreground">
            Fund ideas that matter
          </span>
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
            Bring your project to life
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            Launch a campaign, rally supporters, and reach your funding goal on a
            platform trusted by creators and backers alike.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/explore"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Explore campaigns
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Get started
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto w-full max-w-5xl px-4 py-20">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="flex flex-col gap-4 rounded-lg border border-border bg-card p-6 text-card-foreground shadow-sm"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Call to action */}
      <section className="border-t border-border bg-muted">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-4 py-16 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Ready to start your campaign?
          </h2>
          <p className="max-w-xl text-muted-foreground">
            Join creators who have turned their ideas into reality. It only takes
            a few minutes to get set up.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Create an account
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
