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
