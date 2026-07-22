import { NextResponse } from "next/server";
import { GoogleGenerativeAI, SchemaType, Schema } from "@google/generative-ai";

const SYSTEM_INSTRUCTIONS: Record<string, string> = {
  simple:
    "You are Clario, a compassionate, clear, and highly accessible reading assistant. Your entire purpose is to take confusing, complex, official, or technical text and explain it in extremely simple, plain language. Explain like you're talking to a person who has no background knowledge. Use short paragraphs and clear bullet points. Avoid any jargon, complex terms, or walls of text.",
  student:
    "You are Clario, a compassionate, clear, and highly accessible reading assistant. Your entire purpose is to take confusing, complex, official, or technical text and explain it in extremely simple, plain language. Relate the explanation to a learning context, and use simple examples where helpful. Use short paragraphs and clear bullet points. Avoid any jargon, complex terms, or walls of text.",
  teacher:
    "You are Clario, a compassionate, clear, and highly accessible reading assistant. Your entire purpose is to take confusing, complex, official, or technical text and explain it in extremely simple, plain language. Use a slightly more structured/informative tone, as if preparing to explain it to a class. Use short paragraphs and clear bullet points. Avoid any jargon, complex terms, or walls of text.",
  "elderly-friendly":
    "You are Clario, a compassionate, clear, and highly accessible reading assistant. Your entire purpose is to take confusing, complex, official, or technical text and explain it in extremely simple, plain language. Use extra simple wording, larger implicit warmth, and avoid jargon completely. Use short paragraphs and clear bullet points.",
};

const RESPONSE_SCHEMA: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    explanation: {
      type: SchemaType.STRING,
      description: "The plain-language, simplified explanation of the text, matching the requested tone/audience mode.",
    },
    riskLevel: {
      type: SchemaType.STRING,
      format: "enum",
      enum: ["low", "medium", "high"],
      description: "The analyzed risk level: 'high' for clear signs of scam/fraud/phishing/impersonation/too-good-to-be-true/OTP requests; 'medium' for suspicious, urgent or highly misleading elements; 'low' if no obvious risks are found.",
    },
    riskReason: {
      type: SchemaType.STRING,
      description: "A short 1-2 sentence explanation of why it was assigned that risk level. Must be empty string if riskLevel is 'low' and no notable issues were found.",
    },
  },
  required: ["explanation", "riskLevel", "riskReason"],
};

export async function POST(request: Request) {
  try {
    // 1. Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request payload. Please try again." },
        { status: 400 }
      );
    }

    const { text } = body;
    let { tone } = body;

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

    if (!tone || typeof tone !== "string" || !SYSTEM_INSTRUCTIONS[tone.toLowerCase()]) {
      tone = "simple";
    }

    const normalizedTone = tone.toLowerCase();
    const systemInstruction = SYSTEM_INSTRUCTIONS[normalizedTone];

    // 2. Check for API key configuration
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY is not defined in the environment variables.");
      return NextResponse.json(
        { error: "The explanation service is not configured. Please add GEMINI_API_KEY to your environment variables." },
        { status: 500 }
      );
    }

    // 3. Initialize Gemini SDK
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: systemInstruction,
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
      },
    });

    const prompt = `Please carefully analyze the following text. You have two main tasks:
1. Simplify and explain the text clearly according to your system instructions for the requested tone.
2. Analyze the text for signs of scams, fraud, phishing, misleading intent, urgency pressure, requests for money, OTPs, personal info, suspicious links, or impersonation.

Text to analyze:
"""
${text}
"""`;

    // 4. Generate content from Gemini API
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();

    if (!responseText) {
      throw new Error("Empty response returned from Gemini API");
    }

    // Try parsing the response as JSON
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Failed to parse Gemini response as JSON:", responseText, parseError);
      return NextResponse.json(
        { error: "We couldn't analyze this text right now. Please try again in a moment." },
        { status: 500 }
      );
    }

    const { explanation, riskLevel, riskReason } = parsedResponse;

    // Validate properties
    if (!explanation || !riskLevel || typeof riskReason !== "string") {
      throw new Error("Response JSON does not contain all required fields");
    }

    // 5. Return success response
    return NextResponse.json({
      explanation,
      riskLevel,
      riskReason,
    });
  } catch (error) {
    console.error("Error in /api/explain:", error);
    return NextResponse.json(
      { error: "We couldn't analyze this text right now. Please try again in a moment." },
      { status: 500 }
    );
  }
}
