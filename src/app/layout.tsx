import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedOut,
} from "@clerk/nextjs";
import { Toaster } from "sonner";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import AppSidebar from "@/components/AppSidebar";
import MobileSidebarTrigger from "@/components/MobileSidebarTrigger";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MedCare",
  description: "Medical care management system",
};

/**
 * Root layout component that wraps all pages.
 * Provides the main layout structure with sidebar navigation.
 * Includes Clerk authentication provider and sidebar components.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
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

            <Toaster />
          </SidebarProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
