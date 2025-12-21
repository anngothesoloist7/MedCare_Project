"use client";

/**
 * Diagnosis Page Component
 *
 * This page allows doctors to create diagnoses and prescriptions for patients.
 * It features a 2-step wizard flow:
 * - Step 1: Find patient by NID number (must complete before proceeding)
 * - Step 2: Enter diagnosis and prescription details
 *
 * Connected to:
 * - Clerk authentication via useUser() hook to get current user
 * - API endpoint: GET /api/users/me to verify doctor role
 * - API endpoint: GET /api/patients/by-nid to look up patient by NID
 * - API endpoint: GET /api/medications to fetch medication list
 * - API endpoint: POST /api/diagnosis to submit diagnosis and prescriptions
 *
 * Features:
 * - Role-based access control (only doctors can access)
 * - 2-step wizard with step indicator showing progress
 * - Step 1: Patient lookup by NID number with patient details display
 * - Step 2: Diagnosis entry with optional next checkup date
 * - Dynamic prescription items with medication selection and stock validation
 * - Form validation and error handling
 * - Navigation controls: Continue button (Step 1) and Back button (Step 2)
 * - Automatic reset to Step 1 after successful submission
 */

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  SearchIcon,
  PlusIcon,
  XIcon,
  CalendarIcon,
  StethoscopeIcon,
  PillIcon,
  CheckIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";

/**
 * Type definition for patient data from API
 */
type Patient = {
  user_id: string;
  nid_number: string | null;
  phone: string | null;
  dob: string | null;
  role: "Admin" | "Doctor" | "Patient" | null;
};

/**
 * Type definition for medication data from API
 */
type Medication = {
  medication_id: number;
  name: string;
  description: string | null;
  stock_quantity: number;
  unit_price: number;
  created_at: Date;
  updated_at: Date;
};

/**
 * Type definition for prescription item in form
 */
type PrescriptionItem = {
  id: string;
  medicationId: number;
  medicationName: string;
  stockQuantity: number;
  quantity: string;
  guide: string;
  duration: string;
};

/**
 * Main diagnosis page component
 * Handles role check, patient lookup, diagnosis entry, and prescription management
 */
