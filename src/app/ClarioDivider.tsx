import React from "react";

export function ClarioDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`w-full flex items-center justify-center ${className}`} aria-hidden="true">
      {/*
        Custom Threshold Divider SVG:
        Starts on the left with a subtle, miniature double-loop wavy curve,
        then seamlessly levels into a clean straight line across the rest of the layout.
      */}
      <svg
        className="w-full h-8 text-[#0F172A]"
        viewBox="0 0 600 32"
        preserveAspectRatio="none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Transitioning Line: knot structure on the left (Slate-900), flat line to the right */}
        <path
          d="M 0 16
             L 20 16
             C 25 10, 30 10, 35 16
             C 40 22, 45 22, 50 16
             C 55 10, 60 10, 65 16
             L 600 16"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeOpacity="0.12"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
