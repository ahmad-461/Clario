"use client";

import React, { useState, useEffect, useRef } from "react";

export function ClarioHero() {
  const [sliderPos, setSliderPos] = useState(50); // slider position in percentage (0 to 100)
  const [isDragging, setIsDragging] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Detect prefers-reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  // Add pointer move/up event listeners to window during drag to ensure fluid tracking
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!isDragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setSliderPos(Math.round(percentage));
    };

    const handlePointerUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
    } else {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    }
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [isDragging]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (prefersReducedMotion) return;
    setIsDragging(true);
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setSliderPos(Math.round(percentage));
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (prefersReducedMotion) return;
    if (e.key === "ArrowLeft") {
      setSliderPos((prev) => Math.max(0, prev - 5));
      e.preventDefault();
    } else if (e.key === "ArrowRight") {
      setSliderPos((prev) => Math.min(100, prev + 5));
      e.preventDefault();
    } else if (e.key === "Home") {
      setSliderPos(0);
      e.preventDefault();
    } else if (e.key === "End") {
      setSliderPos(100);
      e.preventDefault();
    }
  };

  const scrollToTool = () => {
    const element = document.getElementById("workspace-tool");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
      // Move focus to input for absolute keyboard compatibility
      setTimeout(() => {
        const textarea = document.getElementById("inputText");
        const fileBtn = document.getElementById("fileInput");
        if (textarea) {
          textarea.focus();
        } else if (fileBtn) {
          fileBtn.focus();
        }
      }, 500);
    }
  };

  return (
    <section className="relative w-full py-12 md:py-20 flex flex-col items-center justify-center gap-10 overflow-hidden">
      {/* Visual background atmospheric elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#0D9488]/5 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#F0FDFA]/60 rounded-full blur-3xl -z-10" />

      {/* Hero Headings */}
      <div className="text-center space-y-4 max-w-3xl px-4 animate-fade-in">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-medium tracking-tight text-[#0F172A] leading-tight">
          Turn confusion into <span className="text-[#0D9488] font-semibold italic">plain language.</span>
        </h1>
        <p className="text-lg md:text-xl text-[#475569] font-medium max-w-2xl mx-auto leading-relaxed">
          Clario untangles dense fine print, confusing legal documents, and misleading messages—safeguarding you from manipulation and hidden scam risks.
        </p>
      </div>

      {/* Hero Visual Thesis (The Interactive Slider / Hover Transformation) */}
      <div className="w-full max-w-4xl px-4 flex flex-col items-center">
        {prefersReducedMotion ? (
          /* Reduced Motion Fallback: Gorgeous Static Side-by-Side Cards */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
            {/* Confusion card */}
            <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 md:p-8 shadow-md relative overflow-hidden flex flex-col gap-4">
              <span className="text-xs font-extrabold text-[#475569] tracking-widest uppercase">
                The Confusion (Original Legalese)
              </span>
              <div className="relative z-10 min-h-[120px]">
                <p className="text-[#475569] leading-relaxed text-sm font-semibold opacity-70 blur-[0.3px]">
                  Pursuant to Section 4(a)(i), the undersigned party hereby covenants to indemnify, defend, and hold harmless the obligee from any and all third-party claims, liabilities, demands, or obligations arising under or connected to this agreement...
                </p>
              </div>
              {/* Tangled SVG lines overlay */}
              <div className="absolute inset-0 pointer-events-none opacity-20">
                <svg className="w-full h-full" viewBox="0 0 400 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M 20 50 Q 80 150, 160 80 T 320 120" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M 40 120 C 120 40, 180 180, 240 100 S 360 160, 380 60" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <div className="pt-2 border-t border-[#E2E8F0]">
                <span className="text-xs font-bold text-red-900 bg-red-100/70 px-2.5 py-1 rounded-full">
                  ⚠️ Complex jargon &amp; indemnity risk
                </span>
              </div>
            </div>

            {/* Clarity card */}
            <div className="bg-[#F0FDFA] border-2 border-[#0D9488]/20 rounded-2xl p-6 md:p-8 shadow-md relative overflow-hidden flex flex-col gap-4">
              <span className="text-xs font-extrabold text-[#0F766E] tracking-widest uppercase">
                The Clarity (Clario Simplified)
              </span>
              <div className="relative z-10 min-h-[120px] flex items-center">
                <p className="text-[#0F766E] text-lg font-bold leading-relaxed">
                  &ldquo;We will protect and pay you back if someone else sues you over this agreement.&rdquo;
                </p>
              </div>
              {/* Straight SVG lines overlay */}
              <div className="absolute inset-0 pointer-events-none opacity-10">
                <svg className="w-full h-full" viewBox="0 0 400 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <line x1="20" y1="50" x2="380" y2="50" stroke="#0D9488" strokeWidth="2" strokeDasharray="4 4" />
                  <line x1="20" y1="100" x2="380" y2="100" stroke="#0D9488" strokeWidth="2" />
                  <line x1="20" y1="150" x2="380" y2="150" stroke="#0D9488" strokeWidth="2" strokeDasharray="4 4" />
                </svg>
              </div>
              <div className="pt-2 border-t border-[#0D9488]/10 flex items-center gap-2">
                <span className="text-xs font-bold text-[#0F766E] bg-teal-100/50 px-2.5 py-1 rounded-full">
                  ✅ 100% Plain Language
                </span>
                <span className="text-xs font-bold text-[#475569]">
                  In Elderly, Student, and Simple Modes
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* High-Fidelity Interactive Slider (Option C - Hybrid Fusion) */
          <div className="w-full">
            {/* Screen Reader instructions for keyboard accessibility */}
            <span id="slider-instructions" className="sr-only">
              Use the Left and Right Arrow keys to slide and reveal the plain language version of the text.
            </span>

            <div
              ref={containerRef}
              onPointerDown={handlePointerDown}
              className={`relative select-none overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-xl max-w-3xl w-full mx-auto min-h-[280px] md:min-h-[320px] transition duration-200 cursor-ew-resize ${
                isDragging ? "ring-2 ring-[#0D9488]" : ""
              }`}
            >
              {/* BASE LAYER: Clarity (Right Side Content, placed in right half) */}
              <div className="absolute inset-0 bg-[#F0FDFA] p-6 md:p-10 flex flex-col justify-between">
                <div className="ml-auto w-[45%] md:w-[48%] text-left">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-extrabold text-[#0F766E] tracking-widest uppercase">
                      Clario Translation
                    </span>
                    <span className="text-[10px] font-bold text-[#0F766E] bg-[#0D9488]/10 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                      <span className="h-1 w-1 rounded-full bg-[#0D9488] animate-pulse" />
                      Resolved Clarity
                    </span>
                  </div>

                  <div className="mt-4 md:mt-6">
                    <p className="text-[#0F766E] text-sm md:text-lg font-bold leading-relaxed font-sans">
                      &ldquo;We will protect and pay you back if someone else sues you over this agreement.&rdquo;
                    </p>
                  </div>
                </div>

                {/* Neat SVG tracks in background representing structured clarity */}
                <div className="absolute inset-0 pointer-events-none opacity-[0.12] z-0">
                  <svg className="w-full h-full" viewBox="0 0 600 300" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <line x1="50" y1="80" x2="550" y2="80" stroke="#0D9488" strokeWidth="4" />
                    <line x1="50" y1="150" x2="550" y2="150" stroke="#0D9488" strokeWidth="4" />
                    <line x1="50" y1="220" x2="550" y2="220" stroke="#0D9488" strokeWidth="4" />
                  </svg>
                </div>

                <div className="ml-auto w-[45%] md:w-[48%] pt-4 border-t border-[#0D9488]/10 flex items-center gap-3 z-10">
                  <span className="text-[10px] md:text-xs font-bold text-[#0F766E]">
                    Friendly, simple translation tailored to any audience tone.
                  </span>
                </div>
              </div>

              {/* OVERLAY LAYER: Confusion (Left Side Content, placed in left half, wiped away by clipPath) */}
              <div
                style={{
                  clipPath: `polygon(0 0, ${sliderPos}% 0, ${sliderPos}% 100%, 0 100%)`,
                }}
                className="absolute inset-0 bg-white p-6 md:p-10 flex flex-col justify-between pointer-events-none border-r border-[#E2E8F0]"
              >
                <div className="w-[45%] md:w-[48%] text-left">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-extrabold text-[#475569] tracking-widest uppercase">
                      Original Document
                    </span>
                    <span className="text-[10px] font-bold text-red-900 bg-red-100 px-2 py-0.5 rounded-full shrink-0">
                      ⚠️ Indemnity
                    </span>
                  </div>

                  <div className="mt-4 md:mt-6">
                    <p className="text-[#475569] text-xs md:text-sm leading-relaxed font-semibold opacity-60">
                      Pursuant to Section 4(a)(i), the undersigned party hereby covenants to indemnify, defend, and hold harmless the obligee from any and all third-party claims, liabilities, or demands arising under...
                    </p>
                  </div>
                </div>

                {/* Tangled SVG curves overlaying Confusion side */}
                <div className="absolute inset-0 pointer-events-none opacity-20 z-0">
                  <svg className="w-full h-full" viewBox="0 0 600 300" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M 60 150 C 60 40, 150 40, 190 150 C 230 260, 310 260, 310 150 C 310 40, 400 40, 440 150 C 480 260, 560 260, 560 150"
                      stroke="#0F172A"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 120 180 C 180 80, 240 280, 300 120 S 420 220, 500 80"
                      stroke="#0F172A"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 80 80 C 140 220, 280 40, 380 200 S 520 80, 540 240"
                      stroke="#0F172A"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>

                <div className="w-[45%] md:w-[48%] pt-4 border-t border-[#E2E8F0] flex items-center gap-3 z-10">
                  <span className="text-[10px] md:text-xs font-bold text-[#475569]">
                    Hover, drag, or use arrows to untangle this sentence.
                  </span>
                </div>
              </div>

              {/* SLIDER DIVISION BAR AND DRAGGABLE THUMB */}
              <div
                style={{ left: `${sliderPos}%` }}
                className="absolute top-0 bottom-0 w-1 bg-[#0D9488] -ml-0.5 flex items-center justify-center pointer-events-none z-30"
              >
                {/* Draggable Button Handle */}
                <button
                  type="button"
                  tabIndex={0}
                  onKeyDown={handleKeyDown}
                  aria-describedby="slider-instructions"
                  aria-label="Text untangling comparison slider"
                  aria-valuenow={sliderPos}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  role="slider"
                  className="w-12 h-12 rounded-full bg-[#0D9488] hover:bg-[#0F766E] border-4 border-white shadow-xl text-white flex items-center justify-center cursor-ew-resize pointer-events-auto select-none focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0D9488] focus:scale-105 active:scale-95 transition-all duration-150"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l-4 4m0 0l4 4m-4-4h16m-4-4l4 4m0 0l-4 4" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Slider status bar text */}
            <div className="text-center mt-3 text-xs text-[#475569] font-bold flex items-center justify-center gap-3">
              <span>Original Jargon ({sliderPos}%)</span>
              <span className="h-1.5 w-1.5 rounded-full bg-[#E2E8F0]" />
              <span>Simplified Clario ({100 - sliderPos}%)</span>
            </div>
          </div>
        )}
      </div>

      {/* Pulsing Downward Chevron Smooth Scroll Call to Action */}
      <button
        type="button"
        onClick={scrollToTool}
        className="group inline-flex flex-col items-center gap-2 mt-2 px-4 py-2 rounded-xl text-[#0F766E] hover:text-[#0D9488] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488] focus-visible:ring-offset-2"
        aria-label="Scroll down to simplifier tool"
      >
        <span className="text-xs font-extrabold tracking-widest uppercase">
          Try the Simplifier Tool
        </span>
        <svg
          className="h-6 w-6 animate-bounce text-[#0D9488] group-hover:scale-110 transition duration-150"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 13l-7 7-7-7m14-6l-7 7-7-7" />
        </svg>
      </button>
    </section>
  );
}
