import type { ReactNode } from "react";
import { Outlet } from "react-router-dom";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

interface MainLayoutProps {
  /**
   * Optional page content. When omitted, the React Router <Outlet /> is
   * rendered instead, allowing MainLayout to be used as a layout route.
   */
  children?: ReactNode;
}

/**
 * Shared application shell: a flex column that pins the Header at the top,
 * expands the main content region, and anchors the Footer at the bottom.
 */
export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header />
      <main className="flex-1">{children ?? <Outlet />}</main>
      <Footer />
    </div>
  );
}

export default MainLayout;
