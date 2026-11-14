"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { createSpring, stepSpring, tuneSpring, clamp } from "./motionEngine";
import { ChevronDown, Check } from "lucide-react";

export interface DropdownOption {
  id: string;
  label: string;
  color: string;
}

export interface SpringDropdownProps {
  options: DropdownOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  label?: string;
}

const ROW = 40;
const PAD = 6;
const GAP = 8;

export default function SpringDropdown({
  options,
  selectedId,
  onSelect,
  label = "Select option",
}: SpringDropdownProps) {
  const [open, setOpen] = useState(false);
  const [currentId, setCurrentId] = useState(selectedId);
  const [hoveredIdx, setHoveredIdx] = useState(-1);
  const ddRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const hlRef = useRef<HTMLDivElement>(null);

  const selectedIdx = Math.max(
    0,
    options.findIndex((o) => o.id === currentId)
  );
  const currentOpt = options[selectedIdx] || options[0];

  const MH = PAD * 2 + ROW * options.length;

  const springs = useRef({
    H: createSpring(0, 300, 23),
    Y: createSpring(0, 260, 24),
    C: createSpring(0, 300, 18),
    O: createSpring(0, 400, 34),
    TS: createSpring(1, 500, 18),
    HT: createSpring(PAD, 620, 36),
    HB: createSpring(PAD + ROW, 620, 36),
    HO: createSpring(0, 400, 32),
  });

  const hover = (i: number, snap = false) => {
    if (i < 0 || i >= options.length) return;
    const top = PAD + i * ROW;
    const { HT, HB, HO } = springs.current;
    if (snap || hoveredIdx < 0) {
      HT.x = HT.t = top;
      HB.x = HB.t = top + ROW;
      HT.v = HB.v = 0;
    } else {
      const down = i > hoveredIdx;
      tuneSpring(down ? HB : HT, 620, 36);
      tuneSpring(down ? HT : HB, 200, 20);
      HT.t = top;
      HB.t = top + ROW;
    }
    setHoveredIdx(i);
    HO.t = 1;
  };

  const toggleOpen = useCallback((val: boolean) => {
    setOpen(val);
    const { H, Y, C, O, HO } = springs.current;
    H.t = val ? MH : 0;
    Y.t = val ? -(GAP + MH) / 2 : 0;
    C.t = val ? 1 : 0;
    O.t = val ? 1 : 0;
    if (val) {
      hover(selectedIdx, true);
    } else {
      setHoveredIdx(-1);
      HO.t = 0;
    }
  }, [MH, selectedIdx]);

  const choose = (id: string) => {
    setCurrentId(id);
    onSelect(id);
    springs.current.TS.x = 0.955;
    setTimeout(() => toggleOpen(false), 180);
  };

  useEffect(() => {
    setCurrentId(selectedId);
  }, [selectedId]);

  useEffect(() => {
    let animId: number;
    let last = performance.now();

    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;

      const { H, Y, C, O, TS, HT, HB, HO } = springs.current;
      stepSpring(H, dt);
      stepSpring(Y, dt);
      stepSpring(C, dt);
      stepSpring(O, dt);
      stepSpring(TS, dt);
      stepSpring(HT, dt);
      stepSpring(HB, dt);
      stepSpring(HO, dt);

      if (menuRef.current && hlRef.current && ddRef.current) {
        const h = Math.max(0, H.x);
        const o = clamp(O.x, 0, 1);
        menuRef.current.style.height = h.toFixed(2) + "px";
        menuRef.current.style.opacity = o.toFixed(3);
        menuRef.current.style.visibility = h < 1 ? "hidden" : "visible";
        menuRef.current.style.transform = `scaleX(${(0.9 + 0.1 * clamp(H.x / MH, 0, 1.06)).toFixed(4)})`;

        hlRef.current.style.opacity = (clamp(HO.x, 0, 1) * o).toFixed(3);
        const ht = clamp(Math.min(HT.x, HB.x - 16), PAD, MH - PAD - 16);
        const hb = clamp(HB.x, ht + 16, MH - PAD);
        hlRef.current.style.height = (hb - ht).toFixed(2) + "px";
        hlRef.current.style.transform = `translateY(${ht.toFixed(2)}px)`;
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [MH]);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (open && ddRef.current && !ddRef.current.contains(e.target as Node)) {
        toggleOpen(false);
      }
    };
    document.addEventListener("pointerdown", handleOutside);
    return () => document.removeEventListener("pointerdown", handleOutside);
  }, [open, toggleOpen]);

  return (
    <div ref={ddRef} className="spring-dd" aria-label={label}>
      <button
        type="button"
        className="spring-trig"
        onClick={() => toggleOpen(!open)}
        aria-expanded={open}
      >
        <span className="spring-dot" style={{ backgroundColor: currentOpt.color }} />
        <span className="spring-val">
          <span className="spring-slot">
            <b>{currentOpt.label}</b>
          </span>
        </span>
        <ChevronDown
          size={16}
          style={{
            transform: `rotate(${open ? 180 : 0}deg)`,
            transition: "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
            color: "#9a9a9a",
          }}
        />
      </button>

      <div ref={menuRef} className="spring-menu" role="listbox">
        <div ref={hlRef} className="spring-hl" />
        {options.map((opt, i) => (
          <div
            key={opt.id}
            className="spring-opt"
            role="option"
            aria-selected={opt.id === currentId}
            onPointerEnter={() => hover(i)}
            onClick={() => choose(opt.id)}
            style={{
              opacity: open ? 1 : 0,
              transform: `translateY(${open ? 0 : -6}px)`,
              transition: `opacity 0.2s ease ${i * 0.03}s, transform 0.2s ease ${i * 0.03}s`,
            }}
          >
            <span className="spring-dot" style={{ backgroundColor: opt.color }} />
            <b>{opt.label}</b>
            {opt.id === currentId && <Check size={14} className="text-[#38bdf8]" />}
          </div>
        ))}
      </div>
    </div>
  );
}
