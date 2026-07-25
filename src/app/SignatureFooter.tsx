"use client";

import React, { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { ClarioLogo } from "./ClarioLogo";

export function SignatureFooter() {
  const [pathLength, setPathLength] = useState<number>(0);
  const [isIntersecting, setIsIntersecting] = useState<boolean>(false);

  const pathRef = useRef<SVGPathElement>(null);
  const containerRef = useRef<HTMLElement>(null);

  // Measure path length dynamically
  useEffect(() => {
    if (pathRef.current) {
      try {
        setPathLength(pathRef.current.getTotalLength());
      } catch (err) {
        console.error("Failed to measure SVG path length:", err);
        setPathLength(1350); // Robust fallback length for this path
      }
    }
  }, []);

  // Set up Intersection Observer for scroll-triggered drawing animation
  useEffect(() => {
    // Respect user's motion preferences immediately
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
      { threshold: 0.1 } // Triggers when at least 10% of footer is visible
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
  }, []);

  const svgPath = "M 0 60 C 50 30, 80 10, 110 60 C 120 80, 130 110, 150 110 C 170 110, 170 20, 190 20 C 210 20, 220 90, 240 90 C 260 90, 270 40, 290 40 C 310 40, 310 80, 330 80 C 350 80, 360 30, 380 30 C 410 30, 430 90, 460 90 C 490 90, 510 50, 540 60 L 600 60 L 1200 60";

  return (
    <footer
      ref={containerRef}
      className="w-full bg-[#F4F6F9] border-t border-[#E2E8F0] relative overflow-hidden z-10"
    >
      {/* Background Atmosphere - elegant, high-contrast, calm */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#0D9488]/5 rounded-full blur-3xl pointer-events-none" />

      {/* UNIFIED RESPONSIBLE LAYOUT - Combines Desktop and Mobile into a single DOM footprint */}
      <div className="relative max-w-7xl w-full mx-auto px-6 md:px-12 lg:px-16 flex flex-col lg:block lg:h-[380px] py-12 lg:py-0 gap-8 lg:gap-0">

        {/* Above-the-line sentence */}
        <div className="lg:absolute lg:top-12 lg:left-12 xl:left-16 lg:max-w-md w-full">
          <p className="font-display text-[#0F172A] font-medium leading-snug lg:leading-tight text-xl md:text-2xl lg:text-2xl xl:text-3xl text-left md:text-center lg:text-left">
            Every day, someone hands you something you don&apos;t understand.
          </p>
        </div>

        {/* Full-bleed "The Untangled Line" SVG horizon container */}
        <div className="relative lg:absolute lg:inset-x-0 lg:top-1/2 lg:-translate-y-1/2 h-[120px] w-full my-2 lg:my-0">
          <svg
            className="w-full h-full pointer-events-none"
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="untangledGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0F172A" />
                <stop offset="50%" stopColor="#0F172A" />
                <stop offset="50%" stopColor="#0D9488" />
                <stop offset="100%" stopColor="#0D9488" />
              </linearGradient>
            </defs>
            <path
              ref={pathRef}
              d={svgPath}
              stroke="url(#untangledGradient)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                strokeDasharray: pathLength || 1350,
                strokeDashoffset: isIntersecting ? 0 : (pathLength || 1350),
                transition: "stroke-dashoffset 2.2s cubic-bezier(0.25, 1, 0.5, 1)",
              }}
            />
          </svg>

          {/* Breakout Logo Mark exactly at the transition midpoint */}
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#F4F6F9] p-2.5 lg:p-3 rounded-full z-20 border border-[#E2E8F0] shadow-sm flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-[0_0_20px_rgba(13,148,136,0.25)] hover:border-[#0D9488]/30"
            title="Clario"
          >
            <ClarioLogo showWordmark={false} size="md" />
          </div>
        </div>

        {/* Below-the-line sentence */}
        <div className="lg:absolute lg:bottom-16 lg:right-12 xl:right-16 lg:max-w-md w-full text-right md:text-center lg:text-right self-end md:self-auto">
          <p className="font-display text-[#0F172A] font-medium leading-snug lg:leading-tight text-xl md:text-2xl lg:text-2xl xl:text-3xl">
            Clario makes sure you understand before you sign, click, or trust.
          </p>
        </div>

        {/* Quiet footer details at the bottom */}
        <div className="w-full border-t border-[#E2E8F0] lg:border-[#E2E8F0]/50 pt-6 lg:pt-3 flex flex-col lg:flex-row justify-between items-center text-xs text-[#334155] font-semibold tracking-wide text-center lg:text-left gap-4 lg:gap-0 lg:absolute lg:bottom-4 lg:inset-x-12 xl:inset-x-16 lg:px-0">
          <p className="leading-relaxed max-w-md lg:max-w-[45%] mx-auto lg:mx-0 text-center lg:text-left">
            Privacy-first by design. Clario processes documents in real-time. We never store raw text or file uploads for guest users, and only save them for signed-in users who choose to keep a personal history.
          </p>
          <p className="my-1 lg:my-0 lg:text-center">
            <Link
              href="/untangle-log"
              className="hover:text-[#0D9488] transition duration-150 underline decoration-dotted underline-offset-4 font-bold"
            >
              The Untangle Log
            </Link>
          </p>
          <p className="whitespace-nowrap text-[#334155]/60 lg:text-[#334155] max-w-md lg:max-w-[45%] mx-auto lg:mx-0 text-center lg:text-right">
            &copy; {new Date().getFullYear()} Clario. All rights reserved.
          </p>
        </div>

      </div>
    </footer>
  );
}
