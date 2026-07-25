"use client";

import React, { useState, useEffect, useRef } from "react";
import { Header } from "../Header";
import { SignatureFooter } from "../SignatureFooter";

interface StatItem {
  count: number;
  pct: number;
}

interface StatGroup {
  total: number;
  risk: {
    low: StatItem;
    medium: StatItem;
    high: StatItem;
  };
  tone: {
    simple: StatItem;
    student: StatItem;
    teacher: StatItem;
    elderly: StatItem;
  };
  inputType: {
    text: StatItem;
    pdf: StatItem;
    image: StatItem;
  };
}

interface StatsResponse {
  allTime: StatGroup;
  thisWeek: StatGroup;
  isRealData: boolean;
}

function AnimatedCount({ value }: { value: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const start = count;
    const end = value;
    if (start === end) return;

    const duration = 1000; // ms
    const startTime = performance.now();

    let animationFrameId: number;

    const updateCount = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const easeOutQuad = (t: number) => t * (2 - t);
      const current = Math.floor(start + (end - start) * easeOutQuad(progress));

      setCount(current);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(updateCount);
      } else {
        setCount(end);
      }
    };

    animationFrameId = requestAnimationFrame(updateCount);

    return () => cancelAnimationFrame(animationFrameId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <>{count.toLocaleString()}</>;
}

