import type { Metadata, Viewport } from "next";
import { DM_Serif_Display, Geist, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import "./product.css";
import "@/components/official-contacts.css";
import "@/components/product/brand-artwork.css";
import "@/components/product/test-checkout.css";
import "./liquidity.css";
import "@/components/product/catalog-families.css";
import "@/components/product/workspace-guide.css";
import '@/components/product/experience-polish.css';
import Atmosphere from "@/components/Atmosphere";
import "@/components/experience/experience.css";
import {ToastStack,PrivacyConsent} from "@/components/experience/Primitives";

const sans = Geist({ variable: "--font-geist-sans", subsets: ["latin"], display: "swap" });
const mono = JetBrains_Mono({ variable: "--font-mono", subsets: ["latin"], display: "swap" });
// Display face is kept separate from the functional UI and mono data faces.
const display = DM_Serif_Display({ variable: "--font-display", subsets: ["latin"], weight: "400", display: "swap" });

const TITLE = "Mercenta — Commerce, with control.";
const DESCRIPTION =
  "Digital products, your region and a bounded AI operator. Explore Mercenta’s catalogue and Testnet purchase journey. Mainnet payments remain closed; refunds are reviewed manually by Mercenta Support.";

export const metadata: Metadata = {
  icons: { icon: [{url:'/favicon.ico?v=mercenta-2',sizes:'any'}, {url:'/favicon-32.png',type:'image/png',sizes:'32x32'}], apple: [{url:'/apple-touch-icon.png',sizes:'180x180'}] },
  manifest: '/site.webmanifest',
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
    description: "Explore illustrative agent purchases governed by spend, margin and supplier rules. Pre-launch preview; no live orders or settlement.",
    images: [{ url: "/mercenta-logo.png", width: 1254, height: 1254, alt: "Mercenta" }],
    url: "https://mercenta.xyz",
  },
  twitter: {
    card: "summary",
    site: "@mercentaxyz",
    creator: "@mercentaxyz",
    title: TITLE,
    description: "Explore illustrative agent purchases governed by spend, margin and supplier rules. Pre-launch preview; no live orders or settlement.",
    images: ["/mercenta-logo.png"],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Font variables live on <html> so :root tokens such as --sans can resolve them.
  return (
    <html lang="en" className={sans.variable + " " + display.variable + " " + mono.variable}>
      <body>
        {/* One non-interactive atmosphere plane for the whole document. */}
        <Atmosphere />
        {children}
        <ToastStack/>
        <PrivacyConsent/>
      </body>
    </html>
  );
}
