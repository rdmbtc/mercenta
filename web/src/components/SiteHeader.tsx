"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { ArrowRight, ArrowUpRight, ChevronDown, Menu, X } from "lucide-react";
import MagneticLink from "@/components/MagneticLink";

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

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const targets = sections
      .map((section) => document.getElementById(section.id))
      .filter((element): element is HTMLElement => element !== null);
    if (targets.length === 0) return;
    // Whichever section owns the band just below the header is "current".
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 },
    );
    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, [sections]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.documentElement.classList.add("menu-open");
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.classList.remove("menu-open");
    };
  }, [open]);

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
          <div className="eco">
            <button type="button" className="eco-trigger" aria-haspopup="true">
              Ecosystem <ChevronDown size={13} aria-hidden="true" />
            </button>
            <div className="eco-panel" role="menu" aria-label="Ecosystem addresses">
              <p className="eco-note">Planned addresses for each part of the product. None of them is live today.</p>
              {ecosystem.map((item) => (
                <a key={item.host} className="eco-link badge-link" href={"https://" + item.host} role="menuitem">
                  <span className="eco-host">{item.host}</span>
                  <span className="eco-role">{item.role}</span>
                  <span className="eco-status">planned</span>
                </a>
              ))}
            </div>
          </div>
        </nav>

        <div className="header-actions">
          <a className="btn btn--ghost btn--sm" href="https://x.com/mercentaxyz" target="_blank" rel="noopener noreferrer">
            Follow <ArrowUpRight size={14} aria-hidden="true" />
          </a>
          <MagneticLink className="btn btn--primary btn--sm" href="#policy">
            Run the terminal <ArrowRight size={14} aria-hidden="true" />
          </MagneticLink>
          <button
            type="button"
            className="menu-toggle"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close navigation" : "Open navigation"}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
          </button>
        </div>
      </div>

      <div id="mobile-menu" className="mobile-menu" hidden={!open}>
        <nav aria-label="Sections">
          {sections.map((section, index) => (
            <a key={section.href} href={section.href} onClick={() => setOpen(false)} style={{ animationDelay: index * 40 + "ms" }}>
              <span className="mobile-index">0{index + 1}</span>
              {section.label}
              <ArrowRight size={16} aria-hidden="true" />
            </a>
          ))}
        </nav>
        <div className="mobile-eco">
          <p className="kicker">Ecosystem · planned, not live</p>
          <div className="badges">
            {ecosystem.map((item) => (
              <a key={item.host} className="badge-link" href={"https://" + item.host}>
                <span className="eco-host">{item.host}</span>
                <span className="eco-status">planned</span>
              </a>
            ))}
          </div>
        </div>
        <a className="btn btn--primary" href="#policy" onClick={() => setOpen(false)}>
          Run the policy terminal <ArrowRight size={16} aria-hidden="true" />
        </a>
      </div>
    </header>
  );
}
