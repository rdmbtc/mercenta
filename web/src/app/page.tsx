import type {Metadata} from "next";
import "./landing-v2.css";
import "./scroll-story.css";
import "./landing-expanded.css";
import FlagshipLanding from "@/components/landing/FlagshipLanding";

export const metadata: Metadata = {
  title: "Mercenta | Autonomous Business Operator & Digital Goods Clearinghouse on Arc",
  description:
    "Institutional digital goods clearinghouse on Arc settled natively in USDC. Deterministic 5-step policy engine, x402 machine-to-machine commerce, and zero-inventory feeds for AI agents.",
  keywords: [
    "autonomous business operator",
    "arc network",
    "circle agent stack",
    "usdc settlement",
    "x402 machine commerce",
    "digital goods clearinghouse",
    "tameion hackathon",
    "policy engine",
    "wholesale digital goods",
    "agentic commerce",
  ],
  alternates: {canonical: "/"},
  openGraph: {
    title: "Mercenta | Autonomous Business Operator & Digital Goods Clearinghouse on Arc",
    description:
      "Institutional digital goods clearinghouse on Arc settled natively in USDC. Deterministic 5-step policy engine, x402 machine-to-machine commerce, and zero-inventory feeds for AI agents.",
    url: "/",
    type: "website",
  },
};

export default function Home() {
  return <FlagshipLanding />;
}
