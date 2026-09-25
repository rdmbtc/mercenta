import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
const sans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
export const metadata: Metadata = {
  metadataBase: new URL("https://mercenta.xyz"),
  title: "Mercenta — Commerce, with control.",
  description:
    "A policy-controlled commerce layer for software agents: wholesale business inputs, deterministic spend rules evaluated before anything is authorised, and USDC settlement recorded with delivery. Pre-launch preview, illustrative data, no live funds.",
  openGraph: {
    title: "Mercenta — Commerce, with control.",
    description:
      "Business inputs bought wholesale, sold at a margin you set, under spend rules your agents cannot bypass.",
    images: ["/mercenta-logo.png"],
    url: "https://mercenta.xyz",
  },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={sans.variable + " " + mono.variable}>{children}</body>
    </html>
  );
}
