"use client";

/**
 * Layout Wrapper Component
 *
 * This client component wraps the layout structure and conditionally renders
 * the sidebar based on the current route. It uses usePathname() to detect
 * if we're on the onboarding page and hides the sidebar accordingly.
 *
 * Connected to:
 * - Root layout (src/app/layout.tsx) - Uses this component to conditionally render sidebar
 * - Onboarding page (src/app/onboarding/page.tsx) - Sidebar is hidden on this route
 *
 * Purpose:
 * - Hide sidebar on /onboarding route for a focused onboarding experience
 * - Show sidebar on all other routes for normal navigation
 */

import { usePathname } from "next/navigation";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import AppSidebar from "@/components/AppSidebar";
import MobileSidebarTrigger from "@/components/MobileSidebarTrigger";
import { SignInButton, SignUpButton, SignedOut } from "@clerk/nextjs";

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get current pathname to check if we're on onboarding page
  const pathname = usePathname();
  const isOnboardingPage = pathname === "/onboarding";

  // On onboarding page, render children without sidebar
  if (isOnboardingPage) {
    return <>{children}</>;
  }

  // On all other pages, render with sidebar navigation
  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />

      <SidebarInset>
        <div className="flex items-center gap-2 p-4">
          <MobileSidebarTrigger />
          {/* Show sign in and sign up buttons when user is not authenticated */}
          <SignedOut>
            <SignInButton mode="modal" />
            <SignUpButton mode="modal" />
          </SignedOut>
        </div>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
