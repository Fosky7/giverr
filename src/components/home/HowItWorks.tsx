import { PencilLine, Share2, Sparkles } from "lucide-react";

interface Step {
  number: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

const STEPS: Step[] = [
  {
    number: "01",
    icon: PencilLine,
    title: "Create your campaign",
    description:
      "Tell your story, set a funding goal, and add photos or video with our simple builder.",
  },
  {
    number: "02",
    icon: Share2,
    title: "Share with the world",
    description:
      "Spread the word across social media and email to bring supporters to your cause.",
  },
  {
    number: "03",
    icon: Sparkles,
    title: "Make it happen",
    description:
      "Watch contributions roll in, thank your backers, and turn your idea into reality.",
  },
];

/**
 * A three-step "How it works" explainer for prospective campaign creators.
 */
export function HowItWorks() {
  return (
    <section className="bg-secondary/40 py-20">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            How Rayze works
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            From idea to impact in three simple steps.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-3">
          {STEPS.map(({ number, icon: Icon, title, description }) => (
            <div key={number} className="relative text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md">
                <Icon className="h-7 w-7" />
              </div>
              <span className="mt-4 block text-sm font-semibold tracking-widest text-primary">
                {number}
              </span>
              <h3 className="mt-2 text-xl font-semibold text-foreground">
                {title}
              </h3>
              <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;
