"use client";

import React, { useEffect, useRef, useState } from "react";
import { createSpring, stepSpring, clamp } from "./motionEngine";

export interface LetterLimitProps {
  limit?: number;
  placeholder?: string;
  onPost?: (text: string) => void;
}

interface LetterItem {
  el: HTMLSpanElement;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  vr: number;
  rest: boolean;
  out: number;
  s: number;
  bin: number | null;
  hits: number;
}

export default function LetterLimit({
  limit = 70,
  placeholder = "Define agent policy boundary or instruction...",
  onPost,
}: LetterLimitProps) {
  const [text, setText] = useState("");
  const cardRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const mirrorRef = useRef<HTMLDivElement>(null);
  const pileRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<SVGCircleElement>(null);
  const countRef = useRef<HTMLSpanElement>(null);

  const springs = useRef({
    F: createSpring(0, 280, 22),
    CP: createSpring(1, 520, 16),
    SH: createSpring(0, 700, 12),
    PP: createSpring(1, 520, 16),
  });

  const lettersRef = useRef<LetterItem[]>([]);
  const binsRef = useRef<Record<number, number>>({});
  const floorYRef = useRef(120);
  const widthRef = useRef(360);

  const endOfText = (): [number, number] => {
    if (!mirrorRef.current || !cardRef.current) return [100, 40];
    mirrorRef.current.textContent = taRef.current?.value || "";
    const m = document.createElement("span");
    m.textContent = "\u200b";
    mirrorRef.current.appendChild(m);
    const b = cardRef.current.getBoundingClientRect();
    const r = m.getBoundingClientRect();
    return [r.left - b.left, r.top - b.top + 12];
  };

  const leave = (l: LetterItem) => {
    if (l.out) return;
    l.out = 0.001;
    l.vy = -230;
    l.rest = false;
    if (l.bin != null) {
      binsRef.current[l.bin] = Math.max(0, (binsRef.current[l.bin] || 0) - 1);
    }
  };

  const drop = (chars: string) => {
    if (!pileRef.current) return;
    const [x, y] = endOfText();
    [...chars].forEach((ch, i) => {
      if (!ch.trim()) return;
      const el = document.createElement("span");
      el.textContent = ch;
      pileRef.current?.appendChild(el);
      lettersRef.current.push({
        el,
        x: x + 4 + i * 9,
        y,
        vx: -40 + Math.random() * 150,
        vy: -150 - Math.random() * 110,
        r: 0,
        vr: (Math.random() - 0.5) * 720,
        rest: false,
        out: 0,
        s: 1,
        bin: null,
        hits: 0,
      });
    });

    while (lettersRef.current.filter((l) => !l.out).length > 40) {
      const l = lettersRef.current.find((l) => !l.out);
      if (l) leave(l);
    }
    springs.current.SH.v += 34;
    springs.current.CP.x = 1.25;
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    let v = e.target.value;
    const was = text.length;

    if (v.length > limit) {
      const extra = v.slice(limit);
      v = v.slice(0, limit);
      drop(extra);
    }

    const currentLen = v.length;
    if (currentLen < was) {
      const live = lettersRef.current.filter((l) => !l.out);
      for (let i = 0; i < Math.min(was - currentLen, live.length); i++) {
        leave(live[live.length - 1 - i]);
      }
    }

    if (currentLen !== was) {
      springs.current.CP.x = Math.max(springs.current.CP.x, 1.12);
    }

    setText(v);
    springs.current.F.t = currentLen / limit;
  };

  useEffect(() => {
    let animId: number;
    let last = performance.now();

    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;

      const { F, CP, SH, PP } = springs.current;
      stepSpring(F, dt);
      stepSpring(CP, dt);
      stepSpring(SH, dt);
      stepSpring(PP, dt);

      lettersRef.current.forEach((l) => {
        if (l.out) {
          l.out += dt;
          l.vy += 900 * dt;
          l.y += l.vy * dt;
          l.s = Math.max(0, 1 - l.out / 0.32);
          return;
        }
        if (l.rest) return;
        l.vy += 1900 * dt;
        l.x += l.vx * dt;
        l.y += l.vy * dt;
        l.r += l.vr * dt;

        if (l.x < 14) {
          l.x = 14;
          l.vx = Math.abs(l.vx) * 0.5;
        } else if (l.x > widthRef.current - 14) {
          l.x = widthRef.current - 14;
          l.vx = -Math.abs(l.vx) * 0.5;
        }

        const b = Math.round(l.x / 10);
        const ground = floorYRef.current - (binsRef.current[b] || 0) * 9;

        if (l.y >= ground && l.vy > 0) {
          l.y = ground;
          if (l.hits++ < 1 && l.vy > 260) {
            l.vy *= -0.3;
            l.vx *= 0.6;
            l.vr *= 0.5;
          } else {
            l.rest = true;
            l.bin = b;
            binsRef.current[b] = Math.min(3, (binsRef.current[b] || 0) + 1);
            l.r = Math.round(l.r / 90) * 90 + (Math.random() - 0.5) * 34;
            l.el.classList.add("is-down");
          }
        }
      });

      lettersRef.current = lettersRef.current.filter((l) => {
        if (l.out > 0.34) {
          l.el.remove();
          return false;
        }
        return true;
      });

      if (fillRef.current && countRef.current) {
        fillRef.current.style.strokeDashoffset = String(1 - clamp(F.x, 0, 1));
        const sh = SH.x * 0.5;
        countRef.current.style.transform = `translateX(${sh.toFixed(2)}px) scale(${CP.x.toFixed(4)})`;
        lettersRef.current.forEach((l) => {
          l.el.style.transform = `translate(${l.x.toFixed(1)}px,${l.y.toFixed(1)}px) rotate(${l.r.toFixed(1)}deg) scale(${l.s.toFixed(3)})`;
        });
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  const left = limit - text.length;
  const isNear = left <= 12 && left > 0;
  const isFull = left <= 0;

  return (
    <div
      ref={cardRef}
      className={`ll-card ${isNear ? "is-near" : ""} ${isFull ? "is-full" : ""}`}
    >
      <div className="ll-area">
        <textarea
          ref={taRef}
          value={text}
          onChange={handleInput}
          rows={3}
          aria-label="Write an instruction"
          placeholder={placeholder}
          className="ll-textarea"
          spellCheck={false}
        />
        <div ref={mirrorRef} className="ll-mirror" aria-hidden="true" />
      </div>

      <div className="ll-foot">
        <svg className="ll-meter" viewBox="0 0 24 24" aria-hidden="true">
          <circle className="ll-track" cx="12" cy="12" r="9" />
          <circle ref={fillRef} className="ll-fill" cx="12" cy="12" r="9" pathLength="1" />
        </svg>
        <span ref={countRef} className="ll-count">
          {left}
        </span>
        <button
          type="button"
          onClick={() => {
            if (onPost && text.trim()) onPost(text.trim());
            setText("");
          }}
          disabled={!text.trim()}
          style={{
            marginLeft: "auto",
            height: "30px",
            padding: "0 14px",
            border: 0,
            borderRadius: "999px",
            background: text.trim() ? "#ffffff" : "rgba(255, 255, 255, 0.1)",
            color: text.trim() ? "#050608" : "rgba(255, 255, 255, 0.4)",
            fontFamily: "var(--font-mono, monospace)",
            fontSize: "11px",
            fontWeight: 700,
            cursor: text.trim() ? "pointer" : "not-allowed",
            transition: "all 0.15s ease",
          }}
        >
          Execute
        </button>
      </div>

      <div ref={pileRef} className="ll-pile" aria-hidden="true" />
    </div>
  );
}
