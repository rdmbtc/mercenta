import type { Metadata, Viewport } from "next";
import { Geist, JetBrains_Mono, Sora } from "next/font/google";
import "./globals.css";

const sans = Geist({ variable: "--font-geist-sans", subsets: ["latin"], display: "swap" });
const mono = JetBrains_Mono({ variable: "--font-mono", subsets: ["latin"], display: "swap" });
// Display face for headings only. Sora ships the latin subset this build needs, and the CSS
// fallback is a system sans, so a failed fetch degrades to a plain heading rather than a serif.
const display = Sora({ variable: "--font-display", subsets: ["latin"], weight: ["500", "600", "700"], display: "swap" });

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
  themeColor: "#06070a",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Font variables live on <html> so :root tokens such as --sans can resolve them.
  return (
    <html lang="en" className={sans.variable + " " + display.variable + " " + mono.variable}>
      <body>
        {/* One non-interactive grain plane for the whole document. */}
        <div className="grain" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
