"use client";

/**
 * Home Page Component (Dashboard Route)
 *
 * This page conditionally renders either DoctorDashboard or UserDashboard based on the user's role.
 * It checks the user's role via the /api/users/me endpoint and displays the appropriate dashboard.
 *
 * Connected to:
 * - Clerk authentication via useUser() hook to get current user
 * - API endpoint: GET /api/users/me to check user role
 * - DoctorDashboard component for doctors
 * - UserDashboard component for patients
 *
 * Features:
 * - Role-based dashboard rendering
 * - Loading state while checking role
 * - Redirects to appropriate dashboard based on role
 */

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import DoctorDashboard from "@/components/DoctorDashboard";
import UserDashboard from "@/components/UserDashboard";

/**
 * Home page component
 * Conditionally renders dashboard based on user role
 */
export default function Home() {
  const { isLoaded: isUserLoaded } = useUser();

  // State for role checking
  const [isCheckingRole, setIsCheckingRole] = useState(true);
  const [userRole, setUserRole] = useState<"Doctor" | "Patient" | null>(null);

  /**
   * Check user role when component mounts
   * This effect runs when isUserLoaded changes
   */
  useEffect(() => {
    const checkRole = async () => {
      if (!isUserLoaded) return;

      try {
        // Fetch user data to get role
        const response = await fetch("/api/users/me");
        const data = await response.json();

        if (response.ok && data.data?.role) {
          // Set user role if it's Doctor or Patient
          if (data.data.role === "Doctor" || data.data.role === "Patient") {
            setUserRole(data.data.role);
          }
        }
      } catch (error) {
        console.error("Error checking role:", error);
      } finally {
        setIsCheckingRole(false);
      }
    };

    checkRole();
  }, [isUserLoaded]);

  // Show loading state while checking role or user is loading
  if (isCheckingRole || !isUserLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Render appropriate dashboard based on role
  // DoctorDashboard for doctors, UserDashboard for patients
  if (userRole === "Doctor") {
    return <DoctorDashboard />;
  }

  if (userRole === "Patient") {
    return <UserDashboard />;
  }

  // Show message if user doesn't have a valid role
  // This shouldn't happen normally but provides fallback
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-semibold mb-2">Welcome</h1>
        <p className="text-muted-foreground">
          Please complete your profile setup to access the dashboard.
        </p>
      </div>
    </div>
  );
}
