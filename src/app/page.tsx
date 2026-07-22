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
  const [selectedTone, setSelectedTone] = useState("simple");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

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
      let textToCopy = explanation;
      if (riskLevel === "medium" || riskLevel === "high") {
        const formattedRisk = riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1);
        textToCopy = `Risk: ${formattedRisk}\nReason: ${riskReason}\n\nExplanation:\n${explanation}`;
      }
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
      {/* Container */}
      <div className="max-w-2xl w-full mx-auto px-4 py-8 md:py-16 flex flex-col gap-8">

        {/* Header Section */}
        <header className="text-center space-y-2">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[#0F172A]">
            Clario
          </h1>
          <p className="text-lg md:text-xl text-[#475569] font-medium">
            Confusing text, explained simply.
          </p>
        </header>

        {/* Form and Input Area */}
        <main className="w-full space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Tone Selector */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs font-semibold text-[#475569] uppercase tracking-wider">
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
                      className={`px-3.5 py-1.5 md:px-5 md:py-2 rounded-full text-xs md:text-sm font-bold transition-all duration-150 whitespace-nowrap ${
                        isActive
                          ? "bg-[#0D9488] text-white shadow-sm"
                          : "text-[#475569] hover:bg-[#F4F6F9] hover:text-[#0F172A] disabled:opacity-50"
                      }`}
                    >
                      {tone.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Input Card with Tabs */}
            <div className="relative bg-white rounded-2xl border border-[#E2E8F0] shadow-sm focus-within:ring-2 focus-within:ring-[#0D9488] focus-within:border-transparent transition duration-150 overflow-hidden">

              {/* Input Mode Tabs */}
              <div className="flex border-b border-[#E2E8F0]">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => {
                    setInputMode("text");
                    setError("");
                  }}
                  className={`flex-1 py-3 text-xs md:text-sm font-bold border-b-2 transition-all duration-150 rounded-tl-2xl flex items-center justify-center gap-1.5 ${
                    inputMode === "text"
                      ? "border-[#0D9488] text-[#0D9488] bg-[#F4F6F9]/30"
                      : "border-transparent text-[#475569] hover:text-[#0F172A] hover:bg-[#F4F6F9]/10"
                  }`}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
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
                  className={`flex-1 py-3 text-xs md:text-sm font-bold border-b-2 transition-all duration-150 rounded-tr-2xl flex items-center justify-center gap-1.5 ${
                    inputMode === "file"
                      ? "border-[#0D9488] text-[#0D9488] bg-[#F4F6F9]/30"
                      : "border-transparent text-[#475569] hover:text-[#0F172A] hover:bg-[#F4F6F9]/10"
                  }`}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
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
                    className="w-full min-h-[180px] md:min-h-[220px] p-5 text-base md:text-lg text-[#0F172A] placeholder-[#475569]/60 focus:outline-none resize-y bg-transparent border-none"
                    placeholder="Paste anything confusing — a letter, a message, a form, an assignment..."
                    maxLength={CHARACTER_LIMIT}
                    value={inputText}
                    onChange={handleInputChange}
                    disabled={isLoading}
                  />

                  {/* Textarea Bottom Control bar */}
                  <div className="flex justify-between items-center px-5 py-3 border-t border-[#E2E8F0] bg-[#F4F6F9]/50 text-sm text-[#475569]">
                    <span>
                      {inputText.length.toLocaleString()} / {CHARACTER_LIMIT.toLocaleString()} characters
                    </span>

                    {inputText.length > 0 && !isLoading && (
                      <button
                        type="button"
                        onClick={() => setInputText("")}
                        className="text-sm font-medium hover:text-[#0F172A] transition duration-150 animate-fade-in"
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
                          <div className="w-16 h-16 rounded-lg bg-[#E2E8F0] flex items-center justify-center shrink-0 text-[#475569]">
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
                          <p className="text-xs text-[#475569] font-medium mt-0.5">
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
                          className="p-1.5 rounded-lg text-[#475569] hover:bg-[#E2E8F0] hover:text-[#0F172A] transition duration-150 shrink-0"
                          aria-label="Remove file"
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
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
                      className={`p-6 md:p-10 flex flex-col items-center justify-center gap-3 min-h-[180px] md:min-h-[220px] cursor-pointer transition-all duration-150 ${
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
                        onChange={(e) => {
                          if (e.target.files && e.target.files.length > 0) {
                            handleFileSelection(e.target.files[0]);
                          }
                        }}
                        disabled={isLoading}
                      />
                      <div className={`p-4 rounded-full bg-[#F4F6F9] text-[#475569] transition duration-150 ${isDragging ? "scale-115 text-[#0D9488]" : ""}`}>
                        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                      </div>
                      <div className="text-center">
                        <p className="text-sm md:text-base font-bold text-[#0F172A]">
                          Drag & drop your file here
                        </p>
                        <p className="text-xs text-[#475569] font-medium mt-1">
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
                  <div className="flex justify-between items-center px-5 py-3 border-t border-[#E2E8F0] bg-[#F4F6F9]/50 text-sm text-[#475569]">
                    <span>
                      {selectedFile ? "1 file selected" : "No file selected"}
                    </span>

                    {selectedFile && !isLoading && (
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="text-sm font-medium hover:text-[#0F172A] transition duration-150 animate-fade-in"
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
                className="p-4 bg-[#FEF2F2] border border-[#991B1B]/10 rounded-xl flex flex-col gap-1 animate-fade-in"
              >
                <span className="text-sm font-bold text-[#991B1B]">Error</span>
                <p className="text-sm text-[#991B1B] font-medium">{error}</p>
              </div>
            )}

            {/* Action Submit Button */}
            <div className="flex justify-center">
              <button
                type="submit"
                disabled={isSubmitDisabled}
                className={`w-full sm:w-auto px-10 py-4 rounded-xl font-bold text-base shadow-sm transition duration-150 ${
                  isLoading
                    ? "bg-[#0D9488]/70 text-white cursor-not-allowed"
                    : isSubmitDisabled
                    ? "bg-[#E2E8F0] text-[#475569]/50 cursor-not-allowed shadow-none"
                    : "bg-[#0D9488] text-white hover:bg-[#0D9488]/90 focus:ring-2 focus:ring-offset-2 focus:ring-[#0D9488] active:scale-[0.98]"
                }`}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2 justify-center">
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
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

          {/* Result Card Display */}
          {explanation && (
            <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-md p-6 md:p-8 space-y-6 transition-all duration-300">

              {/* Header section with Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4">
                <h2 className="text-xl md:text-2xl font-bold text-[#0F172A]">
                  Simple Explanation
                </h2>

                {/* Actions: Copy */}
                <button
                  type="button"
                  onClick={handleCopy}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition duration-150 flex items-center gap-2 self-start sm:self-auto ${
                    copied
                      ? "bg-[#0D9488]/10 text-[#0D9488]"
                      : "bg-[#F4F6F9] text-[#475569] hover:bg-[#E2E8F0] hover:text-[#0F172A]"
                  }`}
                >
                  {copied ? (
                    <>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                      Copy
                    </>
                  )}
                </button>
              </div>

              {/* Risk Badge & Callout Section - Top of the card, above explanation text */}
              <div className="flex flex-col gap-3">
                {riskLevel === "low" && (
                  <div className="flex">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-[#ECFDF5] text-[#065F46] border border-[#065F46]/10">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#065F46]" />
                      No obvious risk detected
                    </span>
                  </div>
                )}

                {riskLevel === "medium" && (
                  <div className="space-y-2">
                    <div className="flex">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-[#FFFBEB] text-[#92400E] border border-[#92400E]/15">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#92400E]" />
                        Medium Risk
                      </span>
                    </div>
                    {riskReason && (
                      <div className="p-3.5 bg-[#FFFBEB] border border-[#92400E]/15 text-[#92400E] rounded-xl text-xs md:text-sm font-medium leading-relaxed">
                        {riskReason}
                      </div>
                    )}
                  </div>
                )}

                {riskLevel === "high" && (
                  <div className="space-y-2">
                    <div className="flex">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-[#FEF2F2] text-[#991B1B] border border-[#991B1B]/15">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#991B1B]" />
                        High Risk
                      </span>
                    </div>
                    {riskReason && (
                      <div className="p-3.5 bg-[#FEF2F2] border border-[#991B1B]/15 text-[#991B1B] rounded-xl text-xs md:text-sm font-medium leading-relaxed">
                        {riskReason}
                      </div>
                    )}
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
                  className="px-6 py-3 rounded-xl border border-[#E2E8F0] bg-white text-[#475569] hover:bg-[#F4F6F9] hover:text-[#0F172A] font-bold text-sm transition duration-150 active:scale-[0.98]"
                >
                  Try another
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
