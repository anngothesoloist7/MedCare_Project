"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";
import {
  LayoutDashboardIcon,
  PillIcon,
  PanelLeftIcon,
  Link,
  StethoscopeIcon,
  FileSearchIcon,
  HistoryIcon,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import Image from "next/image";
import HistoryQueryDialog from "@/components/HistoryQueryDialog";

/**
 * Main application sidebar component.
 * Displays navigation menu items including logo, create button, dashboard,
 * medication tracking, update, query buttons, and Clerk user button.
 * Sidebar is collapsed by default and expands on hover.
 */
export default function AppSidebar() {
  const { state, toggleSidebar, isMobile, openMobile } = useSidebar();
  // On mobile, treat sidebar as expanded (open mode) when mobile sidebar is open
  // On desktop, use the actual state
  const isCollapsed = isMobile ? !openMobile : state === "collapsed";
  const router = useRouter();
  const { user: clerkUser } = useUser();

  // State to track if user is a doctor (for conditional menu items)
  const [isDoctor, setIsDoctor] = useState(false);
  const [isPatient, setIsPatient] = useState(false);
  const [isCheckingRole, setIsCheckingRole] = useState(true);

  // State for history query dialog
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);

  /**
   * Check if current user is a doctor or patient
   * Used to conditionally show menu items based on role
   */
  useEffect(() => {
    const checkRole = async () => {
      try {
        const response = await fetch("/api/users/me");
        const data = await response.json();

        if (response.ok && data.data?.role) {
          if (data.data.role === "Doctor") {
            setIsDoctor(true);
          } else if (data.data.role === "Patient") {
            setIsPatient(true);
          }
        }
      } catch (error) {
        console.error("Error checking role in sidebar:", error);
      } finally {
        setIsCheckingRole(false);
      }
    };

    checkRole();
  }, []);

  /**
   * Gets user's full name from Clerk.
   * Returns formatted name or fallback to username or "User".
   */
  const getUserFullName = (): string => {
    if (!clerkUser) return "User";
    const firstName = clerkUser.firstName ?? "";
    const lastName = clerkUser.lastName ?? "";
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    if (firstName) return firstName;
    if (lastName) return lastName;
    return clerkUser.username ?? "User";
  };

  /**
   * Menu items for the sidebar with their icons and descriptions.
   * Each item has an onClick handler for navigation or actions.
   * Menu items are conditionally shown based on user role:
   * - Dashboard: visible to all users
   * - Diagnosis, Medication, History Query: only visible to doctors
   * - History: only visible to patients
   */
  const menuItems = [
    // Dashboard menu item - visible to all users
    {
      title: "Dashboard",
      description: "Dashboard",
      icon: LayoutDashboardIcon,
      onClick: () => {
        router.push("/");
      },
    },
    // Doctor-only menu items
    ...(isDoctor && !isCheckingRole
      ? [
          {
            title: "Diagnosis",
            description: "Diagnosis",
            icon: StethoscopeIcon,
            onClick: () => {
              router.push("/diagnosis");
            },
          },
          {
            title: "Medication",
            description: "Medication",
            icon: PillIcon,
            onClick: () => {
              router.push("/medication");
            },
          },
          {
            title: "History Query",
            description: "History Query",
            icon: FileSearchIcon,
            onClick: () => {
              // Open history query dialog
              setIsHistoryDialogOpen(true);
            },
          },
        ]
      : []),
    // Patient-only menu items
    ...(isPatient && !isCheckingRole
      ? [
          {
            title: "History",
            description: "History",
            icon: HistoryIcon,
            onClick: () => {
              router.push("/history");
            },
          },
        ]
      : []),
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Logo and trigger button */}
              <SidebarMenuItem>
                <div className="ml-0.5 flex w-full items-center justify-between">
                  {isCollapsed ? (
                    /* Collapsed mode: show logo, on hover show trigger icon */
                    <button
                      onClick={toggleSidebar}
                      aria-label="Toggle Sidebar"
                      className="relative flex h-7 w-7 items-center justify-center cursor-pointer"
                    >
                      {/* Logo image - hidden when hovering over sidebar (using sidebar's group hover) */}
                      <Image
                        src="/icon.png"
                        alt="MedCare Logo"
                        className="h-7 w-7 transition-opacity duration-200 group-hover:opacity-0"
                        width={28}
                        height={28}
                      />
                      {/* Trigger icon - shown when hovering over sidebar (using sidebar's group hover) - size-4 to match SidebarTrigger icon size */}
                      <PanelLeftIcon className="size-4 absolute opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                    </button>
                  ) : (
                    /* In open mode: logo on left, trigger button on right */
                    <>
                      <Link href="/" aria-label="Home">
                        <Image
                          src="/icon.png"
                          alt="MedCare Logo"
                          className="h-7 w-7"
                          width={28}
                          height={28}
                        />
                      </Link>
                      <SidebarTrigger />
                    </>
                  )}
                </div>
              </SidebarMenuItem>
              {/* Map through menu items and render each as a sidebar menu button */}
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {/* Use consistent SidebarMenuButton with tooltip for collapsed state */}
                  <SidebarMenuButton
                    onClick={item.onClick}
                    tooltip={isCollapsed ? item.description : undefined}
                    className="cursor-pointer"
                  >
                    <item.icon />
                    <span>{item.description}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer with Clerk UserButton */}
      <SidebarFooter>
        <SidebarMenu className="flex flex-col gap-2">
          {/* User card with UserButton and full name - responsive layout */}
          <SidebarMenuItem>
            {isCollapsed ? (
              /* Collapsed mode: just show UserButton */
              <div className="ml-0.5">
                <UserButton />
              </div>
            ) : (
              /* Open mode: UserButton and full name in same row, wrapped in a card-like container */
              <div className="flex items-center gap-2 w-full px-2 py-2 rounded-md hover:bg-sidebar-accent transition-colors">
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: "h-8 w-8",
                    },
                  }}
                />
                <span className="text-sm font-medium truncate flex-1">
                  {getUserFullName()}
                </span>
              </div>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      {/* History Query Dialog */}
      <HistoryQueryDialog
        open={isHistoryDialogOpen}
        onOpenChange={setIsHistoryDialogOpen}
      />
    </Sidebar>
  );
}
