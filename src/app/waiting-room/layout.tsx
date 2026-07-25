import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Waiting Room — Clario Companion Mode",
  description: "A collaborative, dual-reader relational space designed for caregivers, teachers, and families to analyze and discuss confusing documents side by side.",
  openGraph: {
    title: "The Waiting Room — Clario Companion Mode",
    description: "A collaborative, dual-reader relational space designed for caregivers, teachers, and families to analyze and discuss confusing documents side by side.",
    type: "website",
    images: [{ url: "/favicon.ico" }],
  },
  twitter: {
    card: "summary",
    title: "The Waiting Room — Clario Companion Mode",
    description: "Cooperative, conversational workspace for two people reading official documents together.",
  },
};

export default function WaitingRoomLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
