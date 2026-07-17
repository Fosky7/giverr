// src/components/layout/Footer.tsx
//
// Global site footer rendered by App.tsx beneath every route. Uses semantic
// design tokens (border, muted-foreground, background) so it adapts to theme.
// Links point at the real static pages that already exist in the project
// (About, Contact, Privacy, Terms) plus the public Explore listing.

import { Link } from "react-router-dom";

const YEAR = new Date().getFullYear();

const FOOTER_LINKS: Array<{ label: string; to: string }> = [
  { label: "Explore", to: "/explore" },
  { label: "About", to: "/about" },
  { label: "Contact", to: "/contact" },
  { label: "Privacy", to: "/privacy" },
  { label: "Terms", to: "/terms" },
];

/**
 * Site-wide footer. Purely presentational — no data fetching.
 */
export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          &copy; {YEAR} KrossFund. All rights reserved.
        </p>

        <nav aria-label="Footer">
          <ul className="flex flex-wrap items-center gap-x-6 gap-y-2">
            {FOOTER_LINKS.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}

export default Footer;
