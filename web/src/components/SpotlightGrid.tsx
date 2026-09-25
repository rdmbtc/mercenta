"use client";

import { useRef, type PointerEvent, type ReactNode } from "react";

const TILT = 7;

/**
 * Tracks the pointer for two effects on every `.spot` child:
 * a spotlight/border glow that follows the cursor across the whole grid, and a 3D tilt on the hovered card.
 * Updates are coalesced into one frame and only write CSS custom properties, so the compositor does the rest.
 */
export default function SpotlightGrid({ className, children }: { className?: string; children: ReactNode }) {
  const frame = useRef(0);
  const last = useRef<{ x: number; y: number; grid: HTMLDivElement | null }>({ x: 0, y: 0, grid: null });
  const tilted = useRef<HTMLElement | null>(null);

  const paint = () => {
    frame.current = 0;
    const { x, y, grid } = last.current;
    if (!grid) return;
    let hovered: HTMLElement | null = null;
    grid.querySelectorAll<HTMLElement>(".spot").forEach((card) => {
      const rect = card.getBoundingClientRect();
      const localX = x - rect.left;
      const localY = y - rect.top;
      card.style.setProperty("--mx", localX.toFixed(1) + "px");
      card.style.setProperty("--my", localY.toFixed(1) + "px");
      if (localX >= 0 && localY >= 0 && localX <= rect.width && localY <= rect.height) {
        hovered = card;
        card.style.setProperty("--ry", ((localX / rect.width - 0.5) * TILT).toFixed(2) + "deg");
        card.style.setProperty("--rx", ((0.5 - localY / rect.height) * TILT).toFixed(2) + "deg");
      }
    });
    if (tilted.current && tilted.current !== hovered) {
      tilted.current.style.setProperty("--rx", "0deg");
      tilted.current.style.setProperty("--ry", "0deg");
    }
    tilted.current = hovered;
  };

  const onMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse") return;
    last.current = { x: event.clientX, y: event.clientY, grid: event.currentTarget };
    if (!frame.current) frame.current = window.requestAnimationFrame(paint);
  };

  const onLeave = () => {
    if (tilted.current) {
      tilted.current.style.setProperty("--rx", "0deg");
      tilted.current.style.setProperty("--ry", "0deg");
      tilted.current = null;
    }
  };

  return (
    <div className={className} onPointerMove={onMove} onPointerLeave={onLeave}>
      {children}
    </div>
  );
}