export default function DiagnosisPage() {
  const { isLoaded: isUserLoaded } = useUser();
  const router = useRouter();

  // Role check state
  const [isCheckingRole, setIsCheckingRole] = useState(true);
  const [isDoctor, setIsDoctor] = useState(false);

  // Step navigation state
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  // Patient lookup state
  const [nidSearch, setNidSearch] = useState("");
  const [isSearchingPatient, setIsSearchingPatient] = useState(false);
  const [patient, setPatient] = useState<Patient | null>(null);

  // Medications state
  const [medications, setMedications] = useState<Medication[]>([]);

  // Diagnosis form state
  const [diagnosis, setDiagnosis] = useState("");
  const [nextCheckup, setNextCheckup] = useState<Date | undefined>(undefined);

  // Prescription items state
  const [prescriptionItems, setPrescriptionItems] = useState<
    PrescriptionItem[]
  >([]);

  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Check if current user is a doctor
   * Redirects to home page if not a doctor
   */
  useEffect(() => {
    const checkRole = async () => {
      if (!isUserLoaded) return;

      try {
        const response = await fetch("/api/users/me");
        const data = await response.json();

        if (response.ok && data.data?.role === "Doctor") {
          setIsDoctor(true);
        } else {
          // Not a doctor, redirect to home
          toast.error("404 Not Found");
          router.push("/");
        }
      } catch (error) {
        console.error("Error checking role:", error);
        toast.error("Failed to verify user role");
        router.push("/");
      } finally {
        setIsCheckingRole(false);
      }
    };

    checkRole();
  }, [isUserLoaded, router]);

  /**
   * Load medications on component mount
   */
  useEffect(() => {
    const loadMedications = async () => {
      try {
        const response = await fetch("/api/medications");
        const data = await response.json();

        if (response.ok && data.data) {
          setMedications(data.data);
        } else {
          toast.error("Failed to load medications");
        }
      } catch (error) {
        console.error("Error loading medications:", error);
        toast.error("Failed to load medications");
      }
    };

    if (isDoctor) {
      loadMedications();
    }
  }, [isDoctor]);

  /**
   * Search for patient by NID number
   */
  const handleSearchPatient = async () => {
    if (!nidSearch.trim()) {
      toast.error("Please enter a NID number");
      return;
    }

    setIsSearchingPatient(true);
    try {
      const response = await fetch(
        `/api/patients/by-nid?nid_number=${encodeURIComponent(
          nidSearch.trim()
        )}`
      );
      const data = await response.json();

      if (response.ok && data.data) {
        setPatient(data.data);
        toast.success("Patient found");
      } else {
        setPatient(null);
        toast.error(data.message ?? "Patient not found");
      }
    } catch (error) {
      console.error("Error searching patient:", error);
      toast.error("Failed to search patient");
      setPatient(null);
    } finally {
      setIsSearchingPatient(false);
    }
  };

  /**
   * Add a new prescription item to the form
   */
  const handleAddPrescriptionItem = () => {
    setPrescriptionItems([
      ...prescriptionItems,
      {
        id: crypto.randomUUID(),
        medicationId: 0, // 0 indicates no medication selected yet
        medicationName: "",
        stockQuantity: 0,
        quantity: "",
        guide: "",
        duration: "",
      },
    ]);
  };

  /**
   * Remove a prescription item from the form
   */
  const handleRemovePrescriptionItem = (id: string) => {
    setPrescriptionItems(prescriptionItems.filter((item) => item.id !== id));
  };

  /**
   * Update prescription item when medication is selected
   */
  const handleMedicationSelect = (itemId: string, medicationIdStr: string) => {
    // Convert string medicationId from Select component to number
    const medicationId = parseInt(medicationIdStr, 10);
    const medication = medications.find(
      (m) => m.medication_id === medicationId
    );

    if (medication) {
      setPrescriptionItems(
        prescriptionItems.map((item) =>
          item.id === itemId
            ? {
                ...item,
                medicationId: medication.medication_id,
                medicationName: medication.name,
                stockQuantity: medication.stock_quantity,
                quantity: "", // Reset quantity when medication changes
              }
            : item
        )
      );
    }
  };

  /**
   * Update prescription item field
   */
  const handlePrescriptionItemChange = (
    id: string,
    field: keyof PrescriptionItem,
    value: string | number
  ) => {
    setPrescriptionItems(
      prescriptionItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  /**
   * Validate form before submission
   */
  const validateForm = (): boolean => {
    // Check patient is selected
    if (!patient) {
      toast.error("Please search and select a patient");
      return false;
    }

    // Check diagnosis is filled
    if (!diagnosis.trim()) {
      toast.error("Please enter a diagnosis");
      return false;
    }

    // Validate prescription items
    for (const item of prescriptionItems) {
      if (!item.medicationId || item.medicationId === 0) {
        toast.error("Please select a medication for all prescription items");
        return false;
      }

      const quantity = parseInt(item.quantity);
      if (!item.quantity || isNaN(quantity) || quantity <= 0) {
        toast.error("Please enter a valid quantity for all prescription items");
        return false;
      }

      if (quantity > item.stockQuantity) {
        toast.error(
          `Quantity (${quantity}) exceeds available stock (${item.stockQuantity}) for ${item.medicationName}`
        );
        return false;
      }
    }

    return true;
  };

  /**
   * Submit diagnosis and prescription items
   */
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/diagnosis", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patientId: patient?.user_id,
          diagnosis: diagnosis.trim(),
          nextCheckup: nextCheckup
            ? format(nextCheckup, "yyyy-MM-dd")
            : undefined,
          prescriptionItems: prescriptionItems.map((item) => ({
            medicationId: item.medicationId,
            quantity: parseInt(item.quantity),
            guide: item.guide.trim() || undefined,
            duration: item.duration.trim() || undefined,
          })),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Diagnosis and prescription created successfully");
        // Reset form and return to step 1
        setCurrentStep(1);
        setPatient(null);
        setNidSearch("");
        setDiagnosis("");
        setNextCheckup(undefined);
        setPrescriptionItems([]);
      } else {
        toast.error(data.message ?? "Failed to create diagnosis");
      }
    } catch (error) {
      console.error("Error submitting diagnosis:", error);
      toast.error("Failed to create diagnosis");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state while checking role
  if (isCheckingRole || !isUserLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-medium">Loading...</div>
        </div>
      </div>
    );
  }

  // Don't render if not a doctor (will redirect)
  if (!isDoctor) {
    return null;
  }

  return (
    <div className="container mx-auto p-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <StethoscopeIcon className="size-8" />
          Create Diagnosis
        </h1>
        <p className="text-muted-foreground mt-2">
          Enter patient information, diagnosis, and prescription details
        </p>
      </div>

      <div className="flex items-center justify-center gap-4 mb-6">
        {/* Step 1 */}
        <div className="flex items-center gap-3">
          <div
            className={`flex size-10 items-center justify-center rounded-full border-2 ${
              currentStep === 1
                ? "border-primary bg-primary text-primary-foreground"
                : patient
                ? "border-primary bg-primary text-primary-foreground"
                : "border-muted bg-muted text-muted-foreground"
            }`}
          >
            {patient ? (
              <CheckIcon className="size-5" />
            ) : (
              <span className="text-sm font-semibold">1</span>
            )}
          </div>
          <div className="flex flex-col">
            <span
              className={`text-sm font-medium ${
                currentStep === 1 || patient
                  ? "text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              Find Patient
            </span>
            {patient && (
              <span className="text-xs text-muted-foreground">
                Patient found
              </span>
            )}
          </div>
        </div>

        {/* Connector Line */}
        <div className={`h-0.5 w-16 ${patient ? "bg-primary" : "bg-muted"}`} />

        {/* Step 2 */}
        <div className="flex items-center gap-3">
          <div
            className={`flex size-10 items-center justify-center rounded-full border-2 ${
              currentStep === 2
                ? "border-primary bg-primary text-primary-foreground"
                : patient
                ? "border-muted bg-background text-muted-foreground"
                : "border-muted bg-muted text-muted-foreground"
            }`}
          >
            <span className="text-sm font-semibold">2</span>
          </div>
          <div className="flex flex-col">
            <span
              className={`text-sm font-medium ${
                currentStep === 2 ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              Diagnosis & Prescription
            </span>
          </div>
        </div>
      </div>

      {/* Step Content */}
      {currentStep === 1 ? (
        /* Step 1: Patient Lookup */
        <div className="flex justify-center">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle>Find Patient</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* NID Search */}
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

              {/* Patient Details */}
              {patient && (
                <div className="space-y-4 rounded-lg border bg-muted/50 p-4">
                  <h3 className="font-semibold">Patient Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        NID Number
                      </Label>
                      <p className="font-medium">
                        {patient.nid_number ?? "N/A"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Phone
                      </Label>
                      <p className="font-medium">{patient.phone ?? "N/A"}</p>
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs text-muted-foreground">
                        Date of Birth
                      </Label>
                      <p className="font-medium">
                        {patient.dob
                          ? format(new Date(patient.dob), "MMM dd, yyyy")
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Continue Button */}
              <div className="flex justify-end">
                <Button
                  onClick={() => setCurrentStep(2)}
                  disabled={!patient}
                  size="lg"
                  className="min-w-32"
                >
                  Continue to Step 2
                  <ArrowRightIcon className="ml-2 size-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Step 2: Diagnosis and Prescription */
        <div className="flex gap-6">
          {/* Left Section: Patient Summary Card (sticky) */}
          <div className="w-1/3">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Patient Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {patient && (
                  <>
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        NID Number
                      </Label>
                      <p className="font-medium">
                        {patient.nid_number ?? "N/A"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Phone
                      </Label>
                      <p className="font-medium">{patient.phone ?? "N/A"}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">
                        Date of Birth
                      </Label>
                      <p className="font-medium">
                        {patient.dob
                          ? format(new Date(patient.dob), "MMM dd, yyyy")
                          : "N/A"}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Section: Diagnosis and Prescription Form */}
          <div className="w-2/3 space-y-6">
            {/* Diagnosis Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <StethoscopeIcon className="size-5" />
                  Diagnosis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Diagnosis Textarea */}
                <div className="space-y-2">
                  <Label htmlFor="diagnosis">
                    Diagnosis <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="diagnosis"
                    placeholder="Enter diagnosis details..."
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    rows={6}
                    className="resize-none"
                  />
                </div>

                {/* Next Checkup Date */}
                <div className="space-y-2">
                  <Label>Next Checkup (Optional)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 size-4" />
                        {nextCheckup ? (
                          format(nextCheckup, "PPP")
                        ) : (
                          <span className="text-muted-foreground">
                            Pick a date
                          </span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={nextCheckup}
                        onSelect={setNextCheckup}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </CardContent>
            </Card>

            {/* Prescription Items Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <PillIcon className="size-5" />
                    Prescription Items
                  </CardTitle>
                  <Button
                    onClick={handleAddPrescriptionItem}
                    size="sm"
                    variant="outline"
                  >
                    <PlusIcon className="mr-2 size-4" />
                    Add Medication
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {prescriptionItems.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <PillIcon className="size-12 mx-auto mb-2 opacity-50" />
                    <p>No prescription items added yet</p>
                    <p className="text-sm">
                      Click &quot;Add Medication&quot; to get started
                    </p>
                  </div>
                ) : (
                  prescriptionItems.map((item, index) => (
                    <Card key={item.id} className="border-2">
                      <CardContent className="p-4 space-y-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">
                            Medication #{index + 1}
                          </h4>
                          <Button
                            onClick={() =>
                              handleRemovePrescriptionItem(item.id)
                            }
                            variant="ghost"
                            size="icon"
                            className="size-8"
                          >
                            <XIcon className="size-4" />
                          </Button>
                        </div>

                        {/* Medication Selection */}
                        <div className="space-y-2">
                          <Label>
                            Medication{" "}
                            <span className="text-destructive">*</span>
                          </Label>
                          <Select
                            value={
                              item.medicationId
                                ? item.medicationId.toString()
                                : ""
                            }
                            onValueChange={(value) => {
                              handleMedicationSelect(item.id, value);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select medication" />
                            </SelectTrigger>
                            <SelectContent>
                              {medications.map((med) => (
                                <SelectItem
                                  key={med.medication_id}
                                  value={med.medication_id.toString()}
                                >
                                  <div className="flex flex-col">
                                    <span className="font-medium">
                                      {med.name}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                      Stock: {med.stock_quantity}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {item.medicationName && (
                            <p className="text-xs text-muted-foreground">
                              Available stock: {item.stockQuantity}
                            </p>
                          )}
                        </div>

                        {/* Quantity */}
                        <div className="space-y-2">
                          <Label>
                            Quantity <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            type="number"
                            placeholder="Enter quantity"
                            value={item.quantity}
                            onChange={(e) =>
                              handlePrescriptionItemChange(
                                item.id,
                                "quantity",
                                e.target.value
                              )
                            }
                            min="1"
                            max={item.stockQuantity}
                          />
                          {item.quantity &&
                            parseInt(item.quantity) > item.stockQuantity && (
                              <p className="text-xs text-destructive">
                                Quantity exceeds available stock
                              </p>
                            )}
                        </div>

                        {/* Guide */}
                        <div className="space-y-2">
                          <Label>Usage Guide (Optional)</Label>
                          <Input
                            placeholder="e.g., Take with food, twice daily"
                            value={item.guide}
                            onChange={(e) =>
                              handlePrescriptionItemChange(
                                item.id,
                                "guide",
                                e.target.value
                              )
                            }
                          />
                        </div>

                        {/* Duration */}
                        <div className="space-y-2">
                          <Label>Duration (Optional)</Label>
                          <Input
                            placeholder="e.g., 7 days, 2 weeks"
                            value={item.duration}
                            onChange={(e) =>
                              handlePrescriptionItemChange(
                                item.id,
                                "duration",
                                e.target.value
                              )
                            }
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Submit Button */}

            <div className="flex items-center justify-between w-full gap-4">
              {/* Back Button */}
              <Button
                onClick={() => setCurrentStep(1)}
                variant="outline"
                size="lg" // Changed to lg to match the Submit button height
                className="flex-none"
              >
                <ArrowLeftIcon className="mr-2 size-4" />
                Back to Step 1
              </Button>

              {/* Submit Button */}
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !patient || !diagnosis.trim()}
                size="lg"
                className="min-w-32 flex-none"
              >
                {isSubmitting ? "Submitting..." : "Submit Diagnosis"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
