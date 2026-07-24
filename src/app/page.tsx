"use client";

import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Header } from "./Header";
import { ClarioHero } from "./ClarioHero";
import { ClarioThreadLine } from "./ClarioThreadLine";
import { SignatureFooter } from "./SignatureFooter";
import { supabaseClient } from "@/lib/supabaseClient";
import { User } from "@supabase/supabase-js";

const TONES = [
  { id: "simple", label: "Simple" },
  { id: "student", label: "Student" },
  { id: "teacher", label: "Teacher" },
  { id: "elderly-friendly", label: "Elderly-friendly" },
];

export default function Home() {
  const [user, setUser] = useState<User | null>(null);

  const [inputMode, setInputMode] = useState<"text" | "file">("text");
  const [inputText, setInputText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pdfPageCount, setPdfPageCount] = useState<number | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Speech Recognition State
  const [isListening, setIsListening] = useState(false);
  const [voiceWarning, setVoiceWarning] = useState("");
  const [speechSupported, setSpeechSupported] = useState<boolean | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [recognitionInstance, setRecognitionInstance] = useState<any>(null);

  // Detect Speech Recognition Support
  useEffect(() => {
    if (typeof window !== "undefined") {
      // @ts-expect-error - SpeechRecognition is not standard in standard DOM lib yet
      const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
      setSpeechSupported(!!SpeechRecognitionClass);
    }
  }, []);

  // Initialize Speech Recognition
  const toggleListening = () => {
    if (!speechSupported) return;

    if (isListening) {
      if (recognitionInstance) {
        recognitionInstance.stop();
      }
      setIsListening(false);
      return;
    }

    try {
      // @ts-expect-error - SpeechRecognition is not standard in standard DOM lib yet
      const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        const resultIndex = event.resultIndex;
        const transcript = event.results[resultIndex][0].transcript;
        if (transcript) {
          setInputText((prev) => {
            const separator = prev.trim() === "" ? "" : " ";
            const combined = prev + separator + transcript;
            if (combined.length >= 5000) {
              setVoiceWarning("Voice input stopped — you've reached the 5,000 character limit.");
              // Stop the active speech recognition instance and set isListening to false
              recognition.stop();
              return combined.substring(0, 5000);
            }
            return combined;
          });
        }
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
      setRecognitionInstance(recognition);
    } catch (err) {
      console.error("Speech recognition initialization failed:", err);
      setIsListening(false);
    }
  };

  // Clean up Speech Recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionInstance) {
        recognitionInstance.stop();
      }
    };
  }, [recognitionInstance]);

  const [explanation, setExplanation] = useState("");
  const [riskLevel, setRiskLevel] = useState("");
  const [riskReason, setRiskReason] = useState("");
  const [manipulationFlags, setManipulationFlags] = useState<string[]>([]);
  const [omissionFlags, setOmissionFlags] = useState<string[]>([]);
  const [confidenceLevel, setConfidenceLevel] = useState("");
  const [confidenceNote, setConfidenceNote] = useState("");
  const [showConfidenceExplanation, setShowConfidenceExplanation] = useState(false);
  const [selectedTone, setSelectedTone] = useState("simple");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Text-to-Speech State
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Stop/Pause playback on cleanup or reset
  const stopSpeaking = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  const handleReadAloud = () => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      alert("Text-to-speech is not supported in this browser.");
      return;
    }

    if (isSpeaking) {
      stopSpeaking();
      return;
    }

    // Prepare text to read aloud
    // We clean up markdown characters to make speech synthesis sound natural
    const cleanText = explanation
      .replace(/[*#_`~>]/g, "") // Remove common markdown formatting characters
      .replace(/-\s+/g, "");    // Remove list bullet symbols

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = "en-US";

    // Set a calm, clear rate and pitch
    utterance.rate = 0.95; // Slightly slower for readability/elderly suitability
    utterance.pitch = 1.0;

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = (e) => {
      console.error("SpeechSynthesisUtterance error:", e);
      setIsSpeaking(false);
    };

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Stop speech if we reset the app or unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  // Constants
  const CHARACTER_LIMIT = 5000;

  // Cleanup Preview URLs
  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  // Handle shared history load
  useEffect(() => {
    try {
      const sharedItemStr = sessionStorage.getItem("clario_view_history");
      if (sharedItemStr) {
        const item = JSON.parse(sharedItemStr);
        // Populate output states
        setExplanation(item.explanation_text);
        setRiskLevel(item.risk_level || "low");
        setRiskReason(item.risk_reason || "");
        setManipulationFlags(item.manipulation_flags || []);
        setOmissionFlags(item.omissionFlags || item.omission_flags || []);
        setConfidenceLevel(item.confidence_level || "high");
        setConfidenceNote(item.confidence_note || "");
        setSelectedTone(item.tone_mode || "simple");

        // Set input state preview info
        if (item.input_type === "pdf") {
          setInputMode("file");
          setSelectedFile(new File([], "document_saved_history.pdf", { type: "application/pdf" }));
          setPdfPageCount(1);
        } else if (item.input_type === "image") {
          setInputMode("file");
          setSelectedFile(new File([], "image_saved_history.png", { type: "image/png" }));
        } else {
          setInputMode("text");
          setInputText("Explanation loaded from saved history.");
        }

        // Smooth scroll to output display
        setTimeout(() => {
          const resultCard = document.getElementById("result-card-display");
          if (resultCard) {
            resultCard.scrollIntoView({ behavior: "smooth" });
          }
        }, 100);

        // Clear sessionStorage so it doesn't linger on refresh
        sessionStorage.removeItem("clario_view_history");
      }
    } catch (err) {
      console.error("Failed to load shared history:", err);
    }
  }, []);

  // Sync / Fetch Tone preference when user is logged in
  useEffect(() => {
    const client = supabaseClient;
    if (!client || !user) return;

    const fetchPreference = async () => {
      try {
        const { data, error: prefErr } = await client
          .from("profiles")
          .select("preferred_tone")
          .eq("user_id", user.id)
          .single();

        if (prefErr) {
          // No profile row yet, which is expected for brand new signups
          if (prefErr.code !== "PGRST116") {
            console.error("Failed to fetch preference:", prefErr.message);
          }
          return;
        }

        if (data?.preferred_tone) {
          setSelectedTone(data.preferred_tone);
        }
      } catch (err) {
        console.error("Error checking preference:", err);
      }
    };

    fetchPreference();
  }, [user]);

  // Handle Tone Selection change with auto-upsert for logged-in users
  const handleToneChange = async (toneId: string) => {
    setSelectedTone(toneId);

    const client = supabaseClient;
    if (user && client) {
      try {
        const { error: upsertErr } = await client.from("profiles").upsert({
          user_id: user.id,
          preferred_tone: toneId,
        });

        if (upsertErr) {
          console.error("Failed to save preferred tone:", upsertErr.message);
        }
      } catch (err) {
        console.error("Error upserting preference:", err);
      }
    }
  };

  // Handle Input Change
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    if (voiceWarning) {
      setVoiceWarning("");
    }
  };

  // Handle File Selection
  const handleFileSelection = async (file: File) => {
    setError("");
    setPdfPageCount(null);
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl(null);
    }

    // 1. Validate File Size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("The file is too large. Max file size is 5MB.");
      setSelectedFile(null);
      return;
    }

    // 2. Validate File Type
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
      setError("Unsupported file format. Please upload a PDF or an image (JPG, PNG, WEBP) only.");
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);

    // 3. Generate preview / page count
    if (isPdf) {
      try {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result;
          if (result instanceof ArrayBuffer) {
            // Look at first 1MB of metadata for page structures to count pages
            const chunk = result.slice(0, 1000000);
            const text = new TextDecoder("utf-8").decode(new Uint8Array(chunk));
            const matches = text.match(/\/Type\s*\/Page\b/g);
            if (matches) {
              setPdfPageCount(matches.length);
            } else {
              const countMatch = /\/Count\s+(\d+)/g.exec(text);
              if (countMatch) {
                setPdfPageCount(parseInt(countMatch[1], 10));
              } else {
                setPdfPageCount(null);
              }
            }
          }
        };
        reader.readAsArrayBuffer(file);
      } catch (err) {
        console.error("Failed to estimate PDF page count client-side", err);
      }
    } else {
      const previewUrl = URL.createObjectURL(file);
      setImagePreviewUrl(previewUrl);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPdfPageCount(null);
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl(null);
    }
    setError("");
  };

  // Drag and Drop Handlers
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelection(files[0]);
    }
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Local/frontend validation check
    if (inputMode === "text" && !inputText.trim()) {
      setError("Please paste some text to explain.");
      return;
    }
    if (inputMode === "file" && !selectedFile) {
      setError("Please upload a PDF or an image (JPG, PNG, WEBP) only.");
      return;
    }

    const canSubmit = inputMode === "text" ? inputText.trim() : selectedFile;
    if (!canSubmit) return;

    setIsLoading(true);
    setError("");
    setExplanation("");
    setRiskLevel("");
    setRiskReason("");
    setManipulationFlags([]);
    setOmissionFlags([]);
    setConfidenceLevel("");
    setConfidenceNote("");
    setShowConfidenceExplanation(false);

    try {
      let body: BodyInit;
      const headers: Record<string, string> = {};

      if (inputMode === "file" && selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("tone", selectedTone);
        body = formData;
      } else {
        headers["Content-Type"] = "application/json";
        body = JSON.stringify({ text: inputText, tone: selectedTone });
      }

      const response = await fetch("/api/explain", {
        method: "POST",
        headers,
        body,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to simplify content.");
      }

      setExplanation(data.explanation);
      setRiskLevel(data.riskLevel || "low");
      setRiskReason(data.riskReason || "");
      setManipulationFlags(data.manipulationFlags || []);
      setOmissionFlags(data.omissionFlags || []);
      setConfidenceLevel(data.confidenceLevel || "high");
      setConfidenceNote(data.confidenceNote || "");

      if (data.pdfPageCount !== undefined) {
        setPdfPageCount(data.pdfPageCount);
      }

      // Save to history in background if user is logged in (Feature 2)
      const client = supabaseClient;
      if (user && client) {
        const resolvedInputType = inputMode === "file" && selectedFile
          ? (selectedFile.name.toLowerCase().endsWith(".pdf") ? "pdf" : "image")
          : "text";

        (async () => {
          try {
            const { error: histErr } = await client
              .from("explanation_history")
              .insert({
                user_id: user.id,
                input_type: resolvedInputType,
                tone_mode: selectedTone,
                explanation_text: data.explanation,
                risk_level: data.riskLevel || "low",
                risk_reason: data.riskReason || null,
                manipulation_flags: data.manipulationFlags || null,
                confidence_level: data.confidenceLevel || "high",
              });
            if (histErr) {
              console.error("Non-blocking save to history failed:", histErr.message);
            }
          } catch (err) {
            console.error("Error executing background save to history:", err);
          }
        })();
      }

    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Copy to Clipboard
  const handleCopy = async () => {
    if (!explanation) return;
    try {
      let textToCopy = "";

      // 1. Add Confidence
      if (confidenceLevel) {
        const formattedConfidence = confidenceLevel.charAt(0).toUpperCase() + confidenceLevel.slice(1);
        textToCopy += `Confidence: ${formattedConfidence}\n`;
        if (confidenceLevel === "low" && confidenceNote) {
          textToCopy += `Note: ${confidenceNote}\n`;
        }
        textToCopy += `\n`;
      }

      // 2. Add Scam Risk
      if (riskLevel === "medium" || riskLevel === "high") {
        const formattedRisk = riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1);
        textToCopy += `Risk: ${formattedRisk}\nReason: ${riskReason}\n\n`;
      }

      // 3. Add Manipulation Flags
      if (manipulationFlags && manipulationFlags.length > 0) {
        textToCopy += `Manipulation Flags:\n`;
        manipulationFlags.forEach((flag) => {
          textToCopy += `- ${flag}\n`;
        });
        textToCopy += `\n`;
      }

      // 3.5 Add Omission Flags
      if (omissionFlags && omissionFlags.length > 0) {
        textToCopy += `What's Missing:\n`;
        omissionFlags.forEach((flag) => {
          textToCopy += `- ${flag}\n`;
        });
        textToCopy += `\n`;
      }

      // 4. Add Explanation
      textToCopy += `Explanation:\n${explanation}`;

      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  // Reset App State (Try Another)
  const handleReset = () => {
    stopSpeaking();
    setInputText("");
    setVoiceWarning("");
    setSelectedFile(null);
    setPdfPageCount(null);
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl(null);
    }
    setExplanation("");
    setRiskLevel("");
    setRiskReason("");
    setManipulationFlags([]);
    setOmissionFlags([]);
    setConfidenceLevel("");
    setConfidenceNote("");
    setShowConfidenceExplanation(false);
    setError("");
    setIsLoading(false);
  };

  // Custom text renderer to format markdown (bullet points, bold, paragraphs, etc.) securely
  const renderExplanation = (text: string) => {
    const isElderly = selectedTone === "elderly-friendly";

    return (
      <div style={isElderly ? { fontSize: "18px", lineHeight: "1.6" } : undefined}>
        <ReactMarkdown
          components={{
            p: ({ children }) => (
              <p className="leading-relaxed mb-4 text-[#0F172A]">
                {children}
              </p>
            ),
            ul: ({ children }) => (
              <ul className="list-disc pl-6 mb-4 space-y-2 text-[#0F172A]">
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal pl-6 mb-4 space-y-2 text-[#0F172A]">
                {children}
              </ol>
            ),
            li: ({ children }) => (
              <li className="leading-relaxed">
                {children}
              </li>
            ),
            strong: ({ children }) => (
              <strong className="font-extrabold text-[#0F172A]">
                {children}
              </strong>
            ),
            em: ({ children }) => (
              <em className="italic text-[#0F172A]">
                {children}
              </em>
            ),
          }}
        >
          {text}
        </ReactMarkdown>
      </div>
    );
  };

  const isSubmitDisabled =
    isLoading ||
    (inputMode === "text" ? !inputText.trim() : !selectedFile);

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-[#0F172A] font-sans transition-colors duration-200 overflow-x-hidden relative">
      {/* Dynamic connecting narrative thread line overlay */}
      <ClarioThreadLine />

      {/* Hidden Print Template container for jsPDF + html2canvas */}
      {explanation && (
        <div
          id="clario-pdf-template"
          style={{
            position: "absolute",
            left: "-9999px",
            top: "-9999px",
            width: "800px", // Standard width for high-quality single-page / multi-page render
            backgroundColor: "#FFFFFF",
            color: "#0F172A",
            padding: "40px",
            boxSizing: "border-box",
            fontFamily: "sans-serif",
            display: "none",
          }}
        >
          {/* Header/Logo */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "2px solid #E2E8F0", paddingBottom: "20px", marginBottom: "30px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              {/* Inline SVG Logo Mark: The Resolved Loop */}
              <svg
                style={{ height: "36px", width: "54px" }}
                viewBox="0 0 48 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Tangled / Confused Loop (Slate-900 / #0F172A) */}
                <path
                  d="M 6 18 C 6 10, 13 6, 17 6 C 23 6, 23 20, 17 20 C 13 20, 10 16, 10 12 C 10 8, 14 6, 18 8"
                  stroke="#0F172A"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Resolved Sweep (Teal-600 / #0D9488) */}
                <path
                  d="M 18 8 C 22 10, 26 24, 34 24 C 39 24, 42 18, 42 12"
                  stroke="#0D9488"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Core Dot (Teal-600 / #0D9488) */}
                <circle cx="42" cy="12" r="3.2" fill="#0D9488" />
              </svg>
              <span style={{ fontSize: "28px", fontWeight: "600", color: "#0F172A", letterSpacing: "0.05em" }}>Clario</span>
            </div>
            <div style={{ fontSize: "14px", fontWeight: "700", color: "#475569" }}>
              Date: {new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
            </div>
          </div>

          {/* Tone Mode used */}
          <div style={{ marginBottom: "24px" }}>
            <span style={{ fontSize: "12px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.1em", color: "#475569", display: "block", marginBottom: "4px" }}>
              Audience Tone Mode
            </span>
            <span style={{ fontSize: "18px", fontWeight: "800", color: "#0D9488" }}>
              {TONES.find((t) => t.id === selectedTone)?.label || "Simple"} Explanation
            </span>
          </div>

          {/* Confidence Section (Always near the top) */}
          {confidenceLevel && (
            <div style={{
              backgroundColor: confidenceLevel === "high" ? "#EFF6FF" : confidenceLevel === "medium" ? "#F1F5F9" : "#FFF7ED",
              border: `1.5px solid ${confidenceLevel === "high" ? "#1E40AF" : confidenceLevel === "medium" ? "#475569" : "#9A3412"}`,
              borderRadius: "12px",
              padding: "20px",
              marginBottom: "30px",
            }}>
              <span style={{
                fontSize: "13px",
                fontWeight: "900",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: confidenceLevel === "high" ? "#1E40AF" : confidenceLevel === "medium" ? "#475569" : "#9A3412",
                display: "block",
                marginBottom: confidenceLevel === "low" && confidenceNote ? "8px" : "0"
              }}>
                Confidence: {confidenceLevel.toUpperCase()}
              </span>
              {confidenceLevel === "low" && confidenceNote && (
                <p style={{
                  fontSize: "15px",
                  fontWeight: "700",
                  lineHeight: "1.5",
                  margin: "0",
                  color: "#9A3412"
                }}>
                  {confidenceNote}
                </p>
              )}
            </div>
          )}

          {/* Scam Risk Alert (If Medium or High) */}
          {(riskLevel === "medium" || riskLevel === "high") && (
            <div style={{
              backgroundColor: riskLevel === "high" ? "#FCE8E6" : "#FEF7E0",
              border: `1.5px solid ${riskLevel === "high" ? "#C5221F" : "#B06000"}`,
              borderRadius: "12px",
              padding: "20px",
              marginBottom: "30px",
            }}>
              <span style={{
                fontSize: "13px",
                fontWeight: "900",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: riskLevel === "high" ? "#C5221F" : "#B06000",
                display: "block",
                marginBottom: "8px"
              }}>
                RISK LEVEL: {riskLevel.toUpperCase()}
              </span>
              <p style={{
                fontSize: "15px",
                fontWeight: "700",
                lineHeight: "1.5",
                margin: "0",
                color: riskLevel === "high" ? "#7F1D1D" : "#78350F"
              }}>
                {riskReason}
              </p>
            </div>
          )}

          {/* Manipulation Tactics (If present) */}
          {manipulationFlags && manipulationFlags.length > 0 && (
            <div style={{
              backgroundColor: "#F3E8FF",
              border: "1.5px solid #6B21A8",
              borderRadius: "12px",
              padding: "20px",
              marginBottom: "30px",
            }}>
              <span style={{
                fontSize: "13px",
                fontWeight: "900",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "#6B21A8",
                display: "block",
                marginBottom: "8px"
              }}>
                MANIPULATION TACTICS OBSERVED
              </span>
              <ul style={{
                fontSize: "15px",
                fontWeight: "700",
                lineHeight: "1.5",
                margin: "0",
                paddingLeft: "20px",
                color: "#6B21A8",
                listStyleType: "disc",
              }}>
                {manipulationFlags.map((flag, idx) => (
                  <li key={idx} style={{ marginBottom: "6px" }}>{flag}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Omission Flags (What's Missing) (If present) */}
          {omissionFlags && omissionFlags.length > 0 && (
            <div style={{
              backgroundColor: "#F8FAFC",
              border: "1.5px dashed #94A3B8",
              borderRadius: "12px",
              padding: "20px",
              marginBottom: "30px",
            }}>
              <span style={{
                fontSize: "13px",
                fontWeight: "900",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "#334155",
                display: "block",
                marginBottom: "4px"
              }}>
                WHAT&apos;S MISSING
              </span>
              <span style={{
                fontSize: "12px",
                fontWeight: "600",
                color: "#475569",
                display: "block",
                marginBottom: "12px"
              }}>
                Sometimes what&apos;s left out matters as much as what&apos;s said.
              </span>
              <ul style={{
                fontSize: "15px",
                fontWeight: "700",
                lineHeight: "1.5",
                margin: "0",
                paddingLeft: "20px",
                color: "#334155",
                listStyleType: "disc",
              }}>
                {omissionFlags.map((flag, idx) => (
                  <li key={idx} style={{ marginBottom: "6px" }}>{flag}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Simplified Explanation Content */}
          <div style={{ marginBottom: "40px" }}>
            <span style={{
              fontSize: "12px",
              fontWeight: "800",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "#475569",
              display: "block",
              marginBottom: "16px"
            }}>
              Simplified Explanation
            </span>
            <div style={{
              fontSize: "19px", // Large-print (> 16pt equivalent)
              lineHeight: "1.7", // Generous line spacing
              color: "#0F172A",
            }}>
              <ReactMarkdown
                components={{
                  p: ({ children }) => (
                    <p style={{ marginBottom: "20px" }}>
                      {children}
                    </p>
                  ),
                  ul: ({ children }) => (
                    <ul style={{ paddingLeft: "30px", listStyleType: "disc", marginBottom: "20px" }}>
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol style={{ paddingLeft: "30px", listStyleType: "decimal", marginBottom: "20px" }}>
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => (
                    <li style={{ marginBottom: "8px" }}>
                      {children}
                    </li>
                  ),
                  strong: ({ children }) => (
                    <strong style={{ fontWeight: "bold" }}>
                      {children}
                    </strong>
                  ),
                  em: ({ children }) => (
                    <em style={{ fontStyle: "italic" }}>
                      {children}
                    </em>
                  ),
                }}
              >
                {explanation}
              </ReactMarkdown>
            </div>
          </div>

          {/* Footer Note */}
          <div style={{ borderTop: "2px solid #E2E8F0", paddingTop: "20px", marginTop: "40px", textAlign: "center" }}>
            <p style={{ fontSize: "14px", fontWeight: "700", color: "#475569", margin: "0" }}>
              Generated by Clario — clario-rose.vercel.app
            </p>
            <p style={{ fontSize: "12px", fontWeight: "600", color: "#475569", marginTop: "4px", marginBottom: "0" }}>
              Empowering reading with clarity, compassion, and absolute privacy.
            </p>
          </div>
        </div>
      )}

      {/* Sleek Navigation Bar */}
      <Header onSessionChange={(currentUser) => setUser(currentUser)} currentPage="home" />

      {/* Distinctive Hero Section with Hybrid Fusion Slider */}
      <ClarioHero />

      {/* Main Workspace Container — REDESIGNED AS ASYMMETRIC GRID */}
      <div
        id="workspace-tool"
        className="max-w-7xl w-full mx-auto px-6 md:px-12 lg:px-16 py-16 md:py-24 scroll-mt-20 relative"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">

          {/* Left Column: Bold Editorial pull-quote statement */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-28 text-left z-10">
            <span className="text-xs font-bold text-[#0D9488] uppercase tracking-widest block">
              The Workspace
            </span>
            <blockquote className="border-l-4 border-[#0D9488] pl-5 space-y-3">
              <p className="font-display font-medium text-[#0F172A] leading-tight text-2xl md:text-3xl lg:text-[2.25rem] tracking-[-0.03em]">
                &ldquo;The words you sign shouldn&apos;t be a test of your endurance.&rdquo;
              </p>
            </blockquote>
            <p className="text-sm text-[#475569] font-semibold leading-relaxed max-w-sm">
              Paste confusing messages, lease agreements, bank warnings, or upload PDFs/images. Clario will instantly simplify the content according to your chosen audience tone.
            </p>
          </div>

          {/* Right Column: The actual Workspace Tool shifted right (cols 5 to 12) */}
          <div className="lg:col-span-8 w-full flex flex-col gap-8 z-10">
            <main className="w-full space-y-8">
              <form onSubmit={handleSubmit} className="space-y-8">

                {/* Tone Selector */}
                <div className="flex flex-col items-start gap-3">
                  <span className="text-xs font-medium text-[#334155] uppercase tracking-widest">
                    Audience Tone Mode
                  </span>
                  <div className="inline-flex p-1.5 bg-[#F4F6F9] border border-[#E2E8F0] rounded-full shadow-inner gap-1.5 max-w-full overflow-x-auto scrollbar-none">
                    {TONES.map((tone) => {
                      const isActive = selectedTone === tone.id;
                      return (
                        <button
                          key={tone.id}
                          type="button"
                          disabled={isLoading}
                          onClick={() => handleToneChange(tone.id)}
                          className={`px-4 py-2 md:px-6 md:py-2.5 rounded-full text-xs md:text-sm font-semibold transition-all duration-150 whitespace-nowrap focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0D9488] focus-visible:outline-none ${
                            isActive
                              ? "bg-[#0D9488] text-white shadow-md border border-[#0F766E]/10 font-bold"
                              : "text-[#334155] hover:bg-white hover:shadow-sm hover:text-[#0F172A] disabled:opacity-50"
                          }`}
                        >
                          {tone.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Input Card with Tabs */}
                <div className={`relative bg-white rounded-2xl border transition duration-300 overflow-hidden ${
                  isLoading
                    ? "border-transparent ring-2 ring-[#0D9488] shadow-2xl animate-pulse"
                    : "border-[#E2E8F0] shadow-xl hover:shadow-2xl focus-within:ring-2 focus-within:ring-[#0D9488] focus-within:border-transparent"
                }`}>

                  {/* Input Mode Tabs */}
                  <div className="flex border-b border-[#E2E8F0] relative">
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => {
                        setInputMode("text");
                        setError("");
                      }}
                      className={`flex-1 py-4 text-xs md:text-sm font-bold transition-all duration-150 rounded-tl-2xl flex items-center justify-center gap-1.5 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0D9488] focus-visible:outline-none z-10 ${
                        inputMode === "text"
                          ? "text-[#0D9488] bg-[#F4F6F9]/30"
                          : "text-[#475569] hover:text-[#0F172A] hover:bg-[#F4F6F9]/10"
                      }`}
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
                      </svg>
                      Paste Text
                    </button>
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => {
                        setInputMode("file");
                        setError("");
                      }}
                      className={`flex-1 py-4 text-xs md:text-sm font-bold transition-all duration-150 rounded-tr-2xl flex items-center justify-center gap-1.5 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0D9488] focus-visible:outline-none z-10 ${
                        inputMode === "file"
                          ? "text-[#0D9488] bg-[#F4F6F9]/30"
                          : "text-[#475569] hover:text-[#0F172A] hover:bg-[#F4F6F9]/10"
                      }`}
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                      Upload File
                    </button>

                    {/* Sliding active indicator bar */}
                    <div
                      className={`absolute bottom-0 left-0 h-0.5 w-1/2 bg-[#0D9488] transition-transform duration-300 ease-out z-20 ${
                        inputMode === "text" ? "translate-x-0" : "translate-x-full"
                      }`}
                    />
                  </div>

                  {/* Dynamic Content Body */}
                  {inputMode === "text" ? (
                    <>
                      <label htmlFor="inputText" className="sr-only">
                        Confusing text input
                      </label>
                      <textarea
                        id="inputText"
                        className="w-full min-h-[180px] md:min-h-[220px] p-6 text-base md:text-lg text-[#0F172A] placeholder-[#475569]/60 focus:outline-none resize-y bg-[#F4F6F9] shadow-inner border-none focus-visible:ring-0"
                        placeholder="Paste anything confusing — a letter, a message, a form, an assignment..."
                        maxLength={CHARACTER_LIMIT}
                        value={inputText}
                        onChange={handleInputChange}
                        disabled={isLoading}
                      />

                      {/* Textarea Bottom Control bar */}
                      <div className="flex justify-between items-center px-6 py-4 border-t border-[#E2E8F0] bg-[#F4F6F9] text-sm text-[#334155]">
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-xs tracking-wider text-[#475569]">
                            {inputText.length.toLocaleString()} / {CHARACTER_LIMIT.toLocaleString()} characters
                          </span>

                          {/* Speech-to-Text Button integrated right here */}
                          <div className="relative group flex items-center">
                            <button
                              type="button"
                              disabled={isLoading || speechSupported === false}
                              onClick={toggleListening}
                              className={`p-1.5 rounded-lg transition-all duration-200 focus-visible:ring-2 focus-visible:ring-[#0D9488] focus-visible:outline-none flex items-center justify-center ${
                                isListening
                                  ? "bg-red-500 text-white animate-pulse shadow-md"
                                  : speechSupported === false
                                  ? "text-slate-300 cursor-not-allowed opacity-50"
                                  : "text-[#475569] hover:bg-[#E2E8F0] hover:text-[#0F172A]"
                              }`}
                              aria-label={
                                speechSupported === false
                                  ? "Voice input isn't supported in this browser"
                                  : isListening
                                  ? "Stop listening"
                                  : "Speak confusing text (Voice input)"
                              }
                            >
                              {isListening ? (
                                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M6 19h12v2H6z M12 2C9.24 2 7 4.24 7 7v5c0 2.76 2.24 5 5 5s5-2.24 5-5V7c0-2.76-2.24-5-5-5zm3 10c0 1.66-1.34 3-3 3s-3-1.34-3-3V7c0-1.66 1.34-3 3-3s3 1.34 3 3v5z" />
                                </svg>
                              ) : (
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                </svg>
                              )}
                            </button>

                            {/* Precise browser compatibility feedback or listening helper tooltip */}
                            {speechSupported === false ? (
                              <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 p-2 bg-slate-800 text-white text-[11px] font-bold rounded shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 text-center z-50">
                                Voice input isn&apos;t supported in this browser
                              </span>
                            ) : (
                              <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-36 p-2 bg-slate-800 text-white text-[11px] font-bold rounded shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 text-center z-50">
                                {isListening ? "Listening... tap to stop" : "Speak to type"}
                              </span>
                            )}
                          </div>
                        </div>

                        {inputText.length > 0 && !isLoading && (
                          <button
                            type="button"
                            onClick={() => {
                              setInputText("");
                              setVoiceWarning("");
                            }}
                            className="text-xs font-bold text-[#0D9488] hover:text-[#0D9488]/80 transition duration-150 animate-fade-in focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0D9488] focus-visible:outline-none rounded uppercase tracking-wider"
                          >
                            Clear Input
                          </button>
                        )}
                      </div>
                      {voiceWarning && (
                        <div className="px-6 py-2.5 bg-[#FEF2F2] border-t border-[#E2E8F0] text-sm text-[#7F1D1D] font-bold animate-fade-in">
                          {voiceWarning}
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      {/* File Upload / Preview Mode */}
                      {selectedFile ? (
                        /* File Preview State */
                        <div className="p-8 flex flex-col items-center justify-center gap-4 min-h-[180px] md:min-h-[220px] bg-[#F4F6F9] shadow-inner">
                          <div className="flex items-center gap-4 p-4 bg-white border border-[#E2E8F0] rounded-xl w-full max-w-md shadow-sm">

                            {/* Image Thumbnail or PDF Icon */}
                            {imagePreviewUrl ? (
                              <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-white border border-[#E2E8F0] shrink-0">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={imagePreviewUrl}
                                  alt="Upload preview"
                                  className="w-full h-full object-cover animate-fade-in"
                                />
                              </div>
                            ) : (
                              <div className="w-16 h-16 rounded-lg bg-[#E2E8F0] flex items-center justify-center shrink-0 text-[#334155]" aria-hidden="true">
                                <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                              </div>
                            )}

                            {/* File details */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-[#0F172A] truncate">
                                {selectedFile.name}
                              </p>
                              <p className="text-xs text-[#334155] font-semibold mt-0.5">
                                {selectedFile.size > 0 ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB` : "Saved PDF/Image"}
                              </p>
                              {pdfPageCount !== null && (
                                <p className="text-xs text-[#0D9488] font-bold mt-1 inline-flex items-center gap-1 animate-fade-in">
                                  📄 {pdfPageCount} {pdfPageCount === 1 ? "page" : "pages"} detected
                                </p>
                              )}
                            </div>

                            {/* Delete action button */}
                            <button
                              type="button"
                              disabled={isLoading}
                              onClick={handleRemoveFile}
                              className="p-1.5 rounded-lg text-[#334155] hover:bg-[#E2E8F0] hover:text-[#0F172A] transition duration-150 shrink-0 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0D9488] focus-visible:outline-none"
                              aria-label="Remove file"
                            >
                              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Dropzone Mode */
                        <div
                          onDragOver={onDragOver}
                          onDragLeave={onDragLeave}
                          onDrop={onDrop}
                          tabIndex={0}
                          role="button"
                          aria-label="Upload a file. Supports PDF and Images (JPG, PNG, WEBP) up to 5MB."
                          onKeyDown={(e) => {
                            if (isLoading) return;
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              document.getElementById("fileInput")?.click();
                            }
                          }}
                          className={`p-8 md:p-12 flex flex-col items-center justify-center gap-3 min-h-[180px] md:min-h-[220px] cursor-pointer transition-all duration-150 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0D9488] focus-visible:outline-none bg-[#F4F6F9] shadow-inner ${
                            isDragging
                              ? "border-2 border-dashed border-[#0D9488] bg-[#0D9488]/5 m-4 rounded-xl"
                              : "border-none hover:bg-[#E2E8F0]/30"
                          }`}
                          onClick={() => {
                            if (!isLoading) {
                              document.getElementById("fileInput")?.click();
                            }
                          }}
                        >
                          <input
                            id="fileInput"
                            type="file"
                            accept=".pdf,image/jpeg,image/jpg,image/png,image/webp"
                            className="hidden"
                            tabIndex={-1}
                            onChange={(e) => {
                              if (e.target.files && e.target.files.length > 0) {
                                handleFileSelection(e.target.files[0]);
                              }
                            }}
                            disabled={isLoading}
                          />
                          <div className={`p-4 rounded-full bg-[#F4F6F9] text-[#334155] transition duration-150 ${isDragging ? "scale-115 text-[#0D9488]" : ""}`} aria-hidden="true">
                            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                          </div>
                          <div className="text-center">
                            <p className="text-sm md:text-base font-bold text-[#0F172A]">
                              Drag & drop your file here
                            </p>
                            <p className="text-xs text-[#334155] font-semibold mt-1">
                              Supports PDF and Images (JPG, PNG, WEBP) up to 5MB
                            </p>
                            <p className="text-xs text-[#0D9488] font-bold mt-2.5 underline block md:hidden">
                              Tap to upload
                            </p>
                            <p className="text-xs text-[#0D9488] font-bold mt-2.5 underline hidden md:block">
                              Or browse files
                            </p>
                          </div>
                        </div>
                      )}

                      {/* File Upload Bottom Control bar */}
                      <div className="flex justify-between items-center px-6 py-4 border-t border-[#E2E8F0] bg-[#F4F6F9] text-sm text-[#334155]">
                        <span className="font-medium text-xs tracking-wider text-[#475569]">
                          {selectedFile ? "1 file selected" : "No file selected"}
                        </span>

                        {selectedFile && !isLoading && (
                          <button
                            type="button"
                            onClick={handleRemoveFile}
                            className="text-xs font-bold text-[#0D9488] hover:text-[#0D9488]/80 transition duration-150 animate-fade-in focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0D9488] focus-visible:outline-none rounded uppercase tracking-wider"
                          >
                            Clear File
                          </button>
                        )}
                      </div>
                    </>
                  )}

                </div>

                {/* Error Message Box */}
                {error && (
                  <div
                    role="alert"
                    className="p-4 bg-[#FEF2F2] border border-[#991B1B]/15 rounded-xl flex flex-col gap-1 animate-fade-in text-[#7F1D1D]"
                  >
                    <span className="text-sm font-extrabold tracking-wide uppercase">Error</span>
                    <p className="text-sm font-semibold">{error}</p>
                  </div>
                )}

                {/* Action Submit Button */}
                <div className="flex justify-start">
                  <button
                    type="submit"
                    disabled={isSubmitDisabled}
                    className={`w-full sm:w-auto px-12 py-4 rounded-xl font-bold text-base shadow-md transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0D9488] focus-visible:outline-none ${
                      isLoading
                        ? "bg-[#0D9488] text-white cursor-not-allowed scale-[0.98]"
                        : isSubmitDisabled
                        ? "bg-[#0D9488]/10 text-[#0D9488]/40 border border-[#0D9488]/10 cursor-not-allowed shadow-none"
                        : "bg-[#0D9488] text-white hover:bg-[#0D9488]/90 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] active:hover:scale-[0.98] transition-transform"
                    }`}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2 justify-center">
                        <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Simplifying...
                      </span>
                    ) : (
                      "Explain This"
                    )}
                  </button>
                </div>
              </form>

              {/* Quiet Entry Point to Waiting Room */}
              <div className="bg-[#FAF5F0] border border-[#EBE3D5] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in text-left">
                <div className="space-y-1">
                  <p className="text-sm font-bold text-[#78350F]">
                    👩‍👦 Helping someone else understand something?
                  </p>
                  <p className="text-xs text-slate-700 font-medium leading-relaxed">
                    Try the Waiting Room—designed specifically for two people looking at a screen together.
                  </p>
                </div>
                <a
                  href="/waiting-room"
                  className="px-4 py-2 bg-[#78350F] hover:bg-[#5F270B] text-white text-xs font-bold rounded-lg transition duration-150 self-start sm:self-auto shrink-0 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#78350F]"
                >
                  Try the Waiting Room →
                </a>
              </div>

              {/* Skeleton Loading State */}
              {isLoading && (
                <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-6 md:p-8 space-y-6 animate-pulse transition-all duration-300">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4">
                    <div className="h-7 w-48 bg-slate-200 rounded-lg" />
                    <div className="h-9 w-32 bg-slate-100 rounded-lg" />
                  </div>

                  {/* Simulated Risk Badge Skeleton */}
                  <div className="h-8 w-44 bg-[#E6F4EA]/70 rounded-full" />

                  {/* Paragraph Line Skeletons */}
                  <div className="space-y-4">
                    <div className="h-4 bg-slate-200 rounded w-full" />
                    <div className="h-4 bg-slate-200 rounded w-11/12" />
                    <div className="h-4 bg-slate-200 rounded w-10/12" />
                  </div>

                  <div className="space-y-3 pt-4">
                    <div className="h-4 bg-slate-200 rounded w-1/2" />
                    <div className="flex items-start gap-3 pl-4">
                      <div className="h-2 w-2 rounded-full bg-slate-200 mt-1.5 shrink-0" />
                      <div className="h-4 bg-slate-200 rounded w-11/12" />
                    </div>
                    <div className="flex items-start gap-3 pl-4">
                      <div className="h-2 w-2 rounded-full bg-slate-200 mt-1.5 shrink-0" />
                      <div className="h-4 bg-slate-200 rounded w-10/12" />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#E2E8F0] flex justify-end">
                    <div className="h-10 w-28 bg-slate-100 rounded-xl" />
                  </div>
                </div>
              )}

              {/* Result Card Display */}
              {explanation && !isLoading && (
                <div id="result-card-display" className="bg-white rounded-2xl border border-[#E2E8F0] shadow-md p-6 md:p-8 space-y-6 transition-all duration-300 animate-fade-in relative z-20">

                  {/* Header section with Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4">
                    <h2 className="text-xl md:text-2xl font-bold text-[#0F172A]">
                      Simple Explanation
                    </h2>

                    {/* Actions: Copy & Print */}
                    <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                      {/* Print / Save as PDF Button */}
                      <button
                        type="button"
                        disabled={isGeneratingPdf}
                        onClick={async () => {
                          setIsGeneratingPdf(true);
                          try {
                            const jsPDF = (await import("jspdf")).jsPDF;
                            const html2canvas = (await import("html2canvas")).default;

                            const element = document.getElementById("clario-pdf-template");
                            if (!element) return;

                            // Temporarily show the template container visually for rendering
                            const originalStyle = element.style.display;
                            element.style.display = "block";

                            const canvas = await html2canvas(element, {
                              // @ts-expect-error - scale option is supported by html2canvas but missing in types
                              scale: 2,
                              useCORS: true,
                              logging: false,
                              backgroundColor: "#FFFFFF",
                            });

                            element.style.display = originalStyle;

                            const imgData = canvas.toDataURL("image/jpeg", 0.95);

                            const pdf = new jsPDF({
                              orientation: "portrait",
                              unit: "mm",
                              format: "a4",
                            });

                            const imgWidth = 210; // A4 size width in mm
                            const pageHeight = 297; // A4 size height in mm
                            const imgHeight = (canvas.height * imgWidth) / canvas.width;
                            let heightLeft = imgHeight;
                            let position = 0;

                            pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight, undefined, "FAST");
                            heightLeft -= pageHeight;

                            while (heightLeft > 0) {
                              position = heightLeft - imgHeight;
                              pdf.addPage();
                              pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight, undefined, "FAST");
                              heightLeft -= pageHeight;
                            }

                            const today = new Date().toISOString().split("T")[0];
                            pdf.save(`clario-summary-${today}.pdf`);
                          } catch (err) {
                            console.error("PDF generation failed: ", err);
                          } finally {
                            setIsGeneratingPdf(false);
                          }
                        }}
                        className="px-4 py-2 rounded-lg text-sm font-bold bg-[#F4F6F9] text-[#334155] hover:bg-[#E2E8F0] hover:text-[#0F172A] transition duration-150 flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0D9488] focus-visible:outline-none disabled:opacity-50"
                      >
                        {isGeneratingPdf ? (
                          <>
                            <svg className="animate-spin h-4 w-4 text-[#334155]" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Preparing PDF...
                          </>
                        ) : (
                          <>
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            Print / Save as PDF
                          </>
                        )}
                      </button>

                      {/* Standard "Read Aloud" button (rendered only when tone is NOT elderly-friendly) */}
                      {selectedTone !== "elderly-friendly" && (
                        <button
                          type="button"
                          onClick={handleReadAloud}
                          className={`px-4 py-2 rounded-lg text-sm font-bold transition duration-150 flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0D9488] focus-visible:outline-none ${
                            isSpeaking
                              ? "bg-red-500 text-white shadow-md animate-pulse"
                              : "bg-[#F4F6F9] text-[#334155] hover:bg-[#E2E8F0] hover:text-[#0F172A]"
                          }`}
                        >
                          {isSpeaking ? (
                            <>
                              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                              </svg>
                              Stop playback
                            </>
                          ) : (
                            <>
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                              </svg>
                              Read Aloud
                            </>
                          )}
                        </button>
                      )}

                      {/* Actions: Copy */}
                      <button
                        type="button"
                        onClick={handleCopy}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition duration-150 flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0D9488] focus-visible:outline-none ${
                          copied
                            ? "bg-[#0D9488]/10 text-[#0D9488]"
                            : "bg-[#F4F6F9] text-[#334155] hover:bg-[#E2E8F0] hover:text-[#0F172A]"
                        }`}
                      >
                        {copied ? (
                          <>
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            Copied!
                          </>
                        ) : (
                          <>
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 002-2H8a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                            </svg>
                            Copy Explanation
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* PROMINENT ELDERLY-FRIENDLY VOICE BUTTON */}
                  {selectedTone === "elderly-friendly" && (
                    <div className="p-1 bg-[#F0FDFA] rounded-2xl border border-[#0D9488]/20 flex justify-center animate-fade-in">
                      <button
                        type="button"
                        onClick={handleReadAloud}
                        className={`w-full py-5 px-8 rounded-xl font-bold text-lg md:text-xl shadow-lg transition-all duration-300 flex items-center justify-center gap-3 focus-visible:ring-4 focus-visible:ring-[#0D9488]/40 focus-visible:outline-none active:scale-[0.98] ${
                          isSpeaking
                            ? "bg-red-500 text-white hover:bg-red-600 animate-pulse"
                            : "bg-[#0D9488] text-white hover:bg-[#0D766E] hover:shadow-xl hover:-translate-y-0.5"
                        }`}
                      >
                        {isSpeaking ? (
                          <>
                            <svg className="h-7 w-7 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Stop Reading Aloud (Stop Speech)
                          </>
                        ) : (
                          <>
                            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                            </svg>
                            Hear Explanation Read Aloud
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Risk Badge & Callout Section - Top of the card, above explanation text */}
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-wrap gap-2 items-center">
                      {/* Confidence Badge */}
                      {confidenceLevel === "high" && (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-extrabold bg-[#EFF6FF] text-[#1E40AF] border border-[#1E40AF]/15 uppercase tracking-wide">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#1E40AF]" />
                          High Confidence
                          {confidenceNote && (
                            <button
                              type="button"
                              onClick={() => setShowConfidenceExplanation(!showConfidenceExplanation)}
                              className="ml-1 text-[10px] underline font-bold text-[#1E40AF] hover:text-[#1E40AF]/80 focus:outline-none"
                              aria-label="Toggle confidence explanation"
                            >
                              (why?)
                            </button>
                          )}
                        </span>
                      )}

                      {confidenceLevel === "medium" && (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-extrabold bg-[#F1F5F9] text-[#475569] border border-[#475569]/15 uppercase tracking-wide">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#475569]" />
                          Medium Confidence
                          {confidenceNote && (
                            <button
                              type="button"
                              onClick={() => setShowConfidenceExplanation(!showConfidenceExplanation)}
                              className="ml-1 text-[10px] underline font-bold text-[#475569] hover:text-[#475569]/80 focus:outline-none"
                              aria-label="Toggle confidence explanation"
                            >
                              (why?)
                            </button>
                          )}
                        </span>
                      )}

                      {confidenceLevel === "low" && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold bg-[#FFF7ED] text-[#9A3412] border border-[#9A3412]/15 uppercase tracking-wide">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#9A3412]" />
                          Low Confidence
                        </span>
                      )}

                      {riskLevel === "low" && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold bg-[#E6F4EA] text-[#137333] border border-[#137333]/15 uppercase tracking-wide">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#137333]" />
                          No obvious risk detected
                        </span>
                      )}

                      {riskLevel === "medium" && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold bg-[#FEF7E0] text-[#78350F] border border-[#78350F]/15 uppercase tracking-wide">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#78350F]" />
                          Medium Risk
                        </span>
                      )}

                      {riskLevel === "high" && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold bg-[#FCE8E6] text-[#7F1D1D] border border-[#7F1D1D]/15 uppercase tracking-wide animate-pulse">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#7F1D1D]" />
                          High Risk
                        </span>
                      )}

                      {/* Manipulation Badge */}
                      {manipulationFlags && manipulationFlags.length > 0 && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold bg-[#F3E8FF] text-[#6B21A8] border border-[#6B21A8]/15 uppercase tracking-wide">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#6B21A8]" />
                          Manipulation Tactics Observed
                        </span>
                      )}

                      {/* Omissions Badge */}
                      {omissionFlags && omissionFlags.length > 0 && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold bg-[#F8FAFC] text-[#334155] border border-[#94A3B8]/30 uppercase tracking-wide">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#64748B]" />
                          Notable Omissions Found
                        </span>
                      )}
                    </div>

                    {/* Confidence explanation Note (for high/medium, toggled by user) */}
                    {showConfidenceExplanation && (confidenceLevel === "high" || confidenceLevel === "medium") && confidenceNote && (
                      <div className="p-4 bg-blue-50/50 border border-blue-100 text-blue-800 rounded-xl text-xs md:text-sm font-semibold leading-relaxed animate-fade-in">
                        {confidenceNote}
                      </div>
                    )}

                    {/* Low Confidence Callout Box - Always visible */}
                    {confidenceLevel === "low" && confidenceNote && (
                      <div className="p-4 bg-[#FFF7ED] border border-[#9A3412]/15 text-[#9A3412] rounded-xl text-xs md:text-sm font-semibold leading-relaxed">
                        {confidenceNote}
                      </div>
                    )}

                    {/* Risk Reason Callouts */}
                    {riskLevel === "medium" && riskReason && (
                      <div className="p-4 bg-[#FEF7E0]/60 border border-[#B06000]/15 text-[#78350F] rounded-xl text-xs md:text-sm font-semibold leading-relaxed">
                        {riskReason}
                      </div>
                    )}

                    {riskLevel === "high" && riskReason && (
                      <div className="p-4 bg-[#FCE8E6]/60 border border-[#C5221F]/15 text-[#7F1D1D] rounded-xl text-xs md:text-sm font-semibold leading-relaxed">
                        {riskReason}
                      </div>
                    )}

                    {/* Manipulation Flags List */}
                    {manipulationFlags && manipulationFlags.length > 0 && (
                      <div className="p-4 bg-[#F3E8FF]/40 border border-[#6B21A8]/15 text-[#6B21A8] rounded-xl text-xs md:text-sm font-semibold leading-relaxed space-y-2">
                        <p className="font-extrabold tracking-wide uppercase text-[10px] text-[#6B21A8]/85">
                          Observed Tactics:
                        </p>
                        <ul className="list-disc pl-5 space-y-1">
                          {manipulationFlags.map((flag, flagIdx) => (
                            <li key={flagIdx}>{flag}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Omissions Callout Box (What's Missing) */}
                    {omissionFlags && omissionFlags.length > 0 && (
                      <div className="p-5 bg-[#F8FAFC] border border-dashed border-[#94A3B8] text-[#334155] rounded-xl text-xs md:text-sm font-semibold leading-relaxed space-y-3">
                        <div className="space-y-0.5">
                          <p className="font-extrabold tracking-wide uppercase text-[11px] text-[#334155]">
                            What&apos;s Missing
                          </p>
                          <p className="text-[#475569] text-xs">
                            Sometimes what&apos;s left out matters as much as what&apos;s said.
                          </p>
                        </div>
                        <ul className="list-disc pl-5 space-y-1 text-[#334155]">
                          {omissionFlags.map((flag, flagIdx) => (
                            <li key={flagIdx}>{flag}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Explanation Content */}
                  <div className="prose max-w-none">
                    {renderExplanation(explanation)}
                  </div>

                  {/* Reset: Try Another Button */}
                  <div className="pt-4 border-t border-[#E2E8F0] flex justify-end">
                    <button
                      type="button"
                      onClick={handleReset}
                      className="px-6 py-3 rounded-xl border border-[#E2E8F0] bg-white text-[#334155] hover:bg-[#F4F6F9] hover:text-[#0F172A] font-bold text-sm transition duration-150 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0D9488] focus-visible:outline-none"
                    >
                      Try another
                    </button>
                  </div>
                </div>
              )}
            </main>
          </div>

        </div>
      </div>

      {/* Grounded Showcase Features — REDESIGNED WITH VARYING SECTION RHYTHM */}
      <section className="border-t border-[#E2E8F0] py-24 md:py-32 space-y-28 md:space-y-40 bg-white/50 relative">
        <div className="max-w-7xl w-full mx-auto px-6 md:px-12 lg:px-16 space-y-28 md:space-y-40 relative z-10">

          {/* Section Introduction */}
          <div className="text-left max-w-2xl space-y-4">
            <h3 className="text-xs font-bold tracking-widest text-[#0D9488] uppercase">
              Clario in Action
            </h3>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-medium text-[#0F172A] leading-tight tracking-[-0.03em]">
              Grounded in trust, built to protect
            </h2>
          </div>

          {/* Feature 1: Scam & Deception (Asymmetric Visual Split Block) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Left Story Text (5 cols) */}
            <div className="lg:col-span-5 space-y-6 text-left order-2 lg:order-1">
              <div className="p-3 bg-red-50 text-[#C5221F] w-fit rounded-xl">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h4 className="text-2xl md:text-3xl font-display font-medium text-[#0F172A]">
                Deception &amp; scam detection
              </h4>
              <p className="text-[#334155] text-sm md:text-base leading-relaxed font-semibold">
                Clario scans documents for manipulative language, false urgency, and liability traps. Rather than hiding behind legal disclaimers, we flag these predatory psychological triggers instantly.
              </p>
            </div>

            {/* Right Visual Representation (7 cols) */}
            <div className="lg:col-span-7 bg-[#F4F6F9] border border-[#E2E8F0] rounded-2xl p-6 md:p-8 shadow-sm flex flex-col gap-4 order-1 lg:order-2">
              <div className="flex justify-between items-center border-b border-[#E2E8F0] pb-3">
                <span className="text-xs font-extrabold text-[#334155] tracking-widest uppercase">
                  Clario Safety Shield
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold bg-[#FCE8E6] text-[#C5221F] uppercase tracking-wide border border-[#C5221F]/15 animate-pulse">
                  ⚠️ High Risk Detected
                </span>
              </div>
              <div className="p-4 bg-white rounded-xl border border-[#E2E8F0] space-y-3">
                <p className="text-xs md:text-sm font-mono text-[#334155] italic">
                  &ldquo;To keep your account active, you must click this link and confirm your SSN within 24 hours...&rdquo;
                </p>
              </div>
              <div className="p-4 bg-[#FCE8E6]/40 border border-[#C5221F]/15 rounded-xl space-y-2">
                <span className="text-[10px] font-bold text-[#C5221F] uppercase tracking-widest block">
                  Why is this flagged?
                </span>
                <p className="text-xs font-semibold text-[#7F1D1D] leading-relaxed">
                  The message creates artificial panic by giving a 24-hour deadline. Legitimate institutions do not demand sensitive personal data like SSNs via unverified message links.
                </p>
              </div>
            </div>
          </div>

          {/* Feature 2: Privacy (Spacious Text-Forward Statement) */}
          <div className="max-w-3xl mx-auto text-center space-y-6 md:space-y-8 bg-[#F0FDFA] border-2 border-[#0D9488]/10 rounded-2xl p-8 md:p-12 shadow-sm">
            <div className="inline-flex p-3 bg-white text-[#0D9488] rounded-xl shadow-sm">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <h4 className="text-2xl md:text-4xl font-display font-medium text-[#0F172A] tracking-[-0.02em]">
              Compassionate privacy by design
            </h4>
            <p className="text-[#334155] text-sm md:text-lg leading-relaxed font-semibold max-w-2xl mx-auto">
              Your safety starts with your personal data. We process documents in real-time and never save your original text or file contents. We record only anonymous, non-blocking metrics (such as the chosen tone mode or confidence score) to keep Clario simple, secure, and respectful of your absolute privacy.
            </p>
          </div>

          {/* Feature 3: Tone Customization (Asymmetric Offset Pull-Quote Block) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Left Pull-Quote (7 cols) */}
            <div className="lg:col-span-7 text-left space-y-6">
              <span className="text-xs font-bold text-[#0D9488] uppercase tracking-widest block">
                Human-Centered Technology
              </span>
              <p className="font-display font-medium text-[#0F172A] leading-tight text-2xl md:text-3xl lg:text-4xl tracking-[-0.03em]">
                &ldquo;Accessibility is not a feature list. It is an understanding that every person reads differently.&rdquo;
              </p>
              <p className="text-[#334155] text-sm md:text-base leading-relaxed font-semibold">
                Whether you need straightforward clarity (Simple), classroom explanations (Teacher &amp; Student), or large-print formats with high line height to prevent layout shifts (Elderly-Friendly), Clario scales perfectly to protect you.
              </p>
            </div>

            {/* Right Badge Grid (5 cols) */}
            <div className="lg:col-span-5 grid grid-cols-2 gap-4">
              <div className="bg-[#EFF6FF] border border-blue-100 p-5 rounded-xl flex flex-col gap-2 shadow-sm">
                <span className="text-base">👵</span>
                <span className="font-bold text-sm text-blue-900">Elderly Friendly</span>
                <p className="text-[11px] text-[#334155] font-semibold leading-relaxed">
                  Scaled typography, high contrast, and zero layout shifts.
                </p>
              </div>
              <div className="bg-[#F0FDFA] border border-teal-100 p-5 rounded-xl flex flex-col gap-2 shadow-sm">
                <span className="text-base">✨</span>
                <span className="font-bold text-sm text-[#0F766E]">Simple Mode</span>
                <p className="text-[11px] text-[#334155] font-semibold leading-relaxed">
                  Straightforward, everyday language devoid of jargon.
                </p>
              </div>
              <div className="bg-slate-50 border border-slate-100 p-5 rounded-xl flex flex-col gap-2 shadow-sm">
                <span className="text-base">🎓</span>
                <span className="font-bold text-sm text-[#0F172A]">Student Mode</span>
                <p className="text-[11px] text-[#334155] font-semibold leading-relaxed">
                  Summarized concepts perfect for study notes and exams.
                </p>
              </div>
              <div className="bg-slate-50 border border-slate-100 p-5 rounded-xl flex flex-col gap-2 shadow-sm">
                <span className="text-base">🏫</span>
                <span className="font-bold text-sm text-[#0F172A]">Teacher Mode</span>
                <p className="text-[11px] text-[#334155] font-semibold leading-relaxed">
                  Structured explanations suitable for direct instruction.
                </p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Signature Footer */}
      <SignatureFooter />

    </div>
  );
}
