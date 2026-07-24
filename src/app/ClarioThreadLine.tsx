"use client";

import React from "react";

export function ClarioThreadLine() {
  return (
    <>
      {/* Desktop Winding Thread Line */}
      <div className="absolute inset-0 pointer-events-none z-0 hidden lg:block overflow-hidden">
        <svg
          className="w-full min-h-[4000px]"
          viewBox="0 0 1440 4000"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
        >
          {/* Main narrative SVG thread path */}
          <path
            d="M 120 180
               C 350 180, 500 500, 1100 300
               S 1300 800, 900 1100
               S 100 1400, 300 1800
               S 1200 2200, 1100 2600
               S 200 2900, 400 3400
               C 500 3600, 800 3700, 1150 3850"
            stroke="#0D9488"
            strokeWidth="2"
            strokeOpacity="0.18"
            strokeLinecap="round"
            strokeDasharray="6 6"
          />

          {/* Subtly intertwined secondary thin strand */}
          <path
            d="M 110 190
               C 340 190, 490 510, 1090 310
               S 1290 810, 890 1110
               S 90 1410, 290 1810
               S 1190 2210, 1090 2610
               S 190 2910, 390 3410"
            stroke="#0F172A"
            strokeWidth="1"
            strokeOpacity="0.12"
            strokeLinecap="round"
          />

          {/* A few tiny decorative intersection circles */}
          <circle cx="1100" cy="300" r="4" fill="#0D9488" fillOpacity="0.4" />
          <circle cx="300" cy="1800" r="4" fill="#0D9488" fillOpacity="0.3" />
          <circle cx="1100" cy="2600" r="4" fill="#0D9488" fillOpacity="0.4" />
        </svg>
      </div>

      {/* Mobile Simplified Short Connection Stroke (Hero to first elements) */}
      <div className="absolute inset-x-0 top-0 pointer-events-none z-0 block lg:hidden h-[1200px] overflow-hidden">
        <svg
          className="w-full h-full"
          viewBox="0 0 375 1200"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
        >
          <path
            d="M 40 150
               C 100 200, 320 400, 200 650
               S 50 850, 180 1100"
            stroke="#0D9488"
            strokeWidth="1.5"
            strokeOpacity="0.15"
            strokeLinecap="round"
            strokeDasharray="4 4"
          />
        </svg>
      </div>
    </>
  );
}
