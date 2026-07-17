import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";

/**
 * Fallback 404 page for unmatched routes.
 */
export function NotFound() {
  return (
    <section className="container mx-auto flex min-h-[60vh] flex-col items-center justify-center px-4 py-20 text-center">
      <p className="text-6xl font-bold text-primary">404</p>
      <h1 className="mt-4 text-2xl font-semibold text-foreground">
        Page not found
      </h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Button asChild className="mt-8">
        <Link to="/">Back to Home</Link>
      </Button>
    </section>
  );
}

export default NotFound;
