// src/pages/Explore.tsx
//
// Campaign discovery page. Self-contained and default-exported so the route
// import in src/App.tsx (`@/pages/Explore`) always resolves at build time.

import { Link } from "react-router-dom";
import { Compass } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function Explore() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <header className="mb-10 text-center">
        <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Compass className="h-6 w-6" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Explore campaigns
        </h1>
        <p className="mt-3 text-muted-foreground">
          Discover projects from creators around the world and back the ones you
          believe in.
        </p>
      </header>

      <div className="rounded-lg border border-dashed border-border bg-muted/30 p-12 text-center">
        <p className="text-muted-foreground">
          No campaigns to show yet. Be the first to launch one.
        </p>
        <Button asChild className="mt-6">
          <Link to="/login">Start a campaign</Link>
        </Button>
      </div>
    </div>
  );
}
