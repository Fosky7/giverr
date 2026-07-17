import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  Rocket,
  LayoutDashboard,
  Settings,
  LogOut,
  User as UserIcon,
} from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  to: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Home", to: "/" },
  { label: "Explore Campaigns", to: "/explore" },
  { label: "Start a Campaign", to: "/start" },
  { label: "About Us", to: "/about" },
  { label: "Contact", to: "/contact" },
];

/**
 * Derive up to two initials from a display name or email for the avatar
 * fallback. Falls back to a single letter, then a generic glyph handled by
 * the caller when nothing usable is present.
 */
function getInitials(name: string | null | undefined, email: string | null | undefined): string {
  const source = (name && name.trim()) || (email && email.split("@")[0]) || "";
  if (!source) return "";
  const parts = source.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Application header with brand logo, primary navigation, auth controls, and a
 * responsive mobile hamburger menu. Auth state comes from the shared
 * {@link useAuth} hook so the header stays in sync with the rest of the app.
 */
export function Header() {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const displayName = profile?.fullName ?? null;
  const email = profile?.email ?? user?.email ?? null;
  const avatarUrl = profile?.avatarUrl ?? null;
  const initials = getInitials(displayName, email);

  const handleSignOut = async () => {
    setMobileOpen(false);
    await signOut();
    navigate("/");
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "text-sm font-medium transition-colors hover:text-primary",
      isActive ? "text-primary" : "text-muted-foreground"
    );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 font-bold text-lg text-foreground"
          onClick={() => setMobileOpen(false)}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Rocket className="h-5 w-5" />
          </span>
          <span>Rayze</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 md:flex">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} className={navLinkClass} end={item.to === "/"}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Desktop auth */}
        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-full outline-none ring-offset-background transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  aria-label="Open account menu"
                >
                  <Avatar className="h-9 w-9">
                    {avatarUrl ? (
                      <AvatarImage src={avatarUrl} alt={displayName ?? email ?? "User avatar"} />
                    ) : null}
                    <AvatarFallback className="bg-secondary text-secondary-foreground text-sm font-medium">
                      {initials || <UserIcon className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="flex flex-col gap-0.5">
                  {displayName ? (
                    <span className="truncate text-sm font-medium text-foreground">
                      {displayName}
                    </span>
                  ) : null}
                  {email ? (
                    <span className="truncate text-xs font-normal text-muted-foreground">
                      {email}
                    </span>
                  ) : null}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/dashboard">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/dashboard/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Profile Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/login">Login</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/signup">Sign Up</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md p-2 text-foreground md:hidden"
          aria-label="Toggle navigation menu"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((prev) => !prev)}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="border-t border-border bg-background md:hidden">
          <nav className="container mx-auto flex flex-col gap-1 px-4 py-4">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-secondary text-secondary-foreground"
                      : "text-muted-foreground hover:bg-secondary/60"
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}

            <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
              {user ? (
                <>
                  {/* Account summary */}
                  <div className="flex items-center gap-3 px-3 py-2">
                    <Avatar className="h-9 w-9">
                      {avatarUrl ? (
                        <AvatarImage
                          src={avatarUrl}
                          alt={displayName ?? email ?? "User avatar"}
                        />
                      ) : null}
                      <AvatarFallback className="bg-secondary text-secondary-foreground text-sm font-medium">
                        {initials || <UserIcon className="h-4 w-4" />}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex min-w-0 flex-col">
                      {displayName ? (
                        <span className="truncate text-sm font-medium text-foreground">
                          {displayName}
                        </span>
                      ) : null}
                      {email ? (
                        <span className="truncate text-xs text-muted-foreground">
                          {email}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <NavLink
                    to="/dashboard"
                    end
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-secondary text-secondary-foreground"
                          : "text-muted-foreground hover:bg-secondary/60"
                      )
                    }
                  >
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard
                  </NavLink>
                  <NavLink
                    to="/dashboard/settings"
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-secondary text-secondary-foreground"
                          : "text-muted-foreground hover:bg-secondary/60"
                      )
                    }
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Profile Settings
                  </NavLink>
                  <Button variant="outline" size="sm" onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild variant="outline" size="sm">
                    <Link to="/login" onClick={() => setMobileOpen(false)}>
                      Login
                    </Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link to="/signup" onClick={() => setMobileOpen(false)}>
                      Sign Up
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

export default Header;
