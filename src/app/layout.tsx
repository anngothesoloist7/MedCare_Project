import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import LayoutWrapper from "@/components/LayoutWrapper";
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
 *
 * For the /onboarding route, the sidebar is hidden to provide a focused
 * onboarding experience without navigation distractions. This is handled
 * by the LayoutWrapper client component which checks the pathname.
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
          {/* LayoutWrapper is a client component that conditionally renders sidebar */}
          {/* It hides the sidebar on /onboarding route and shows it on other routes */}
          <LayoutWrapper>{children}</LayoutWrapper>

          {/* Toaster for toast notifications (available on all pages) */}
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
