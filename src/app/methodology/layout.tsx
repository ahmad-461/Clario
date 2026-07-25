import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Clario Methodology — Real-time Transparent AI Analysis",
  description: "Learn how Clario leverages Google Gemini AI to analyze confusing texts across three clear conceptual layers with explicit legal/financial limitations.",
  openGraph: {
    title: "Clario Methodology — Real-time Transparent AI Analysis",
    description: "Learn how Clario leverages Google Gemini AI to analyze confusing texts across three clear conceptual layers with explicit legal/financial limitations.",
    type: "website",
    images: [{ url: "/favicon.ico" }],
  },
  twitter: {
    card: "summary",
    title: "Clario Methodology — Real-time Transparent AI Analysis",
    description: "Transparent breakdown of our AI engines, 3-layer analysis, and limitations.",
  },
};

export default function MethodologyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
