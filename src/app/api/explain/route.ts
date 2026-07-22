import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

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
      systemInstruction: "You are Clario, a compassionate, clear, and highly accessible reading assistant. Your entire purpose is to take confusing, complex, official, or technical text and explain it in extremely simple, plain language. Explain like you're talking to an elderly person or a student who has no background knowledge. Use short paragraphs and clear bullet points. Avoid any jargon, complex terms, or walls of text.",
    });

    const prompt = `Please simplify and explain the following text. Make it easy to understand, warm, and clear:

"""
${text}
"""

Simple Explanation:`;

    // 4. Generate content from Gemini API
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const explanation = response.text();

    if (!explanation) {
      throw new Error("Empty explanation returned from Gemini API");
    }

    // 5. Return success response
    return NextResponse.json({ explanation });
  } catch (error) {
    console.error("Error in /api/explain:", error);
    return NextResponse.json(
      { error: "We couldn't simplify this text right now. Please try again in a moment." },
      { status: 500 }
    );
  }
}
