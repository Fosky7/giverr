import React from "react";

import type { FooterGroup } from "../types";

interface FooterProps extends React.HTMLAttributes<HTMLElement> {
  brandName: string;
  description: string;
  groups: FooterGroup[];
}

export function Footer({ brandName, description, groups, ...props }: FooterProps) {
  const currentYear = new Date().getFullYear();
  const brandInitial = brandName.trim().charAt(0).toUpperCase() || "G";

  return (
    <footer className="border-t border-border bg-card" aria-labelledby="footer-heading" {...props}>
      <h2 id="footer-heading" className="sr-only">
        Footer
      </h2>
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.2fr_2fr] lg:px-8">
        <div>
          <a href="#top" className="inline-flex items-center gap-2" aria-label={`${brandName} home`}>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <span className="text-base font-bold" aria-hidden="true">
                {brandInitial}
              </span>
            </span>
            <span className="text-lg font-bold tracking-tight">{brandName}</span>
          </a>
          <p className="mt-4 max-w-sm leading-7 text-muted-foreground">{description}</p>
        </div>

        <div className="grid gap-8 sm:grid-cols-3">
          {groups.map((group) => (
            <div key={group.title}>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground">{group.title}</h3>
              <ul className="mt-4 space-y-3">
                {group.links.map((link) => (
                  <li key={`${group.title}-${link.label}`}>
                    <a
                      href={link.href}
                      aria-label={link.ariaLabel ?? link.label}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-border py-6">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>© {currentYear} {brandName}. All rights reserved.</p>
          <p>Built for transparent generosity.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
