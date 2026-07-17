import { Link } from "react-router-dom";
import { Send, Share2, Rss, Link2, Rocket } from "lucide-react";

import { Separator } from "@/components/ui/separator";

interface FooterLink {
  label: string;
  to: string;
}

const QUICK_LINKS: FooterLink[] = [
  { label: "Home", to: "/" },
  { label: "Explore Campaigns", to: "/explore" },
  { label: "Start a Campaign", to: "/start" },
  { label: "About Us", to: "/about" },
  { label: "Contact", to: "/contact" },
];

const LEGAL_LINKS: FooterLink[] = [
  { label: "Privacy Policy", to: "/privacy" },
  { label: "Terms of Service", to: "/terms" },
];

const SOCIAL_LINKS = [
  { label: "Twitter", href: "https://twitter.com", Icon: Send },
  { label: "Facebook", href: "https://facebook.com", Icon: Share2 },
  { label: "Instagram", href: "https://instagram.com", Icon: Rss },
  { label: "LinkedIn", href: "https://linkedin.com", Icon: Link2 },
];

/**
 * Global footer with brand blurb, quick links, legal links, social icons,
 * and dynamic copyright year. Collapses to a single column on mobile.
 */
export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2 font-bold text-lg text-foreground">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Rocket className="h-5 w-5" />
              </span>
              <span>Rayze</span>
            </Link>
            <p className="max-w-xs text-sm text-muted-foreground">
              Empowering ideas through community-driven crowdfunding. Launch,
              back, and grow the projects that matter.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">
              Quick Links
            </h3>
            <ul className="space-y-2">
              {QUICK_LINKS.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">Legal</h3>
            <ul className="space-y-2">
              {LEGAL_LINKS.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="mb-4 text-sm font-semibold text-foreground">
              Follow Us
            </h3>
            <div className="flex items-center gap-3">
              {SOCIAL_LINKS.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-secondary-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; {year} Rayze. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            {LEGAL_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-sm text-muted-foreground transition-colors hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
