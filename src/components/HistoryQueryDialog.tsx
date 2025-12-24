"use client";

/**
 * HistoryQueryDialog Component
 *
 * This component displays a dialog for doctors to query patient diagnosis history.
 * It allows searching by patient ID (NID number) and displays the patient's diagnosis history
 * with pagination. Similar to the dashboard table but for querying any patient's history.
 *
 * Connected to:
 * - API endpoint: GET /api/patients/by-nid to look up patient by NID
 * - API endpoint: GET /api/history/patient to fetch patient diagnosis history with pagination
 * - API endpoint: GET /api/clerk/user/[id] to fetch patient names from Clerk
 * - DiagnosisDetailDialog component to show full diagnosis details
 *
 * Features:
 * - Patient search by NID number
 * - Table displaying patient diagnosis history (5 per page, paginated)
 * - Click "View" button to see full diagnosis and prescriptions
 */

import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { EyeIcon, SearchIcon, FileSearchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import DiagnosisDetailDialog from "@/components/DiagnosisDetailDialog";

/**
 * Type definition for patient from API
 */
type Patient = {
  user_id: string;
  nid_number: string | null;
  phone: string | null;
  dob: string | null;
  role: "Admin" | "Doctor" | "Patient" | null;
};

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
type HistoryResponse = {
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
 * Props for HistoryQueryDialog component
 */
type HistoryQueryDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * HistoryQueryDialog component
 * Allows doctors to search and view patient diagnosis history
 */
export default function HistoryQueryDialog({
  open,
  onOpenChange,
}: HistoryQueryDialogProps) {
  // State for patient search
  const [nidSearch, setNidSearch] = useState("");
  const [isSearchingPatient, setIsSearchingPatient] = useState(false);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [patientName, setPatientName] = useState<string>("");

  // State for diagnosis history
  const [history, setHistory] = useState<DiagnosisHistory[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // State for diagnosis detail dialog
  const [selectedDiagnosisId, setSelectedDiagnosisId] = useState<number | null>(
    null
  );
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  /**
   * Reset state when dialog closes
   * This ensures clean state when dialog is reopened
   */
  useEffect(() => {
    if (!open) {
      setNidSearch("");
      setPatient(null);
      setHistory([]);
      setCurrentPage(1);
      setTotalPages(1);
      setTotal(0);
    }
  }, [open]);

  /**
   * Fetch patient diagnosis history when patient is found and page changes
   * This effect runs when patient or currentPage changes
   */
  useEffect(() => {
    const fetchHistory = async () => {
      if (!patient) {
        return;
      }

      setIsLoadingHistory(true);
      try {
        // Fetch patient diagnosis history with pagination
        // Default limit is 5 per page
        const response = await fetch(
          `/api/history/patient?patientId=${encodeURIComponent(
            patient.user_id
          )}&page=${currentPage}&limit=5`
        );
        const data: HistoryResponse = await response.json();

        if (response.ok && data.success) {
          // Update state with fetched data
          setHistory(data.data);
          setTotalPages(data.pagination.totalPages);
          setTotal(data.pagination.total);
        } else {
          // Show error toast if API request failed
          toast.error("Failed to load patient history");
        }
      } catch (error) {
        // Handle network errors or other exceptions
        console.error("Error fetching patient history:", error);
        toast.error("Failed to load patient history");
      } finally {
        setIsLoadingHistory(false);
      }
    };

    fetchHistory();
  }, [patient, currentPage]);

  /**
   * Fetch patient name from Clerk when patient is found
   */
  useEffect(() => {
    const fetchPatientName = async () => {
      if (!patient) {
        setPatientName("");
        return;
      }

      try {
        const response = await fetch(`/api/clerk/user/${patient.user_id}`);
        const data = await response.json();

        if (response.ok && data.success) {
          setPatientName(data.data.fullName);
        } else {
          setPatientName(patient.user_id); // Fallback to user ID
        }
      } catch (error) {
        console.error("Error fetching patient name:", error);
        setPatientName(patient.user_id); // Fallback to user ID
      }
    };

    fetchPatientName();
  }, [patient]);

  /**
   * Search for patient by NID number
   * This function is called when user clicks search button or presses Enter
   */
  const handleSearchPatient = async () => {
    if (!nidSearch.trim()) {
      toast.error("Please enter a NID number");
      return;
    }

    setIsSearchingPatient(true);
    try {
      // Search for patient by NID number
      const response = await fetch(
        `/api/patients/by-nid?nid_number=${encodeURIComponent(
          nidSearch.trim()
        )}`
      );
      const data = await response.json();

      if (response.ok && data.data) {
        // Patient found, update state
        setPatient(data.data);
        setCurrentPage(1); // Reset to first page
        toast.success("Patient found");
      } else {
        // Patient not found
        setPatient(null);
        setHistory([]);
        toast.error(data.message ?? "Patient not found");
      }
    } catch (error) {
      // Handle network errors or other exceptions
      console.error("Error searching patient:", error);
      toast.error("Failed to search patient");
      setPatient(null);
      setHistory([]);
    } finally {
      setIsSearchingPatient(false);
    }
  };

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
    setIsDetailDialogOpen(true);
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
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[95vw] sm:max-w-[90vw] md:max-w-[85vw] lg:max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSearchIcon className="size-5" />
              Patient diagnosis query
            </DialogTitle>
            <DialogDescription>
              Search for a patient by NID number to view their diagnosis history
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Patient Search Section */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nid-search">National ID Number</Label>
                    <div className="flex gap-2">
                      <Input
                        id="nid-search"
                        placeholder="Enter NID number"
                        value={nidSearch}
                        onChange={(e) => setNidSearch(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleSearchPatient();
                          }
                        }}
                      />
                      <Button
                        onClick={handleSearchPatient}
                        disabled={isSearchingPatient}
                        size="icon"
                      >
                        <SearchIcon className="size-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Patient Info Display */}
                  {patient && (
                    <div className="pt-4 border-t space-y-2">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Name: </span>
                        <span className="font-medium">
                          {patientName || "Loading..."}
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">
                          NID Number:{" "}
                        </span>
                        <span className="font-medium">
                          {patient.nid_number ?? "N/A"}
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Phone: </span>
                        <span className="font-medium">
                          {patient.phone ?? "N/A"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Diagnosis History Table */}
            {patient && (
              <Card>
                <CardContent className="pt-6">
                  {isLoadingHistory ? (
                    // Show loading state while fetching data
                    <div className="flex items-center justify-center py-8">
                      <div className="text-muted-foreground">
                        Loading diagnosis history...
                      </div>
                    </div>
                  ) : history.length === 0 ? (
                    // Show message if no history found
                    <div className="text-center py-8 text-muted-foreground">
                      No diagnosis history found for this patient
                    </div>
                  ) : (
                    <>
                      {/* Diagnosis History Table - Responsive with word wrapping */}
                      <div className="w-full">
                        <table className="w-full border-collapse table-fixed">
                          <colgroup>
                            <col className="w-12" />
                            <col className="w-36" />
                            <col className="w-auto" />
                            <col className="w-24" />
                          </colgroup>
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-2 font-medium text-sm">
                                #
                              </th>
                              <th className="text-left p-2 font-medium text-sm">
                                Time
                              </th>
                              <th className="text-left p-2 font-medium text-sm">
                                Diagnosis
                              </th>
                              <th className="text-left p-2 font-medium text-sm">
                                Detail
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {history.map((item, index) => {
                              // Calculate row number based on current page
                              const rowNumber =
                                (currentPage - 1) * 5 + index + 1;

                              return (
                                <tr
                                  key={item.diagnosis_id}
                                  className="border-b hover:bg-muted/50"
                                >
                                  <td className="p-2 break-words">
                                    {rowNumber}
                                  </td>
                                  <td className="p-2 break-words">
                                    {format(
                                      new Date(item.date),
                                      "MMM dd, yyyy HH:mm"
                                    )}
                                  </td>
                                  <td className="p-2 break-words">
                                    {item.diagnosis}
                                  </td>
                                  <td className="p-2 break-words">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        handleViewClick(item.diagnosis_id)
                                      }
                                      className="gap-2"
                                    >
                                      <EyeIcon className="size-4" />
                                      View
                                    </Button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

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
                        Showing {history.length} of {total} diagnoses
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Diagnosis Detail Dialog */}
      <DiagnosisDetailDialog
        diagnosisId={selectedDiagnosisId}
        open={isDetailDialogOpen}
        onOpenChange={setIsDetailDialogOpen}
      />
    </>
  );
}
