"use client";

import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { ArrowRight, ArrowUpRight, ChevronDown, Menu, X } from "lucide-react";

type Link = { label: string; href: string; id: string };

export default function SiteHeader({
  sections,
  ecosystem,
}: {
  sections: Link[];
  ecosystem: Array<{ host: string; role: string }>;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string>("");
  const [ecoOpen, setEcoOpen] = useState(false);
  const ecoRef = useRef<HTMLDivElement>(null);

  // Scroll detection
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Section active tracking
  useEffect(() => {
    const targets = sections
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => el !== null);
    if (targets.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 },
    );
    targets.forEach((t) => observer.observe(t));
    return () => observer.disconnect();
  }, [sections]);

  // Mobile menu keyboard + scroll lock
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    document.documentElement.classList.add("menu-open");
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.classList.remove("menu-open");
    };
  }, [open]);

  // Eco dropdown: close on outside click or Escape
  useEffect(() => {
    if (!ecoOpen) return;
    function handleOutside(e: MouseEvent | TouchEvent) {
      if (ecoRef.current && !ecoRef.current.contains(e.target as Node)) {
        setEcoOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setEcoOpen(false);
    }
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, [ecoOpen]);

  return (
    <header className={"header" + (scrolled ? " is-scrolled" : "") + (open ? " is-open" : "")}>
      <div className="header-inner">
        <a className="brand" href="#top" aria-label="Mercenta home" onClick={() => setOpen(false)}>
          <span className="brand-mark">
            <Image src="/mercenta-logo.png" alt="" width={36} height={36} priority />
          </span>
          <span className="brand-word">
            mercenta<span className="brand-dot">.</span>
          </span>
        </a>

        <nav className="nav" aria-label="Sections">
          {sections.map((section) => (
            <a
              key={section.href}
              href={section.href}
              className={active === section.id ? "is-active" : undefined}
              aria-current={active === section.id ? "true" : undefined}
            >
              {section.label}
            </a>
          ))}

          {/* Eco dropdown — React-controlled */}
          <div
            ref={ecoRef}
            className="eco"
            data-open={ecoOpen ? "" : undefined}
          >
            <button
              type="button"
              className="eco-trigger"
              aria-haspopup="true"
              aria-expanded={ecoOpen}
              aria-controls="eco-panel"
              onClick={() => setEcoOpen((v) => !v)}
            >
              Ecosystem <ChevronDown size={13} aria-hidden="true" />
            </button>
            <div
              id="eco-panel"
              className="eco-panel"
              aria-label="Ecosystem addresses"
              role="list"
            >
              <p className="eco-note">Seven dedicated infrastructure nodes across the Mercenta network.</p>
              {ecosystem.map((item) => (
                <a
                  key={item.host}
                  href={"https://" + item.host}
                  target="_blank"
                  rel="noopener noreferrer"
                  role="listitem"
                  className="eco-link hover:bg-white/5 transition-colors p-1.5 rounded"
                  onClick={() => setEcoOpen(false)}
                >
                  <span className="eco-host font-mono font-semibold text-white">{item.host}</span>
                  <span className="eco-role text-[11px] text-[#b2b6bd]">{item.role}</span>
                  <span className="eco-status font-mono text-[10px] text-[#00ca8e]">node</span>
                </a>
              ))}
            </div>
          </div>
        </nav>

        <div className="header-actions">
          <a className="btn btn--ghost btn--sm" href="https://x.com/mercentaxyz" target="_blank" rel="noopener noreferrer">
            Follow <ArrowUpRight size={14} aria-hidden="true" />
          </a>
          <a className="btn btn--primary btn--sm" href="/app">
            Launch Console <ArrowRight size={14} aria-hidden="true" />
          </a>
          <button
            type="button"
            className="menu-toggle"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close navigation" : "Open navigation"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          </button>
        </div>
      </div>

      <div id="mobile-menu" className="mobile-menu" hidden={!open}>
        <nav aria-label="Sections">
          {sections.map((section, index) => (
            <a
              key={section.href}
              href={section.href}
              onClick={() => setOpen(false)}
              style={{ animationDelay: index * 40 + "ms" }}
            >
              <span className="mobile-index">0{index + 1}</span>
              {section.label}
              <ArrowRight size={16} aria-hidden="true" />
            </a>
          ))}
        </nav>
        <div className="mobile-eco">
          <p className="kicker">Ecosystem Nodes</p>
          {ecosystem.map((item) => (
            <a
              key={item.host}
              href={"https://" + item.host}
              target="_blank"
              rel="noopener noreferrer"
              className="eco-link"
            >
              <span className="eco-host">{item.host}</span>
              <span className="eco-status">node</span>
            </a>
          ))}
        </div>
        <a className="btn btn--primary" href="/app" onClick={() => setOpen(false)}>
          Launch Console <ArrowRight size={16} aria-hidden="true" />
        </a>
      </div>
    </header>
  );
}
