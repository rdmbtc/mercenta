import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const sans = Geist({ variable: "--font-geist-sans", subsets: ["latin"], display: "swap" });
const mono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"], display: "swap" });

const TITLE = "Mercenta — Commerce, with control.";
const DESCRIPTION =
  "The policy-controlled commerce layer for software agents. Agents propose purchases; deterministic spend, margin and supplier rules decide what is authorised; USDC settlement and delivery land on one order record. Pre-launch preview with illustrative data and no live funds.";

export const metadata: Metadata = {
  metadataBase: new URL("https://mercenta.xyz"),
  title: { default: TITLE, template: "%s · Mercenta" },
  description: DESCRIPTION,
  applicationName: "Mercenta",
  keywords: [
    "agentic commerce",
    "AI agent procurement",
    "policy engine",
    "USDC settlement",
    "spend controls",
    "margin floor",
    "autonomous agents",
    "Mercenta",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Mercenta",
    title: TITLE,
    description: "Business inputs bought wholesale, sold at a margin you set, under spend rules your agents cannot bypass.",
    images: [{ url: "/mercenta-logo.png", width: 1254, height: 1254, alt: "Mercenta" }],
    url: "https://mercenta.xyz",
  },
  twitter: {
    card: "summary",
    site: "@mercentaxyz",
    creator: "@mercentaxyz",
    title: TITLE,
    description: "Business inputs bought wholesale, sold at a margin you set, under spend rules your agents cannot bypass.",
    images: ["/mercenta-logo.png"],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#04060c",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Font variables live on <html> so :root tokens such as --sans can resolve them.
  return (
    <html lang="en" className={sans.variable + " " + mono.variable}>
      <body>{children}</body>
    </html>
  );
}
