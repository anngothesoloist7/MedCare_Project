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
} from "lucide-react";
import { z } from "zod";
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
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

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
      setRecordingTime(0);
      console.log("[DEBUG] Set isRecording to true, recordingTime to 0");

      // Start timer
      console.log("[DEBUG] Setting up timer interval...");
      timerIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          const newTime = prev + 1;
          console.log("[DEBUG] Timer tick, new time:", newTime);
          return newTime;
        });
      }, 1000);
      console.log(
        "[DEBUG] Timer interval set, interval ID:",
        timerIntervalRef.current
      );

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

    // Clear timer
    if (timerIntervalRef.current) {
      console.log("[DEBUG] Clearing timer interval:", timerIntervalRef.current);
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
      console.log("[DEBUG] Timer cleared");
    } else {
      console.warn("[WARN] Timer interval was null");
    }

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
      setRecordingTime(0);
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
   * Format recording time as MM:SS
   */
  const formatRecordingTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  /**
   * Debug: Log recordingTime changes
   */
  useEffect(() => {
    console.log("[DEBUG] recordingTime changed to:", recordingTime);
  }, [recordingTime]);

  /**
   * Debug: Log isRecording changes
   */
  useEffect(() => {
    console.log("[DEBUG] isRecording changed to:", isRecording);
  }, [isRecording]);

  /**
   * Cleanup: Stop recording and clear timer on unmount
   */
  useEffect(() => {
    return () => {
      console.log("[DEBUG] Cleanup effect running");
      if (timerIntervalRef.current) {
        console.log("[DEBUG] Clearing timer interval in cleanup");
        clearInterval(timerIntervalRef.current);
      }
      if (mediaRecorderRef.current && isRecording) {
        console.log("[DEBUG] Stopping MediaRecorder in cleanup");
        mediaRecorderRef.current.stop();
      }
    };
  }, [isRecording]);

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
            {/* Voice Input Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MicIcon className="size-5" />
                  Voice Input
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Record your diagnosis and prescription details. The system
                  will automatically transcribe and fill in the form fields
                  below.
                </p>

                {/* Recording Controls */}
                <div className="flex items-center gap-4">
                  {!isRecording && !isProcessingVoice ? (
                    <Button
                      onClick={startRecording}
                      disabled={!patient}
                      size="lg"
                      className="min-w-32"
                    >
                      <MicIcon className="mr-2 size-4" />
                      Start Recording
                    </Button>
                  ) : isRecording ? (
                    <>
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex size-12 items-center justify-center rounded-full bg-destructive text-destructive-foreground ${
                            isRecording ? "animate-pulse" : ""
                          }`}
                        >
                          <MicIcon className="size-6" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-2xl font-mono font-semibold">
                            {formatRecordingTime(recordingTime)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Recording...
                          </span>
                        </div>
                      </div>
                      <Button
                        onClick={stopRecording}
                        variant="destructive"
                        size="lg"
                        className="min-w-32"
                      >
                        <SquareIcon className="mr-2 size-4" />
                        Stop Recording
                      </Button>
                    </>
                  ) : (
                    <div className="flex items-center gap-3">
                      <LoaderIcon className="size-5 animate-spin text-primary" />
                      <span className="text-sm text-muted-foreground">
                        Processing voice input...
                      </span>
                    </div>
                  )}
                </div>

                {/* Error Display */}
                {voiceError && (
                  <div className="rounded-lg border border-destructive bg-destructive/10 p-3">
                    <p className="text-sm text-destructive">
                      {voiceError instanceof Error
                        ? voiceError.message
                        : "An error occurred while processing voice input"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

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
