"use client";

import React, { useState, useRef } from "react";

interface DemoStep {
  title: string;
  badge: string;
  badgeClass: string;
  content: React.ReactNode;
  footerText: string;
}

export function ClarioHero() {
  const [currentStep, setCurrentStep] = useState(0);
  const demoCardRef = useRef<HTMLDivElement>(null);

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

  const steps: DemoStep[] = [
    {
      title: "Confusing Information",
      badge: "The Original Legalese",
      badgeClass: "bg-[#FFF7ED] text-[#9A3412] border-[#9A3412]/15",
      content: (
        <div className="space-y-4 text-left">
          <p className="text-xs font-bold text-[#475569] tracking-widest uppercase">
            Lease Agreement Clause
          </p>
          <div className="relative p-5 bg-slate-50 border border-slate-200 rounded-xl overflow-hidden font-sans">
            {/* Tangled loop pattern overlay to represent confusion */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.08]" aria-hidden="true">
              <svg className="w-full h-full" viewBox="0 0 400 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M 20 50 Q 80 150, 160 80 T 320 120" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" />
                <path d="M 40 120 C 120 40, 180 180, 240 100 S 360 160, 380 60" stroke="#0F172A" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-sm md:text-base text-[#334155] font-semibold leading-relaxed relative z-10">
              &ldquo;Tenant shall surrender the Premises in good order. Notwithstanding the foregoing, if Tenant <span className="bg-amber-100/80 px-1 py-0.5 rounded border border-amber-200 font-bold text-slate-900">fails to provide written notice of non-renewal exactly sixty (60) days</span> prior to expiration, this Lease shall <span className="bg-amber-100/80 px-1 py-0.5 rounded border border-amber-200 font-bold text-slate-900">automatically renew at a surcharge of 150%</span> of the then-current monthly rent, and Tenant shall remain fully liable for utility charges...&rdquo;
            </p>
          </div>
          <p className="text-xs font-semibold text-[#475569]">
            ⚠️ Complex conditions, strict time limits, and sudden financial penalties are hidden in the dense paragraphs.
          </p>
        </div>
      ),
      footerText: "1 of 5 • See how Clario untangles this paragraph instantly"
    },
    {
      title: "Clario Explains It Clearly",
      badge: "Layer 1: Plain Language",
      badgeClass: "bg-[#F0FDFA] text-[#0F766E] border-[#0D9488]/15",
      content: (
        <div className="space-y-4 text-left">
          <p className="text-xs font-bold text-[#0D9488] tracking-widest uppercase">
            Understand It
          </p>
          <div className="p-5 bg-[#F0FDFA] border-2 border-[#0D9488]/20 rounded-xl flex flex-col gap-3">
            <p className="text-base md:text-lg text-[#0F766E] font-bold leading-relaxed">
              &ldquo;If you don&apos;t tell the landlord in writing exactly 60 days before your lease ends that you are moving out, your lease will automatically renew month-to-month, and your rent will increase by 50% (you will pay 1.5x your current rent).&rdquo;
            </p>
          </div>
          <p className="text-xs font-semibold text-[#475569]">
            ✨ Translated into a clear, jargon-free explanation tailored to your selected audience mode.
          </p>
        </div>
      ),
      footerText: "2 of 5 • Next, see the concrete key details extracted"
    },
    {
      title: "What Matters",
      badge: "Layer 2: Key Details",
      badgeClass: "bg-[#EFF6FF] text-[#1E40AF] border-[#1E40AF]/15",
      content: (
        <div className="space-y-4 text-left">
          <p className="text-xs font-bold text-[#0D9488] tracking-widest uppercase">
            Scannable Key Facts
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-4 bg-white border border-[#E2E8F0] rounded-xl flex gap-3 shadow-sm">
              <span className="text-lg shrink-0">📅</span>
              <div>
                <span className="text-[10px] font-extrabold uppercase text-[#475569] tracking-wider block">Action Required</span>
                <p className="text-xs font-bold text-slate-800 leading-snug mt-0.5">Give written move-out notice exactly 60 days prior.</p>
              </div>
            </div>
            <div className="p-4 bg-white border border-[#E2E8F0] rounded-xl flex gap-3 shadow-sm">
              <span className="text-lg shrink-0">💰</span>
              <div>
                <span className="text-[10px] font-extrabold uppercase text-[#475569] tracking-wider block">Penalty Fee</span>
                <p className="text-xs font-bold text-slate-800 leading-snug mt-0.5">Rent increases by 150% if the notice deadline is missed.</p>
              </div>
            </div>
            <div className="p-4 bg-[#EFF6FF]/40 border border-[#E2E8F0] rounded-xl flex gap-3 shadow-sm md:col-span-2">
              <span className="text-lg shrink-0">🔌</span>
              <div>
                <span className="text-[10px] font-extrabold uppercase text-[#1E40AF] tracking-wider block">Ongoing Obligation</span>
                <p className="text-xs font-bold text-slate-800 leading-snug mt-0.5">You stay fully responsible for utility bills and maintenance during renewal months.</p>
              </div>
            </div>
          </div>
        </div>
      ),
      footerText: "3 of 5 • Next, Clario uncovers hidden traps and omissions"
    },
    {
      title: "What You Might Be Missing",
      badge: "Layer 3: Hidden Risks",
      badgeClass: "bg-[#F3E8FF] text-[#6B21A8] border-[#6B21A8]/15",
      content: (
        <div className="space-y-4 text-left">
          <p className="text-xs font-bold text-[#0D9488] tracking-widest uppercase">
            What They&apos;re Not Telling You
          </p>
          <div className="space-y-2.5">
            <div className="px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
              <span className="text-[9px] font-extrabold uppercase text-[#6B21A8] tracking-wider block">Stated (Hidden in plain sight)</span>
              <p className="text-xs font-semibold text-slate-700 leading-relaxed mt-0.5">The 150% rent hike is automatic and legally binding immediately upon missing the deadline.</p>
            </div>
            <div className="px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
              <span className="text-[9px] font-extrabold uppercase text-[#6B21A8] tracking-wider block">Implied (Unsaid consequences)</span>
              <p className="text-xs font-semibold text-slate-700 leading-relaxed mt-0.5">If you find a new apartment but miss the notice date, you could be forced to pay two leases at once.</p>
            </div>
            <div className="px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
              <span className="text-[9px] font-extrabold uppercase text-[#0D9488] tracking-wider block">Worth Verifying</span>
              <p className="text-xs font-semibold text-slate-700 leading-relaxed mt-0.5">Check local tenant laws—some states limit auto-renewal penalties or require prior warning.</p>
            </div>
          </div>
        </div>
      ),
      footerText: "4 of 5 • Next, see the finalized outcome of your analysis"
    },
    {
      title: "Better-Informed Decision",
      badge: "Confident Resolution",
      badgeClass: "bg-[#E6F4EA] text-[#137333] border-[#137333]/15",
      content: (
        <div className="space-y-4 text-left">
          <p className="text-xs font-bold text-[#137333] tracking-widest uppercase">
            Decision Power Unlocked
          </p>
          <div className="p-5 bg-[#E6F4EA]/30 border border-[#137333]/20 rounded-xl flex items-start gap-4">
            <div className="p-2 bg-white text-[#137333] rounded-full shadow-sm shrink-0">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div className="space-y-1.5">
              <p className="text-sm md:text-base font-bold text-slate-900 leading-snug">
                With Clario, you avoid costly traps before you sign, click, or trust.
              </p>
              <p className="text-xs md:text-sm font-semibold text-slate-700 leading-relaxed">
                You are fully empowered to negotiate notice terms, set precise calendar reminders, and verify legal rent limits—saving yourself thousands of dollars and immense stress.
              </p>
            </div>
          </div>
        </div>
      ),
      footerText: "5 of 5 • You're ready to try it with your own documents!"
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setCurrentStep(0); // Loop back or let them restart
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <section className="relative w-full py-16 md:py-24 lg:py-32 flex flex-col items-center justify-center overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-10 left-1/3 w-[500px] h-[500px] bg-[#0D9488]/5 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-[#F0FDFA]/40 rounded-full blur-3xl -z-10" />

      {/* Main asymmetric editorial container */}
      <div className="max-w-7xl w-full mx-auto px-6 md:px-12 lg:px-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">

          {/* Left Column: Oversized editorial headline overlapping the widget */}
          <div className="lg:col-span-5 relative z-20 space-y-6 lg:space-y-8 text-left">
            {/* Desktop Overlap Container */}
            <div className="lg:-mr-24 xl:-mr-32 lg:relative lg:z-30">
              <h1 className="font-display font-medium text-[#0F172A] leading-[0.9] text-[2.75rem] md:text-6xl lg:text-[clamp(3.2rem,6.8vw,5.5rem)] tracking-[-0.04em] lg:tracking-[-0.05em]">
                Understand <br />
                before you <span className="text-[#0D9488] italic font-semibold tracking-tighter block mt-2 lg:inline lg:mt-0">sign, click, or trust.</span>
              </h1>
            </div>

            {/* Refined Hero Supporting Copy explicitly communicating what, who, and why it is different */}
            <p className="text-base md:text-lg text-[#334155] font-medium max-w-lg leading-relaxed pt-2 md:pt-4">
              Clario turns confusing documents, messages, and fine print into plain language for everyday people, caregivers, and families. Unlike generic AI summarizers that just shorten text, Clario translates complex details, highlights key obligations, and actively flags hidden risks so you can make confident, safe decisions.
            </p>

            {/* Downward CTA Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={scrollToTool}
                className="group inline-flex items-center gap-3 px-5 py-3 rounded-xl border-2 border-[#0D9488] text-[#0F766E] hover:text-white hover:bg-[#0D9488] transition-all duration-300 font-bold text-sm shadow-sm hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0D9488]"
                aria-label="Scroll down to simplifier tool"
              >
                <span className="tracking-wide uppercase text-xs">
                  Try the Simplifier Tool
                </span>
                <svg
                  className="h-4 w-4 animate-bounce text-[#0D9488] group-hover:text-white group-hover:translate-y-0.5 transition-all duration-200"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="3"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 13l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Right Column: Off-center Interactive step-by-step click-through demo (~60% space) */}
          <div className="lg:col-span-7 relative z-10 w-full flex flex-col items-center lg:items-end">
            <div className="w-full max-w-2xl lg:max-w-none">
              {/* Screen Reader instructions for keyboard accessibility */}
              <span id="demo-instructions" className="sr-only">
                Interactive click-through demo of a lease agreement auto-renewal clause. Use the Back and Next buttons or the timeline steps to explore Clario&apos;s three-layer value in 30 seconds.
              </span>

              {/* Interactive Demo Card */}
              <div
                ref={demoCardRef}
                className="relative bg-white border border-[#E2E8F0] rounded-2xl shadow-xl w-full flex flex-col justify-between overflow-hidden transition-all duration-300 hover:shadow-2xl focus-within:ring-2 focus-within:ring-[#0D9488] focus-within:border-transparent"
                style={{ minHeight: "440px" }}
              >
                {/* Demo Card Header */}
                <div className="px-6 py-4 bg-slate-50 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#0D9488]" />
                    <span className="text-xs font-bold text-[#0F172A] uppercase tracking-widest">
                      Interactive Demo: Clario in Action
                    </span>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${steps[currentStep].badgeClass}`}>
                    {steps[currentStep].badge}
                  </span>
                </div>

                {/* Progress / Step Timeline Navigation */}
                <div className="px-6 pt-4 flex items-center justify-between gap-1.5">
                  {steps.map((step, idx) => {
                    const isActive = idx === currentStep;
                    const isCompleted = idx < currentStep;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCurrentStep(idx)}
                        className="flex-1 group flex flex-col items-start gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0D9488] rounded p-1 transition"
                        aria-label={`Go to step ${idx + 1}: ${step.title}`}
                      >
                        {/* Step indicator bar */}
                        <div className={`h-1.5 w-full rounded-full transition-all duration-300 ${
                          isActive
                            ? "bg-[#0D9488]"
                            : isCompleted
                            ? "bg-[#0D9488]/50"
                            : "bg-slate-200 group-hover:bg-slate-300"
                        }`} />
                        <span className={`text-[9px] font-extrabold uppercase tracking-wider hidden sm:block transition-colors duration-200 ${
                          isActive
                            ? "text-[#0D9488]"
                            : isCompleted
                            ? "text-[#0F766E]/75"
                            : "text-slate-400 group-hover:text-slate-600"
                        }`}>
                          {idx + 1}. {step.title.split(" ")[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Main Content Area */}
                <div className="px-6 py-5 flex-1 flex flex-col justify-center min-h-[220px]">
                  <div className="transition-all duration-200 ease-in-out">
                    {steps[currentStep].content}
                  </div>
                </div>

                {/* Demo Card Footer & Controls */}
                <div className="px-6 py-4 bg-slate-50 border-t border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <span className="text-xs font-bold text-[#475569] tracking-wide text-left">
                    {steps[currentStep].footerText}
                  </span>

                  <div className="flex items-center gap-2.5 self-end sm:self-auto">
                    {/* Back Button */}
                    {currentStep > 0 && (
                      <button
                        type="button"
                        onClick={handleBack}
                        className="px-4 py-2 text-xs font-bold text-[#475569] hover:text-[#0F172A] border border-[#E2E8F0] hover:bg-slate-100 rounded-lg transition duration-150 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-[#0D9488]"
                      >
                        Back
                      </button>
                    )}

                    {/* Next / Restart Button */}
                    <button
                      type="button"
                      onClick={handleNext}
                      className="px-5 py-2 text-xs font-bold bg-[#0D9488] hover:bg-[#0F766E] text-white rounded-lg transition-all duration-150 active:scale-[0.98] shadow-sm hover:shadow focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0D9488]"
                    >
                      {currentStep === steps.length - 1 ? "Restart Demo" : "Next Step →"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Demo Assist Subtitle */}
              <div className="text-center lg:text-right mt-3 text-xs text-[#334155] font-bold">
                💡 Experience Clario&apos;s full three-layer value in 30 seconds above.
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
