import type {Metadata} from "next";
import "./landing-v2.css";
import "./scroll-story.css";
import "./landing-expanded.css";
import FlagshipLanding from "@/components/landing/FlagshipLanding";

export const metadata: Metadata = {
  title: "Mercenta | Buy Gift Cards with USDC",
  description:
    "Buy gift cards with stablecoin USDC on Base and Solana. Steam, PSN, Xbox and more codes with clear pricing, verified availability and agent tooling.",
  keywords: [
    "buy gift cards with stablecoin",
    "buy steam gift card with usdc",
    "xbox gift card usdc",
    "playstation gift card usdc",
    "gift card wholesale api",
    "digital goods supplier usdc",
    "usdc gift cards",
  ],
  alternates: {canonical: "/"},
  openGraph: {
    title: "Mercenta | Buy Gift Cards with USDC",
    description:
      "Buy gift cards with stablecoin USDC on Base and Solana. Steam, PSN, Xbox and more codes with clear pricing, verified availability and agent tooling.",
    url: "/",
    type: "website",
  },
};

export default function Home() {
  return <FlagshipLanding />;
}
