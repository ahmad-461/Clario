import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Untangle Log — Clario Transparency Report",
  description: "Live, anonymized impact statistics and trends showing risk detection rates and tone mode preferences across the Clario ecosystem.",
  openGraph: {
    title: "The Untangle Log — Clario Transparency Report",
    description: "Live, anonymized impact statistics and trends showing risk detection rates and tone mode preferences across the Clario ecosystem.",
    type: "website",
    images: [{ url: "/favicon.ico" }],
  },
  twitter: {
    card: "summary",
    title: "The Untangle Log — Clario Transparency Report",
    description: "Honest, transparent statistics of document analyses completed on Clario.",
  },
};

export default function UntangleLogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
