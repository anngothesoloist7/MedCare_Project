/**
 * POST /api/diagnosis/voice - Process voice input and generate structured diagnosis data
 *
 * This endpoint receives audio file from the frontend, transcribes it using Gemini,
 * and uses streamObject to extract structured diagnosis and prescription data.
 *
 * Connected to:
 * - Clerk authentication via auth() from @clerk/nextjs/server
 * - MySQL database via executeQuery utility (src/utils/sql.ts) to fetch medications
 * - Google Gemini 2.5 Flash Lite model for transcription and structured data extraction
 * - AI SDK's experimental_transcribe and streamObject functions
 *
 * Used by:
 * - Diagnosis page voice input feature (useObject hook)
 *
 * Request:
 * - FormData with 'audio' file (WebM format)
 *
 * Response:
 * - Streams JSON chunks matching the voice input schema
 *
 * @returns Streaming response with structured diagnosis data
 */

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { executeQuery } from "@/utils/sql";
import { streamObject } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";

/**
 * Type definition for user record from database
 * Used to verify user role before allowing voice processing
 */
type User = {
  user_id: string;
  nid_number: string | null;
  phone: string | null;
  role: "Doctor" | "Patient" | null;
  dob: string | null;
  created_at: Date;
  updated_at: Date;
};

/**
 * Type definition for medication record from database
 * Used to provide medication list to LLM for matching
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
 * Zod schema for voice input structured output
 * This defines the shape of data that the LLM should extract from the transcribed voice
 * - diagnosis: Required string describing the diagnosis
 * - nextCheckup: Optional date string in YYYY-MM-DD format
 * - prescriptionItems: Array of prescription items with medication names, quantities, and optional guides/durations
 */
const voiceInputSchema = z.object({
  diagnosis: z.string().describe("The diagnosis description"),
  nextCheckup: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
    .optional()
    .describe("Next checkup date in YYYY-MM-DD format, if mentioned"),
  prescriptionItems: z
    .array(
      z.object({
        medicationName: z
          .string()
          .describe(
            "Name of the medication (must match one of the available medications)"
          ),
        quantity: z
          .number()
          .int()
          .positive()
          .describe("Quantity of medication prescribed"),
        guide: z
          .string()
          .optional()
          .describe(
            "Usage guide/instructions (e.g., 'Take with food, twice daily')"
          ),
        duration: z
          .string()
          .optional()
          .describe("Duration of medication (e.g., '7 days', '2 weeks')"),
      })
    )
    .describe("Array of prescribed medications"),
});

/**
 * POST endpoint - Process voice input and generate structured data
 *
 * This endpoint:
 * 1. Verifies user is authenticated and has role='Doctor'
 * 2. Receives audio file from FormData
 * 3. Fetches medications list from database
 * 4. Transcribes audio using experimental_transcribe with Gemini
 * 5. Uses streamObject to extract structured data from transcribed text
 * 6. Streams the structured data back to frontend
 *
 * @param request - Next.js Request object containing FormData with audio file
 * @returns Streaming response with structured diagnosis data
 */
