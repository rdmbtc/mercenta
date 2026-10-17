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
import '@/components/experience/mercenta-ledger-polish.css';
import {ToastStack,PrivacyConsent} from "@/components/experience/Primitives";

const sans = Geist({ variable: "--font-geist-sans", subsets: ["latin"], display: "swap" });
const mono = JetBrains_Mono({ variable: "--font-mono", subsets: ["latin"], display: "swap" });
// Display face is kept separate from the functional UI and mono data faces.
const display = DM_Serif_Display({ variable: "--font-display", subsets: ["latin"], weight: "400", display: "swap" });

const TITLE = "Mercenta | Agentic Commerce with Spend Control";
const DESCRIPTION =
 "Buy gaming, streaming and cloud gift cards with USDC. Built on Arc Network, with multi-chain settlement. Agent checkout with spend limits. Mainnet closed; refunds via Support.";

export const metadata: Metadata = {
  icons: { icon: [{url:'/favicon.ico?v=mercenta-2',sizes:'any'}, {url:'/favicon-32.png',type:'image/png',sizes:'32x32'}], apple: [{url:'/apple-touch-icon.png',sizes:'180x180'}] },
  manifest: '/site.webmanifest',
  metadataBase: new URL("https://mercenta.xyz"),
  title: { default: TITLE, template: "%s | Mercenta" },
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
    "buy steam gift card with usdc",
    "steam wallet code crypto",
    "steam gift card base network",
    "playstation gift card usdc",
    "psn card crypto payment",
    "psn top up solana",
    "xbox gift card usdc",
    "xbox game pass code crypto",
    "riot points card usdc",
    "roblox gift card crypto",
    "blizzard battle.net balance usdc",
    "razer gold pin crypto",
    "epic games gift card usdc",
    "buy gift cards with stablecoin",
    "gift card wholesale api",
    "digital goods supplier usdc",
    "apple gift card usdc",
    "access apple gift card with crypto payment",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Mercenta",
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: "/og-cover.png", width: 1200, height: 630, alt: "Mercenta - buy gift cards with USDC" }],
    url: "https://mercenta.xyz",
  },
  twitter: {
    card: "summary_large_image",
    site: "@mercentaxyz",
    creator: "@mercentaxyz",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og-cover.png"],
  },
  robots: { index: true, follow: true },
};
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://mercenta.xyz/#organization",
      name: "Mercenta",
      url: "https://mercenta.xyz",
      logo: { "@type": "ImageObject", url: "https://mercenta.xyz/mercenta-logo.png" },
      sameAs: ["https://x.com/mercentaxyz"],
    },
    {
      "@type": "WebSite",
      "@id": "https://mercenta.xyz/#website",
      url: "https://mercenta.xyz",
      name: "Mercenta",
      description: DESCRIPTION,
      publisher: { "@id": "https://mercenta.xyz/#organization" },
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: "https://mercenta.xyz/catalog?q={search_term_string}" },
        "query-input": "required name=search_term_string",
      },
    },
  ],
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* One non-interactive atmosphere plane for the whole document. */}
        <Atmosphere />
        {children}
        <ToastStack/>
        <PrivacyConsent/>
      </body>
    </html>
  );
}
