import { Link } from "react-router-dom";
import { Rocket, Search } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Full-width, glossy hero section for the Rayze landing page. Uses layered
 * token-based gradients plus decorative blurred blobs for depth. Motion is
 * kept subtle and respects `prefers-reduced-motion` via `motion-reduce`.
 */
export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      {/* Base gradient wash */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-secondary/40 via-primary/5 to-transparent" />

      {/* Decorative blurred blobs for the glossy feel */}
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl animate-pulse motion-reduce:animate-none" />
      <div className="pointer-events-none absolute -right-16 top-32 h-80 w-80 rounded-full bg-primary/10 blur-3xl animate-pulse motion-reduce:animate-none [animation-delay:1s]" />

      <div className="container relative mx-auto px-4 py-20 md:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5 text-sm font-medium text-secondary-foreground">
            <Rocket className="h-4 w-4" />
            Empower Change
          </span>

          <h1 className="mt-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
            Empower Change.{" "}
            <span className="text-primary">Fund Your Vision.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Rayze is a modern crowdfunding platform where individuals and NGOs
            launch campaigns and rally the public to turn ambitious ideas into
            real-world impact.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button asChild size="lg">
              <Link to="/start">
                <Rocket className="mr-2 h-5 w-5" />
                Start a Campaign
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/explore">
                <Search className="mr-2 h-5 w-5" />
                Explore Campaigns
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
