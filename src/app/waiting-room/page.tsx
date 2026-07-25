"use client";

import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Header } from "../Header";
import { SignatureFooter } from "../SignatureFooter";
import { supabaseClient } from "@/lib/supabaseClient";
import { User } from "@supabase/supabase-js";
import { CHARACTER_LIMIT, FILE_SIZE_LIMIT_BYTES } from "@/lib/constants";

const TONES = [
  { id: "simple", label: "Simple" },
  { id: "student", label: "Student" },
  { id: "teacher", label: "Teacher" },
  { id: "elderly-friendly", label: "Elderly-friendly" },
];

interface WhatTheyAreNotTellingYouItem {
  category: "Stated" | "Implied" | "Worth verifying";
  text: string;
}

export default function WaitingRoomPage() {
  const [user, setUser] = useState<User | null>(null);

  const [inputMode, setInputMode] = useState<"text" | "file">("text");
  const [inputText, setInputText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pdfPageCount, setPdfPageCount] = useState<number | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [explanation, setExplanation] = useState(""); // Unified backup serialized markdown
  const [understandItText, setUnderstandItText] = useState("");
  const [whatMattersItems, setWhatMattersItems] = useState<string[]>([]);
  const [whatTheyAreNotTellingYouItems, setWhatTheyAreNotTellingYouItems] = useState<WhatTheyAreNotTellingYouItem[]>([]);

  const [riskLevel, setRiskLevel] = useState("");
  const [confidenceLevel, setConfidenceLevel] = useState("");
  const [confidenceNote, setConfidenceNote] = useState("");
  const [talkingPoints, setTalkingPoints] = useState<string[]>([]);
  const [showConfidenceExplanation, setShowConfidenceExplanation] = useState(false);
  const [selectedTone, setSelectedTone] = useState("simple");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Cleanup Preview URLs
  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
  };

  const handleFileSelection = async (file: File) => {
    setError("");
    setPdfPageCount(null);
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl(null);
    }

    if (file.size > FILE_SIZE_LIMIT_BYTES) {
      setError("The file is too large. Max file size is 5MB.");
      setSelectedFile(null);
      return;
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
      setError("Unsupported file format. Please upload a PDF or an image (JPG, PNG, WEBP) only.");
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);

    if (isPdf) {
      try {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result;
          if (result instanceof ArrayBuffer) {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
    setUnderstandItText("");
    setWhatMattersItems([]);
    setWhatTheyAreNotTellingYouItems([]);

    setRiskLevel("");
    setConfidenceLevel("");
    setConfidenceNote("");
    setTalkingPoints([]);
    setShowConfidenceExplanation(false);

    try {
      let body: BodyInit;
      const headers: Record<string, string> = {};

      if (inputMode === "file" && selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("tone", selectedTone);
        formData.append("companionMode", "true");
        body = formData;
      } else {
        headers["Content-Type"] = "application/json";
        body = JSON.stringify({ text: inputText, tone: selectedTone, companionMode: true });
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
      setUnderstandItText(data.understandIt);
      setWhatMattersItems(data.whatMatters || []);
      setWhatTheyAreNotTellingYouItems(data.whatTheyAreNotTellingYou || []);

      setRiskLevel(data.riskLevel || "low");
      setConfidenceLevel(data.confidenceLevel || "high");
      setConfidenceNote(data.confidenceNote || "");
      setTalkingPoints(data.talkingPoints || []);

      if (data.pdfPageCount !== undefined) {
        setPdfPageCount(data.pdfPageCount);
      }

      // Save to history in background if user is logged in
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
                risk_reason: null,
                manipulation_flags: null,
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

  const handleCopy = async () => {
    if (!explanation) return;
    try {
      let textToCopy = "";

      if (confidenceLevel) {
        const formattedConfidence = confidenceLevel.charAt(0).toUpperCase() + confidenceLevel.slice(1);
        textToCopy += `Confidence: ${formattedConfidence}\n`;
        if (confidenceLevel === "low" && confidenceNote) {
          textToCopy += `Note: ${confidenceNote}\n`;
        }
        textToCopy += `\n`;
      }

      if (riskLevel === "high") {
        textToCopy += `Status: Worth a Closer Look\n\n`;
      } else if (riskLevel === "medium") {
        textToCopy += `Status: Possible Concern\n\n`;
      } else {
        textToCopy += `Status: No obvious concerns detected\n\n`;
      }

      if (talkingPoints && talkingPoints.length > 0) {
        textToCopy += `Discussion Points:\n`;
        talkingPoints.forEach((point) => {
          textToCopy += `- ${point}\n`;
        });
        textToCopy += `\n`;
      }

      textToCopy += explanation;

      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const handleReset = () => {
    setInputText("");
    setSelectedFile(null);
    setPdfPageCount(null);
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl(null);
    }
    setExplanation("");
    setUnderstandItText("");
    setWhatMattersItems([]);
    setWhatTheyAreNotTellingYouItems([]);

    setRiskLevel("");
    setConfidenceLevel("");
    setConfidenceNote("");
    setTalkingPoints([]);
    setShowConfidenceExplanation(false);
    setError("");
    setIsLoading(false);
  };

  const renderExplanation = (text: string) => {
    const isElderly = selectedTone === "elderly-friendly";

    return (
      <div style={isElderly ? { fontSize: "18px", lineHeight: "1.6" } : undefined}>
        <ReactMarkdown
          components={{
            p: ({ children }) => (
              <p className="leading-relaxed mb-4 text-[#0F172A] font-medium">
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
              <li className="leading-relaxed font-semibold">
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

  const statedUntelling = whatTheyAreNotTellingYouItems.filter((item) => item.category === "Stated");
  const impliedUntelling = whatTheyAreNotTellingYouItems.filter((item) => item.category === "Implied");
  const verifyUntelling = whatTheyAreNotTellingYouItems.filter((item) => item.category === "Worth verifying");

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#0F172A] font-sans overflow-x-hidden relative">
      {/* Warm background atmosphere representing safety and relational calm */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#0D9488]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Hidden Print Template container for jsPDF + html2canvas */}
      {explanation && (
        <div
          id="clario-pdf-template"
          style={{
            position: "absolute",
            left: "-9999px",
            top: "-9999px",
            width: "800px",
            backgroundColor: "#FFFFFF",
            color: "#0F172A",
            padding: "40px",
            boxSizing: "border-box",
            fontFamily: "sans-serif",
            display: "none",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "2px solid #E2E8F0", paddingBottom: "20px", marginBottom: "30px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <svg style={{ height: "36px", width: "54px" }} viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M 6 18 C 6 10, 13 6, 17 6 C 23 6, 23 20, 17 20 C 13 20, 10 16, 10 12 C 10 8, 14 6, 18 8" stroke="#0F172A" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M 18 8 C 22 10, 26 24, 34 24 C 39 24, 42 18, 42 12" stroke="#0D9488" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="42" cy="12" r="3.2" fill="#0D9488" />
              </svg>
              <span style={{ fontSize: "28px", fontWeight: "600", color: "#0F172A", letterSpacing: "0.05em" }}>Clario</span>
            </div>
            <div style={{ fontSize: "14px", fontWeight: "700", color: "#475569" }}>
              Waiting Room Shared Session
            </div>
          </div>

          <div style={{ marginBottom: "24px" }}>
            <span style={{ fontSize: "12px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.1em", color: "#475569", display: "block", marginBottom: "4px" }}>
              Audience Tone Mode
            </span>
            <span style={{ fontSize: "18px", fontWeight: "800", color: "#0D9488" }}>
              {TONES.find((t) => t.id === selectedTone)?.label || "Simple"} Explanation
            </span>
          </div>

          {talkingPoints && talkingPoints.length > 0 && (
            <div style={{
              backgroundColor: "#FAF5F0",
              border: "1.5px solid #EBE3D5",
              borderRadius: "12px",
              padding: "20px",
              marginBottom: "30px",
            }}>
              <span style={{
                fontSize: "13px",
                fontWeight: "900",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "#78350F",
                display: "block",
                marginBottom: "8px"
              }}>
                Points to Discuss Together
              </span>
              <ul style={{
                fontSize: "15px",
                fontWeight: "700",
                lineHeight: "1.5",
                margin: "0",
                paddingLeft: "20px",
                color: "#78350F",
                listStyleType: "disc",
              }}>
                {talkingPoints.map((point, idx) => (
                  <li key={idx} style={{ marginBottom: "6px" }}>{point}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Section 1: Understand It */}
          <div style={{ marginBottom: "30px" }}>
            <span style={{ fontSize: "14px", fontWeight: "800", textTransform: "uppercase", color: "#0D9488", display: "block", marginBottom: "10px" }}>
              1. Understand It
            </span>
            <div style={{ fontSize: "16px", lineHeight: "1.6", color: "#0F172A" }}>
              <ReactMarkdown>{understandItText}</ReactMarkdown>
            </div>
          </div>

          {/* Section 2: What Matters */}
          {whatMattersItems.length > 0 && (
            <div style={{ marginBottom: "30px" }}>
              <span style={{ fontSize: "14px", fontWeight: "800", textTransform: "uppercase", color: "#0D9488", display: "block", marginBottom: "10px" }}>
                2. What Matters
              </span>
              <ul style={{ fontSize: "15px", lineHeight: "1.6", color: "#0F172A", listStyleType: "disc", paddingLeft: "20px" }}>
                {whatMattersItems.map((item, idx) => (
                  <li key={idx} style={{ marginBottom: "6px" }}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Section 3: What They're Not Telling You */}
          {whatTheyAreNotTellingYouItems.length > 0 && (
            <div style={{ marginBottom: "30px" }}>
              <span style={{ fontSize: "14px", fontWeight: "800", textTransform: "uppercase", color: "#0D9488", display: "block", marginBottom: "10px" }}>
                3. What They&apos;re Not Telling You
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {statedUntelling.length > 0 && (
                  <div>
                    <span style={{ fontSize: "13px", fontWeight: "800", color: "#475569", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>Stated:</span>
                    <ul style={{ fontSize: "14px", listStyleType: "disc", paddingLeft: "20px", color: "#334155" }}>
                      {statedUntelling.map((item, idx) => <li key={idx}>{item.text}</li>)}
                    </ul>
                  </div>
                )}
                {impliedUntelling.length > 0 && (
                  <div>
                    <span style={{ fontSize: "13px", fontWeight: "800", color: "#475569", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>Implied:</span>
                    <ul style={{ fontSize: "14px", listStyleType: "disc", paddingLeft: "20px", color: "#334155" }}>
                      {impliedUntelling.map((item, idx) => <li key={idx}>{item.text}</li>)}
                    </ul>
                  </div>
                )}
                {verifyUntelling.length > 0 && (
                  <div>
                    <span style={{ fontSize: "13px", fontWeight: "800", color: "#475569", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>Worth verifying:</span>
                    <ul style={{ fontSize: "14px", listStyleType: "disc", paddingLeft: "20px", color: "#334155" }}>
                      {verifyUntelling.map((item, idx) => <li key={idx}>{item.text}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Disclaimer Footnote */}
          <div style={{ marginTop: "30px", borderTop: "1px solid #E2E8F0", paddingTop: "15px", fontSize: "11px", color: "#64748B", fontStyle: "italic", textAlign: "center" }}>
            This is an AI-generated analysis, not a guarantee. Verify important information before making legal, financial, or personal decisions.
          </div>
        </div>
      )}

      {/* Navigation */}
      <Header onSessionChange={(currentUser) => setUser(currentUser)} currentPage="home" />

      {/* Warm Hero Header */}
      <section className="max-w-7xl w-full mx-auto px-6 md:px-12 lg:px-16 py-12 md:py-16 text-left relative z-10 border-b border-[#E2E8F0]/60">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 text-amber-900 rounded-full text-xs font-bold border border-amber-500/15 uppercase tracking-widest">
            <span>Companion Mode</span>
            <span className="h-1 w-1 rounded-full bg-amber-500" />
            <span>The Waiting Room</span>
          </div>
          <h1 className="font-display font-medium text-[#0F172A] leading-tight text-3xl md:text-5xl lg:text-6xl tracking-[-0.03em]">
            Let&apos;s understand it <span className="text-[#0D9488] italic font-semibold">together, before either of you decides.</span>
          </h1>
          <p className="text-base md:text-lg text-[#334155] font-semibold leading-relaxed max-w-2xl">
            This space is designed specifically for two people reading confusing documents at the same screen. One of you receives the text; one helps make sense of it—so you can protect each other and understand before anyone signs, clicks, or trusts. Clario frames everything in warm, cooperative language with talking points to guide your conversation.
          </p>
        </div>
      </section>

      {/* Workspace Grid */}
      <main className="max-w-7xl w-full mx-auto px-6 md:px-12 lg:px-16 py-12 md:py-16 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">

          {/* LEFT COLUMN: Input Area */}
          <div className="lg:col-span-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-extrabold text-[#475569] uppercase tracking-widest block">
                  Step 1 — Input Area
                </span>
                <h2 className="text-xl md:text-2xl font-display font-medium text-[#0F172A]">
                  What they received
                </h2>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Audience Tone Mode Selector */}
              <div className="flex flex-col items-start gap-3 bg-[#FAF5F0] border border-[#EBE3D5] p-4 rounded-2xl">
                <span className="text-xs font-bold text-[#78350F] uppercase tracking-widest">
                  Choose a tone that suits them best:
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
                        className={`px-4 py-2 rounded-full text-xs md:text-sm font-semibold transition-all duration-150 whitespace-nowrap focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0D9488] focus-visible:outline-none ${
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

              {/* Input Card Container */}
              <div className={`relative bg-white rounded-2xl border transition duration-300 overflow-hidden ${
                isLoading
                  ? "border-transparent ring-2 ring-[#0D9488] shadow-xl animate-pulse"
                  : "border-[#E2E8F0] shadow-md hover:shadow-lg focus-within:ring-2 focus-within:ring-[#0D9488] focus-within:border-transparent"
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

                  <div
                    className={`absolute bottom-0 left-0 h-0.5 w-1/2 bg-[#0D9488] transition-transform duration-300 ease-out z-20 ${
                      inputMode === "text" ? "translate-x-0" : "translate-x-full"
                    }`}
                  />
                </div>

                {/* Input Body */}
                {inputMode === "text" ? (
                  <>
                    <label htmlFor="inputText" className="sr-only">Confusing text input</label>
                    <textarea
                      id="inputText"
                      className="w-full min-h-[220px] p-6 text-base text-[#0F172A] placeholder-[#475569]/60 focus:outline-none resize-y bg-[#F4F6F9] shadow-inner border-none focus-visible:ring-0"
                      placeholder="Paste whatever message or document feels confusing or high-pressure here..."
                      maxLength={CHARACTER_LIMIT}
                      value={inputText}
                      onChange={handleInputChange}
                      disabled={isLoading}
                    />

                    <div className="flex justify-between items-center px-6 py-4 border-t border-[#E2E8F0] bg-[#F4F6F9] text-sm text-[#334155]">
                      <span className="font-semibold text-xs tracking-wider text-[#475569]">
                        {inputText.length.toLocaleString()} / {CHARACTER_LIMIT.toLocaleString()} characters
                      </span>

                      {inputText.length > 0 && !isLoading && (
                        <button
                          type="button"
                          onClick={() => setInputText("")}
                          className="text-xs font-bold text-[#0D9488] hover:text-[#0D9488]/80 transition duration-150 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0D9488] focus-visible:outline-none rounded uppercase tracking-wider"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    {selectedFile ? (
                      <div className="p-8 flex flex-col items-center justify-center gap-4 min-h-[220px] bg-[#F4F6F9] shadow-inner animate-fade-in">
                        <div className="flex items-center gap-4 p-4 bg-white border border-[#E2E8F0] rounded-xl w-full max-w-md shadow-sm">
                          {imagePreviewUrl ? (
                            <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-white border border-[#E2E8F0] shrink-0">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={imagePreviewUrl} alt="Upload preview" className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="w-16 h-16 rounded-lg bg-[#E2E8F0] flex items-center justify-center shrink-0 text-[#334155]" aria-hidden="true">
                              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}

                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-[#0F172A] truncate">{selectedFile.name}</p>
                            <p className="text-xs text-[#334155] font-semibold mt-0.5">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                            {pdfPageCount !== null && (
                              <p className="text-xs text-[#0D9488] font-bold mt-1">📄 {pdfPageCount} {pdfPageCount === 1 ? "page" : "pages"} detected</p>
                            )}
                          </div>

                          <button
                            type="button"
                            disabled={isLoading}
                            onClick={handleRemoveFile}
                            className="p-1.5 rounded-lg text-[#334155] hover:bg-[#E2E8F0] hover:text-[#0F172A] transition duration-150 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0D9488]"
                            aria-label="Remove file"
                          >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onDragOver={onDragOver}
                        onDragLeave={onDragLeave}
                        onDrop={onDrop}
                        tabIndex={0}
                        role="button"
                        aria-label="Upload a file. Supports PDF and Images up to 5MB."
                        onKeyDown={(e) => {
                          if (isLoading) return;
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            document.getElementById("fileInput")?.click();
                          }
                        }}
                        className={`p-8 md:p-12 flex flex-col items-center justify-center gap-3 min-h-[220px] cursor-pointer bg-[#F4F6F9] shadow-inner transition-all duration-150 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0D9488] focus-visible:outline-none ${
                          isDragging ? "border-2 border-dashed border-[#0D9488] bg-[#0D9488]/5 m-4 rounded-xl" : "hover:bg-[#E2E8F0]/30"
                        }`}
                        onClick={() => {
                          if (!isLoading) document.getElementById("fileInput")?.click();
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
                        <div className="p-4 rounded-full bg-[#F4F6F9] text-[#334155] shrink-0" aria-hidden="true">
                          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-bold text-[#0F172A]">Drag & drop your file here</p>
                          <p className="text-xs text-[#334155] font-semibold mt-1">Supports PDF, JPG, PNG, WEBP up to 5MB</p>
                          <p className="text-xs text-[#0D9488] font-bold mt-2 underline">Or browse files</p>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-center px-6 py-4 border-t border-[#E2E8F0] bg-[#F4F6F9] text-sm text-[#334155]">
                      <span className="font-semibold text-xs tracking-wider text-[#475569]">
                        {selectedFile ? "1 file selected" : "No file selected"}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {error && (
                <div role="alert" className="p-4 bg-[#FEF2F2] border border-[#7F1D1D]/15 rounded-xl flex flex-col gap-1 text-[#7F1D1D] animate-fade-in">
                  <span className="text-xs font-extrabold tracking-widest uppercase">Error</span>
                  <p className="text-sm font-semibold">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitDisabled}
                className={`w-full px-8 py-4 rounded-xl font-bold text-base shadow-md transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0D9488] focus-visible:outline-none active:scale-[0.98] ${
                  isLoading
                    ? "bg-[#0D9488] text-white cursor-not-allowed scale-[0.98]"
                    : isSubmitDisabled
                    ? "bg-[#0D9488]/10 text-[#0D9488]/40 border border-[#0D9488]/10 cursor-not-allowed shadow-none"
                    : "bg-[#0D9488] text-white hover:bg-[#0D9488]/90 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:hover:scale-[0.98] transition-transform"
                }`}
              >
                {isLoading ? "Analyzing together..." : "Explain this for both of us"}
              </button>
            </form>
          </div>

          {/* RIGHT COLUMN: Output Area */}
          <div className="lg:col-span-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-extrabold text-[#0F766E] uppercase tracking-widest block">
                  Step 2 — Explanation
                </span>
                <h2 className="text-xl md:text-2xl font-display font-medium text-[#0F172A]">
                  Let&apos;s understand it together
                </h2>
              </div>
            </div>

            {/* If loading skeleton */}
            {isLoading && (
              <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-md p-6 md:p-8 space-y-6 animate-pulse">
                <div className="h-6 bg-slate-200 rounded w-1/2" />
                <div className="h-10 bg-slate-100 rounded w-1/3" />
                <div className="space-y-3 pt-4">
                  <div className="h-4 bg-slate-200 rounded w-full" />
                  <div className="h-4 bg-slate-200 rounded w-11/12" />
                  <div className="h-4 bg-slate-200 rounded w-4/5" />
                </div>
              </div>
            )}

            {/* If empty placeholder */}
            {!explanation && !isLoading && (
              <div className="bg-[#FAF9F5] border border-dashed border-[#E2E8F0] rounded-2xl p-8 md:p-12 text-center min-h-[300px] flex flex-col items-center justify-center gap-4">
                <div className="p-4 bg-white rounded-full text-slate-400 shadow-sm">
                  <svg className="h-8 w-8 text-[#0D9488]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-display font-semibold text-lg text-slate-800">Ready to simplify</h3>
                  <p className="text-sm text-[#475569] font-medium leading-relaxed max-w-sm mt-1.5">
                    Your shared explanation and interactive conversation points will appear here as soon as you type or upload on the left.
                  </p>
                </div>
              </div>
            )}

            {/* Explanation Results */}
            {explanation && !isLoading && (
              <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-md p-6 md:p-8 space-y-6 animate-fade-in relative">

                {/* Header Action Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4">
                  <h3 className="text-lg md:text-xl font-bold text-[#0F172A] font-display">
                    Our Shared Explanation
                  </h3>

                  <div className="flex items-center gap-2">
                    {/* Save PDF */}
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

                          const originalStyle = element.style.display;
                          element.style.display = "block";

                          const canvas = await html2canvas(element, {
                            // @ts-expect-error - scale is supported but omitted in @types/html2canvas
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

                          const imgWidth = 210;
                          const pageHeight = 297;
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
                          pdf.save(`clario-waitingroom-${today}.pdf`);
                        } catch (err) {
                          console.error("PDF generation failed: ", err);
                        } finally {
                          setIsGeneratingPdf(false);
                        }
                      }}
                      className="px-3 py-1.5 bg-[#F4F6F9] hover:bg-[#E2E8F0] text-[#334155] hover:text-[#0F172A] rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                    >
                      {isGeneratingPdf ? "..." : "Save PDF"}
                    </button>

                    {/* Copy */}
                    <button
                      type="button"
                      onClick={handleCopy}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                        copied
                          ? "bg-[#0D9488]/10 text-[#0D9488]"
                          : "bg-[#F4F6F9] hover:bg-[#E2E8F0] text-[#334155] hover:text-[#0F172A]"
                      }`}
                    >
                      {copied ? "Copied!" : "Copy Session"}
                    </button>
                  </div>
                </div>

                {/* Badge Lists */}
                <div className="flex flex-wrap gap-2 items-center">
                  {confidenceLevel === "high" && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-extrabold bg-[#EFF6FF] text-[#1E40AF] border border-[#1E40AF]/15 uppercase tracking-wide">
                      High Confidence
                      {confidenceNote && (
                        <button
                          type="button"
                          onClick={() => setShowConfidenceExplanation(!showConfidenceExplanation)}
                          className="ml-1 text-[10px] underline font-bold hover:text-[#1E40AF]/80"
                        >
                          (why?)
                        </button>
                      )}
                    </span>
                  )}
                  {confidenceLevel === "medium" && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-extrabold bg-[#F1F5F9] text-[#475569] border border-[#475569]/15 uppercase tracking-wide">
                      Medium Confidence
                      {confidenceNote && (
                        <button
                          type="button"
                          onClick={() => setShowConfidenceExplanation(!showConfidenceExplanation)}
                          className="ml-1 text-[10px] underline font-bold hover:text-[#475569]/80"
                        >
                          (why?)
                        </button>
                      )}
                    </span>
                  )}
                  {confidenceLevel === "low" && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-[#FFF7ED] text-[#9A3412] border border-[#9A3412]/15 uppercase tracking-wide">
                      Low Confidence
                    </span>
                  )}

                  {riskLevel === "low" && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-[#E6F4EA] text-[#0F766E] border border-[#0D9488]/10 uppercase tracking-wide">
                      No obvious concerns detected
                    </span>
                  )}
                  {riskLevel === "medium" && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-[#FEF7E0] text-[#78350F] border border-[#78350F]/15 uppercase tracking-wide">
                      Possible Concern
                    </span>
                  )}
                  {riskLevel === "high" && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-[#FCE8E6] text-[#7F1D1D] border border-[#7F1D1D]/15 uppercase tracking-wide">
                      Worth a Closer Look
                    </span>
                  )}
                </div>

                {/* Show confidence explanation */}
                {showConfidenceExplanation && (confidenceLevel === "high" || confidenceLevel === "medium") && confidenceNote && (
                  <div className="p-4 bg-blue-50/50 border border-blue-100 text-[#334155] rounded-xl text-xs font-semibold leading-relaxed animate-fade-in">
                    {confidenceNote}
                  </div>
                )}

                {/* Low Confidence warning */}
                {confidenceLevel === "low" && confidenceNote && (
                  <div className="p-4 bg-[#FFF7ED] border border-[#9A3412]/15 text-[#9A3412] rounded-xl text-xs md:text-sm font-semibold leading-relaxed">
                    {confidenceNote}
                  </div>
                )}

                {/* DISTINGUISHING INTERACTIVE ELEMENT: Talking Points callout block */}
                {talkingPoints && talkingPoints.length > 0 && (
                  <div className="p-6 bg-[#FAF5F0] border border-[#EBE3D5] rounded-xl space-y-3 shadow-inner">
                    <span className="text-[11px] font-bold text-[#78350F] uppercase tracking-widest block">
                      🗣️ Talking Points — Discuss these together:
                    </span>
                    <ul className="space-y-3">
                      {talkingPoints.map((point, pointIdx) => (
                        <li key={pointIdx} className="text-sm text-[#78350F] font-bold leading-relaxed border-l-2 border-[#78350F]/20 pl-3">
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* THREE-LAYER ANALYSIS VISUALS */}
                <div className="space-y-8 text-left pt-4 border-t border-[#E2E8F0]">
                  {/* Layer 1: Understand It */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-[#0D9488] uppercase tracking-widest block border-b border-[#E2E8F0] pb-2">
                      1. Understand It
                    </h3>
                    <div className="prose max-w-none">
                      {renderExplanation(understandItText)}
                    </div>
                  </div>

                  {/* Layer 2: What Matters */}
                  {whatMattersItems.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold text-[#0D9488] uppercase tracking-widest block border-b border-[#E2E8F0] pb-2">
                        2. What Matters
                      </h3>
                      <ul className="list-disc pl-5 space-y-2 text-sm md:text-base font-semibold text-slate-800">
                        {whatMattersItems.map((item, idx) => (
                          <li key={idx} className="leading-relaxed">{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Layer 3: What They're Not Telling You */}
                  {whatTheyAreNotTellingYouItems.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold text-[#0D9488] uppercase tracking-widest block border-b border-[#E2E8F0] pb-2">
                        3. What They&apos;re Not Telling You
                      </h3>

                      <div className="grid grid-cols-1 gap-4">
                        {statedUntelling.length > 0 && (
                          <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-2">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">Stated:</span>
                            <ul className="list-disc pl-5 space-y-1.5 text-xs md:text-sm font-semibold text-slate-700">
                              {statedUntelling.map((item, idx) => (
                                <li key={idx} className="leading-relaxed">{item.text}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {impliedUntelling.length > 0 && (
                          <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-2">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">Implied:</span>
                            <ul className="list-disc pl-5 space-y-1.5 text-xs md:text-sm font-semibold text-slate-700">
                              {impliedUntelling.map((item, idx) => (
                                <li key={idx} className="leading-relaxed">{item.text}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {verifyUntelling.length > 0 && (
                          <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-2">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">Worth verifying:</span>
                            <ul className="list-disc pl-5 space-y-1.5 text-xs md:text-sm font-semibold text-slate-700">
                              {verifyUntelling.map((item, idx) => (
                                <li key={idx} className="leading-relaxed">{item.text}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footnote disclaimer */}
                <div className="text-[11px] text-slate-500 text-center italic leading-relaxed pt-2">
                  This is an AI-generated analysis, not a guarantee. Verify important information before making legal, financial, or personal decisions.
                </div>

                {/* Reset button */}
                <div className="pt-4 border-t border-[#E2E8F0] flex justify-end">
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-6 py-2.5 rounded-xl border border-[#E2E8F0] bg-white text-[#334155] hover:bg-[#F4F6F9] hover:text-[#0F172A] font-bold text-sm transition duration-150"
                  >
                    Try another together
                  </button>
                </div>

              </div>
            )}
          </div>

        </div>
      </main>

      {/* Footer */}
      <SignatureFooter />
    </div>
  );
}
