"use client";

import React, { useState, useEffect } from "react";

const TONES = [
  { id: "simple", label: "Simple" },
  { id: "student", label: "Student" },
  { id: "teacher", label: "Teacher" },
  { id: "elderly-friendly", label: "Elderly-friendly" },
];

export default function Home() {
  const [inputMode, setInputMode] = useState<"text" | "file">("text");
  const [inputText, setInputText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pdfPageCount, setPdfPageCount] = useState<number | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [explanation, setExplanation] = useState("");
  const [riskLevel, setRiskLevel] = useState("");
  const [riskReason, setRiskReason] = useState("");
  const [manipulationFlags, setManipulationFlags] = useState<string[]>([]);
  const [confidenceLevel, setConfidenceLevel] = useState("");
  const [confidenceNote, setConfidenceNote] = useState("");
  const [showConfidenceExplanation, setShowConfidenceExplanation] = useState(false);
  const [selectedTone, setSelectedTone] = useState("simple");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

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

  // Handle Input Change
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
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

    const canSubmit = inputMode === "text" ? inputText.trim() : selectedFile;
    if (!canSubmit) return;

    setIsLoading(true);
    setError("");
    setExplanation("");
    setRiskLevel("");
    setRiskReason("");
    setManipulationFlags([]);
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
      setConfidenceLevel(data.confidenceLevel || "high");
      setConfidenceNote(data.confidenceNote || "");

      if (data.pdfPageCount !== undefined) {
        setPdfPageCount(data.pdfPageCount);
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
    setInputText("");
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
    setConfidenceLevel("");
    setConfidenceNote("");
    setShowConfidenceExplanation(false);
    setError("");
    setIsLoading(false);
  };

  // Custom text renderer to format bullet points and paragraphs securely
  const renderExplanation = (text: string) => {
    const blocks = text.split(/\n\s*\n/);
    const isElderly = selectedTone === "elderly-friendly";

    return blocks.map((block, index) => {
      const trimmed = block.trim();
      if (!trimmed) return null;

      const lines = trimmed.split("\n");

      // Determine if this block is a list
      const isList = lines.every((line) => {
        const lineTrimmed = line.trim();
        return (
          lineTrimmed.startsWith("*") ||
          lineTrimmed.startsWith("-") ||
          /^\d+\./.test(lineTrimmed)
        );
      });

      if (isList) {
        return (
          <ul
            key={index}
            className={`list-disc pl-6 mb-4 space-y-2 text-[#0F172A]`}
            style={isElderly ? { fontSize: "18px", lineHeight: "1.6" } : undefined}
          >
            {lines.map((line, lIndex) => {
              const content = line.replace(/^[\s*-]+|^\d+\.\s*/, "").trim();
              return (
                <li key={lIndex} className="leading-relaxed">
                  {content}
                </li>
              );
            })}
          </ul>
        );
      }

      return (
        <p
          key={index}
          className={`leading-relaxed mb-4 text-[#0F172A]`}
          style={isElderly ? { fontSize: "18px", lineHeight: "1.6" } : undefined}
        >
          {trimmed}
        </p>
      );
    });
  };

  const isSubmitDisabled =
    isLoading ||
    (inputMode === "text" ? !inputText.trim() : !selectedFile);

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-[#0F172A] font-sans transition-colors duration-200">
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
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <svg
                style={{ height: "36px", width: "36px", color: "#0D9488" }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                />
              </svg>
              <span style={{ fontSize: "28px", fontWeight: "900", color: "#0F172A", letterSpacing: "-0.05em" }}>Clario</span>
            </div>
            <div style={{ fontSize: "14px", fontWeight: "700", color: "#475569" }}>
              Date: {new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
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
              {explanation.split(/\n\s*\n/).map((block, index) => {
                const trimmed = block.trim();
                if (!trimmed) return null;

                const lines = trimmed.split("\n");
                const isList = lines.every((line) => {
                  const lineTrimmed = line.trim();
                  return (
                    lineTrimmed.startsWith("*") ||
                    lineTrimmed.startsWith("-") ||
                    /^\d+\./.test(lineTrimmed)
                  );
                });

                if (isList) {
                  return (
                    <ul key={index} style={{ paddingLeft: "30px", listStyleType: "disc", marginBottom: "20px" }}>
                      {lines.map((line, lIndex) => {
                        const content = line.replace(/^[\s*-]+|^\d+\.\s*/, "").trim();
                        return (
                          <li key={lIndex} style={{ marginBottom: "8px" }}>
                            {content}
                          </li>
                        );
                      })}
                    </ul>
                  );
                }

                return (
                  <p key={index} style={{ marginBottom: "20px" }}>
                    {trimmed}
                  </p>
                );
              })}
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

      {/* Container */}
      <div className="max-w-2xl w-full mx-auto px-4 py-8 md:py-16 flex flex-col gap-8">

        {/* Header Section */}
        <header className="text-center space-y-3">
          <div className="flex items-center justify-center gap-2.5">
            <svg
              className="h-9 w-9 text-[#0D9488]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="1.75"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
              />
            </svg>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-[#0F172A]">
              Clario
            </h1>
          </div>
          <p className="text-lg md:text-xl text-[#334155] font-semibold max-w-md mx-auto leading-relaxed">
            Confusing documents and complex text, explained simply.
          </p>
        </header>

        {/* Form and Input Area */}
        <main className="w-full space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Tone Selector */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs font-semibold text-[#334155] uppercase tracking-wider">
                Audience Tone
              </span>
              <div className="inline-flex p-1 bg-white border border-[#E2E8F0] rounded-full shadow-sm gap-1 max-w-full overflow-x-auto scrollbar-none">
                {TONES.map((tone) => {
                  const isActive = selectedTone === tone.id;
                  return (
                    <button
                      key={tone.id}
                      type="button"
                      disabled={isLoading}
                      onClick={() => setSelectedTone(tone.id)}
                      className={`px-3.5 py-1.5 md:px-5 md:py-2 rounded-full text-xs md:text-sm font-bold transition-all duration-150 whitespace-nowrap focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0D9488] focus-visible:outline-none ${
                        isActive
                          ? "bg-[#0D9488] text-white shadow-sm"
                          : "text-[#334155] hover:bg-[#F4F6F9] hover:text-[#0F172A] disabled:opacity-50"
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
                ? "border-transparent ring-2 ring-[#0D9488] shadow-md animate-pulse"
                : "border-[#E2E8F0] shadow-sm focus-within:ring-2 focus-within:ring-[#0D9488] focus-within:border-transparent"
            }`}>

              {/* Input Mode Tabs */}
              <div className="flex border-b border-[#E2E8F0]">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => {
                    setInputMode("text");
                    setError("");
                  }}
                  className={`flex-1 py-3 text-xs md:text-sm font-bold border-b-2 transition-all duration-150 rounded-tl-2xl flex items-center justify-center gap-1.5 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0D9488] focus-visible:outline-none ${
                    inputMode === "text"
                      ? "border-[#0D9488] text-[#0D9488] bg-[#F4F6F9]/30"
                      : "border-transparent text-[#334155] hover:text-[#0F172A] hover:bg-[#F4F6F9]/10"
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
                  className={`flex-1 py-3 text-xs md:text-sm font-bold border-b-2 transition-all duration-150 rounded-tr-2xl flex items-center justify-center gap-1.5 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0D9488] focus-visible:outline-none ${
                    inputMode === "file"
                      ? "border-[#0D9488] text-[#0D9488] bg-[#F4F6F9]/30"
                      : "border-transparent text-[#334155] hover:text-[#0F172A] hover:bg-[#F4F6F9]/10"
                  }`}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Upload File
                </button>
              </div>

              {/* Dynamic Content Body */}
              {inputMode === "text" ? (
                <>
                  <label htmlFor="inputText" className="sr-only">
                    Confusing text input
                  </label>
                  <textarea
                    id="inputText"
                    className="w-full min-h-[180px] md:min-h-[220px] p-5 text-base md:text-lg text-[#0F172A] placeholder-[#334155]/70 focus:outline-none resize-y bg-transparent border-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0D9488]"
                    placeholder="Paste anything confusing — a letter, a message, a form, an assignment..."
                    maxLength={CHARACTER_LIMIT}
                    value={inputText}
                    onChange={handleInputChange}
                    disabled={isLoading}
                  />

                  {/* Textarea Bottom Control bar */}
                  <div className="flex justify-between items-center px-5 py-3 border-t border-[#E2E8F0] bg-[#F4F6F9]/50 text-sm text-[#334155]">
                    <span>
                      {inputText.length.toLocaleString()} / {CHARACTER_LIMIT.toLocaleString()} characters
                    </span>

                    {inputText.length > 0 && !isLoading && (
                      <button
                        type="button"
                        onClick={() => setInputText("")}
                        className="text-sm font-bold text-[#0D9488] hover:text-[#0D9488]/80 transition duration-150 animate-fade-in focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0D9488] focus-visible:outline-none rounded"
                      >
                        Clear Input
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* File Upload / Preview Mode */}
                  {selectedFile ? (
                    /* File Preview State */
                    <div className="p-6 flex flex-col items-center justify-center gap-4 min-h-[180px] md:min-h-[220px] bg-transparent">
                      <div className="flex items-center gap-4 p-4 bg-[#F4F6F9] border border-[#E2E8F0] rounded-xl w-full max-w-md shadow-sm">

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
                            {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
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
                      className={`p-6 md:p-10 flex flex-col items-center justify-center gap-3 min-h-[180px] md:min-h-[220px] cursor-pointer transition-all duration-150 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0D9488] focus-visible:outline-none focus-visible:bg-[#F4F6F9]/50 ${
                        isDragging
                          ? "border-2 border-dashed border-[#0D9488] bg-[#0D9488]/5 m-4 rounded-xl"
                          : "border-none hover:bg-[#F4F6F9]/50"
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
                  <div className="flex justify-between items-center px-5 py-3 border-t border-[#E2E8F0] bg-[#F4F6F9]/50 text-sm text-[#334155]">
                    <span>
                      {selectedFile ? "1 file selected" : "No file selected"}
                    </span>

                    {selectedFile && !isLoading && (
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="text-sm font-bold text-[#0D9488] hover:text-[#0D9488]/80 transition duration-150 animate-fade-in focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0D9488] focus-visible:outline-none rounded"
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
            <div className="flex justify-center">
              <button
                type="submit"
                disabled={isSubmitDisabled}
                className={`w-full sm:w-auto px-10 py-4 rounded-xl font-bold text-base shadow-md transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0D9488] focus-visible:outline-none ${
                  isLoading
                    ? "bg-[#0D9488] text-white cursor-not-allowed scale-[0.98]"
                    : isSubmitDisabled
                    ? "bg-[#E2E8F0] text-[#334155]/50 cursor-not-allowed shadow-none"
                    : "bg-[#0D9488] text-white hover:bg-[#0D9488]/90 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]"
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
            <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-md p-6 md:p-8 space-y-6 transition-all duration-300 animate-fade-in">

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
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                        </svg>
                        Copy Explanation
                      </>
                    )}
                  </button>
                </div>
              </div>

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
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold bg-[#FEF7E0] text-[#B06000] border border-[#B06000]/15 uppercase tracking-wide">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#B06000]" />
                      Medium Risk
                    </span>
                  )}

                  {riskLevel === "high" && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold bg-[#FCE8E6] text-[#C5221F] border border-[#C5221F]/15 uppercase tracking-wide animate-pulse">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#C5221F]" />
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
                      Observed Patterns:
                    </p>
                    <ul className="list-disc pl-5 space-y-1">
                      {manipulationFlags.map((flag, flagIdx) => (
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

        {/* How it works / About box */}
        <section className="bg-white border border-[#E2E8F0] rounded-2xl p-6 md:p-8 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
            <svg
              className="h-5 w-5 text-[#0D9488]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.25"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.25 11.25l.041-.02a.75.75 0 111.084 1.085l-.26.26m0 0a1.5 1.5 0 10-2.23 2.23l.26-.26m0 0V15.75m1.125-12.75h7.5c.621 0 1.125.504 1.125 1.125v15c0 .621-.504 1.125-1.125 1.125h-15A1.125 1.125 0 013 18.75v-15c0-.621.504-1.125 1.125-1.125h7.5"
              />
            </svg>
            How it works & Privacy
          </h2>
          <p className="text-[#334155] text-sm md:text-base leading-relaxed font-medium">
            Clario is a secure, compassionate reading assistant designed to turn confusing documents into plain language. Your privacy is our priority: we only log anonymous usage metrics, and your text, documents, or personal data are never saved or stored. Simply paste text, drag in a document, or snap a photo to begin.
          </p>
        </section>

        {/* Footer Section */}
        <footer className="text-center pt-4 border-t border-[#E2E8F0] space-y-1">
          <p className="text-sm font-bold text-[#0F172A]">
            Clario
          </p>
          <p className="text-xs text-[#334155] font-semibold">
            Empowering reading with clarity, compassion, and absolute privacy.
          </p>
        </footer>

      </div>
    </div>
  );
}
