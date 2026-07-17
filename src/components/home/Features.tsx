import { Rocket, ShieldCheck, HeartHandshake, LineChart, Globe2, Zap } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Feature {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

const FEATURES: Feature[] = [
  {
    icon: Rocket,
    title: "Launch in minutes",
    description:
      "Spin up a beautiful campaign page with our guided builder — no technical skills required.",
  },
  {
    icon: ShieldCheck,
    title: "Secure & transparent",
    description:
      "Every contribution is protected and every campaign is verified so backers can give with confidence.",
  },
  {
    icon: HeartHandshake,
    title: "Built for causes",
    description:
      "Purpose-built tools for individuals and NGOs to rally communities around what matters most.",
  },
  {
    icon: LineChart,
    title: "Real-time insights",
    description:
      "Track funding progress, donor activity, and momentum with a clear, actionable dashboard.",
  },
  {
    icon: Globe2,
    title: "Reach everywhere",
    description:
      "Share your story across the web and mobile with campaign pages that look great on any device.",
  },
  {
    icon: Zap,
    title: "Fast payouts",
    description:
      "Access the funds you raise quickly so you can focus on delivering real-world impact.",
  },
];

/**
 * Marketing feature grid highlighting the core value props of Rayze.
 */
export function Features() {
  return (
    <section className="container mx-auto px-4 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Everything you need to raise funds
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Rayze gives creators and organizations the tools to launch, share, and
          grow campaigns that make a difference.
        </p>
      </div>

      <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, description }) => (
          <Card
            key={title}
            className="border-border/60 transition-shadow hover:shadow-lg"
          >
            <CardHeader className="space-y-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-6 w-6" />
              </span>
              <CardTitle className="text-xl">{title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

export default Features;
