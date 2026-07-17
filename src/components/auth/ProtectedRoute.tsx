// src/components/auth/ProtectedRoute.tsx
import type { ReactNode } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  /**
   * Optional children to render when the user is authenticated. When omitted
   * the component renders a nested React Router <Outlet />, allowing it to be
   * used as a layout/guard route:
   *
   *   <Route element={<ProtectedRoute />}>
   *     <Route path="/dashboard" element={<DashboardPage />} />
   *   </Route>
   *
   * Or wrapping a single element:
   *
   *   <Route
   *     path="/dashboard"
   *     element={<ProtectedRoute><DashboardPage /></ProtectedRoute>}
   *   />
   */
  children?: ReactNode;
  /** Path to redirect unauthenticated users to. Defaults to /login. */
  redirectTo?: string;
}

/**
 * Route guard for authenticated-only areas (dashboard, profile settings).
 *
 * Behaviour:
 * - While the auth state is still bootstrapping (`loading`), a centered
 *   spinner is shown so we don't prematurely bounce a user who actually has a
 *   valid session (e.g. during the OAuth redirect round-trip or initial
 *   session hydration).
 * - Once loading resolves, if there is no authenticated user we redirect to
 *   `/login`, preserving the attempted location in `state.from` so the login
 *   flow can return the user to where they were headed.
 * - Otherwise we render the protected content (children or <Outlet />).
 */
export function ProtectedRoute({
  children,
  redirectTo = "/login",
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // 1) Auth state is still being determined — hold off on any redirect.
  if (loading) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex min-h-[60vh] w-full items-center justify-center"
      >
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="sr-only">Checking your session…</span>
      </div>
    );
  }

  // 2) Resolved, but no user — send to login and remember where we came from.
  if (!user) {
    return (
      <Navigate to={redirectTo} replace state={{ from: location }} />
    );
  }

  // 3) Authenticated — render the guarded content.
  return <>{children ?? <Outlet />}</>;
}

export default ProtectedRoute;
