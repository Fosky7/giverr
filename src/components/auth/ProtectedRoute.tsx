// src/components/auth/ProtectedRoute.tsx
//
// Route guard for authenticated-only pages. Wrap any protected element:
//
//   <Route
//     path="/dashboard"
//     element={
//       <ProtectedRoute>
//         <Dashboard />
//       </ProtectedRoute>
//     }
//   />
//
// Behaviour:
//   * While the initial session check is in flight (`loading` from useAuth), we
//     render a full-page spinner. Gating on loading prevents a "flash of the
//     login page" for users who are actually authenticated but whose session
//     hasn't resolved yet on first paint.
//   * Once resolved, if there is no user we redirect to /login and preserve the
//     attempted path (+ query + hash) as a `redirect` query param. After a
//     successful email login or Google OAuth round-trip, the auth flow reads
//     this param and returns the user to exactly where they were headed.
//   * If authenticated, we render the protected children.

import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";

import { useAuth } from "@/hooks/useAuth";

export interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * Guards its children behind an authenticated Supabase session.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // 1) Still resolving the initial session — don't decide yet.
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="sr-only">Checking your session…</span>
      </div>
    );
  }

  // 2) Not signed in — bounce to /login, remembering where they wanted to go.
  if (!user) {
    const attemptedPath = `${location.pathname}${location.search}${location.hash}`;
    const redirectParam = encodeURIComponent(attemptedPath);
    return (
      <Navigate to={`/login?redirect=${redirectParam}`} replace />
    );
  }

  // 3) Authenticated — render the protected content.
  return <>{children}</>;
}

export default ProtectedRoute;
