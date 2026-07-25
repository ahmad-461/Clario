"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Header } from "../Header";
import { SignatureFooter } from "../SignatureFooter";
import { User } from "@supabase/supabase-js";

export default function AboutPage() {
  const [, setUser] = useState<User | null>(null);

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#0F172A] font-sans flex flex-col relative overflow-x-hidden">
      {/* Warm Relational Atmosphere */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#0D9488]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <Header onSessionChange={(currentUser) => setUser(currentUser)} currentPage="about" />

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 md:px-12 lg:px-16 py-12 md:py-20 flex flex-col gap-12 relative z-10">

        {/* Editorial Header */}
        <div className="space-y-4 text-left border-b border-[#E2E8F0]/80 pb-8">
          <span className="text-xs font-bold text-[#0D9488] uppercase tracking-widest block">
            Our Mission & Purpose
          </span>
          <h1 className="font-display font-medium text-[#0F172A] leading-tight text-3xl md:text-5xl tracking-[-0.03em]">
            About Clario
          </h1>
          <p className="text-sm md:text-base text-[#334155] font-semibold leading-relaxed max-w-2xl">
            Clario is built around a singular, simple promise: helping you understand what you are reading before you sign, click, or trust.
          </p>
        </div>

        {/* Section 1: The Problem Clario Solves */}
        <section className="space-y-4">
          <h2 className="text-xl md:text-2xl font-display font-medium text-[#0F172A]">
            The Problem We Solve
          </h2>
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-[#E2E8F0] shadow-sm space-y-4 text-sm md:text-base text-[#334155] leading-relaxed">
            <p className="font-semibold">
              Confusing text isn&apos;t just inconvenient — it&apos;s dangerous.
            </p>
            <p className="font-semibold">
              Whether it&apos;s a dense landlord lease clause, a tricky credit card agreement, a complex assignment sheet, or a phishing SMS message designed to create artificial panic — language is often used as a tool to exclude or deceive.
            </p>
            <p className="font-semibold text-slate-800">
              For students trying to study, teachers designing lessons, elderly adults managing their utilities, caregivers protecting vulnerable parents, or non-native English speakers, the barrier to understanding is too high.
            </p>
            <p className="font-semibold">
              Clario was created to lower this barrier. We turn dense, intimidating jargon into clear, structured, and compassionate plain language so you can make better-informed decisions.
            </p>
          </div>
        </section>

        {/* Section 2: EDITORIAL FOUNDER NOTE HOLDING/FLAG BLOCK */}
        <section className="space-y-4">
          <div className="border-l-4 border-[#0D9488] pl-5 py-2">
            <h2 className="text-xl md:text-2xl font-display font-medium text-[#0F172A]">
              Founder&apos;s Note
            </h2>
            <span className="text-[10px] font-bold text-[#0D9488] uppercase tracking-widest block mt-1">
              Direct & First-Person Letter
            </span>
          </div>

          <div className="bg-[#FFFDF9] border border-amber-500/15 rounded-2xl p-6 md:p-8 space-y-6 text-sm md:text-base text-[#334155] leading-relaxed shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 bg-amber-500/5 text-amber-800/20 text-4xl font-display font-bold select-none">
              &ldquo;
            </div>

            {/* HOLDING FLAG / NOTIFICATION */}
            <div className="p-4 bg-amber-50 border border-amber-200/60 rounded-xl text-amber-900 font-bold text-xs md:text-sm leading-relaxed space-y-1">
              <span className="uppercase tracking-widest text-[10px] text-amber-700 block">Note from Developer</span>
              <p>
                Founder&apos;s bio content is currently being finalized by the creator. We do not manufacture fake credentials, testimonials, or artificial expertise, ensuring Clario remains 100% trustworthy and transparent.
              </p>
              <p className="text-[11px] font-semibold text-slate-600 italic">
                Once provided, the real founder note and personal background will be inserted here in a clean, human first-person letter format.
              </p>
            </div>

            <p className="italic font-semibold text-slate-500">
              Check back soon for the direct story of how and why Clario was created, written by the founder themselves.
            </p>
          </div>
        </section>

        {/* Section 3: Supporting Information */}
        <section className="space-y-4">
          <h2 className="text-xl md:text-2xl font-display font-medium text-[#0F172A]">
            Grounded in Genuine Trust
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] space-y-2 shadow-sm">
              <h3 className="font-display font-semibold text-slate-900">
                100% Free & No-Login Core
              </h3>
              <p className="text-xs md:text-sm text-[#475569] font-semibold leading-relaxed">
                Accessibility shouldn&apos;t require credentials. Anyone can paste text, upload files, or translate confusing alerts instantly without needing to make an account or pay a fee.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] space-y-2 shadow-sm">
              <h3 className="font-display font-semibold text-slate-900">
                Privacy-First Architecture
              </h3>
              <p className="text-xs md:text-sm text-[#475569] font-semibold leading-relaxed">
                We do not store raw text, uploads, or PDFs on any server for guest users. All processing happens in real-time, protecting your security and confidentiality.
              </p>
            </div>
          </div>
        </section>

        {/* Methodology Link CTA */}
        <div className="pt-6 border-t border-[#E2E8F0] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#334155] font-semibold">
            Want to see how our three-layer AI analysis engine processes documents under the hood?
          </p>
          <Link
            href="/methodology"
            className="px-5 py-2.5 bg-[#0D9488] hover:bg-[#0D766E] text-white text-xs font-bold rounded-lg transition-all duration-200 shadow-sm hover:shadow active:scale-[0.98]"
          >
            How Clario Works &rarr;
          </Link>
        </div>

      </main>

      {/* Footer */}
      <SignatureFooter />
    </div>
  );
}
