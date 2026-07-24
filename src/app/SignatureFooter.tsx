"use client";

import React, { useRef, useEffect, useState } from "react";
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

      {/* DESKTOP LAYOUT (lg breakpoint and up) */}
      <div className="hidden lg:block relative max-w-7xl w-full mx-auto px-12 lg:px-16 h-[380px]">
        {/* Above-the-line sentence (left-aligned, over the chaotic portion) */}
        <div className="absolute top-12 left-12 max-w-md">
          <p className="font-display text-2xl lg:text-3xl text-[#0F172A] leading-tight font-medium">
            Every day, someone hands you something you don&apos;t understand.
          </p>
        </div>

        {/* Full-bleed "The Untangled Line" SVG horizon container */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[120px] w-full pointer-events-none">
          <svg
            className="w-full h-full"
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
        </div>

        {/* Breakout Logo Mark exactly at the transition midpoint (50% horizontal) */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#F4F6F9] p-3 rounded-full z-20 border border-[#E2E8F0] shadow-sm flex items-center justify-center transition-transform duration-300 hover:scale-110"
          title="Clario"
        >
          <ClarioLogo showWordmark={false} size="md" />
        </div>

        {/* Below-the-line sentence (right-aligned, over the resolved portion) */}
        <div className="absolute bottom-16 right-12 max-w-md text-right">
          <p className="font-display text-2xl lg:text-3xl text-[#0F172A] leading-tight font-medium">
            Clario makes sure that&apos;s not the end of the story.
          </p>
        </div>

        {/* Quiet footer details at the absolute bottom */}
        <div className="absolute bottom-4 left-0 right-0 px-12 lg:px-16 flex justify-between items-center text-xs text-[#334155] font-semibold tracking-wide border-t border-[#E2E8F0]/50 pt-3">
          <p className="max-w-xl text-left">
            We value your trust. Clario processes all documents in real-time and never stores your raw text or file uploads.
          </p>
          <p className="whitespace-nowrap">
            &copy; {new Date().getFullYear()} Clario. All rights reserved.
          </p>
        </div>
      </div>

      {/* MOBILE / TABLET LAYOUT (< lg breakpoint) */}
      <div className="block lg:hidden max-w-2xl mx-auto px-6 py-12 flex flex-col gap-8">
        {/* Above-the-line sentence */}
        <p className="font-display text-xl md:text-2xl text-[#0F172A] leading-snug text-left md:text-center w-full font-medium">
          Every day, someone hands you something you don&apos;t understand.
        </p>

        {/* SVG horizon container (height-confined, with absolute-centered Logo Mark) */}
        <div className="relative w-full h-[120px] my-2">
          <svg
            className="w-full h-full"
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="untangledGradientMobile" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0F172A" />
                <stop offset="50%" stopColor="#0F172A" />
                <stop offset="50%" stopColor="#0D9488" />
                <stop offset="100%" stopColor="#0D9488" />
              </linearGradient>
            </defs>
            <path
              d={svgPath}
              stroke="url(#untangledGradientMobile)"
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

          {/* Absolute-centered Logo Mark on the line */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#F4F6F9] p-2.5 rounded-full z-20 border border-[#E2E8F0] shadow-sm flex items-center justify-center">
            <ClarioLogo showWordmark={false} size="md" />
          </div>
        </div>

        {/* Below-the-line sentence */}
        <p className="font-display text-xl md:text-2xl text-[#0F172A] leading-snug text-right md:text-center w-full font-medium self-end md:self-auto">
          Clario makes sure that&apos;s not the end of the story.
        </p>

        {/* Quiet details block */}
        <div className="flex flex-col gap-4 text-xs text-[#334155] font-semibold tracking-wide border-t border-[#E2E8F0] pt-6 text-center">
          <p className="leading-relaxed max-w-md mx-auto">
            We value your trust. Clario processes all documents in real-time and never stores your raw text or file uploads.
          </p>
          <p className="text-[#334155]/60 mt-2">
            &copy; {new Date().getFullYear()} Clario. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
