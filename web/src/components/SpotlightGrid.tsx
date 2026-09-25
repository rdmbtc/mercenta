"use client";

import type { PointerEvent, ReactNode } from "react";

/** Tracks the pointer so each .spot child can render a glow that follows the cursor. */
export default function SpotlightGrid({ className, children }: { className?: string; children: ReactNode }) {
  const onMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse") return;
    const cards = event.currentTarget.querySelectorAll<HTMLElement>(".spot");
    cards.forEach((card) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--mx", event.clientX - rect.left + "px");
      card.style.setProperty("--my", event.clientY - rect.top + "px");
    });
  };
  return (
    <div className={className} onPointerMove={onMove}>
      {children}
    </div>
  );
}