export default function UntangleLogPage() {
  const [activeTab, setActiveTab] = useState<"allTime" | "thisWeek">("allTime");
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [isIntersecting, setIsIntersecting] = useState<boolean>(false);
  const [pathLength, setPathLength] = useState<number>(0);

  const pathRef = useRef<SVGPathElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch aggregate stats on mount
  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        const res = await fetch("/api/untangle-log");
        if (!res.ok) {
          throw new Error("Failed to load statistics from API.");
        }
        const data = await res.json();
        setStats(data);
      } catch (err: unknown) {
        console.error("Failed to load untangle log stats:", err);
        setError("We had trouble loading the transparency data. Please refresh in a moment.");
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  // Measure path length dynamically for animation
  useEffect(() => {
    if (pathRef.current) {
      try {
        setPathLength(pathRef.current.getTotalLength());
      } catch (err) {
        console.error("Failed to measure SVG path length:", err);
        setPathLength(1400); // Robust fallback length
      }
    }
  }, [loading, activeTab]); // Measure after content has loaded or tab changed

  // Setup intersection observer or motion preferences for the SVG animation
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) {
      setIsIntersecting(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = containerRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
      observer.disconnect();
    };
  }, [loading]);

  const activeStats = stats ? stats[activeTab] : null;

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-[#0F172A] font-sans flex flex-col relative overflow-x-hidden">
      {/* Background Atmosphere - elegant, calm */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#0D9488]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <Header currentPage="home" />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 md:px-12 lg:px-16 py-12 md:py-16 space-y-12 relative z-10">

        {/* Tightened Editorial Title & Philosophy Statement */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start border-b border-[#E2E8F0]/60 pb-8">
          <div className="lg:col-span-7 space-y-4 text-left">
            <span className="text-xs font-bold text-[#0D9488] uppercase tracking-widest block">
              Transparency Report
            </span>
            <h1 className="font-display font-medium text-[#0F172A] leading-tight text-3xl md:text-5xl tracking-[-0.03em]">
              The Untangle Log
            </h1>
            <p className="font-display font-medium text-[#334155] leading-relaxed text-lg italic">
              &ldquo;Every number here represents a moment where someone chose to understand before they signed, clicked, or trusted.&rdquo;
            </p>
          </div>

          <div className="lg:col-span-5 text-left lg:border-l lg:border-[#E2E8F0] lg:pl-6 space-y-2.5">
            <span className="text-xs font-bold text-[#475569] uppercase tracking-wider block">
              Privacy-first by design
            </span>
            <p className="text-xs text-[#334155] font-semibold leading-relaxed">
              Privacy-first by design. Clario processes text and files in real-time. For guest sessions, no raw text or file contents are ever stored or saved. We record only anonymous, high-level metadata to measure our direct impact in helping people understand before they decide.
            </p>
          </div>
        </div>

        {/* Tab Selector & Status row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/60 p-4 rounded-2xl border border-[#E2E8F0]/60 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-[#334155] uppercase tracking-widest whitespace-nowrap">
              Reporting:
            </span>
            <div className="inline-flex p-1 bg-[#F4F6F9] border border-[#E2E8F0] rounded-full shadow-inner gap-1">
              <button
                type="button"
                onClick={() => setActiveTab("allTime")}
                className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488] ${
                  activeTab === "allTime"
                    ? "bg-[#0D9488] text-white shadow border border-[#0F766E]/10"
                    : "text-[#334155] hover:text-[#0F172A]"
                }`}
              >
                All-Time Total
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("thisWeek")}
                className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488] ${
                  activeTab === "thisWeek"
                    ? "bg-[#0D9488] text-white shadow border border-[#0F766E]/10"
                    : "text-[#334155] hover:text-[#0F172A]"
                }`}
              >
                This Week
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-[#475569] bg-white border border-[#E2E8F0] px-3.5 py-1.5 rounded-xl shadow-sm self-start sm:self-auto">
            <span className={`h-1.5 w-1.5 rounded-full ${stats?.isRealData ? "bg-emerald-500" : "bg-slate-400"} animate-pulse`} />
            <span>
              {stats?.isRealData
                ? "Live from Supabase metrics"
                : "Sample benchmark data — live connection offline"}
            </span>
          </div>
        </div>

        {/* Error Handling */}
        {error && (
          <div role="alert" className="p-4 bg-[#FEF2F2] border border-[#7F1D1D]/15 rounded-xl flex flex-col gap-1 text-[#7F1D1D] animate-fade-in">
            <span className="text-xs font-extrabold tracking-widest uppercase">Error</span>
            <p className="text-sm font-semibold">{error}</p>
          </div>
        )}

        {/* Loading / Content Grid */}
        {loading ? (
          <div className="h-[240px] bg-white rounded-2xl border border-[#E2E8F0] shadow-md animate-pulse flex items-center justify-center text-slate-400 font-bold">
            Calculating impact data...
          </div>
        ) : (
          activeStats && (
            <div ref={containerRef} className="space-y-12">

              {/* DESKTOP SIGNATURE HERO MOMENT */}
              <div className="hidden lg:block relative bg-[#F4F6F9] border border-[#E2E8F0] rounded-3xl p-8 overflow-hidden min-h-[220px] shadow-sm select-none">
                {/* SVG Untangled Line */}
                <div className="absolute inset-0 w-full h-full pointer-events-none z-0">
                  <svg
                    className="w-full h-full"
                    viewBox="0 0 1200 200"
                    preserveAspectRatio="none"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <defs>
                      <linearGradient id="signatureLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#0F172A" />
                        <stop offset="60%" stopColor="#0F172A" />
                        <stop offset="60%" stopColor="#0D9488" />
                        <stop offset="100%" stopColor="#0D9488" />
                      </linearGradient>
                    </defs>
                    <path
                      ref={pathRef}
                      d="M 0 100 C 150 40, 250 160, 350 70 C 450 160, 500 40, 600 100 L 1200 100"
                      stroke="url(#signatureLineGradient)"
                      strokeWidth="5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      key={activeTab}
                      style={{
                        strokeDasharray: pathLength || 1400,
                        strokeDashoffset: isIntersecting ? 0 : (pathLength || 1400),
                        transition: "stroke-dashoffset 2.5s cubic-bezier(0.25, 1, 0.5, 1)",
                      }}
                    />
                  </svg>
                </div>

                {/* Overlaid Live Count text box intersecting the straight segment */}
                <div className="absolute left-[62%] top-1/2 -translate-y-1/2 z-10 bg-[#F4F6F9] border border-[#E2E8F0] px-8 py-4 rounded-2xl shadow-md select-none flex items-center gap-4 border-l-4 border-l-[#0D9488] animate-fade-in animate-duration-300">
                  <span className="font-display font-medium text-6xl xl:text-7xl text-[#0F172A] tracking-[-0.04em] leading-none">
                    <AnimatedCount value={activeStats.total} />
                  </span>
                  <div className="text-left">
                    <span className="text-[10px] font-bold text-[#475569] uppercase tracking-widest block">
                      Documents
                    </span>
                    <span className="text-xs font-bold text-[#0D9488] uppercase tracking-widest block leading-tight">
                      Untangled
                    </span>
                  </div>
                </div>
              </div>

              {/* MOBILE/TABLET SIGNATURE MOMENT FALLBACK */}
              <div className="block lg:hidden bg-white border border-[#E2E8F0] rounded-2xl p-6 text-center shadow-md space-y-4">
                <div className="w-full h-[60px] relative">
                  <svg
                    className="w-full h-full"
                    viewBox="0 0 400 60"
                    preserveAspectRatio="none"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      d="M 10 30 L 390 30"
                      stroke="#0D9488"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray="4 4"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center bg-white px-4 mx-auto w-fit text-[11px] font-extrabold text-[#0D9488] uppercase tracking-widest">
                    Live Total count
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="block font-display font-medium text-5xl md:text-6xl text-[#0F172A] tracking-tight">
                    <AnimatedCount value={activeStats.total} />
                  </span>
                  <span className="block text-xs font-extrabold text-[#475569] uppercase tracking-widest">
                    Confusing documents untangled to date
                  </span>
                </div>
              </div>

              {/* QUIETER SECONDARY LAYOUT */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">

                {/* Panel 1: Predator & Scam Warnings (High/Medium/Low) */}
                <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl shadow-sm flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-[#475569] uppercase tracking-widest block mb-2">
                      Deception Detection Breakdown
                    </span>
                    <h3 className="text-sm font-bold text-[#0F172A] border-b border-slate-100 pb-2 mb-3">
                      Possible Concerns &amp; Risks
                    </h3>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-[#FCE8E6]/60 text-[#7F1D1D] font-bold">
                      <span className="flex items-center gap-1">⚠️ Worth a Closer Look</span>
                      <span>{activeStats.risk.high.count} ({activeStats.risk.high.pct}%)</span>
                    </div>
                    <div className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-[#FEF7E0] text-[#78350F] font-bold">
                      <span className="flex items-center gap-1">🚨 Possible Concern</span>
                      <span>{activeStats.risk.medium.count} ({activeStats.risk.medium.pct}%)</span>
                    </div>
                    <div className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-[#E6F4EA] text-[#0F766E] font-bold">
                      <span className="flex items-center gap-1">🛡️ No obvious concerns</span>
                      <span>{activeStats.risk.low.count} ({activeStats.risk.low.pct}%)</span>
                    </div>
                  </div>
                </div>

                {/* Panel 2: Channels used */}
                <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl shadow-sm flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-[#475569] uppercase tracking-widest block mb-2">
                      Primary Entry Channels
                    </span>
                    <h3 className="text-sm font-bold text-[#0F172A] border-b border-slate-100 pb-2 mb-3">
                      Input Format Popularity
                    </h3>
                  </div>

                  <div className="space-y-3 font-semibold text-xs text-[#334155]">
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>✏️ Pasted Raw Text</span>
                        <span>{activeStats.inputType.text.pct}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5">
                        <div className="bg-slate-700 h-1.5 rounded-full" style={{ width: `${activeStats.inputType.text.pct}%` }} />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>📄 Uploaded PDF Files</span>
                        <span>{activeStats.inputType.pdf.pct}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5">
                        <div className="bg-[#0D9488] h-1.5 rounded-full" style={{ width: `${activeStats.inputType.pdf.pct}%` }} />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>🖼️ Images &amp; Screenshots</span>
                        <span>{activeStats.inputType.image.pct}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5">
                        <div className="bg-slate-700 h-1.5 rounded-full" style={{ width: `${activeStats.inputType.image.pct}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Panel 3: Tone breakdowns */}
                <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl shadow-sm flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-[#475569] uppercase tracking-widest block mb-2">
                      User Accessibility Choices
                    </span>
                    <h3 className="text-sm font-bold text-[#0F172A] border-b border-slate-100 pb-2 mb-3">
                      Preferred Translation Tone
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                    <div className="p-2 bg-[#F4F6F9] rounded-lg border border-[#E2E8F0]/60 text-center">
                      <span className="block text-slate-500 text-[10px] uppercase">Simple</span>
                      <span className="text-[#0F172A]">{activeStats.tone.simple.pct}%</span>
                    </div>
                    <div className="p-2 bg-[#EFF6FF] rounded-lg border border-blue-100 text-center">
                      <span className="block text-blue-600 text-[10px] uppercase">Elderly</span>
                      <span className="text-blue-900">{activeStats.tone.elderly.pct}%</span>
                    </div>
                    <div className="p-2 bg-[#FAF5F0] rounded-lg border border-amber-100 text-center">
                      <span className="block text-amber-700 text-[10px] uppercase">Student</span>
                      <span className="text-amber-950">{activeStats.tone.student.pct}%</span>
                    </div>
                    <div className="p-2 bg-[#FDFBF7] rounded-lg border border-slate-200/60 text-center">
                      <span className="block text-slate-600 text-[10px] uppercase">Teacher</span>
                      <span className="text-[#0F172A]">{activeStats.tone.teacher.pct}%</span>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          )
        )}
      </main>

      {/* Footer */}
      <SignatureFooter />
    </div>
  );
}
