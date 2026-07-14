import React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { CtaLink, NavItem } from "../types";

interface HeaderProps extends React.HTMLAttributes<HTMLElement> {
  brandName: string;
  navItems: NavItem[];
  primaryCta: CtaLink;
  secondaryCta?: CtaLink;
}

export function Header({
  brandName,
  navItems,
  primaryCta,
  secondaryCta,
  className,
  ...props
}: HeaderProps) {
  const brandInitial = brandName.trim().charAt(0).toUpperCase() || "G";
  const hasNavItems = navItems.length > 0;
  const mobileNavId = "module-one-mobile-navigation";
  const headerRef = React.useRef<HTMLElement | null>(null);
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  React.useEffect(() => {
    if (!hasNavItems && isMenuOpen) {
      setIsMenuOpen(false);
    }
  }, [hasNavItems, isMenuOpen]);

  React.useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  React.useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;

      if (!(target instanceof Node)) {
        return;
      }

      if (headerRef.current && !headerRef.current.contains(target)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isMenuOpen]);

  return (
    <header
      ref={headerRef}
      className={cn(
        "sticky top-0 z-50 w-full border-b border-border/70 bg-background/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/80",
        className,
      )}
      {...props}
    >
      <div className="mx-auto flex min-h-16 w-full max-w-7xl flex-col gap-2 px-4 py-3 sm:px-6 lg:px-8 xl:flex-row xl:items-center xl:justify-between xl:gap-4">
        <div className="flex w-full items-center justify-between gap-3 xl:w-auto xl:flex-shrink-0">
          <a
            href="#top"
            className="group inline-flex min-w-0 items-center gap-2 rounded-md text-foreground outline-none transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            aria-label={`${brandName} home`}
            onClick={() => setIsMenuOpen(false)}
          >
            <span
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-sm transition-transform group-hover:scale-105"
              aria-hidden="true"
            >
              {brandInitial}
            </span>
            <span className="truncate text-lg font-bold tracking-tight">{brandName}</span>
          </a>

          <div className="flex flex-shrink-0 items-center gap-2 xl:hidden">
            {secondaryCta ? (
              <Button asChild variant="ghost" size="sm" className="hidden whitespace-nowrap sm:inline-flex">
                <a
                  href={secondaryCta.href}
                  aria-label={secondaryCta.ariaLabel ?? secondaryCta.label}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {secondaryCta.label}
                </a>
              </Button>
            ) : null}
            <Button asChild size="sm" className="whitespace-nowrap">
              <a
                href={primaryCta.href}
                aria-label={primaryCta.ariaLabel ?? primaryCta.label}
                onClick={() => setIsMenuOpen(false)}
              >
                {primaryCta.label}
              </a>
            </Button>

            {hasNavItems ? (
              <button
                type="button"
                className={cn(
                  "inline-flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background text-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  isMenuOpen && "bg-accent text-accent-foreground",
                )}
                aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
                aria-expanded={isMenuOpen}
                aria-controls={mobileNavId}
                onClick={() => setIsMenuOpen((current) => !current)}
              >
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  {isMenuOpen ? (
                    <>
                      <path d="M18 6 6 18" />
                      <path d="m6 6 12 12" />
                    </>
                  ) : (
                    <>
                      <path d="M4 6h16" />
                      <path d="M4 12h16" />
                      <path d="M4 18h16" />
                    </>
                  )}
                </svg>
              </button>
            ) : null}
          </div>
        </div>

        {isMenuOpen && hasNavItems ? (
          <nav id={mobileNavId} className="xl:hidden" aria-label="Mobile primary navigation">
            <div className="mt-2 rounded-xl border border-border bg-card/95 p-2 shadow-lg backdrop-blur">
              {navItems.map((item) => (
                <a
                  key={`${item.label}-${item.href}-mobile`}
                  href={item.href}
                  aria-label={item.ariaLabel ?? item.label}
                  className="block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </a>
              ))}
            </div>
          </nav>
        ) : null}

        {hasNavItems ? (
          <nav
            className="hidden items-center gap-1 text-sm font-medium text-muted-foreground xl:flex xl:justify-center"
            aria-label="Primary navigation"
          >
            {navItems.map((item) => (
              <a
                key={`${item.label}-${item.href}`}
                href={item.href}
                aria-label={item.ariaLabel ?? item.label}
                className="rounded-md px-3 py-2 transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                {item.label}
              </a>
            ))}
          </nav>
        ) : null}

        <div className="hidden items-center gap-2 xl:flex">
          {secondaryCta ? (
            <Button asChild variant="outline">
              <a href={secondaryCta.href} aria-label={secondaryCta.ariaLabel ?? secondaryCta.label}>
                {secondaryCta.label}
              </a>
            </Button>
          ) : null}
          <Button asChild>
            <a href={primaryCta.href} aria-label={primaryCta.ariaLabel ?? primaryCta.label}>
              {primaryCta.label}
            </a>
          </Button>
        </div>
      </div>
    </header>
  );
}

export default Header;
