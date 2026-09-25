import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
const sans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
export const metadata: Metadata = {
  metadataBase: new URL("https://mercenta.xyz"),
  title: "Mercenta — Sell. Settle. Fulfill.",
  description: "A digital store with an AI assistant, policy-controlled fulfillment and planned USDC payments on Arc Network. Join the Mercenta early-access pilot.",
  openGraph: { title: "Mercenta — Your business, on autopilot.", description: "Digital commerce with boundaries. Sell. Settle. Fulfill.", images: ["/mercenta-logo.png"], url: "https://mercenta.xyz" },
};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="en"><body className={`${sans.variable} ${mono.variable}`}>{children}</body></html>}
