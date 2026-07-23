import React from "react";

interface ClarioLogoProps {
  showWordmark?: boolean;
  size?: "sm" | "md" | "lg" | "custom";
  customHeightClass?: string; // e.g. "h-8 w-auto"
  wordmarkClass?: string;
  className?: string;
}

export function ClarioLogo({
  showWordmark = true,
  size = "md",
  customHeightClass = "",
  wordmarkClass = "",
  className = "",
}: ClarioLogoProps) {
  // Sizing definitions for the SVG mark
  const sizeClasses = {
    sm: "h-7 w-auto", // ~28px, perfect for header
    md: "h-9 w-auto", // ~36px, standard
    lg: "h-14 w-auto", // ~56px, bold closing footer anchor
    custom: customHeightClass,
  };

  const svgClass = sizeClasses[size] || sizeClasses.md;

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Inline SVG Logo Mark: The Resolved Loop */}
      <svg
        className={`${svgClass} shrink-0`}
        viewBox="0 0 48 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Tangled / Confused Loop (Slate-900 / #0F172A) */}
        <path
          d="M 6 18 C 6 10, 13 6, 17 6 C 23 6, 23 20, 17 20 C 13 20, 10 16, 10 12 C 10 8, 14 6, 18 8"
          stroke="#0F172A"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Resolved Sweep (Teal-600 / #0D9488) */}
        <path
          d="M 18 8 C 22 10, 26 24, 34 24 C 39 24, 42 18, 42 12"
          stroke="#0D9488"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Core Dot (Teal-600 / #0D9488) */}
        <circle cx="42" cy="12" r="3.2" fill="#0D9488" />
      </svg>

      {/* Wordmark Lockup */}
      {showWordmark && (
        <span
          className={`font-semibold tracking-wider text-[#0F172A] ${
            size === "sm"
              ? "text-xl md:text-2xl"
              : size === "lg"
              ? "text-3xl md:text-4xl font-extrabold"
              : "text-2xl md:text-3xl"
          } ${wordmarkClass}`}
        >
          Clario
        </span>
      )}
    </div>
  );
}
