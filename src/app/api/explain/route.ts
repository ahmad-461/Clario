import { NextResponse } from "next/server";
import { GoogleGenerativeAI, SchemaType, Schema } from "@google/generative-ai";
import { PDFParse } from "pdf-parse";
import { supabase } from "@/lib/supabase";

// @ts-expect-error - pdfjs worker doesn't have standard type definitions
import * as pdfWorker from "pdfjs-dist/legacy/build/pdf.worker.mjs";

if (typeof globalThis !== "undefined") {
  // @ts-expect-error - assigning to globalThis is not defined in globalThis type
  globalThis.pdfjsWorker = pdfWorker;
}

const SYSTEM_INSTRUCTIONS: Record<string, string> = {
  simple:
    "You are Clario, a compassionate, clear, and highly accessible reading assistant. Your entire purpose is to take confusing, complex, official, or technical text and explain it in extremely simple, plain language. Explain like you're talking to a person who has no background knowledge. Use short paragraphs and clear bullet points. Avoid any jargon, complex terms, or walls of text. Also check for personal emotional or pressure tactics (like guilt-tripping, controlling language, fear/urgency pressure, or emotional manipulation from friends, partners, family, or bosses).",
  student:
    "You are Clario, a compassionate, clear, and highly accessible reading assistant. Your entire purpose is to take confusing, complex, official, or technical text and explain it in extremely simple, plain language. Relate the explanation to a learning context, and use simple examples where helpful. Use short paragraphs and clear bullet points. Avoid any jargon, complex terms, or walls of text. Also check for personal emotional or pressure tactics (like guilt-tripping, controlling language, fear/urgency pressure, or emotional manipulation from friends, partners, family, or bosses).",
  teacher:
    "You are Clario, a compassionate, clear, and highly accessible reading assistant. Your entire purpose is to take confusing, complex, official, or technical text and explain it in extremely simple, plain language. Use a slightly more structured/informative tone, as if preparing to explain it to a class. Use short paragraphs and clear bullet points. Avoid any jargon, complex terms, or walls of text. Also check for personal emotional or pressure tactics (like guilt-tripping, controlling language, fear/urgency pressure, or emotional manipulation from friends, partners, family, or bosses).",
  "elderly-friendly":
    "You are Clario, a compassionate, clear, and highly accessible reading assistant. Your entire purpose is to take confusing, complex, official, or technical text and explain it in extremely simple, plain language. Use extra simple wording, larger implicit warmth, and avoid jargon completely. Use short paragraphs and clear bullet points. Also check for personal emotional or pressure tactics (like guilt-tripping, controlling language, fear/urgency pressure, or emotional manipulation from friends, partners, family, or bosses).",
};

