"use client";

import { useEffect } from "react";

/**
 * Progressive enhancement for server-rendered markup:
 *  - [data-reveal] elements get .is-in when they enter the viewport (CSS animates them);
 *  - [data-count] elements count up from 0 to their number once, in place.
 * Without JavaScript nothing is hidden: the hiding rule is scoped to html.has-js.
 */
export default function ScrollEffects() {
  useEffect(() => {
    const html = document.documentElement;
    html.classList.add("has-js");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const reveals = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    const counters = Array.from(document.querySelectorAll<HTMLElement>("[data-count]"));

    const runCounter = (element: HTMLElement) => {
      const target = Number(element.dataset.count);
      const suffix = element.dataset.suffix ?? "";
      if (!Number.isFinite(target) || reduced) {
        element.textContent = String(target) + suffix;
        return;
      }
      const duration = 900;
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        element.textContent = String(Math.round(target * eased)) + suffix;
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    if (reduced) {
      reveals.forEach((element) => element.classList.add("is-in"));
      counters.forEach(runCounter);
      return () => html.classList.remove("has-js");
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const element = entry.target as HTMLElement;
          element.classList.add("is-in");
          if (element.dataset.count !== undefined) runCounter(element);
          observer.unobserve(element);
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.12 },
    );
    reveals.forEach((element) => observer.observe(element));
    counters.forEach((element) => observer.observe(element));

    return () => {
      observer.disconnect();
      html.classList.remove("has-js");
    };
  }, []);

  return null;
}
