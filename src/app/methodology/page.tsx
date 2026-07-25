"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Header } from "../Header";
import { SignatureFooter } from "../SignatureFooter";
import { User } from "@supabase/supabase-js";

export default function MethodologyPage() {
  const [, setUser] = useState<User | null>(null);

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-[#0F172A] font-sans flex flex-col relative overflow-x-hidden">
      {/* Background Atmosphere */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#0D9488]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <Header onSessionChange={(currentUser) => setUser(currentUser)} currentPage="methodology" />

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 md:px-12 lg:px-16 py-12 md:py-20 flex flex-col gap-10 relative z-10">

        {/* Editorial Title */}
        <div className="space-y-4 text-left border-b border-[#E2E8F0]/80 pb-8">
          <span className="text-xs font-bold text-[#0D9488] uppercase tracking-widest block">
            Core Principles & Technology
          </span>
          <h1 className="font-display font-medium text-[#0F172A] leading-tight text-3xl md:text-5xl tracking-[-0.03em]">
            How Clario Works
          </h1>
          <p className="text-sm md:text-base text-[#334155] font-semibold leading-relaxed max-w-2xl">
            We believe that genuine trust is built through complete honesty. This page explains exactly how Clario works under the hood, the AI technology we use, and our fundamental boundaries.
          </p>
        </div>

        {/* Section 1: The Core AI Engine */}
        <section className="space-y-4">
          <h2 className="text-xl md:text-2xl font-display font-medium text-[#0F172A]">
            1. Our Technology
          </h2>
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-[#E2E8F0] shadow-sm space-y-4 text-sm md:text-base text-[#334155] leading-relaxed">
            <p className="font-semibold">
              Clario is powered by Google Gemini AI (<span className="text-[#0D9488] font-bold">gemini-2.5-flash</span>) for real-time document parsing and text translation.
            </p>
            <p className="font-semibold">
              Every explanation, bullet point, and risk flag you see is <span className="text-slate-900 font-extrabold">entirely AI-generated</span>. There are no human lawyers, financial advisors, or moderators reviewing your uploads or queries.
            </p>
            <p className="font-semibold">
              We send your text, PDF, or image securely to Google’s API to parse, categorize, and translate it according to your selected Audience Tone Mode.
            </p>
          </div>
        </section>

        {/* Section 2: The Three-Layer Analysis */}
        <section className="space-y-4">
          <h2 className="text-xl md:text-2xl font-display font-medium text-[#0F172A]">
            2. The Three-Layer Framework
          </h2>
          <p className="text-xs font-bold text-[#0D9488] uppercase tracking-widest -mt-2">
            Understand It / What Matters / What They&apos;re Not Telling You
          </p>

          <div className="grid grid-cols-1 gap-6">

            {/* Layer 1 */}
            <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm flex flex-col md:flex-row gap-4 items-start">
              <div className="h-10 w-10 rounded-full bg-[#F0FDFA] border border-[#0D9488]/20 flex items-center justify-center shrink-0 text-[#0D9488] font-bold">
                1
              </div>
              <div className="space-y-2">
                <h3 className="font-display font-semibold text-lg text-slate-900">
                  Layer 1: Understand It
                </h3>
                <p className="text-xs md:text-sm text-[#334155] font-semibold leading-relaxed">
                  Our model takes complex terms, dense jargon, and official vocabulary and translates it into friendly, conversational English. Depending on your choice of Tone Mode (such as &ldquo;For an older adult&rdquo; or &ldquo;Just explain it&rdquo;), Clario adjusts the word choice, sentence structure, and visual font size to match how you read best.
                </p>
              </div>
            </div>

            {/* Layer 2 */}
            <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm flex flex-col md:flex-row gap-4 items-start">
              <div className="h-10 w-10 rounded-full bg-[#EFF6FF] border border-[#1E40AF]/20 flex items-center justify-center shrink-0 text-[#1E40AF] font-bold">
                2
              </div>
              <div className="space-y-2">
                <h3 className="font-display font-semibold text-lg text-slate-900">
                  Layer 2: What Matters
                </h3>
                <p className="text-xs md:text-sm text-[#334155] font-semibold leading-relaxed">
                  We instruct the AI to extract key concrete dates, specific fees, exact pricing, explicit payment details, obligations, and immediate actions required of you. This ensures you can scan the document for direct, factual takeaways without getting lost in page-long legal clauses.
                </p>
              </div>
            </div>

            {/* Layer 3 */}
            <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-sm flex flex-col md:flex-row gap-4 items-start">
              <div className="h-10 w-10 rounded-full bg-[#F3E8FF] border border-[#6B21A8]/20 flex items-center justify-center shrink-0 text-[#6B21A8] font-bold">
                3
              </div>
              <div className="space-y-2">
                <h3 className="font-display font-semibold text-lg text-slate-900">
                  Layer 3: What They&apos;re Not Telling You
                </h3>
                <p className="text-xs md:text-sm text-[#334155] font-semibold leading-relaxed">
                  We look for hidden risks, severe liabilities, omissions (crucial details a standard document of this type should contain but is missing), and manipulative pressure tactics (like artificial urgency, guilt, or fear). We present these split cleanly into structured categories:
                </p>
                <ul className="list-disc pl-5 text-xs md:text-sm text-[#334155] font-semibold space-y-1">
                  <li><strong className="text-[#0F172A]">Stated:</strong> Conditions explicitly stated in the document but designed to be easily overlooked or hidden in small print.</li>
                  <li><strong className="text-[#0F172A]">Implied:</strong> Risks or requirements that aren&apos;t spelled out directly, but follow logically from what you are agreeing to.</li>
                  <li><strong className="text-[#0F172A]">Worth verifying:</strong> Elements that require external verification or consulting other parties before proceeding.</li>
                </ul>
              </div>
            </div>

          </div>
        </section>

        {/* Section 3: Limitations & Disclaimers */}
        <section className="space-y-4">
          <h2 className="text-xl md:text-2xl font-display font-medium text-[#0F172A]">
            3. Our Limitations
          </h2>
          <div className="bg-[#FEF2F2] border border-[#7F1D1D]/15 rounded-2xl p-6 md:p-8 space-y-4 text-xs md:text-sm text-[#7F1D1D] leading-relaxed">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#7F1D1D] block">
              Important Legal Boundaries
            </span>
            <p className="font-bold">
              Clario is an AI-powered reading assistant. Clario is NOT a lawyer, financial advisor, or licensed professional in any field.
            </p>
            <p className="font-bold">
              The analysis generated is designed strictly to assist comprehension and serve as an educational companion. It is not legal or financial representation, a guarantee, or a formal review of your contracts.
            </p>
            <p className="font-semibold text-[#7F1D1D]/90">
              Large Language Models are highly capable but can make mistakes, overlook critical context, omit details, or display incorrect information (hallucinations). You should always read official documents carefully yourself and verify important dates, costs, or obligations before signing, clicking, or putting trust in any message.
            </p>
            <p className="font-semibold text-[#7F1D1D]/90">
              When dealing with high-risk financial commitments, formal legal agreements, or suspicious messages, please consult a qualified human professional.
            </p>
          </div>
        </section>

        {/* Section 4: Our Privacy Commitment */}
        <section className="space-y-4">
          <h2 className="text-xl md:text-2xl font-display font-medium text-[#0F172A]">
            4. Privacy-First Architecture
          </h2>
          <div className="bg-[#F0FDFA] border-2 border-[#0D9488]/10 rounded-2xl p-6 md:p-8 space-y-4 text-sm md:text-base text-[#334155] leading-relaxed">
            <p className="font-semibold">
              We process your text and uploads entirely in real-time.
            </p>
            <p className="font-semibold text-slate-800">
              For guest users, Clario <span className="text-slate-900 font-extrabold">never stores the raw text, PDF files, or image uploads</span> on any database. Your inputs are discarded the moment Google Gemini completes its real-time stream analysis.
            </p>
            <p className="font-semibold">
              If you optionally choose to sign up for an account, your history is saved securely and can only be viewed or deleted by you. We only capture anonymous metadata (such as the tone mode and risk level chosen) to construct our transparency reports in <Link href="/untangle-log" className="text-[#0D9488] font-bold underline hover:text-[#0F766E]">The Untangle Log</Link>.
            </p>
          </div>
        </section>

        {/* About Clario Link CTA */}
        <div className="pt-6 border-t border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#334155] font-semibold">
            Want to know who is behind Clario and why we built it?
          </p>
          <Link
            href="/about"
            className="px-5 py-2.5 bg-[#0D9488] hover:bg-[#0D766E] text-white text-xs font-bold rounded-lg transition-all duration-200 shadow-sm hover:shadow active:scale-[0.98]"
          >
            Read Our About Page &rarr;
          </Link>
        </div>

      </main>

      {/* Footer */}
      <SignatureFooter />
    </div>
  );
}
