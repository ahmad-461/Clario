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

export default function UntangleLogPage() {
  const [activeTab, setActiveTab] = useState<"allTime" | "thisWeek">("allTime");
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [isIntersecting, setIsIntersecting] = useState<boolean>(false);
  const [pathLength, setPathLength] = useState<number>(0);

  const pathRef = useRef<SVGPathElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch the aggregate stats on mount
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
  }, [loading]); // Measure after content has loaded and SVG is in the DOM

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

  // Render stats loading skeleton
  const renderSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-pulse">
      {[1, 2, 3].map((n) => (
        <div key={n} className="bg-white border border-[#E2E8F0] p-8 rounded-2xl h-56 flex flex-col justify-between shadow-sm">
          <div className="h-4 bg-slate-200 rounded w-1/3" />
          <div className="h-10 bg-slate-200 rounded w-2/3 my-4" />
          <div className="space-y-2">
            <div className="h-3 bg-slate-100 rounded w-full" />
            <div className="h-3 bg-slate-100 rounded w-4/5" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-[#0F172A] font-sans flex flex-col relative overflow-x-hidden">
      {/* Background Atmosphere - elegant, calm */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#0D9488]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <Header currentPage="home" />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 md:px-12 lg:px-16 py-16 md:py-24 space-y-16 relative z-10">

        {/* Editorial Title & Statement */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          <div className="lg:col-span-8 space-y-6 text-left">
            <span className="text-xs font-bold text-[#0D9488] uppercase tracking-widest block">
              Transparency Report
            </span>
            <h1 className="font-display font-medium text-[#0F172A] leading-tight text-3xl md:text-5xl lg:text-6xl tracking-[-0.03em]">
              The Untangle Log
            </h1>
            <blockquote className="border-l-4 border-[#0D9488] pl-5 space-y-3 max-w-2xl">
              <p className="font-display font-medium text-[#334155] leading-relaxed text-lg md:text-2xl italic">
                &ldquo;Every number here represents a moment of confusion, resolved. We publish this openly because clarity should include clarity about Clario itself.&rdquo;
              </p>
            </blockquote>
          </div>

          <div className="lg:col-span-4 text-left lg:border-l lg:border-[#E2E8F0] lg:pl-8 space-y-4">
            <span className="text-xs font-extrabold text-[#475569] uppercase tracking-wider block">
              Our Transparency Philosophy
            </span>
            <p className="text-sm text-[#334155] font-semibold leading-relaxed">
              To guarantee your absolute safety, Clario does not log, inspect, or save original texts or files submitted to the system.
            </p>
            <p className="text-sm text-[#334155] font-semibold leading-relaxed">
              We record only fully anonymized, high-level structural parameters — such as risk warnings and tone modes — to track the direct impact we are creating together.
            </p>
          </div>
        </div>

        {/* Tab Selector controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-[#E2E8F0] pb-6">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-[#334155] uppercase tracking-widest">
              Reporting Period
            </span>
            <div className="inline-flex p-1.5 bg-white border border-[#E2E8F0] rounded-full shadow-inner gap-1.5 w-fit mt-1.5">
              <button
                type="button"
                onClick={() => setActiveTab("allTime")}
                className={`px-6 py-2 rounded-full text-xs md:text-sm font-semibold transition-all duration-150 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0D9488] focus-visible:outline-none ${
                  activeTab === "allTime"
                    ? "bg-[#0D9488] text-white shadow border border-[#0F766E]/10 font-bold"
                    : "text-[#334155] hover:bg-slate-50 hover:text-[#0F172A]"
                }`}
              >
                All-Time Total
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("thisWeek")}
                className={`px-6 py-2 rounded-full text-xs md:text-sm font-semibold transition-all duration-150 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0D9488] focus-visible:outline-none ${
                  activeTab === "thisWeek"
                    ? "bg-[#0D9488] text-white shadow border border-[#0F766E]/10 font-bold"
                    : "text-[#334155] hover:bg-slate-50 hover:text-[#0F172A]"
                }`}
              >
                This Week
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-[#475569] bg-white border border-[#E2E8F0] px-4 py-2.5 rounded-xl shadow-sm self-start sm:self-auto">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>
              {stats?.isRealData
                ? "Streaming live from Supabase metrics logs"
                : "Displaying aggregated benchmark metrics"}
            </span>
          </div>
        </div>

        {/* Error Handling */}
        {error && (
          <div role="alert" className="p-4 bg-[#FEF2F2] border border-[#991B1B]/15 rounded-xl text-[#7F1D1D] text-sm font-semibold">
            {error}
          </div>
        )}

        {/* Loading / Content Grid */}
        {loading ? (
          renderSkeleton()
        ) : (
          activeStats && (
            <div ref={containerRef} className="space-y-12 relative">

              {/* The "Untangle" Line Motif behind Stats card */}
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[160px] w-full pointer-events-none z-0 opacity-15">
                <svg
                  className="w-full h-full"
                  viewBox="0 0 1200 120"
                  preserveAspectRatio="none"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <defs>
                    <linearGradient id="untangleLogGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#0F172A" />
                      <stop offset="40%" stopColor="#0F172A" />
                      <stop offset="40%" stopColor="#0D9488" />
                      <stop offset="100%" stopColor="#0D9488" />
                    </linearGradient>
                  </defs>
                  <path
                    ref={pathRef}
                    d="M 0 60 C 150 20, 250 100, 350 40 C 450 100, 500 20, 600 60 L 1200 60"
                    stroke="url(#untangleLogGradient)"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      strokeDasharray: pathLength || 1400,
                      strokeDashoffset: isIntersecting ? 0 : (pathLength || 1400),
                      transition: "stroke-dashoffset 2.5s cubic-bezier(0.25, 1, 0.5, 1)",
                    }}
                  />
                </svg>
              </div>

              {/* High-Fidelity Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">

                {/* 1. Total Explained Card */}
                <div className="bg-white border border-[#E2E8F0] p-8 rounded-2xl shadow-xl flex flex-col justify-between hover:shadow-2xl transition duration-300">
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-[#475569] uppercase tracking-widest block">
                      Total Handled
                    </span>
                    <h2 className="font-display font-medium text-4xl lg:text-5xl text-[#0F172A] pt-3">
                      {activeStats.total.toLocaleString()}
                    </h2>
                  </div>
                  <div className="pt-6 border-t border-slate-100 mt-6 text-sm text-[#334155] font-semibold leading-relaxed">
                    Explanations delivered instantly with absolute raw-text privacy.
                  </div>
                </div>

                {/* 2. Scam Risk Warnings Card */}
                <div className="bg-white border border-[#E2E8F0] p-8 rounded-2xl shadow-xl flex flex-col justify-between hover:shadow-2xl transition duration-300">
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-[#475569] uppercase tracking-widest block">
                      Predatory Warnings
                    </span>
                    <h2 className="font-display font-medium text-4xl lg:text-5xl text-[#7F1D1D] pt-3">
                      {(activeStats.risk.medium.count + activeStats.risk.high.count).toLocaleString()}
                    </h2>
                  </div>
                  <div className="pt-6 border-t border-slate-100 mt-6 text-sm text-[#334155] font-semibold space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-[#7F1D1D]">⚠️ High Risk (Scams/Phishing):</span>
                      <span className="font-extrabold text-[#7F1D1D]">{activeStats.risk.high.count} ({activeStats.risk.high.pct}%)</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-[#78350F]">🚨 Medium Risk (Suspicious):</span>
                      <span className="font-extrabold text-[#78350F]">{activeStats.risk.medium.count} ({activeStats.risk.medium.pct}%)</span>
                    </div>
                    <div className="flex justify-between items-center text-xs border-t border-dashed border-slate-200 pt-1.5">
                      <span className="text-slate-500 font-bold">🛡️ Clear Documents (Low Risk):</span>
                      <span className="text-slate-700 font-extrabold">{activeStats.risk.low.count} ({activeStats.risk.low.pct}%)</span>
                    </div>
                  </div>
                </div>

                {/* 3. Input Channels Card */}
                <div className="bg-white border border-[#E2E8F0] p-8 rounded-2xl shadow-xl flex flex-col justify-between hover:shadow-2xl transition duration-300">
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-[#475569] uppercase tracking-widest block">
                      Primary Channels
                    </span>
                    <h2 className="font-display font-medium text-4xl lg:text-5xl text-[#0D9488] pt-3">
                      {Math.max(activeStats.inputType.text.pct, activeStats.inputType.pdf.pct, activeStats.inputType.image.pct)}%
                    </h2>
                  </div>
                  <div className="pt-6 border-t border-slate-100 mt-6 text-sm text-[#334155] font-semibold space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-bold">✏️ Pasted Text:</span>
                      <span className="text-slate-700 font-extrabold">{activeStats.inputType.text.count.toLocaleString()} ({activeStats.inputType.text.pct}%)</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-bold">📄 PDF Uploads:</span>
                      <span className="text-slate-700 font-extrabold">{activeStats.inputType.pdf.count.toLocaleString()} ({activeStats.inputType.pdf.pct}%)</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-bold">🖼️ Images/Screenshots:</span>
                      <span className="text-slate-700 font-extrabold">{activeStats.inputType.image.count.toLocaleString()} ({activeStats.inputType.image.pct}%)</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Detailed Breakdown Section: Tone modes used */}
              <div className="bg-white border border-[#E2E8F0] rounded-2xl p-8 md:p-12 shadow-xl hover:shadow-2xl transition duration-300 space-y-8 relative z-10">
                <div className="space-y-2 text-left">
                  <span className="text-xs font-bold text-[#0D9488] uppercase tracking-widest block">
                    Accessibility Preference
                  </span>
                  <h3 className="text-2xl font-display font-medium text-slate-900">
                    Tone Modes Chosen by Readers
                  </h3>
                  <p className="text-sm text-[#475569] font-semibold leading-relaxed max-w-xl">
                    Our readers come with unique needs. We measure which modes are chosen to ensure we keep prioritizing clarity for everyone.
                  </p>
                </div>

                {/* Tone Breakdown Chart/Pills Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-2">

                  {/* Simple Tone */}
                  <div className="bg-[#F4F6F9] border border-[#E2E8F0] p-6 rounded-xl flex flex-col justify-between gap-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-widest">Simple</span>
                      <span className="text-sm">✨</span>
                    </div>
                    <div>
                      <span className="font-display font-medium text-3xl text-[#0F172A] block">
                        {activeStats.tone.simple.count.toLocaleString()}
                      </span>
                      <span className="text-xs text-[#0F766E] font-bold mt-1 block">
                        {activeStats.tone.simple.pct}% of readers
                      </span>
                    </div>
                  </div>

                  {/* Elderly Tone */}
                  <div className="bg-[#EFF6FF] border border-blue-100 p-6 rounded-xl flex flex-col justify-between gap-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-900 uppercase tracking-widest">Elderly Friendly</span>
                      <span className="text-sm">👵</span>
                    </div>
                    <div>
                      <span className="font-display font-medium text-3xl text-blue-950 block">
                        {activeStats.tone.elderly.count.toLocaleString()}
                      </span>
                      <span className="text-xs text-[#0F766E] font-bold mt-1 block">
                        {activeStats.tone.elderly.pct}% of readers
                      </span>
                    </div>
                  </div>

                  {/* Student Tone */}
                  <div className="bg-slate-50 border border-slate-200/60 p-6 rounded-xl flex flex-col justify-between gap-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-widest">Student</span>
                      <span className="text-sm">🎓</span>
                    </div>
                    <div>
                      <span className="font-display font-medium text-3xl text-[#0F172A] block">
                        {activeStats.tone.student.count.toLocaleString()}
                      </span>
                      <span className="text-xs text-[#0F766E] font-bold mt-1 block">
                        {activeStats.tone.student.pct}% of readers
                      </span>
                    </div>
                  </div>

                  {/* Teacher Tone */}
                  <div className="bg-slate-50 border border-slate-200/60 p-6 rounded-xl flex flex-col justify-between gap-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-widest">Teacher</span>
                      <span className="text-sm">🏫</span>
                    </div>
                    <div>
                      <span className="font-display font-medium text-3xl text-[#0F172A] block">
                        {activeStats.tone.teacher.count.toLocaleString()}
                      </span>
                      <span className="text-xs text-[#0F766E] font-bold mt-1 block">
                        {activeStats.tone.teacher.pct}% of readers
                      </span>
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
