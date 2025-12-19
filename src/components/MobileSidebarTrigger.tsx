"use client";

import { useIsMobile } from "@/hooks/use-mobile";
import { SidebarTrigger } from "@/components/ui/sidebar";

/**
 * Mobile sidebar trigger component.
 * Only renders the sidebar trigger button on mobile devices.
 * Hidden on desktop where the sidebar is always visible.
 */
export default function MobileSidebarTrigger() {
  const isMobile = useIsMobile();

  if (!isMobile) {
    return null;
  }

  return <SidebarTrigger />;
}
