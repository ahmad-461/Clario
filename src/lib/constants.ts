/**
 * Clario Shared Constants and Theme Configuration
 * Centralized for code quality and visual consistency.
 */

export const CHARACTER_LIMIT = 5000;
export const FILE_SIZE_LIMIT_BYTES = 5 * 1024 * 1024; // 5MB

// Core Brand Theme Colors (Tailwind Reference Only)
export const COLOR_PRIMARY_TEAL = "#0D9488";
export const COLOR_PRIMARY_TEAL_ACTIVE = "#0F766E";
export const COLOR_SLATE_DARK = "#0F172A";
export const COLOR_SLATE_INACTIVE = "#475569";
export const COLOR_TRACK_BG = "#F4F6F9";

// Unified Tailwind CSS Class Badges for Visual Consistency
export const BADGE_CLASSES = {
  CONFIDENCE: {
    HIGH: "bg-[#EFF6FF] text-[#1E40AF] border-[#1E40AF]/15",
    MEDIUM: "bg-[#F1F5F9] text-[#475569] border-[#475569]/15",
    LOW: "bg-[#FFF7ED] text-[#9A3412] border-[#9A3412]/15",
  },
  RISK: {
    LOW: "bg-[#E6F4EA] text-[#137333] border-[#137333]/15",
    MEDIUM: "bg-[#FEF7E0] text-[#78350F] border-[#78350F]/15",
    HIGH: "bg-[#FCE8E6] text-[#7F1D1D] border-[#7F1D1D]/15",
  },
  MANIPULATION: "bg-[#F3E8FF] text-[#6B21A8] border-[#6B21A8]/15",
  OMISSIONS: "bg-[#F8FAFC] text-[#334155] border-[#94A3B8]/30",
  TONE: "bg-[#F0FDFA] text-[#0F766E] border-[#0D9488]/10",
};

// jsPDF and html2canvas PDF Export Style Constants
export const PDF_STYLES = {
  CONFIDENCE: {
    high: { backgroundColor: "#EFF6FF", border: "1.5px solid #1E40AF", color: "#1E40AF" },
    medium: { backgroundColor: "#F1F5F9", border: "1.5px solid #475569", color: "#475569" },
    low: { backgroundColor: "#FFF7ED", border: "1.5px solid #9A3412", color: "#9A3412" },
  },
  RISK: {
    high: { backgroundColor: "#FCE8E6", border: "1.5px solid #C5221F", color: "#7F1D1D" },
    medium: { backgroundColor: "#FEF7E0", border: "1.5px solid #B06000", color: "#78350F" },
  },
  MANIPULATION: { backgroundColor: "#F3E8FF", border: "1.5px solid #6B21A8", color: "#6B21A8" },
  OMISSIONS: { backgroundColor: "#F8FAFC", border: "1.5px dashed #94A3B8", color: "#334155" },
};
