"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Menu, X } from "./Icons";

const NAV = [
  { label: "How it works", href: "#how" },
  { label: "Sandbox", href: "#sandbox" },
  { label: "Catalog", href: "#catalog" },
  { label: "Receipts", href: "#receipts" },
];

export function Logo() {
  return (
    <Link href="/" className="ml-logo" aria-label="Mercenta home">
      <span className="ml-logo__mark" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
          <path d="M4 18V7l8 6 8-6v11" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      mercenta
    </Link>
  );
}

export default function LandingHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={"ml-header" + (scrolled ? " is-scrolled" : "") + (open ? " is-open" : "")}>
      <div className="ml-header__inner">
        <Logo />
        <nav className="ml-nav" aria-label="Primary">
          {NAV.map((n) => (
            <a key={n.href} href={n.href} onClick={() => setOpen(false)}>
              {n.label}
            </a>
          ))}
        </nav>
        <div className="ml-header__actions">
          <a href="/catalog" className="ml-btn ml-btn--ghost ml-hide-sm">
            Catalog
          </a>
          <a href="/app" className="ml-btn ml-btn--primary ml-btn--sm">
            Open console <ArrowRight size={15} />
          </a>
          <button
            type="button"
            className="ml-burger"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
    </header>
  );
}
