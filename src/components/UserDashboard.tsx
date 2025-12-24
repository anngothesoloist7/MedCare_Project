"use client";

/**
 * UserDashboard Component
 *
 * This component displays a dashboard for patients showing their latest diagnosis details.
 * It shows the most recent diagnosis with full details including prescription items.
 *
 * Connected to:
 * - API endpoint: GET /api/dashboard/user to fetch latest diagnosis ID
 * - API endpoint: GET /api/diagnosis/[id] to fetch full diagnosis details
 * - API endpoint: GET /api/clerk/user/[id] to fetch doctor names from Clerk
 *
 * Features:
 * - Latest diagnosis information card with date, doctor, diagnosis text, and next checkup
 * - Prescription items table showing medications, quantities, guides, and durations
 * - Doctor names fetched from Clerk API
 */

import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  LayoutDashboardIcon,
  StethoscopeIcon,
  PillIcon,
  CalendarIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Type definition for API response from dashboard endpoint
 */
type DashboardResponse = {
  success: boolean;
  data: Array<{
    diagnosis_id: number;
    doctor_id: string;
    date: Date;
    diagnosis: string;
    next_checkup: Date | null;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

/**
 * Type definition for diagnosis details from API
 */
type DiagnosisDetails = {
  diagnosis_id: number;
  doctor_id: string;
  patient_id: string;
  date: Date;
  diagnosis: string;
  next_checkup: Date | null;
  created_at: Date;
  updated_at: Date;
};

/**
 * Type definition for prescription item from API
 */
type PrescriptionItem = {
  prescription_item_id: number;
  medication_id: number;
  medication_name: string;
  quantity: number;
  guide: string | null;
  duration: string | null;
};

/**
 * Type definition for diagnosis detail API response
 */
type DiagnosisDetailResponse = {
  success: boolean;
  data: {
    diagnosis: DiagnosisDetails;
    prescriptionItems: PrescriptionItem[];
  };
};

/**
 * UserDashboard component
 * Displays latest diagnosis details with prescription items
 */
export default function UserDashboard() {
  // State for doctor names (cached to avoid repeated API calls)
  const [doctorNames, setDoctorNames] = useState<Record<string, string>>({});

  // State for latest diagnosis details
  const [latestDiagnosis, setLatestDiagnosis] =
    useState<DiagnosisDetails | null>(null);
  const [latestPrescriptionItems, setLatestPrescriptionItems] = useState<
    PrescriptionItem[]
  >([]);
  const [isLoadingLatest, setIsLoadingLatest] = useState(false);

  /**
   * Fetch latest diagnosis details when component mounts
   * This effect runs once on mount to get the most recent diagnosis
   */
  useEffect(() => {
    const fetchLatestDiagnosis = async () => {
      setIsLoadingLatest(true);
      try {
        // First, fetch the first page to get the latest diagnosis ID
        const response = await fetch(`/api/dashboard/user?page=1&limit=1`);
        const data: DashboardResponse = await response.json();

        if (response.ok && data.success && data.data.length > 0) {
          // Get the latest diagnosis ID (first item is most recent)
          const latestDiagnosisId = data.data[0].diagnosis_id;

          // Fetch full details of the latest diagnosis including prescription items
          const detailResponse = await fetch(
            `/api/diagnosis/${latestDiagnosisId}`
          );
          const detailData: DiagnosisDetailResponse =
            await detailResponse.json();

          if (detailResponse.ok && detailData.success) {
            // Update state with latest diagnosis details
            setLatestDiagnosis(detailData.data.diagnosis);
            setLatestPrescriptionItems(detailData.data.prescriptionItems);
          } else {
            // If fetching details fails, don't show error toast as it's not critical
            console.error("Failed to load latest diagnosis details");
          }
        }
      } catch (error) {
        // Handle network errors or other exceptions
        // Don't show error toast as this is supplementary information
        console.error("Error fetching latest diagnosis:", error);
      } finally {
        setIsLoadingLatest(false);
      }
    };

    fetchLatestDiagnosis();
  }, []);

  /**
   * Fetch doctor names from Clerk API for latest diagnosis doctor ID using batch endpoint
   * This effect runs when latest diagnosis changes
   */
  useEffect(() => {
    const fetchDoctorNames = async () => {
      // Get doctor ID from latest diagnosis
      const latestDoctorId = latestDiagnosis?.doctor_id;

      if (!latestDoctorId) {
        return;
      }

      // Check if we already have the doctor name
      if (doctorNames[latestDoctorId]) {
        return;
      }

      // Doctor ID is missing, fetch it
      const missingIds = [latestDoctorId];

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

    if (latestDiagnosis) {
      fetchDoctorNames();
    }
  }, [latestDiagnosis, doctorNames]);

  return (
    <div className="container mx-auto p-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <LayoutDashboardIcon className="size-8" />
          Dashboard
        </h1>
        <p className="text-muted-foreground mt-2">
          View your latest diagnosis and prescription details
        </p>
      </div>

      {/* Latest Diagnosis Detail Card */}
      {isLoadingLatest ? (
        <Card className="mb-6">
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">
                Loading latest diagnosis...
              </div>
            </div>
          </CardContent>
        </Card>
      ) : latestDiagnosis ? (
        <Card className="mb-6">
          <CardContent className="space-y-6">
            {/* Diagnosis Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                Diagnosis information
              </h3>

              {/* Diagnosis Date */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Date
                </label>
                <p className="mt-1 flex items-center gap-2">
                  {format(new Date(latestDiagnosis.date), "MMM dd, yyyy")}
                </p>
              </div>

              {/* Doctor Name */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Doctor
                </label>
                <p className="mt-1 font-medium">
                  {doctorNames[latestDiagnosis.doctor_id] ?? "Loading..."}
                </p>
              </div>

              {/* Diagnosis Text */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Diagnosis
                </label>
                <p className="mt-1 whitespace-pre-wrap">
                  {latestDiagnosis.diagnosis}
                </p>
              </div>

              {/* Next Checkup Date (if available) */}
              {latestDiagnosis.next_checkup && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Next checkup
                  </label>
                  <p className="mt-1 flex items-center gap-2">
                    {format(
                      new Date(latestDiagnosis.next_checkup),
                      "MMM dd, yyyy"
                    )}
                  </p>
                </div>
              )}
            </div>

            {/* Prescription Items Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                Prescription items
              </h3>
              {latestPrescriptionItems.length === 0 ? (
                // Show message if no prescription items
                <div className="text-center py-8 text-muted-foreground">
                  <PillIcon className="size-12 mx-auto mb-2 opacity-50" />
                  <p>No prescription items for this diagnosis</p>
                </div>
              ) : (
                // Display prescription items in a responsive table with word wrapping
                <div className="w-full">
                  <table className="w-full border-collapse table-fixed">
                    <colgroup>
                      <col className="w-auto" />
                      <col className="w-24" />
                      <col className="w-auto" />
                      <col className="w-auto" />
                    </colgroup>
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 font-medium text-sm">
                          Medication
                        </th>
                        <th className="text-left p-2 font-medium text-sm">
                          Quantity
                        </th>
                        <th className="text-left p-2 font-medium text-sm">
                          Guide
                        </th>
                        <th className="text-left p-2 font-medium text-sm">
                          Duration
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {latestPrescriptionItems.map((item) => (
                        <tr
                          key={item.prescription_item_id}
                          className="border-b hover:bg-muted/50"
                        >
                          <td className="p-2 font-medium break-words">
                            {item.medication_name}
                          </td>
                          <td className="p-2 break-words">{item.quantity}</td>
                          <td className="p-2 break-words">
                            {item.guide ?? (
                              <span className="text-muted-foreground">N/A</span>
                            )}
                          </td>
                          <td className="p-2 break-words">
                            {item.duration ?? (
                              <span className="text-muted-foreground">N/A</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        // Show message if no latest diagnosis found
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <StethoscopeIcon className="size-5" />
              Latest diagnosis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              No diagnosis found. Your latest diagnosis will appear here once
              you have been diagnosed.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