const RESPONSE_SCHEMA: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    understandIt: {
      type: SchemaType.STRING,
      description: "The plain-language, simplified explanation of the text, matching the requested tone/audience mode.",
    },
    whatMatters: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: "An array of short, concrete key facts, obligations, deadlines, payments, fees, or required actions. Present as short, actionable bullet points.",
    },
    whatTheyAreNotTellingYou: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          category: {
            type: SchemaType.STRING,
            format: "enum",
            enum: ["Stated", "Implied", "Worth verifying"],
            description: "Categorize as 'Stated' (explicitly stated in source but potentially hidden or notable), 'Implied' (not stated outright but implied), or 'Worth verifying' (requires external verification).",
          },
          text: {
            type: SchemaType.STRING,
            description: "The description of the risk, manipulation, omission, or unusual pattern. Keep it brief and clear.",
          }
        },
        required: ["category", "text"]
      },
      description: "A consolidated list of hidden risks, unusual conditions, pressure tactics, manipulative language, easily overlooked details, potential consequences, or omitted details.",
    },
    riskLevel: {
      type: SchemaType.STRING,
      format: "enum",
      enum: ["low", "medium", "high"],
      description: "The analyzed risk level: 'high' for clear signs of scam/fraud/phishing/impersonation/too-good-to-be-true/OTP requests; 'medium' for suspicious, urgent or highly misleading elements; 'low' if no obvious risks are found.",
    },
    confidenceLevel: {
      type: SchemaType.STRING,
      format: "enum",
      enum: ["high", "medium", "low"],
      description: "The analyzed confidence level of the AI's explanation: 'high', 'medium', or 'low'.",
    },
    confidenceNote: {
      type: SchemaType.STRING,
      description: "A short 1 sentence explanation of why confidence is at that level. Gently suggest consulting a professional (like lawyer, doctor, accountant, etc.) if confidenceLevel is 'low'.",
    },
    talkingPoints: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.STRING,
      },
      description: "2-3 short, concrete conversational talking points or questions the two readers (e.g. an adult child helping an elderly parent) could discuss together. Must be empty array if companionMode is inactive.",
    },
  },
  required: ["understandIt", "whatMatters", "whatTheyAreNotTellingYou", "riskLevel", "confidenceLevel", "confidenceNote", "talkingPoints"],
};

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";
    let text = "";
    let tone = "simple";
    let companionMode = false;
    let file: File | null = null;
    let inputType: "text" | "pdf" | "image" = "text";
    let pdfPageCount: number | null = null;

    // Early Content-Length check to prevent reading excessively large payloads
    const contentLengthStr = request.headers.get("content-length");
    if (contentLengthStr) {
      const contentLength = parseInt(contentLengthStr, 10);
      if (!isNaN(contentLength) && contentLength > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: "The file is too large. Max file size is 5MB." },
          { status: 413 }
        );
      }
    }

    // 1. Parse payload based on Content-Type
    if (contentType.includes("multipart/form-data")) {
      let formData;
      try {
        formData = await request.formData();
      } catch (err: unknown) {
        console.error("Failed to parse form data:", err);
        const errMsg = err instanceof Error ? err.message : "";
        if (errMsg.toLowerCase().includes("large") || errMsg.toLowerCase().includes("limit")) {
          return NextResponse.json(
            { error: "The file is too large. Max file size is 5MB." },
            { status: 413 }
          );
        }
        return NextResponse.json(
          { error: "Failed to parse file upload request. Please try again." },
          { status: 400 }
        );
      }
      text = (formData.get("text") as string) || "";
      tone = (formData.get("tone") as string) || "simple";
      companionMode = formData.get("companionMode") === "true";
      file = formData.get("file") as File | null;
    } else {
      let body;
      try {
        body = await request.json();
      } catch {
        return NextResponse.json(
          { error: "Invalid request payload. Please try again." },
          { status: 400 }
        );
      }
      text = body.text || "";
      tone = body.tone || "simple";
      companionMode = !!body.companionMode;
    }

    // 2. Validate Tone
    if (!tone || typeof tone !== "string" || !SYSTEM_INSTRUCTIONS[tone.toLowerCase()]) {
      tone = "simple";
    }
    const normalizedTone = tone.toLowerCase();
    const systemInstruction = SYSTEM_INSTRUCTIONS[normalizedTone];

    // 3. Check for API key configuration
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY is not defined in the environment variables.");
      return NextResponse.json(
        { error: "The explanation service is not configured. Please add GEMINI_API_KEY to your environment variables." },
        { status: 500 }
      );
    }

    // 4. Initialize Gemini SDK
    const genAI = new GoogleGenerativeAI(apiKey);

    // Adapt system instruction if companionMode is active to be warmer and framed for two people reading together
    const modifiedSystemInstruction = companionMode
      ? `${systemInstruction} Framed for two people looking at/reading the same document or message together (e.g. an adult child helping an elderly parent, or a teacher with a student). Make the explanation feel distinctly warmer, collaborative, and more relational. Use second-person-plural framing naturally where appropriate (e.g. "We can understand this as...", "Let's look at this part together...") without being gimmicky.`
      : systemInstruction;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: modifiedSystemInstruction,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
      },
    });

    let result;

    // 5. If a file is uploaded, process it
    if (file && file.size > 0) {
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: "The file is too large. Max file size is 5MB." },
          { status: 413 }
        );
      }

      const mimeType = file.type;
      const fileName = file.name.toLowerCase();
      const isPdf = mimeType === "application/pdf" || fileName.endsWith(".pdf");
      const isSupportedImage =
        ["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(mimeType) ||
        fileName.endsWith(".jpg") ||
        fileName.endsWith(".jpeg") ||
        fileName.endsWith(".png") ||
        fileName.endsWith(".webp");

      if (!isPdf && !isSupportedImage) {
        return NextResponse.json(
          { error: "Unsupported file format. Please upload a PDF or an image (JPG, PNG, WEBP) only." },
          { status: 400 }
        );
      }

      if (isPdf) {
        inputType = "pdf";
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        let pdfTextResult;
        try {
          const parser = new PDFParse({ data: buffer });
          pdfTextResult = await parser.getText();
        } catch (pdfErr) {
          console.error("PDF parsing failed:", pdfErr);
          return NextResponse.json(
            { error: "Failed to read the PDF file. Please ensure it is not password-protected or corrupted." },
            { status: 400 }
          );
        }

        const extractedText = pdfTextResult.text ? pdfTextResult.text.trim() : "";
        pdfPageCount = pdfTextResult.total;

        if (!extractedText) {
          return NextResponse.json(
            { error: "The PDF is empty or contains no readable text. If this is a scanned document, please convert it to an image instead." },
            { status: 400 }
          );
        }

        const finalPdfText = extractedText.length > 150000
          ? extractedText.substring(0, 150000) + "\n\n[Truncated due to length]"
          : extractedText;

        const prompt = `Please carefully analyze the following text extracted from a PDF. You have three primary analysis layers to populate:
1. "Understand It" (understandIt): A clear, plain-language, simplified explanation of the text matching the requested tone.
2. "What Matters" (whatMatters): A scannable bullet-pointed list of key concrete details (deadlines, payments/fees, obligations, consequences, conditions, actions required, or terms). It must be short and action-oriented.
3. "What They're Not Telling You" (whatTheyAreNotTellingYou): A list of hidden risks, manipulative pressure tactics (e.g. emotional manipulation, artificial urgency), unusual clauses, potential consequences, or notably absent details (omissions expected for this type of document). You must categorize each item into exactly one of three categories:
   - "Stated" (explicitly stated in the source text but potentially hidden or key to note)
   - "Implied" (implied but not stated outright)
   - "Worth verifying" (requires external verification or further check)

Note on Risk Language and Softening:
- Use cautious, honest language rather than alarmist or definitive claims.
- Use words like: potential risk, possible concern, unusual pattern, worth verifying, proceed with caution.
- Avoid absolute claims like "this is a scam" unless evidence is 100% explicit and unambiguous (e.g. asking for bank credentials directly).

Confidence Level Assessment:
- Assess confidence level (high, medium, low) and provide a confidenceNote. Suggest consulting a professional (lawyer, doctor, accountant, etc.) if confidence is low.

Talking Points:
- If companionMode is active (companionMode is: ${companionMode}), generate 2-3 collaborative questions/talking points. If inactive, return an empty array [].

Text to analyze:
"""
${finalPdfText}
"""`;

        result = await model.generateContent(prompt);

      } else {
        inputType = "image";
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const imagePart = {
          inlineData: {
            data: buffer.toString("base64"),
            mimeType: mimeType || "image/jpeg",
          },
        };

        const prompt = `Please carefully analyze the attached image. You have three primary analysis layers to populate:
1. "Understand It" (understandIt): A clear, plain-language, simplified explanation of the text matching the requested tone.
2. "What Matters" (whatMatters): A scannable bullet-pointed list of key concrete details (deadlines, payments/fees, obligations, consequences, conditions, actions required, or terms). It must be short and action-oriented.
3. "What They're Not Telling You" (whatTheyAreNotTellingYou): A list of hidden risks, manipulative pressure tactics (e.g. emotional manipulation, artificial urgency), unusual clauses, potential consequences, or notably absent details (omissions expected for this type of document). You must categorize each item into exactly one of three categories:
   - "Stated" (explicitly stated in the source text but potentially hidden or key to note)
   - "Implied" (implied but not stated outright)
   - "Worth verifying" (requires external verification or further check)

Note on Risk Language and Softening:
- Use cautious, honest language rather than alarmist or definitive claims.
- Use words like: potential risk, possible concern, unusual pattern, worth verifying, proceed with caution.
- Avoid absolute claims like "this is a scam" unless evidence is 100% explicit and unambiguous (e.g. asking for bank credentials directly).

Confidence Level Assessment:
- Assess confidence level (high, medium, low) and provide a confidenceNote. Suggest consulting a professional (lawyer, doctor, accountant, etc.) if confidence is low.

Talking Points:
- If companionMode is active (companionMode is: ${companionMode}), generate 2-3 collaborative questions/talking points. If inactive, return an empty array [].`;

        result = await model.generateContent([prompt, imagePart]);
      }

    } else {
      inputType = "text";
      if (!text || typeof text !== "string" || text.trim() === "") {
        return NextResponse.json(
          { error: "Please paste some text to explain." },
          { status: 400 }
        );
      }

      if (text.length > 5000) {
        return NextResponse.json(
          { error: "Text exceeds the 5000 character limit." },
          { status: 400 }
        );
      }

      const prompt = `Please carefully analyze the following text. You have three primary analysis layers to populate:
1. "Understand It" (understandIt): A clear, plain-language, simplified explanation of the text matching the requested tone.
2. "What Matters" (whatMatters): A scannable bullet-pointed list of key concrete details (deadlines, payments/fees, obligations, consequences, conditions, actions required, or terms). It must be short and action-oriented.
3. "What They're Not Telling You" (whatTheyAreNotTellingYou): A list of hidden risks, manipulative pressure tactics (e.g. emotional manipulation, artificial urgency), unusual clauses, potential consequences, or notably absent details (omissions expected for this type of document). You must categorize each item into exactly one of three categories:
   - "Stated" (explicitly stated in the source text but potentially hidden or key to note)
   - "Implied" (implied but not stated outright)
   - "Worth verifying" (requires external verification or further check)

Note on Risk Language and Softening:
- Use cautious, honest language rather than alarmist or definitive claims.
- Use words like: potential risk, possible concern, unusual pattern, worth verifying, proceed with caution.
- Avoid absolute claims like "this is a scam" unless evidence is 100% explicit and unambiguous (e.g. asking for bank credentials directly).

Confidence Level Assessment:
- Assess confidence level (high, medium, low) and provide a confidenceNote. Suggest consulting a professional (lawyer, doctor, accountant, etc.) if confidence is low.

Talking Points:
- If companionMode is active (companionMode is: ${companionMode}), generate 2-3 collaborative questions/talking points. If inactive, return an empty array [].

Text to analyze:
"""
${text}
"""`;

      result = await model.generateContent(prompt);
    }

    const response = await result.response;
    const responseText = response.text();

    if (!responseText) {
      throw new Error("Empty response returned from Gemini API");
    }

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Failed to parse Gemini response as JSON:", responseText, parseError);
      return NextResponse.json(
        { error: "We couldn't analyze this content right now. Please try again in a moment." },
        { status: 500 }
      );
    }

    const { understandIt, whatMatters, whatTheyAreNotTellingYou, riskLevel, confidenceLevel, confidenceNote, talkingPoints } = parsedResponse;

    // Validate properties
    if (!understandIt || !Array.isArray(whatMatters) || !Array.isArray(whatTheyAreNotTellingYou) || !riskLevel || !confidenceLevel || typeof confidenceNote !== "string" || !Array.isArray(talkingPoints)) {
      throw new Error("Response JSON does not contain all required fields of the new schema");
    }

    // Prepare full multi-layer text as unified Markdown for backwards compatibility and database storage (Option A)
    let fullMarkdownText = `### Understand It\n\n${understandIt}\n\n### What Matters\n\n`;
    whatMatters.forEach((item: string) => {
      fullMarkdownText += `- ${item}\n`;
    });
    fullMarkdownText += `\n### What They're Not Telling You\n\n`;

    const categories = ["Stated", "Implied", "Worth verifying"];
    categories.forEach((cat) => {
      const items = whatTheyAreNotTellingYou.filter((item: { category: string; text: string }) => item.category === cat);
      if (items.length > 0) {
        fullMarkdownText += `#### ${cat}\n`;
        items.forEach((item: { text: string }) => {
          fullMarkdownText += `- ${item.text}\n`;
        });
        fullMarkdownText += `\n`;
      }
    });

    // 7. Non-blocking Log to Supabase anonymous analytics
    try {
      if (supabase) {
        let toneMode = "simple";
        if (normalizedTone === "student") toneMode = "student";
        else if (normalizedTone === "teacher") toneMode = "teacher";
        else if (normalizedTone === "elderly-friendly" || normalizedTone === "elderly") toneMode = "elderly";

        const { error: dbError } = await supabase.from("usage_logs").insert({
          input_type: inputType,
          tone_mode: toneMode,
          risk_level: riskLevel,
          confidence_level: confidenceLevel,
        });

        if (dbError) {
          console.error("Failed to log usage metadata to Supabase:", dbError.message);
        }
      } else {
        console.warn("Supabase client is not initialized. Skipping anonymous analytics logging.");
      }
    } catch (dbEx) {
      console.error("Error occurred while logging to Supabase:", dbEx);
    }

    // Return success response structured for both old client code and the new three-layer representation
    return NextResponse.json({
      // Keep explanation as fallback / backwards compatibility with full serialized markdown (especially for history review / sharing)
      explanation: fullMarkdownText.trim(),
      understandIt,
      whatMatters,
      whatTheyAreNotTellingYou,
      riskLevel,
      confidenceLevel,
      confidenceNote,
      talkingPoints,
      ...(pdfPageCount !== null ? { pdfPageCount } : {}),
    });

  } catch (error: unknown) {
    console.error("Error in /api/explain:", error);

    const errMsg = error instanceof Error ? error.message : "";
    if (
      errMsg.toLowerCase().includes("large") ||
      errMsg.toLowerCase().includes("limit") ||
      errMsg.toLowerCase().includes("too large")
    ) {
      return NextResponse.json(
        { error: "The file is too large. Max file size is 5MB." },
        { status: 413 }
      );
    }

    return NextResponse.json(
      { error: "We couldn't analyze this content right now. Please try again in a moment." },
      { status: 500 }
    );
  }
}
