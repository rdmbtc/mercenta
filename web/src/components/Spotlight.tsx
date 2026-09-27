"use client";

import { useEffect } from "react";

/* Decorative pointer spotlight for cards marked [data-spotlight].
 *
 * One delegated listener on the document rather than one per card: the page adds and removes cards
 * as it scrolls, and a hundred listeners is a hundred chances to leak. The pointer position is
 * written as --mx/--my only for the two cards nearest the cursor and only while they are on screen,
 * because a card that has not been painted yet cannot show a highlight anyway.
 *
 * Keyboard users get the same ring from the [data-spotlight]:focus-within rule in globals.css, so
 * nothing here is the sole cue for anything.
 *
 * Skipped entirely under reduced motion and for coarse pointers. Renders nothing.
 */
const RADIUS_PAD = 48; // only touch cards within a screenful of the viewport
const NEAREST = 2;

export default function Spotlight() {
  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || still) return;

    let frame = 0;
    let x = 0;
    let y = 0;
    let touched: HTMLElement[] = [];

    const clear = () => {
      for (const el of touched) {
        el.style.removeProperty("--mx");
        el.style.removeProperty("--my");
      }
      touched = [];
    };

    const paint = () => {
      frame = 0;
      const cards = document.querySelectorAll<HTMLElement>("[data-spotlight]");
      const visible: { el: HTMLElement; box: DOMRect; d: number }[] = [];

      for (const el of cards) {
        const box = el.getBoundingClientRect();
        if (box.bottom < -RADIUS_PAD || box.top > window.innerHeight + RADIUS_PAD) continue;
        const dx = Math.max(box.left - x, 0, x - box.right);
        const dy = Math.max(box.top - y, 0, y - box.bottom);
        visible.push({ el, box, d: dx * dx + dy * dy });
      }

      visible.sort((a, b) => a.d - b.d);
      const next = visible.slice(0, NEAREST);

      for (const el of touched) {
        if (!next.some((item) => item.el === el)) {
          el.style.removeProperty("--mx");
          el.style.removeProperty("--my");
        }
      }

      for (const item of next) {
        item.el.style.setProperty("--mx", x - item.box.left + "px");
        item.el.style.setProperty("--my", y - item.box.top + "px");
      }

      touched = next.map((item) => item.el);
    };

    const schedule = () => {
      if (frame === 0) frame = requestAnimationFrame(paint);
    };

    const move = (event: PointerEvent) => {
      x = event.clientX;
      y = event.clientY;
      schedule();
    };

    const leave = () => clear();

    document.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerdown", move, { passive: true });
    document.addEventListener("pointerleave", leave);
    window.addEventListener("blur", leave);
    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule, { passive: true });

    return () => {
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerdown", move);
      document.removeEventListener("pointerleave", leave);
      window.removeEventListener("blur", leave);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule);
      if (frame) cancelAnimationFrame(frame);
      clear();
    };
  }, []);

  return null;
}
