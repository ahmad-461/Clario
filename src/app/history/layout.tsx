import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Explanation History — Clario",
  description: "Securely review, print, copy, or delete your previously simplified contracts, messages, and document analyses.",
  openGraph: {
    title: "My Explanation History — Clario",
    description: "Securely review, print, copy, or delete your previously simplified contracts, messages, and document analyses.",
    type: "website",
    images: [{ url: "/favicon.ico" }],
  },
  twitter: {
    card: "summary",
    title: "My Explanation History — Clario",
    description: "Access your personal history of untangled documents safely and securely.",
  },
};

export default function HistoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
