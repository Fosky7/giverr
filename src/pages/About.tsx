import { Heart, Shield, Sparkles, Users } from "lucide-react";

import { PageHeader } from "@/components/layout/PageHeader";

interface ValueItem {
  title: string;
  description: string;
  Icon: typeof Heart;
}

const VALUES: ValueItem[] = [
  {
    title: "Transparency",
    description:
      "Every campaign shows clear goals and progress so backers always know where their support goes.",
    Icon: Shield,
  },
  {
    title: "Community",
    description:
      "We connect creators and supporters, turning shared passion into collective impact.",
    Icon: Users,
  },
  {
    title: "Empathy",
    description:
      "Behind every campaign is a real story. We build tools that honour the people behind the cause.",
    Icon: Heart,
  },
  {
    title: "Excellence",
    description:
      "From design to reliability, we hold ourselves to a high standard so fundraising feels effortless.",
    Icon: Sparkles,
  },
];

/**
 * About Us page. Content-only marketing page describing Rayze's mission,
 * origin story, and core values using the project's design tokens.
 */
export function About() {
  return (
    <>
      <PageHeader
        title="About Rayze"
        description="We're building the most trusted place to raise funds for the ideas and causes that move the world forward."
        eyebrow={
          <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5 text-sm font-medium text-secondary-foreground">
            <Sparkles className="h-4 w-4" />
            Our story
          </span>
        }
      />

      <section className="container mx-auto px-4 py-16">
        {/* Mission */}
        <div className="mx-auto max-w-3xl space-y-4 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Our mission
          </h2>
          <p className="text-lg text-muted-foreground">
            Rayze exists to help individuals and NGOs raise funds from the
            public efficiently and excellently. We remove the friction between a
            great idea and the community ready to support it — so more good
            things get built.
          </p>
        </div>

        {/* Story */}
        <div className="mx-auto mt-16 max-w-3xl space-y-4">
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            How it started
          </h2>
          <p className="text-muted-foreground">
            We kept seeing brilliant creators and dedicated non-profits held
            back by clunky, opaque fundraising tools. Backers wanted to help but
            couldn't tell where their money went. Rayze was born to fix that: a
            modern, transparent platform where trust is built into every step.
          </p>
          <p className="text-muted-foreground">
            Today, Rayze brings creators and supporters together around
            campaigns that matter — with clear goals, honest progress, and a
            delightful experience for everyone involved.
          </p>
        </div>
      </section>

      {/* Values */}
      <section className="border-t border-border bg-secondary/30">
        <div className="container mx-auto px-4 py-16">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              What we value
            </h2>
            <p className="mt-3 text-muted-foreground">
              The principles that guide how we build Rayze.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map(({ title, description, Icon }) => (
              <div
                key={title}
                className="rounded-xl border border-border bg-background p-6"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-lg font-semibold text-foreground">
                  {title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

export default About;
