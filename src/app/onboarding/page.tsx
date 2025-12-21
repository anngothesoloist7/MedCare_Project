"use client";

/**
 * Onboarding Page Component
 *
 * This page is displayed when a user signs in but hasn't completed onboarding
 * (nid_number is null in the database). Users must fill in all required fields
 * based on their selected role before they can proceed to use the application.
 *
 * Connected to:
 * - Clerk authentication via useUser() hook to get current user's name
 * - API endpoint: POST /api/onboarding to submit onboarding data
 * - Middleware (src/proxy.ts) redirects users here if nid_number is null
 *
 * Form Fields:
 * - Common (all roles): nid_number, phone, dob
 *
 * Validation:
 * - Client-side validation ensures all required fields are filled before submission
 * - Server-side validation in API endpoint provides additional security
 * - Form submission is disabled until all required fields are valid
 *
 * Flow:
 * 1. User fills in form fields based on selected role
 * 2. Form validates required fields client-side
 * 3. On submit, sends data to /api/onboarding endpoint
 * 4. On success, user is redirected to home page (middleware will allow access)
 * 5. On error, displays error message using toast notification
 */

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { ArrowRightIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

/**
 * Type definition for form data state
 * All fields are optional in state, but validation ensures required fields are present
 */
type FormData = {
  nidNumber: string;
  phone: string;
  dob: string;
  role: "Doctor" | "Patient" | "";
};

export default function OnboardingPage() {
  // Get current user from Clerk to display their name in welcome message
  const { user: clerkUser, isLoaded: isUserLoaded } = useUser();
  const router = useRouter();

  // Form state - tracks all input values
  const [formData, setFormData] = useState<FormData>({
    nidNumber: "",
    phone: "",
    dob: "",
    role: "",
  });

  // Loading state for form submission
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get user's full name from Clerk for welcome message
  // Returns formatted name or fallback to username or "User"
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

  // Validate form data based on selected role
  // Returns true if all required fields are filled, false otherwise
  const validateForm = (): boolean => {
    // Common required fields for all roles
    if (
      !formData.nidNumber ||
      !formData.phone ||
      !formData.dob ||
      !formData.role
    ) {
      return false;
    }

    return true;
  };

  // Handle form submission
  // Validates form data, sends to API endpoint, handles success/error responses
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Client-side validation before submission
    if (!validateForm()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare request body
      const requestBody: {
        nidNumber: string;
        phone: string;
        role: "Doctor" | "Patient";
        dob: string;
      } = {
        nidNumber: formData.nidNumber,
        phone: formData.phone,
        role: formData.role as "Doctor" | "Patient",
        dob: formData.dob,
      };

      // Send POST request to onboarding API endpoint
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle API errors (validation errors, server errors, etc.)
        throw new Error(
          data.message ?? data.error ?? "Failed to complete onboarding"
        );
      }

      // Success - show success message and redirect to home
      toast.success("Onboarding completed successfully!");
      router.push("/");
    } catch (error) {
      // Handle network errors or API errors
      toast.error(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle input field changes
  // Updates form state when user types in input fields
  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Check if form is valid to enable/disable submit button
  const isFormValid = validateForm();

  // Show loading state while Clerk user data is loading
  if (!isUserLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-black">
      <div className="w-full max-w-2xl">
        {/* Welcome message - displays user's name from Clerk */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold text-black dark:text-zinc-50">
            Hi {getUserFullName()}, welcome to MedCare
          </h1>
          <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">
            Please fill in your details to complete your profile
          </p>
        </div>

        {/* Onboarding form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Role selection - Radio buttons for Doctor/Patient */}
          <div className="space-y-3">
            <Label htmlFor="role">Role</Label>
            <RadioGroup
              value={formData.role}
              onValueChange={(value) =>
                handleInputChange("role", value as "Doctor" | "Patient" | "")
              }
              className="flex flex-col gap-3"
            >
              <div className="flex items-center gap-3 rounded-md border border-input bg-background p-4 dark:bg-input/30">
                <RadioGroupItem value="Doctor" id="role-doctor" />
                <Label
                  htmlFor="role-doctor"
                  className="cursor-pointer font-normal"
                >
                  Doctor
                </Label>
              </div>
              <div className="flex items-center gap-3 rounded-md border border-input bg-background p-4 dark:bg-input/30">
                <RadioGroupItem value="Patient" id="role-patient" />
                <Label
                  htmlFor="role-patient"
                  className="cursor-pointer font-normal"
                >
                  Patient
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Common fields: NID Number, Phone, Date of Birth */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nidNumber">
                National ID Number <span className="text-destructive">*</span>
              </Label>
              <Input
                id="nidNumber"
                type="number"
                placeholder="Enter your national ID number"
                value={formData.nidNumber}
                onChange={(e) => handleInputChange("nidNumber", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">
                Phone <span className="text-destructive">*</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="Enter your phone number"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dob">
                Date of Birth <span className="text-destructive">*</span>
              </Label>
              <Input
                id="dob"
                type="date"
                value={formData.dob}
                onChange={(e) => handleInputChange("dob", e.target.value)}
                required
                max={new Date().toISOString().split("T")[0]} // Prevent future dates
              />
            </div>
          </div>

          {/* Submit button - Circular button with arrow icon */}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              size="icon"
              className="h-12 w-12 rounded-full"
            >
              <ArrowRightIcon className="h-5 w-5" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
