// src/pages/HomePage.tsx
//
// Public landing page (route "/"). Presents the platform value proposition and
// primary CTAs. Uses the shared Supabase client to surface a live count of
// active campaigns so the hero reflects real backend data rather than a mock.
//
// Default export so it can be imported directly (or lazy-loaded) by App.tsx.

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Rocket, ShieldCheck, Users } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

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
      "Create a campaign with rich media, funding goals, and payout details in a guided flow.",
  },
  {
    icon: ShieldCheck,
    title: "Secure payouts",
    description:
      "Bank details are stored securely and funds are released to verified creators.",
  },
  {
    icon: Users,
    title: "Built-in community",
    description:
      "Backers track contributions and stay updated as campaigns hit their milestones.",
  },
];

/**
 * Marketing homepage with a live campaign count pulled from Supabase.
 */
export default function HomePage() {
  const { user } = useAuth();
  const [campaignCount, setCampaignCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadCount() {
      const { count, error } = await supabase
        .from("campaigns")
        .select("id", { count: "exact", head: true });

      if (!cancelled && !error && typeof count === "number") {
        setCampaignCount(count);
      }
    }

    void loadCount();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="bg-background">
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 py-20 text-center">
        <span className="inline-flex items-center rounded-full border border-border bg-muted px-4 py-1 text-sm text-muted-foreground">
          {campaignCount === null
            ? "Crowdfunding, done right"
            : `${campaignCount.toLocaleString()} campaigns and counting`}
        </span>

        <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Fund the ideas worth building.
        </h1>

        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          Back creators you believe in, or launch your own campaign and reach a
          community ready to support it.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link to="/explore">
              Explore campaigns
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>

          <Button asChild size="lg" variant="outline">
            <Link to={user ? "/create-campaign" : "/login"}>
              {user ? "Start a campaign" : "Sign in to start"}
            </Link>
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 pb-20">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="rounded-lg border border-border bg-card p-6 text-left"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-card-foreground">
                  {feature.title}
                </h3>
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
