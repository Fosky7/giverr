import { Link } from "react-router-dom";
import { Rocket, Search } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Prominent, contrasting call-to-action band shown before the footer to
 * reinforce the platform's primary actions.
 */
export function CallToActionSection() {
  return (
    <section className="container mx-auto px-4 py-20">
      <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-16 text-center text-primary-foreground shadow-xl sm:px-12">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary-foreground/10" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-primary-foreground/10" />

        <div className="relative mx-auto max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to make a difference?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-primary-foreground/80">
            Join thousands of creators and organizations using Rayze to raise
            funds and create lasting impact for the causes that matter most.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button asChild size="lg" variant="secondary">
              <Link to="/start">
                <Rocket className="mr-2 h-5 w-5" />
                Start Your Campaign Today
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              <Link to="/explore">
                <Search className="mr-2 h-5 w-5" />
                Discover Impactful Causes
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CallToActionSection;
