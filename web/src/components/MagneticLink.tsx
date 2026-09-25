"use client";

import { useRef, type AnchorHTMLAttributes, type PointerEvent } from "react";

const PULL = 0.22;
const MAX = 9;

/** Anchor that leans toward the cursor while hovered and springs back on leave. Transform only, so it stays cheap. */
export default function MagneticLink({ children, className, ...rest }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  const ref = useRef<HTMLAnchorElement>(null);

  const onMove = (event: PointerEvent<HTMLAnchorElement>) => {
    if (event.pointerType !== "mouse") return;
    const element = ref.current;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const dx = event.clientX - (rect.left + rect.width / 2);
    const dy = event.clientY - (rect.top + rect.height / 2);
    const tx = Math.max(-MAX, Math.min(MAX, dx * PULL));
    const ty = Math.max(-MAX, Math.min(MAX, dy * PULL));
    element.style.transition = "transform 120ms ease-out";
    element.style.transform = "translate3d(" + tx.toFixed(1) + "px," + ty.toFixed(1) + "px,0)";
  };

  const onLeave = () => {
    const element = ref.current;
    if (!element) return;
    element.style.transition = "transform 520ms cubic-bezier(0.22, 1, 0.36, 1)";
    element.style.transform = "translate3d(0,0,0)";
  };

  return (
    <a ref={ref} className={className ? className + " magnetic" : "magnetic"} onPointerMove={onMove} onPointerLeave={onLeave} {...rest}>
      {children}
    </a>
  );
}
