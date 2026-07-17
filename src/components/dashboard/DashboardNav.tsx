// src/components/dashboard/DashboardNav.tsx
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Megaphone,
  HandCoins,
  Settings,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

interface DashboardNavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  /** When true the link only matches the exact path (used for the index). */
  end?: boolean;
}

/**
 * Dashboard sub-section links. Paths are relative to the /dashboard layout
 * route so the nested routes resolve correctly.
 */
const NAV_ITEMS: DashboardNavItem[] = [
  { label: "Overview", to: "/dashboard", icon: LayoutDashboard, end: true },
  { label: "My Campaigns", to: "/dashboard/campaigns", icon: Megaphone },
  { label: "Donations", to: "/dashboard/donations", icon: HandCoins },
  { label: "Settings", to: "/dashboard/settings", icon: Settings },
];

/**
 * Vertical navigation for the dashboard. Reuses the app's active-link styling
 * pattern (active = secondary background) so it feels consistent with the
 * mobile header menu.
 */
export function DashboardNav() {
  return (
    <nav className="flex flex-col gap-1" aria-label="Dashboard sections">
      {NAV_ITEMS.map(({ label, to, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-secondary text-secondary-foreground"
                : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
            )
          }
        >
          <Icon className="h-4 w-4 shrink-0" />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

export default DashboardNav;
