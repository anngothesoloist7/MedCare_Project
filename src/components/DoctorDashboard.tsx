"use client";

/**
 * DoctorDashboard Component
 *
 * This component displays a dashboard for doctors showing their patient visits.
 * It features a table with pagination showing patient visits sorted by most recent first.
 * Each row has a "View" button that opens a dialog with full diagnosis details.
 *
 * Connected to:
 * - API endpoint: GET /api/dashboard/doctor to fetch patient visits with pagination
 * - API endpoint: GET /api/clerk/user/[id] to fetch patient names from Clerk
 * - DiagnosisDetailDialog component to show full diagnosis details
 *
 * Features:
 * - Table displaying: #, Name, Time, Diagnosis, Detail columns
 * - Pagination (5 items per page)
 * - Patient names fetched from Clerk API
 * - Click "View" button to see full diagnosis and prescriptions
 */

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { EyeIcon, LayoutDashboardIcon } from "lucide-react";
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
 * Type definition for patient visit from API
 */
type PatientVisit = {
  diagnosis_id: number;
  patient_id: string;
  date: Date;
  diagnosis: string;
  next_checkup: Date | null;
};

/**
 * Type definition for API response
 */
type DashboardResponse = {
  success: boolean;
  data: PatientVisit[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

/**
 * DoctorDashboard component
 * Displays patient visits table with pagination and detail dialog
 */
export default function DoctorDashboard() {
  // State for patient visits data
  const [visits, setVisits] = useState<PatientVisit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // State for patient names (cached to avoid repeated API calls)
  const [patientNames, setPatientNames] = useState<Record<string, string>>({});

  // State for diagnosis detail dialog
  const [selectedDiagnosisId, setSelectedDiagnosisId] = useState<number | null>(
    null
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  /**
   * Fetch patient visits from API when page changes
   * This effect runs when currentPage changes
   */
  useEffect(() => {
    const fetchVisits = async () => {
      setIsLoading(true);
      try {
        // Fetch patient visits with pagination
        // Default limit is 5 per page
        const response = await fetch(
          `/api/dashboard/doctor?page=${currentPage}&limit=5`
        );
        const data: DashboardResponse = await response.json();

        if (response.ok && data.success) {
          // Update state with fetched data
          setVisits(data.data);
          setTotalPages(data.pagination.totalPages);
          setTotal(data.pagination.total);
        } else {
          // Show error toast if API request failed
          toast.error("Failed to load patient visits");
        }
      } catch (error) {
        // Handle network errors or other exceptions
        console.error("Error fetching patient visits:", error);
        toast.error("Failed to load patient visits");
      } finally {
        setIsLoading(false);
      }
    };

    fetchVisits();
  }, [currentPage]);

  /**
   * Fetch patient names from Clerk API for all unique patient IDs using batch endpoint
   * This effect runs when visits data changes
   */
  useEffect(() => {
    const fetchPatientNames = async () => {
      // Get unique patient IDs from visits
      const patientIds = Array.from(
        new Set(visits.map((visit) => visit.patient_id))
      );

      // Filter out patient IDs we already have names for
      const missingIds = patientIds.filter((id) => !patientNames[id]);

      if (missingIds.length === 0) {
        return;
      }

      try {
        // Fetch names for all missing patient IDs using batch endpoint
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
          // Update patient names cache with batch results
          // data.data is a map of user IDs to name data
          setPatientNames((prev) => {
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
          const namePromises = missingIds.map(async (patientId) => {
            try {
              const response = await fetch(`/api/clerk/user/${patientId}`);
              const data = await response.json();

              if (response.ok && data.success) {
                return {
                  patientId,
                  fullName: data.data.fullName,
                };
              }
              return {
                patientId,
                fullName: patientId, // Use user ID as fallback
              };
            } catch (error) {
              console.error(
                `Error fetching name for patient ${patientId}:`,
                error
              );
              return {
                patientId,
                fullName: patientId, // Use user ID as fallback
              };
            }
          });

          const nameResults = await Promise.all(namePromises);
          setPatientNames((prev) => {
            const updated = { ...prev };
            nameResults.forEach(({ patientId, fullName }) => {
              updated[patientId] = fullName;
            });
            return updated;
          });
        }
      } catch (error) {
        // Handle network errors or other exceptions
        console.error("Error fetching patient names:", error);
        // Set fallback names using user IDs
        setPatientNames((prev) => {
          const updated = { ...prev };
          missingIds.forEach((id) => {
            updated[id] = id; // Use user ID as fallback
          });
          return updated;
        });
      }
    };

    if (visits.length > 0) {
      fetchPatientNames();
    }
  }, [visits, patientNames]);

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

  return (
    <div className="container mx-auto p-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <LayoutDashboardIcon className="size-8" />
          Doctor dashboard
        </h1>
        <p className="text-muted-foreground mt-2">
          View your patient visits and diagnosis history
        </p>
      </div>

      {/* Patient Visits Table Card */}
      <Card>
        <CardHeader>
          <CardTitle>Patient visits</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            // Show loading state while fetching data
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">
                Loading patient visits...
              </div>
            </div>
          ) : visits.length === 0 ? (
            // Show message if no visits found
            <div className="text-center py-8 text-muted-foreground">
              No patient visits found
            </div>
          ) : (
            <>
              {/* Patient Visits Table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Diagnosis</TableHead>
                    <TableHead className="w-24">Detail</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visits.map((visit, index) => {
                    // Calculate row number based on current page
                    const rowNumber = (currentPage - 1) * 5 + index + 1;
                    // Get patient name from cache or show loading
                    const patientName =
                      patientNames[visit.patient_id] ?? "Loading...";
                    // Truncate diagnosis text for table display
                    const truncatedDiagnosis =
                      visit.diagnosis.length > 50
                        ? `${visit.diagnosis.substring(0, 50)}...`
                        : visit.diagnosis;

                    return (
                      <TableRow key={visit.diagnosis_id}>
                        <TableCell>{rowNumber}</TableCell>
                        <TableCell className="font-medium">
                          {patientName}
                        </TableCell>
                        <TableCell>
                          {format(new Date(visit.date), "MMM dd, yyyy HH:mm")}
                        </TableCell>
                        <TableCell>{truncatedDiagnosis}</TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewClick(visit.diagnosis_id)}
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
                Showing {visits.length} of {total} patient visits
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
