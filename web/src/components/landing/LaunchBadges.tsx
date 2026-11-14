import React from "react";

export interface LaunchBadgesProps {
  variant?: "hero" | "footer";
  className?: string;
}

export function LaunchBadges({ variant = "hero", className = "" }: LaunchBadgesProps) {
  const isHero = variant === "hero";

  return (
    <div
      className={`mx-launch-badges-container ${className}`}
      style={{
        marginTop: isHero ? "1.5rem" : "1.25rem",
        marginBottom: isHero ? "0.5rem" : "0.75rem",
      }}
    >
      <span
        style={{
          display: "block",
          fontSize: "10px",
          fontFamily: "var(--font-mono, monospace)",
          textTransform: "uppercase",
          letterSpacing: "0.14em",
          color: "rgba(255, 255, 255, 0.45)",
          marginBottom: "0.6rem",
        }}
      >
        Featured &amp; Launching on
      </span>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "0.65rem",
        }}
      >
        {/* Arc Ecosystem Showcase */}
        <a
          href="https://arc-showcase.thecanteenapp.com/p/mercenta/"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "7px",
            height: "38px",
            padding: "0 12px",
            borderRadius: "8px",
            background: "linear-gradient(135deg, rgba(0, 210, 255, 0.15), rgba(0, 82, 255, 0.18))",
            border: "1px solid rgba(0, 210, 255, 0.4)",
            color: "#e0f2fe",
            fontSize: "12px",
            fontFamily: "var(--font-mono, monospace)",
            textDecoration: "none",
            transition: "all 0.15s ease",
          }}
          className="hover:scale-[1.02] hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(0,210,255,0.25)]"
          title="Featured on Arc Ecosystem Showcase by Canteen"
        >
          <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#38bdf8", boxShadow: "0 0 8px #38bdf8" }} />
          <strong>Arc Showcase</strong>
          <span style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: "10px" }}>CANTEEN</span>
        </a>

        {/* Alchemy Grantee */}
        <a
          href="https://www.alchemy.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "7px",
            height: "38px",
            padding: "0 12px",
            borderRadius: "8px",
            background: "linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(59, 130, 246, 0.15))",
            border: "1px solid rgba(168, 85, 247, 0.4)",
            color: "#f3e8ff",
            fontSize: "12px",
            fontFamily: "var(--font-mono, monospace)",
            textDecoration: "none",
            transition: "all 0.15s ease",
          }}
          className="hover:scale-[1.02] hover:border-purple-400 hover:shadow-[0_0_15px_rgba(168,85,247,0.25)]"
          title="Alchemy Developer Grant Recipient ($1,000)"
        >
          <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#c084fc", boxShadow: "0 0 8px #c084fc" }} />
          <strong>Alchemy Grantee</strong>
          <span style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: "10px" }}>$1,000</span>
        </a>

        {/* Product Hunt */}
        <a
          href="https://www.producthunt.com/products/mercenta?embed=true&utm_source=badge-featured&utm_medium=badge&utm_campaign=badge-mercenta"
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: "inline-block", transition: "transform 0.15s ease, opacity 0.15s ease" }}
          className="hover:scale-[1.02] hover:opacity-100 opacity-90"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt="Mercenta - Buy Gift Cards with USDC | Product Hunt"
            src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1292489&theme=dark&t=1792949912834"
            style={{ height: "38px", width: "auto", display: "block" }}
          />
        </a>

        {/* Uneed (Dark theme) */}
        <a
          href="https://www.uneed.best/tool/mercenta"
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: "inline-block", transition: "transform 0.15s ease, opacity 0.15s ease" }}
          className="hover:scale-[1.02] hover:opacity-100 opacity-90"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://www.uneed.best/EMBED3.png"
            alt="Launching Soon on Uneed"
            style={{ height: "38px", width: "auto", display: "block", borderRadius: "6px" }}
          />
        </a>

        {/* ConfettiSaaS (Dark theme) */}
        <a
          href="https://confettisaas.com/saas/mercenta-xyz?ref=badge"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="View Mercenta on ConfettiSaaS"
          style={{ display: "inline-block", transition: "transform 0.15s ease, opacity 0.15s ease" }}
          className="hover:scale-[1.02] hover:opacity-100 opacity-90"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://confettisaas.com/badge-dark.svg"
            alt="Mercenta on ConfettiSaaS"
            loading="lazy"
            style={{ height: "38px", width: "auto", display: "block" }}
          />
        </a>

        {/* ScrollLaunch */}
        <a
          href="https://www.scrolllaunch.com/products/mercenta?ref=badge"
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: "inline-block", transition: "transform 0.15s ease, opacity 0.15s ease" }}
          className="hover:scale-[1.02] hover:opacity-100 opacity-90"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://www.scrolllaunch.com/api/badge/mercenta"
            alt="Featured on ScrollLaunch"
            loading="lazy"
            style={{ height: "38px", width: "auto", display: "block" }}
          />
        </a>

        {/* FoundrList */}
        <a
          href="https://www.foundrlist.com/product/mercenta?utm_source=badge&utm_medium=embed"
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: "inline-block", transition: "transform 0.15s ease, opacity 0.15s ease" }}
          className="hover:scale-[1.02] hover:opacity-100 opacity-90"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://www.foundrlist.com/api/badge/mercenta"
            alt="Featured on FoundrList"
            style={{ height: "38px", width: "auto", display: "block" }}
          />
        </a>

        {/* Twelve Tools (Dark theme) */}
        <a
          href="https://twelve.tools"
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: "inline-block", transition: "transform 0.15s ease, opacity 0.15s ease" }}
          className="hover:scale-[1.02] hover:opacity-100 opacity-90"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://twelve.tools/badge1-dark.svg"
            alt="Featured on Twelve Tools"
            style={{ height: "38px", width: "auto", display: "block" }}
          />
        </a>
      </div>
    </div>
  );
}
