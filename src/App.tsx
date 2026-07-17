// src/App.tsx
//
// Application shell + router. Registers all top-level routes including the
// OAuth finalization route `/auth/callback` (the redirectTo target used by
// signInWithGoogle) and the email/password auth pages.
//
// SINGLE SOURCE OF TRUTH FOR AUTH UI: the real Login / Signup / ResetPassword /
// ForgotPassword pages are the ones wired here. The auto-generated,
// display:none stub pages (LoginPage.tsx, SignupPage.tsx, ResetPasswordPage.tsx,
// ForgotPasswordPage.tsx, Profile.tsx) are intentionally NOT imported or routed
// anywhere — routing them would render a hidden blank page.

import { Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

// Pages (real implementations only — never the *Page.tsx stubs).
import HomePage from "@/pages/HomePage";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import Explore from "@/pages/Explore";
import Privacy from "@/pages/Privacy";
import Terms from "@/pages/Terms";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import AuthCallback from "@/pages/AuthCallback";
import Dashboard from "@/pages/Dashboard";
import DashboardPage from "@/pages/DashboardPage";
import CreateCampaignPage from "@/pages/CreateCampaignPage";
import ProfileSettingsPage from "@/pages/ProfileSettingsPage";
import Start from "@/pages/Start";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

/** Simple full-page fallback while lazy content resolves. */
function PageFallback() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          {/*
            AuthProvider wraps the router so every route + hook reads a
            consistent auth surface (user/session/loading). ProtectedRoute
            depends on this context to gate on the initial session check.
          */}
          <AuthProvider>
            <div className="flex min-h-screen flex-col">
              <Header />
              <main className="flex-1">
                <Suspense fallback={<PageFallback />}>
                  <Routes>
                    {/* Public marketing / content */}
                    <Route path="/" element={<HomePage />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/explore" element={<Explore />} />
                    <Route path="/campaigns" element={<Explore />} />
                    <Route path="/privacy" element={<Privacy />} />
                    <Route path="/terms" element={<Terms />} />

                    {/* Auth (real pages — NOT the display:none stubs) */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route
                      path="/forgot-password"
                      element={<ForgotPassword />}
                    />
                    <Route
                      path="/reset-password"
                      element={<ResetPassword />}
                    />
                    {/* OAuth / email-confirmation finalization target. */}
                    <Route path="/auth/callback" element={<AuthCallback />} />

                    {/* Authenticated */}
                    <Route
                      path="/dashboard"
                      element={
                        <ProtectedRoute>
                          <Dashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/dashboard/campaigns"
                      element={
                        <ProtectedRoute>
                          <DashboardPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/start"
                      element={
                        <ProtectedRoute>
                          <CreateCampaignPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/settings"
                      element={
                        <ProtectedRoute>
                          <ProfileSettingsPage />
                        </ProtectedRoute>
                      }
                    />

                    {/* Fallback */}
        <Route path="/start" element={<Start />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </main>
              <Footer />
            </div>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