export async function POST(request: Request) {
  try {
    // Get the authenticated user ID from Clerk
    // auth() throws an error if user is not authenticated
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          message: "User is not authenticated",
        },
        { status: 401 }
      );
    }

    // Verify user is a doctor by querying database
    // Only doctors can use voice input feature
    const users = await executeQuery<User>("queries/getUserById.sql", [userId]);

    if (users.length === 0) {
      return NextResponse.json(
        {
          error: "User not found",
          message: "User record not found in database",
        },
        { status: 404 }
      );
    }

    const user = users[0];

    // Check if user has Doctor role
    if (user.role !== "Doctor") {
      return NextResponse.json(
        {
          error: "Forbidden",
          message: "Only doctors can use voice input",
        },
        { status: 403 }
      );
    }

    // Parse FormData to get audio file
    // Note: Next.js automatically handles FormData parsing when Content-Type is multipart/form-data
    // However, some clients may not set the Content-Type header correctly
    let formData: FormData;
    let audioFile: File | null;

    try {
      // Check Content-Type header
      const contentType = request.headers.get("content-type");
      console.log("[DEBUG] Content-Type header:", contentType);

      // If Content-Type is not set or doesn't include multipart/form-data,
      // we'll try to parse it anyway as Next.js might handle it
      if (
        contentType &&
        !contentType.includes("multipart/form-data") &&
        !contentType.includes("application/x-www-form-urlencoded")
      ) {
        console.warn("[WARN] Content-Type may not be FormData:", contentType);
      }

      // Parse FormData - Next.js should handle this automatically
      // If the request body is FormData, this will work even without the header
      formData = await request.formData();
      console.log("[DEBUG] FormData parsed successfully");
      console.log(
        "[DEBUG] FormData entries:",
        Array.from(formData.entries()).map(([key]) => key)
      );

      audioFile = formData.get("audio") as File | null;
      console.log(
        "[DEBUG] Audio file:",
        audioFile
          ? {
              name: audioFile.name,
              type: audioFile.type,
              size: audioFile.size,
            }
          : "null"
      );
    } catch (error) {
      console.error("[ERROR] Failed to parse FormData:", error);
      console.error(
        "[ERROR] Error details:",
        error instanceof Error ? error.stack : String(error)
      );

      // Try to get raw body for debugging
      try {
        const body = await request.text();
        console.log(
          "[DEBUG] Raw request body (first 200 chars):",
          body.substring(0, 200)
        );
      } catch (e) {
        console.error("[ERROR] Could not read request body:", e);
      }

      return NextResponse.json(
        {
          error: "Invalid request format",
          message:
            "Request must be FormData with 'audio' file. Please ensure Content-Type is multipart/form-data.",
        },
        { status: 400 }
      );
    }

    if (!audioFile) {
      return NextResponse.json(
        {
          error: "Missing audio file",
          message: "Audio file is required",
        },
        { status: 400 }
      );
    }

    // Validate file type (should be audio/webm or audio/*)
    if (!audioFile.type.startsWith("audio/")) {
      return NextResponse.json(
        {
          error: "Invalid file type",
          message: "File must be an audio file",
        },
        { status: 400 }
      );
    }

    // Fetch medications list from database
    // This will be included in the system prompt to help LLM match medication names
    const medications = await executeQuery<Medication>(
      "queries/getAllMedications.sql"
    );

    // Convert audio file to buffer for transcription
    const audioBuffer = Buffer.from(await audioFile.arrayBuffer());

    // Initialize Gemini model
    // Uses GEMINI_API_KEY from environment variables
    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (!geminiApiKey) {
      console.error("GEMINI_API_KEY is not set");
      return NextResponse.json(
        {
          error: "Server configuration error",
          message: "Gemini API key is not configured",
        },
        { status: 500 }
      );
    }

    // Initialize Google Generative AI client
    // This creates a client that can be used to create models
    const googleAI = createGoogleGenerativeAI({
      apiKey: geminiApiKey,
    });

    // Process audio directly with streamObject using multimodal input
    // Google Gemini is a multimodal model that can understand audio natively
    // We skip the separate transcription step and let Gemini:
    // 1. Listen to the audio
    // 2. Extract structured diagnosis and prescription data directly
    // This is more efficient than transcribe-then-parse approach
    console.log(
      "[DEBUG] Starting audio processing, audio buffer size:",
      audioBuffer.length
    );
    console.log("[DEBUG] Audio file type:", audioFile.type);

    // Initialize Gemini model for multimodal structured data extraction
    // Gemini 2.5 Flash Lite supports multimodal input including audio
    const languageModel = googleAI("models/gemini-2.5-flash-lite");

    // Build system prompt with medications list
    // This helps the LLM match medication names from voice to available medications
    const medicationsList = medications
      .map(
        (med) =>
          `- ${med.name} (ID: ${med.medication_id})${
            med.description ? `: ${med.description}` : ""
          }`
      )
      .join("\n");

    // System prompt: Contains instructions and context (medications list)
    // This tells Gemini how to extract structured data from the audio
    const systemPrompt = `You are a medical assistant that extracts structured diagnosis and prescription data from doctor's voice notes.

Available medications:
${medicationsList}

Instructions:
1. Listen to the audio recording carefully and extract the diagnosis description.
2. If a next checkup date is mentioned, extract it in YYYY-MM-DD format.
3. Extract prescription items with medication names that match the available medications list above.
4. For each medication, extract quantity, usage guide (if mentioned), and duration (if mentioned).
5. Medication names must exactly match one of the available medications from the list above.
6. If a medication name doesn't match exactly, try to find the closest match from the available medications.
7. Only include medications that are mentioned in the voice note.

Context: The patient is from VinUniversity.
`;

    console.log("[DEBUG] System prompt length:", systemPrompt.length);
    console.log("[DEBUG] Calling streamObject with multimodal input...");

    // Use streamObject with multimodal messages (audio + text)
    // This combines transcription and structured data extraction in one step
    // The 'messages' parameter allows multimodal content unlike 'prompt' which is text-only
    const result = streamObject({
      model: languageModel,
      schema: voiceInputSchema,
      system: systemPrompt,
      // Use messages array for multimodal content (audio file + text instruction)
      // This allows Gemini to process the audio and extract structured data directly
      messages: [
        {
          role: "user",
          content: [
            {
              // Pass audio as file content
              // Gemini accepts audio/webm, audio/mp3, audio/wav, etc.
              // Use 'mediaType' property (not 'mimeType') as per AI SDK types
              type: "file",
              data: audioBuffer,
              mediaType: audioFile.type,
            },
            {
              // Text instruction telling Gemini what to extract
              type: "text",
              text: "Listen to this audio recording from a doctor and extract the structured diagnosis and prescription data according to the schema.",
            },
          ],
        },
      ],
    });

    // Return the streaming response using toTextStreamResponse()
    // According to AI SDK docs (https://ai-sdk.dev/docs/reference/ai-sdk-core/stream-object#to-text-stream-response),
    // streamObject returns toTextStreamResponse() which creates a simple text stream response.
    // Each text delta is encoded as UTF-8 and sent as a separate chunk.
    // The frontend parses the raw JSON text chunks directly.
    return result.toTextStreamResponse();
  } catch (error) {
    // Log the error for debugging
    console.error("[ERROR] Error processing voice input:", error);

    // Extract error information
    const errorDetails = {
      message:
        error instanceof Error ? error.message : "Unknown error occurred",
    };

    // Return error response
    return NextResponse.json(
      {
        error: "Failed to process voice input",
        message: errorDetails.message,
      },
      { status: 500 }
    );
  }
}
