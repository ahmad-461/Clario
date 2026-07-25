import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Clario — Our Mission and Purpose",
  description: "Read about Clario's mission to make legalese, dense contracts, and confusing alerts accessible to students, teachers, elderly users, and caregivers.",
  openGraph: {
    title: "About Clario — Our Mission and Purpose",
    description: "Read about Clario's mission to make legalese, dense contracts, and confusing alerts accessible to students, teachers, elderly users, and caregivers.",
    type: "website",
    images: [{ url: "/favicon.ico" }],
  },
  twitter: {
    card: "summary",
    title: "About Clario — Our Mission and Purpose",
    description: "Our story, mission, and dedication to accessible language and genuine trust.",
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
