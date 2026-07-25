import type { Metadata } from "next";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Clario — Untangle Confusing Information",
  description: "Clario untangles confusing documents, legalese, and fine print so you can understand before you sign, click, or trust.",
  openGraph: {
    title: "Clario — Untangle Confusing Information",
    description: "Clario untangles confusing documents, legalese, and fine print so you can understand before you sign, click, or trust.",
    type: "website",
    images: [{ url: "/favicon.ico" }],
  },
  twitter: {
    card: "summary",
    title: "Clario — Untangle Confusing Information",
    description: "Clario untangles confusing documents, legalese, and fine print so you can understand before you sign, click, or trust.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Clario",
    "description": "Clario untangles confusing documents, legalese, and fine print so you can understand before you sign, click, or trust.",
    "applicationCategory": "EducationalApplication",
    "operatingSystem": "All",
    "offers": {
      "@type": "Offer",
      "price": "0.00",
      "priceCurrency": "USD"
    }
  };

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
