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
 * - API endpoint: POST /api/diagnosis/voice to process voice input and generate structured data
 *
 * Features:
 * - Role-based access control (only doctors can access)
 * - 2-step wizard with step indicator showing progress
 * - Step 1: Patient lookup by NID number with patient details display
 * - Step 2: Diagnosis entry with optional next checkup date
 * - Voice input feature: Record voice, transcribe, and auto-fill form fields
 * - Dynamic prescription items with medication selection and stock validation
 * - Form validation and error handling
 * - Navigation controls: Continue button (Step 1) and Back button (Step 2)
 * - Automatic reset to Step 1 after successful submission
 */

import { useState, useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useStopwatch } from "react-timer-hook";
import { experimental_useObject as useObject } from "@ai-sdk/react";
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
  MicIcon,
  SquareIcon,
  LoaderIcon,
  UserIcon,
  HistoryIcon,
  ClipboardListIcon,
  AlertCircleIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
 * Zod schema for voice input structured output
 * This matches the schema used in the backend API route
 * Used by useObject hook to parse the streamed response
 */
const voiceInputSchema = z.object({
  diagnosis: z.string(),
  nextCheckup: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  prescriptionItems: z.array(
    z.object({
      medicationName: z.string(),
      quantity: z.number().int().positive(),
      guide: z.string().optional(),
      duration: z.string().optional(),
    })
  ),
});

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
  const [patientName, setPatientName] = useState<string>("");
  const [latestVisits, setLatestVisits] = useState<
    {
      diagnosis_id: number;
      date: Date;
      diagnosis: string;
      doctor_id: string;
    }[]
  >([]);

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

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Use react-timer-hook for recording timer
  const { seconds, minutes, start, pause, reset } = useStopwatch({
    autoStart: false,
  });

  // Voice processing state
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [voiceError, setVoiceError] = useState<Error | null>(null);
  const [voiceObject, setVoiceObject] = useState<Partial<
    z.infer<typeof voiceInputSchema>
  > | null>(null);

  // Note: We don't use useObject's submit() for FormData because it converts FormData to JSON
  // Instead, we use fetch directly and parse the streaming response manually
  // The useObject hook is kept for potential future use but not actively used for FormData submission
  useObject({
    api: "/api/diagnosis/voice",
    schema: voiceInputSchema,
    onFinish: (result: {
      object?: z.infer<typeof voiceInputSchema>;
      error?: unknown;
    }) => {
      console.log("[DEBUG] useObject onFinish called, result:", result);
      setIsProcessingVoice(false);
      // Auto-fill form fields when voice processing completes
      if (result.object) {
        console.log("[DEBUG] Auto-filling form with:", result.object);
        handleAutoFill(result.object);
      }
      if (result.error) {
        console.error("[ERROR] useObject error:", result.error);
        setVoiceError(
          result.error instanceof Error
            ? result.error
            : new Error(String(result.error))
        );
        toast.error(
          "Failed to process voice input. Please try again or enter manually."
        );
      }
    },
    onError: (error: Error) => {
      console.error("[ERROR] Voice processing error:", error);
      setIsProcessingVoice(false);
      setVoiceError(error);
      toast.error("Failed to process voice input. Please try again.");
    },
  });

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
   * Fetch patient name from Clerk and latest visit history when patient is found
   */
  useEffect(() => {
    const fetchPatientData = async () => {
      if (!patient) {
        setPatientName("");
        setLatestVisits([]);
        return;
      }

      try {
        // Fetch patient name from Clerk
        const nameResponse = await fetch(`/api/clerk/user/${patient.user_id}`);
        const nameData = await nameResponse.json();

        if (nameResponse.ok && nameData.success) {
          setPatientName(nameData.data.fullName);
        } else {
          setPatientName(patient.user_id); // Fallback to user ID
        }

        // Fetch latest visit history (up to 5 records)
        const historyResponse = await fetch(
          `/api/history/patient?patientId=${encodeURIComponent(
            patient.user_id
          )}&page=1&limit=5`
        );
        const historyData = await historyResponse.json();

        if (
          historyResponse.ok &&
          historyData.success &&
          historyData.data.length > 0
        ) {
          setLatestVisits(historyData.data);
        } else {
          setLatestVisits([]);
        }
      } catch (error) {
        console.error("Error fetching patient data:", error);
        setPatientName(patient.user_id); // Fallback to user ID
        setLatestVisits([]);
      }
    };

    fetchPatientData();
  }, [patient]);

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
   * Start voice recording
   * Requests microphone access and starts recording audio
   */
  const startRecording = async () => {
    console.log("[DEBUG] startRecording called");
    try {
      console.log("[DEBUG] Requesting microphone access...");
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      console.log("[DEBUG] Microphone access granted, stream:", stream);

      // Create MediaRecorder instance
      // WebM format is the default browser format
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      });
      console.log("[DEBUG] MediaRecorder created:", mediaRecorder);
      console.log("[DEBUG] MediaRecorder state:", mediaRecorder.state);

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Collect audio chunks as they're recorded
      mediaRecorder.ondataavailable = (event) => {
        console.log(
          "[DEBUG] ondataavailable event, data size:",
          event.data.size
        );
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          console.log(
            "[DEBUG] Audio chunks count:",
            audioChunksRef.current.length
          );
        }
      };

      // Handle recording stop
      mediaRecorder.onstop = () => {
        console.log("[DEBUG] MediaRecorder stopped");
        // Stop all tracks to release microphone
        stream.getTracks().forEach((track) => {
          track.stop();
          console.log("[DEBUG] Stopped track:", track.kind);
        });
      };

      // Start recording
      console.log("[DEBUG] Starting MediaRecorder...");
      mediaRecorder.start();
      console.log("[DEBUG] MediaRecorder started, state:", mediaRecorder.state);

      setIsRecording(true);
      console.log("[DEBUG] Set isRecording to true");

      // Start timer using useStopwatch
      reset();
      start();
      console.log("[DEBUG] Started stopwatch timer");

      toast.success("Recording started");
    } catch (error) {
      console.error("[ERROR] Error starting recording:", error);
      if (error instanceof Error) {
        if (error.name === "NotAllowedError") {
          toast.error(
            "Microphone permission denied. Please allow microphone access."
          );
        } else if (error.name === "NotFoundError") {
          toast.error("No microphone found. Please connect a microphone.");
        } else {
          toast.error("Failed to start recording. Please try again.");
        }
      } else {
        toast.error("Failed to start recording. Please try again.");
      }
    }
  };

  /**
   * Stop voice recording and submit audio for processing
   * Stops the recording, creates a Blob, and submits it via fetch (not useObject's submit)
   */
  const stopRecording = async () => {
    console.log("[DEBUG] stopRecording called");
    console.log("[DEBUG] mediaRecorderRef.current:", mediaRecorderRef.current);
    console.log("[DEBUG] isRecording:", isRecording);

    if (!mediaRecorderRef.current || !isRecording) {
      console.warn(
        "[WARN] Cannot stop recording - mediaRecorder or isRecording is falsy"
      );
      return;
    }

    console.log(
      "[DEBUG] Stopping MediaRecorder, current state:",
      mediaRecorderRef.current.state
    );
    // Stop recording
    mediaRecorderRef.current.stop();
    setIsRecording(false);
    console.log("[DEBUG] Set isRecording to false");

    // Stop timer using useStopwatch
    pause();
    console.log("[DEBUG] Stopped stopwatch timer");

    // Wait for recording to stop, then create blob and submit
    setTimeout(async () => {
      console.log(
        "[DEBUG] Creating blob from audio chunks, count:",
        audioChunksRef.current.length
      );
      // Create blob from audio chunks
      const audioBlob = new Blob(audioChunksRef.current, {
        type: "audio/webm",
      });
      console.log(
        "[DEBUG] Audio blob created, size:",
        audioBlob.size,
        "type:",
        audioBlob.type
      );

      // Create FormData and submit directly via fetch
      // Note: useObject's submit() converts FormData to JSON, so we use fetch directly
      // and manually handle the streaming response using readUIMessageStream
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");
      console.log("[DEBUG] FormData created, audio file appended");
      console.log(
        "[DEBUG] FormData entries:",
        Array.from(formData.entries()).map(([key, value]) => ({
          key,
          value:
            value instanceof File
              ? { name: value.name, type: value.type, size: value.size }
              : value,
        }))
      );

      // Submit FormData directly via fetch
      // The backend returns a streaming response in AI SDK's data stream format
      setIsProcessingVoice(true);
      setVoiceError(null);
      setVoiceObject(null);

      try {
        console.log("[DEBUG] Sending FormData via fetch...");
        const response = await fetch("/api/diagnosis/voice", {
          method: "POST",
          // Don't set Content-Type header - browser will set it with boundary automatically
          body: formData,
        });

        console.log(
          "[DEBUG] Fetch response received, status:",
          response.status
        );
        console.log(
          "[DEBUG] Response Content-Type:",
          response.headers.get("content-type")
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({
            error: "Unknown error",
            message: `HTTP ${response.status}`,
          }));
          throw new Error(
            errorData.message ??
              errorData.error ??
              "Failed to process voice input"
          );
        }

        // Read the streaming response manually
        // The response from toTextStreamResponse() is a plain text stream
        // containing JSON text chunks that accumulate into a complete JSON object.
        // Reference: https://ai-sdk.dev/docs/reference/ai-sdk-core/stream-object#to-text-stream-response
        console.log("[DEBUG] Starting to read stream...");
        let finalObject: z.infer<typeof voiceInputSchema> | null = null;

        // Parse the stream manually - toTextStreamResponse format (plain JSON text chunks)
        const stream = response.body;
        if (!stream) {
          throw new Error("Response body is not readable");
        }

        // Read the stream - toTextStreamResponse sends plain JSON text chunks
        const reader = stream.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let partialObject: Partial<z.infer<typeof voiceInputSchema>> = {};

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            console.log("[DEBUG] Stream reading complete");
            break;
          }

          // Accumulate the raw JSON text chunks
          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;
          console.log("[DEBUG] Received chunk, buffer length:", buffer.length);

          // Try to parse the accumulated buffer as JSON
          // During streaming, the JSON may be incomplete, so parsing might fail
          // This is expected behavior - we continue accumulating until complete
          try {
            const parsed = JSON.parse(buffer);
            console.log("[DEBUG] Parsed partial JSON:", parsed);

            // Merge into partial object for real-time UI updates
            partialObject = deepMerge(partialObject, parsed);
            console.log("[DEBUG] Merged partial object:", partialObject);

            // Update state for real-time UI updates
            setVoiceObject(partialObject);
          } catch {
            // Expected during streaming - JSON is still incomplete
            // Continue accumulating chunks until we have valid JSON
            console.log(
              "[DEBUG] Partial JSON (expected during streaming), continuing..."
            );
          }
        }

        // Parse the final complete JSON buffer
        console.log("[DEBUG] Parsing final buffer...");
        try {
          const finalParsed = JSON.parse(buffer);
          console.log("[DEBUG] Final parsed JSON:", finalParsed);
          partialObject = deepMerge(partialObject, finalParsed);
        } catch (e) {
          console.error("[ERROR] Failed to parse final JSON:", e);
          console.log("[DEBUG] Buffer content:", buffer);
        }

        console.log("[DEBUG] Final parsed object:", partialObject);

        // Validate the final object against the schema
        const validated = voiceInputSchema.safeParse(partialObject);
        if (validated.success) {
          console.log("[DEBUG] Validation successful, auto-filling form");
          finalObject = validated.data;
          handleAutoFill(finalObject);
          setIsProcessingVoice(false);
          setVoiceObject(finalObject);
        } else {
          console.error("[ERROR] Validation failed:", validated.error);
          throw new Error(
            "Failed to parse response: " + validated.error.message
          );
        }
      } catch (error) {
        console.error("[ERROR] Error processing voice input:", error);
        setIsProcessingVoice(false);
        setVoiceError(
          error instanceof Error ? error : new Error(String(error))
        );
        toast.error("Failed to process voice input. Please try again.");
      }

      // Reset recording state
      audioChunksRef.current = [];
      mediaRecorderRef.current = null;
      console.log("[DEBUG] Recording state reset");

      toast.success("Processing voice input...");
    }, 100);
  };

  /**
   * Auto-fill form fields from voice input structured data
   * Maps the LLM output to form state fields
   */
  const handleAutoFill = (data: z.infer<typeof voiceInputSchema>) => {
    // Set diagnosis
    if (data.diagnosis) {
      setDiagnosis(data.diagnosis);
    }

    // Set next checkup date if provided
    if (data.nextCheckup) {
      const checkupDate = new Date(data.nextCheckup);
      if (!isNaN(checkupDate.getTime())) {
        setNextCheckup(checkupDate);
      }
    }

    // Map prescription items
    if (data.prescriptionItems && data.prescriptionItems.length > 0) {
      const mappedItems: PrescriptionItem[] = data.prescriptionItems.map(
        (item) => {
          // Find medication by name (case-insensitive match)
          const medication = medications.find(
            (med) =>
              med.name.toLowerCase() === item.medicationName.toLowerCase()
          );

          if (!medication) {
            // If medication not found, log warning but still create item
            console.warn(
              `Medication "${item.medicationName}" not found in available medications`
            );
            toast.warning(
              `Medication "${item.medicationName}" not found. Please select manually.`
            );
          }

          return {
            id: crypto.randomUUID(),
            medicationId: medication?.medication_id ?? 0,
            medicationName: medication?.name ?? item.medicationName,
            stockQuantity: medication?.stock_quantity ?? 0,
            quantity: item.quantity.toString(),
            guide: item.guide ?? "",
            duration: item.duration ?? "",
          };
        }
      );

      setPrescriptionItems(mappedItems);
      toast.success(
        "Form auto-filled from voice input. Please review and edit if needed."
      );
    }
  };

  /**
   * Deep merge utility for merging partial objects
   * Used to merge streaming JSON chunks into a complete object
   */
  const deepMerge = (
    target: Record<string, unknown>,
    source: Record<string, unknown>
  ): Record<string, unknown> => {
    const result = { ...target };
    for (const key in source) {
      if (
        typeof source[key] === "object" &&
        source[key] !== null &&
        !Array.isArray(source[key]) &&
        typeof target[key] === "object" &&
        target[key] !== null &&
        !Array.isArray(target[key])
      ) {
        result[key] = deepMerge(
          target[key] as Record<string, unknown>,
          source[key] as Record<string, unknown>
        );
      } else {
        result[key] = source[key];
      }
    }
    return result;
  };

  /**
   * Cleanup: Stop recording and clear timer on unmount
   */
  useEffect(() => {
    return () => {
      console.log("[DEBUG] Cleanup effect running");
      if (mediaRecorderRef.current && isRecording) {
        console.log("[DEBUG] Stopping MediaRecorder in cleanup");
        mediaRecorderRef.current.stop();
        pause();
      }
    };
  }, [isRecording, pause]);

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

      {/* Step Indicator */}
      <div className="relative mb-10">
        <div className="flex items-center justify-center max-w-2xl mx-auto">
          {/* Step 1 */}
          <div className="relative z-10 flex flex-col items-center">
            <motion.div
              initial={false}
              animate={{
                backgroundColor:
                  currentStep === 1 || patient
                    ? "var(--primary)"
                    : "var(--muted)",
                scale: currentStep === 1 ? 1.1 : 1,
              }}
              className={`flex size-10 items-center justify-center rounded-full border-4 border-background text-primary-foreground shadow-sm transition-colors`}
            >
              {patient ? (
                <CheckIcon className="size-6" />
              ) : (
                <span className="text-base font-bold">1</span>
              )}
            </motion.div>
            <div className="absolute top-12 text-center whitespace-nowrap">
              <span
                className={`text-sm font-semibold tracking-tight ${
                  currentStep === 1 || patient
                    ? "text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                Patient Search
              </span>
            </div>
          </div>

          {/* Connector Line */}
          <div className="flex-1 h-1 mx-4 bg-muted overflow-hidden">
            <motion.div
              initial={false}
              animate={{ width: patient ? "100%" : "0%" }}
              className="h-full bg-primary"
              transition={{ duration: 0.5 }}
            />
          </div>

          {/* Step 2 */}
          <div className="relative z-10 flex flex-col items-center">
            <motion.div
              initial={false}
              animate={{
                backgroundColor:
                  currentStep === 2 ? "var(--primary)" : "var(--muted)",
                scale: currentStep === 2 ? 1.1 : 1,
                color:
                  currentStep === 2
                    ? "var(--primary-foreground)"
                    : "var(--muted-foreground)",
              }}
              className="flex size-10 items-center justify-center rounded-full border-4 border-background shadow-sm transition-colors"
            >
              <span className="text-base font-bold">2</span>
            </motion.div>
            <div className="absolute top-12 text-center whitespace-nowrap">
              <span
                className={`text-sm font-semibold tracking-tight ${
                  currentStep === 2
                    ? "text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                Diagnosis & Prescription
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        {currentStep === 1 ? (
          /* Step 1: Patient Lookup */
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex justify-center"
          >
            <Card className="w-full max-w-xl shadow-lg border-primary/10">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <UserIcon className="size-5 text-primary" />
                  Patient Identification
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Search by National ID to access patient records and history
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* NID Search */}
                <div className="space-y-3">
                  <Label
                    htmlFor="nid-search"
                    className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    National ID Number
                  </Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input
                        id="nid-search"
                        placeholder="e.g., 0123456789"
                        className="pl-9 h-10"
                        value={nidSearch}
                        onChange={(e) => setNidSearch(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleSearchPatient();
                          }
                        }}
                      />
                    </div>
                    <Button
                      onClick={handleSearchPatient}
                      disabled={isSearchingPatient}
                      className="h-10 px-6 bg-primary hover:bg-primary/90"
                    >
                      {isSearchingPatient ? (
                        <LoaderIcon className="size-4 animate-spin" />
                      ) : (
                        <SearchIcon className="size-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Patient Details */}
                <AnimatePresence>
                  {patient && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <span className="text-sm text-muted-foreground opacity-70">
                              Full Name
                            </span>
                            <p className="font-semibold text-foreground truncate">
                              {patientName || "..."}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <span className="text-sm text-muted-foreground opacity-70">
                              NID Number
                            </span>
                            <p className="font-semibold text-foreground uppercase tracking-tight">
                              {patient.nid_number ?? "N/A"}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <span className="text-sm text-muted-foreground opacity-70">
                              Phone Number
                            </span>
                            <p className="font-medium text-foreground">
                              {patient.phone ?? "N/A"}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <span className="text-sm text-muted-foreground opacity-70">
                              Date of Birth
                            </span>
                            <p className="font-medium text-foreground">
                              {patient.dob
                                ? format(new Date(patient.dob), "MMM dd, yyyy")
                                : "N/A"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Continue Button */}
                <div className="pt-2">
                  <Button
                    onClick={() => setCurrentStep(2)}
                    disabled={!patient}
                    className="w-full h-10"
                  >
                    Proceed to Diagnosis
                    <ArrowRightIcon className="ml-2 size-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          /* Step 2: Diagnosis and Prescription */
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto"
          >
            {/* Left Section: Context & History */}
            <div className="w-full lg:w-[380px] space-y-6 mt-4">
              {/* Voice Automation Button/Timer */}
              <AnimatePresence mode="wait">
                {!isRecording && !isProcessingVoice ? (
                  <motion.div
                    key="voice-button"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                  >
                    <Button
                      onClick={startRecording}
                      className="w-full h-11 shadow-sm border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 transition-all font-bold"
                      variant="outline"
                    >
                      <MicIcon className="mr-2 size-4" />
                      Use AI Voice Assistant
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="voice-session"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <Card className="shadow-lg border-primary/30 bg-primary/5 overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between gap-4">
                          {isRecording ? (
                            <>
                              <div className="flex items-center gap-3">
                                <motion.div
                                  animate={{ scale: [1, 1.15, 1] }}
                                  transition={{
                                    repeat: Infinity,
                                    duration: 1.5,
                                  }}
                                  className="size-10 rounded-full bg-destructive flex items-center justify-center text-destructive-foreground"
                                >
                                  <MicIcon className="size-5" />
                                </motion.div>
                                <div>
                                  <span className="text-xl font-mono font-bold tracking-tighter">
                                    {minutes.toString().padStart(2, "0")}:
                                    {seconds.toString().padStart(2, "0")}
                                  </span>
                                  <p className="text-[9px] font-bold uppercase text-destructive animate-pulse -mt-1">
                                    Recording...
                                  </p>
                                </div>
                              </div>
                              <Button
                                onClick={stopRecording}
                                variant="destructive"
                                size="sm"
                                className="h-9 font-bold px-4"
                              >
                                Stop & Parse
                              </Button>
                            </>
                          ) : (
                            <div className="w-full flex items-center gap-3 py-1">
                              <LoaderIcon className="size-5 animate-spin text-primary" />
                              <div className="flex-1">
                                <p className="text-sm font-bold text-primary">
                                  Synthesizing Data...
                                </p>
                                <p className="text-[9px] text-muted-foreground uppercase">
                                  Mapping to your report
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        {voiceError && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            className="mt-3 pt-3 border-t border-destructive/10"
                          >
                            <p className="text-[10px] font-medium text-destructive leading-tight flex items-center gap-1.5">
                              <AlertCircleIcon className="size-3" />
                              {voiceError.message}
                            </p>
                          </motion.div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
              {/* Patient Profile Quick View */}
              <Card className="bg-slate-50 dark:bg-slate-900/50 overflow-hidden">
                <CardContent className="space-y-4 text-sm">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <UserIcon className="size-6" />
                    </div>
                    <div>
                      <CardTitle className="text-base truncate max-w-[200px]">
                        {patientName}
                      </CardTitle>
                    </div>
                  </div>
                  <div className="gap-1">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-primary/20">National ID</Badge>
                      <p>{patient?.nid_number || "N/A"}</p>
                    </div>
                    <br />
                    <div className="flex items-center gap-2">
                      <Badge className="bg-primary/20">Birth Date</Badge>
                      <p className="w-full">
                        {patient?.dob
                          ? format(new Date(patient.dob), "MMM dd, yyyy")
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                  <div className="text-md flex items-center gap-2 font-semibold">
                    <HistoryIcon className="size-4 text-primary" />
                    Medical History
                  </div>
                  <div className="space-y-4 max-h-[400px] pr-2 overflow-y-auto custom-scrollbar">
                    {latestVisits.length > 0 ? (
                      latestVisits.map((visit, idx) => (
                        <div
                          key={visit.diagnosis_id}
                          className="relative pl-4 border-l-2 border-primary/20 space-y-2 pb-1 last:pb-0"
                        >
                          <div>
                            <p
                              className={`text-[10px] font-bold uppercase text-primary`}
                            >
                              {format(new Date(visit.date), "MMM dd, yyyy")}
                            </p>
                            <p
                              className={`text-base text-sm text-foreground mt-1 leading-relaxed line-clamp-3`}
                            >
                              &ldquo;{visit.diagnosis}&rdquo;
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center py-4 text-center">
                        <p className="text-xs text-muted-foreground italic">
                          No prior records
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Section: Form Entry */}
            <div className="flex-1 space-y-8 mt-4">
              {/* Diagnosis Entry */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 border-b pb-2">
                  <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <ClipboardListIcon className="size-5 text-primary" />
                  </div>
                  <h3 className="font-bold tracking-tight">Diagnosis</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-1.5">
                    <Label
                      htmlFor="diagnosis"
                      className="text-sm text-muted-foreground opacity-80 pl-0.5"
                    >
                      Diagnosis
                    </Label>
                    <Textarea
                      id="diagnosis"
                      placeholder="Start typing or use voice assistant..."
                      value={diagnosis}
                      onChange={(e) => setDiagnosis(e.target.value)}
                      className="min-h-[100px] resize-none border-primary/10 focus:border-primary/30 text-sm leading-relaxed p-3"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm text-muted-foreground opacity-80 pl-0.5">
                      Follow-up
                    </Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full h-10 justify-start text-left font-medium border-primary/10"
                        >
                          <CalendarIcon className="mr-2 size-3.5 text-primary" />
                          {nextCheckup
                            ? format(nextCheckup, "PPP")
                            : "Pick Date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="end">
                        <Calendar
                          mode="single"
                          selected={nextCheckup}
                          onSelect={setNextCheckup}
                          disabled={(date) => date < new Date()}
                          autoFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <div className="mt-2 p-3 rounded-lg border border-dashed text-center bg-slate-50/50 dark:bg-slate-900/50">
                      <p className="text-[9px] text-muted-foreground leading-snug">
                        Scheduled revision for monitoring recovery.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Prescription Management */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <PillIcon className="size-5 text-primary" />
                    </div>
                    <h3 className="font-bold tracking-tight">Prescription</h3>
                  </div>
                  <Button
                    onClick={handleAddPrescriptionItem}
                    size="sm"
                    variant="outline"
                    className="h-8 border-primary/20 text-primary hover:bg-primary/5"
                  >
                    <PlusIcon className="mr-1.5 size-3.5" />
                    Add Medication
                  </Button>
                </div>

                <div className="space-y-4">
                  <AnimatePresence initial={false}>
                    {prescriptionItems.length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="py-12 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center px-4"
                      >
                        <div className="size-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                          <PillIcon className="size-6 text-slate-400" />
                        </div>
                        <p className="text-sm font-medium text-slate-500">
                          No prescriptions assigned
                        </p>
                        <p className="text-[11px] text-slate-400 max-w-[200px] mt-1">
                          Manual entry or voice transcription is required for
                          medication.
                        </p>
                      </motion.div>
                    ) : (
                      prescriptionItems.map((item, index) => (
                        <motion.div
                          key={item.id}
                          layout
                          initial={{ opacity: 0, y: 10, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{
                            opacity: 0,
                            scale: 0.95,
                            filter: "blur(4px)",
                          }}
                          transition={{ duration: 0.2 }}
                          className="group relative"
                        >
                          <Card className="border-primary/5 shadow-sm hover:shadow-md transition-all overflow-hidden">
                            <div className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-primary/40 group-hover:bg-primary transition-colors" />
                            <CardContent className="p-4 sm:p-5">
                              <div className="flex items-start justify-between gap-4 mb-4">
                                <div className="flex items-center gap-2">
                                  <span className="size-5 rounded-full bg-primary text-[10px] font-bold text-white flex items-center justify-center">
                                    {index + 1}
                                  </span>
                                  <h4 className="font-bold text-sm tracking-tight capitalize">
                                    Medication Specification
                                  </h4>
                                </div>
                                <Button
                                  onClick={() =>
                                    handleRemovePrescriptionItem(item.id)
                                  }
                                  variant="ghost"
                                  size="icon"
                                  className="size-7 -mr-2 -mt-2 text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                                >
                                  <XIcon className="size-3.5" />
                                </Button>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                                <div className="md:col-span-12 lg:col-span-5 space-y-1.5 min-w-0">
                                  <Label className="text-sm text-muted-foreground pl-0.5">
                                    Select Medication
                                  </Label>
                                  <Select
                                    value={
                                      item.medicationId
                                        ? item.medicationId.toString()
                                        : ""
                                    }
                                    onValueChange={(value) =>
                                      handleMedicationSelect(item.id, value)
                                    }
                                  >
                                    <SelectTrigger className="h-10 text-sm font-medium w-full flex items-center justify-between border-primary/10 bg-background px-3">
                                      <div className="flex items-center gap-2 overflow-hidden min-w-0 flex-1">
                                        <div className="truncate py-1">
                                          <SelectValue placeholder="Choose medication..." />
                                        </div>
                                        {item.medicationId !== 0 && (
                                          <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[9px] font-bold text-slate-500 uppercase tracking-tight">
                                            {item.stockQuantity} in stock
                                          </span>
                                        )}
                                      </div>
                                    </SelectTrigger>
                                    <SelectContent>
                                      {medications.map((med) => (
                                        <SelectItem
                                          key={med.medication_id}
                                          value={med.medication_id.toString()}
                                        >
                                          <div className="flex items-center justify-between w-full min-w-[280px] gap-4">
                                            <span className="font-semibold truncate">
                                              {med.name}
                                            </span>
                                            <span
                                              className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase shrink-0 ${
                                                med.stock_quantity > 10
                                                  ? "bg-green-100 text-green-700"
                                                  : "bg-amber-100 text-amber-700"
                                              }`}
                                            >
                                              Stock: {med.stock_quantity}
                                            </span>
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="md:col-span-4 lg:col-span-2 space-y-1.5">
                                  <Label className="text-sm text-muted-foreground pl-0.5">
                                    Qty
                                  </Label>
                                  <div className="relative">
                                    <Input
                                      type="number"
                                      placeholder="0"
                                      value={item.quantity}
                                      onChange={(e) =>
                                        handlePrescriptionItemChange(
                                          item.id,
                                          "quantity",
                                          e.target.value
                                        )
                                      }
                                      className={`h-10 font-bold px-3 ${
                                        item.quantity &&
                                        parseInt(item.quantity) >
                                          item.stockQuantity
                                          ? "border-destructive ring-destructive/20 focus-visible:ring-destructive"
                                          : ""
                                      }`}
                                    />
                                    {item.quantity &&
                                      parseInt(item.quantity) >
                                        item.stockQuantity && (
                                        <div className="absolute -bottom-4 left-0 right-0 text-center">
                                          <span className="text-[8px] font-bold text-destructive uppercase">
                                            Over Limit
                                          </span>
                                        </div>
                                      )}
                                  </div>
                                </div>

                                <div className="md:col-span-8 lg:col-span-5 space-y-1.5">
                                  <Label className="text-sm text-muted-foreground pl-0.5">
                                    Usage Guide (Optional)
                                  </Label>
                                  <Input
                                    placeholder="e.g., Take twice daily"
                                    value={item.guide}
                                    onChange={(e) =>
                                      handlePrescriptionItemChange(
                                        item.id,
                                        "guide",
                                        e.target.value
                                      )
                                    }
                                    className="h-10 text-sm"
                                  />
                                </div>

                                <div className="md:col-span-12 space-y-1.5">
                                  <Label className="text-sm text-muted-foreground pl-0.5">
                                    Duration (Optional)
                                  </Label>
                                  <Input
                                    placeholder="e.g., 7 consecutive days"
                                    value={item.duration}
                                    onChange={(e) =>
                                      handlePrescriptionItemChange(
                                        item.id,
                                        "duration",
                                        e.target.value
                                      )
                                    }
                                    className="h-10 text-sm"
                                  />
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t">
                <Button
                  onClick={() => setCurrentStep(1)}
                  variant="ghost"
                  className="w-full sm:w-auto text-muted-foreground h-10 px-6 hover:bg-primary/30"
                >
                  <ArrowLeftIcon className="mr-2 size-4" />
                  Discard & Exit
                </Button>

                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !patient || !diagnosis.trim()}
                    className="h-10 px-8 shadow-lg shadow-primary/20 transition-all active:scale-95"
                  >
                    {isSubmitting ? (
                      <LoaderIcon className="mr-2 size-4 animate-spin" />
                    ) : currentStep === 2 ? (
                      "Submit"
                    ) : (
                      "Continue"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
