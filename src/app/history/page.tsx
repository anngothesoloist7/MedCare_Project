"use client";

/**
 * History Page Component
 *
 * This page displays a diagnosis history table for patients with pagination.
 * Each row has a "View" button that opens a dialog with full diagnosis details.
 * This route is only accessible to patients.
 *
 * Connected to:
 * - API endpoint: GET /api/dashboard/user to fetch diagnosis history with pagination
 * - API endpoint: GET /api/clerk/user/[id] to fetch doctor names from Clerk
 * - API endpoint: GET /api/users/me to verify user role
 * - DiagnosisDetailDialog component to show full diagnosis details
 *
 * Features:
 * - Patient-only access protection
 * - Table displaying: #, Doctor, Time, Diagnosis, Detail columns
 * - Pagination (5 items per page)
 * - Doctor names fetched from Clerk API
 * - Click "View" button to see full diagnosis and prescriptions
 */

import { useState, useEffect, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { format } from "date-fns";
import { EyeIcon, HistoryIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import DiagnosisDetailDialog from "@/components/DiagnosisDetailDialog";

/**
 * Type definition for diagnosis history from API
 */
type DiagnosisHistory = {
  diagnosis_id: number;
  doctor_id: string;
  date: Date;
  diagnosis: string;
  next_checkup: Date | null;
};

/**
 * Type definition for API response
 */
type DashboardResponse = {
  success: boolean;
  data: DiagnosisHistory[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

/**
 * History page component
 * Displays diagnosis history table with pagination and detail dialog
 * Only accessible to patients
 */
export default function HistoryPage() {
  const { isLoaded: isUserLoaded } = useUser();

  // State for role checking and access control
  const [isCheckingRole, setIsCheckingRole] = useState(true);
  const [isPatient, setIsPatient] = useState(false);

  // State for diagnosis history data
  const [history, setHistory] = useState<DiagnosisHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // State for doctor names (cached to avoid repeated API calls)
  const [doctorNames, setDoctorNames] = useState<Record<string, string>>({});

  // State for diagnosis detail dialog
  const [selectedDiagnosisId, setSelectedDiagnosisId] = useState<number | null>(
    null
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  /**
   * Check user role when component mounts
   * This effect runs when isUserLoaded changes
   * Only patients can access this page
   */
  useEffect(() => {
    const checkRole = async () => {
      if (!isUserLoaded) return;

      try {
        // Fetch user data to get role
        const response = await fetch("/api/users/me");
        const data = await response.json();

        if (response.ok && data.data?.role === "Patient") {
          // User is a patient, allow access
          setIsPatient(true);
        } else {
          // User is not a patient, deny access
          setIsPatient(false);
        }
      } catch (error) {
        console.error("Error checking role:", error);
        setIsPatient(false);
      } finally {
        setIsCheckingRole(false);
      }
    };

    checkRole();
  }, [isUserLoaded]);

  /**
   * Fetch diagnosis history from API when page changes
   * This effect runs when currentPage changes
   * Only runs if user is a patient
   */
  useEffect(() => {
    if (!isPatient) return;

    const fetchHistory = async () => {
      setIsLoading(true);
      try {
        // Fetch diagnosis history with pagination
        // Default limit is 5 per page
        const response = await fetch(
          `/api/dashboard/user?page=${currentPage}&limit=5`
        );
        const data: DashboardResponse = await response.json();

        if (response.ok && data.success) {
          // Update state with fetched data
          setHistory(data.data);
          setTotalPages(data.pagination.totalPages);
          setTotal(data.pagination.total);
        } else {
          // Show error toast if API request failed
          toast.error("Failed to load diagnosis history");
        }
      } catch (error) {
        // Handle network errors or other exceptions
        console.error("Error fetching diagnosis history:", error);
        toast.error("Failed to load diagnosis history");
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [currentPage, isPatient]);

  /**
   * Fetch doctor names from Clerk API for all unique doctor IDs using batch endpoint
   * This effect runs when history data changes
   * Only runs if user is a patient
   */
  useEffect(() => {
    if (!isPatient) return;

    const fetchDoctorNames = async () => {
      // Get unique doctor IDs from history
      const doctorIds = Array.from(
        new Set(history.map((item) => item.doctor_id))
      );

      // Filter out doctor IDs we already have names for
      const missingIds = doctorIds.filter((id) => !doctorNames[id]);

      if (missingIds.length === 0) {
        return;
      }

      try {
        // Fetch names for all missing doctor IDs using batch endpoint
        // This is more efficient than fetching them one by one
        const response = await fetch("/api/clerk/users/batch", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userIds: missingIds }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          // Update doctor names cache with batch results
          // data.data is a map of user IDs to name data
          setDoctorNames((prev) => {
            const updated = { ...prev };
            Object.entries(data.data).forEach(([userId, nameData]) => {
              const nameInfo = nameData as { fullName: string };
              updated[userId] = nameInfo.fullName;
            });
            return updated;
          });
        } else {
          // If batch fetch fails, fall back to individual fetches
          console.error(
            "Batch fetch failed, falling back to individual fetches:",
            data
          );
          const namePromises = missingIds.map(async (doctorId) => {
            try {
              const response = await fetch(`/api/clerk/user/${doctorId}`);
              const data = await response.json();

              if (response.ok && data.success) {
                return {
                  doctorId,
                  fullName: data.data.fullName,
                };
              }
              return {
                doctorId,
                fullName: doctorId, // Use user ID as fallback
              };
            } catch (error) {
              console.error(
                `Error fetching name for doctor ${doctorId}:`,
                error
              );
              return {
                doctorId,
                fullName: doctorId, // Use user ID as fallback
              };
            }
          });

          const nameResults = await Promise.all(namePromises);
          setDoctorNames((prev) => {
            const updated = { ...prev };
            nameResults.forEach(({ doctorId, fullName }) => {
              updated[doctorId] = fullName;
            });
            return updated;
          });
        }
      } catch (error) {
        // Handle network errors or other exceptions
        console.error("Error fetching doctor names:", error);
        // Set fallback names using user IDs
        setDoctorNames((prev) => {
          const updated = { ...prev };
          missingIds.forEach((id) => {
            updated[id] = id; // Use user ID as fallback
          });
          return updated;
        });
      }
    };

    if (history.length > 0) {
      fetchDoctorNames();
    }
  }, [history, doctorNames, isPatient]);

  /**
   * Handle pagination page change
   * Updates currentPage state which triggers data fetch
   */
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  /**
   * Handle "View" button click
   * Opens diagnosis detail dialog with selected diagnosis ID
   */
  const handleViewClick = (diagnosisId: number) => {
    setSelectedDiagnosisId(diagnosisId);
    setIsDialogOpen(true);
  };

  /**
   * Generate pagination items for display
   * Creates array of page numbers to show in pagination component
   */
  const paginationItems = useMemo(() => {
    const items: (number | "ellipsis")[] = [];
    const maxVisible = 5; // Maximum number of page buttons to show

    if (totalPages <= maxVisible) {
      // Show all pages if total pages is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        items.push(i);
      }
    } else {
      // Show first page, ellipsis, current page range, ellipsis, last page
      items.push(1);

      if (currentPage > 3) {
        items.push("ellipsis");
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        items.push(i);
      }

      if (currentPage < totalPages - 2) {
        items.push("ellipsis");
      }

      items.push(totalPages);
    }

    return items;
  }, [currentPage, totalPages]);

  // Show loading state while checking role or user is loading
  if (isCheckingRole || !isUserLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Show access denied message if user is not a patient
  if (!isPatient) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-2">Access Denied</h1>
          <p className="text-muted-foreground">
            This page is only accessible to patients.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <HistoryIcon className="size-8" />
          Visited History
        </h1>
        <p className="text-muted-foreground mt-2">
          View your complete visited history and prescriptions
        </p>
      </div>

      {/* Diagnosis History Table Card */}
      <Card>
        <CardHeader>
          <CardTitle>Visited History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            // Show loading state while fetching data
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">
                Loading visited history...
              </div>
            </div>
          ) : history.length === 0 ? (
            // Show message if no history found
            <div className="text-center py-8 text-muted-foreground">
              No visited history found
            </div>
          ) : (
            <>
              {/* Diagnosis History Table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Diagnosis</TableHead>
                    <TableHead className="w-24">Detail</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((item, index) => {
                    // Calculate row number based on current page
                    const rowNumber = (currentPage - 1) * 5 + index + 1;
                    // Get doctor name from cache or show loading
                    const doctorName =
                      doctorNames[item.doctor_id] ?? "Loading...";
                    // Truncate diagnosis text for table display
                    const truncatedDiagnosis =
                      item.diagnosis.length > 50
                        ? `${item.diagnosis.substring(0, 50)}...`
                        : item.diagnosis;

                    return (
                      <TableRow key={item.diagnosis_id}>
                        <TableCell>{rowNumber}</TableCell>
                        <TableCell className="font-medium">
                          {doctorName}
                        </TableCell>
                        <TableCell>
                          {format(new Date(item.date), "MMM dd, yyyy HH:mm")}
                        </TableCell>
                        <TableCell>{truncatedDiagnosis}</TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewClick(item.diagnosis_id)}
                            className="gap-2"
                          >
                            <EyeIcon className="size-4" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6">
                  <Pagination>
                    <PaginationContent>
                      {/* Previous Button */}
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            handlePageChange(currentPage - 1);
                          }}
                          className={
                            currentPage === 1
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer"
                          }
                        />
                      </PaginationItem>

                      {/* Page Number Buttons */}
                      {paginationItems.map((item, index) => {
                        if (item === "ellipsis") {
                          return (
                            <PaginationItem key={`ellipsis-${index}`}>
                              <PaginationEllipsis />
                            </PaginationItem>
                          );
                        }

                        return (
                          <PaginationItem key={item}>
                            <PaginationLink
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                handlePageChange(item);
                              }}
                              isActive={currentPage === item}
                              className="cursor-pointer"
                            >
                              {item}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}

                      {/* Next Button */}
                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            handlePageChange(currentPage + 1);
                          }}
                          className={
                            currentPage === totalPages
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer"
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}

              {/* Total Count Display */}
              <div className="mt-4 text-sm text-muted-foreground text-center">
                Showing {history.length} of {total} visited history
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Diagnosis Detail Dialog */}
      <DiagnosisDetailDialog
        diagnosisId={selectedDiagnosisId}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </div>
  );
}

