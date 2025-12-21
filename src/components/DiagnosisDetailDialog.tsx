"use client";

/**
 * DiagnosisDetailDialog Component
 *
 * This component displays a dialog showing full diagnosis details and prescription items.
 * It fetches diagnosis information from the API and displays it in a structured format.
 *
 * Connected to:
 * - API endpoint: GET /api/diagnosis/[id] to fetch diagnosis details and prescriptions
 *
 * Used by:
 * - DoctorDashboard component when user clicks "View" button
 * - UserDashboard component when user clicks "View" button
 *
 * Props:
 * - diagnosisId: The diagnosis ID to fetch and display
 * - open: Boolean to control dialog visibility
 * - onOpenChange: Callback function when dialog open state changes
 */

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { StethoscopeIcon, PillIcon, CalendarIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
 * Type definition for API response
 */
type DiagnosisDetailResponse = {
  success: boolean;
  data: {
    diagnosis: DiagnosisDetails;
    prescriptionItems: PrescriptionItem[];
  };
};

/**
 * Props for DiagnosisDetailDialog component
 */
type DiagnosisDetailDialogProps = {
  diagnosisId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * DiagnosisDetailDialog component
 * Displays full diagnosis details and prescription items in a dialog
 */
export default function DiagnosisDetailDialog({
  diagnosisId,
  open,
  onOpenChange,
}: DiagnosisDetailDialogProps) {
  // State for diagnosis details and prescription items
  const [diagnosis, setDiagnosis] = useState<DiagnosisDetails | null>(null);
  const [prescriptionItems, setPrescriptionItems] = useState<
    PrescriptionItem[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Fetch diagnosis details when dialog opens and diagnosisId is provided
   * This effect runs when open or diagnosisId changes
   */
  useEffect(() => {
    const fetchDiagnosisDetails = async () => {
      // Don't fetch if dialog is closed or no diagnosisId provided
      if (!open || !diagnosisId) {
        return;
      }

      setIsLoading(true);
      try {
        // Fetch diagnosis details from API
        // The API returns both diagnosis and prescription items
        const response = await fetch(`/api/diagnosis/${diagnosisId}`);
        const data: DiagnosisDetailResponse = await response.json();

        if (response.ok && data.success) {
          // Update state with fetched data
          setDiagnosis(data.data.diagnosis);
          setPrescriptionItems(data.data.prescriptionItems);
        } else {
          // Show error toast if API request failed
          const errorMessage =
            (data as { message?: string }).message ??
            (data as { error?: string }).error ??
            "Failed to load diagnosis details";
          toast.error(errorMessage);
        }
      } catch (error) {
        // Handle network errors or other exceptions
        console.error("Error fetching diagnosis details:", error);
        toast.error("Failed to load diagnosis details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDiagnosisDetails();
  }, [open, diagnosisId]);

  /**
   * Reset state when dialog closes
   * This ensures clean state when dialog is reopened
   */
  useEffect(() => {
    if (!open) {
      setDiagnosis(null);
      setPrescriptionItems([]);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-[90vw] md:max-w-[85vw] lg:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <StethoscopeIcon className="size-5" />
            Diagnosis details
          </DialogTitle>
          <DialogDescription>
            View complete diagnosis information and prescribed medications
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          // Show loading state while fetching data
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">
              Loading diagnosis details...
            </div>
          </div>
        ) : diagnosis ? (
          <div className="space-y-6">
            {/* Diagnosis Information Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Diagnosis information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Diagnosis Date */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Date
                  </label>
                  <p className="mt-1 flex items-center gap-2">
                    {format(new Date(diagnosis.date), "PPP")}
                  </p>
                </div>

                {/* Diagnosis Text */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Diagnosis
                  </label>
                  <p className="mt-1 whitespace-pre-wrap">
                    {diagnosis.diagnosis}
                  </p>
                </div>

                {/* Next Checkup Date (if available) */}
                {diagnosis.next_checkup && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Next checkup
                    </label>
                    <p className="mt-1 flex items-center gap-2">
                      {format(new Date(diagnosis.next_checkup), "PPP")}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Prescription Items Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Prescription items
                </CardTitle>
              </CardHeader>
              <CardContent>
                {prescriptionItems.length === 0 ? (
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
                        {prescriptionItems.map((item) => (
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
                                <span className="text-muted-foreground">
                                  N/A
                                </span>
                              )}
                            </td>
                            <td className="p-2 break-words">
                              {item.duration ?? (
                                <span className="text-muted-foreground">
                                  N/A
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          // Show message if no diagnosis data (shouldn't happen normally)
          <div className="text-center py-8 text-muted-foreground">
            No diagnosis details available
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
