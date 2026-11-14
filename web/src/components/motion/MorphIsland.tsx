"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { createSpring, stepSpring, tuneSpring, clamp } from "./motionEngine";
import { Clock, AlertTriangle, Check, X } from "lucide-react";

export type IslandState = "idle" | "evaluating" | "clearing" | "escalation";

const SIZE: Record<IslandState, [number, number]> = {
  idle: [148, 36],
  evaluating: [224, 36],
  clearing: [284, 52],
  escalation: [332, 68],
};

export default function MorphIsland() {
  const [state, setState] = useState<IslandState>("idle");
  const [timerProgress, setTimerProgress] = useState(0);
  const [auto, setAuto] = useState(true);
  const islandRef = useRef<HTMLDivElement>(null);

  const springs = useRef({
    w: createSpring(SIZE.idle[0], 380, 24),
    h: createSpring(SIZE.idle[1], 300, 22),
    press: createSpring(1, 520, 18),
  });

  const go = useCallback((next: IslandState, fromUser = false) => {
    if (fromUser) setAuto(false);
    if (next === state) {
      springs.current.press.v -= 2;
      return;
    }
    const [w, h] = SIZE[next];
    const grow = w * h > springs.current.w.t * springs.current.h.t;
    tuneSpring(springs.current.w, 380, 24);
    tuneSpring(springs.current.h, 300 * (grow ? 1 : 1.3), 22);
    springs.current.w.t = w;
    springs.current.h.t = h;
    springs.current.press.v -= grow ? 1.6 : 1;
    setState(next);
    if (next === "clearing") setTimerProgress(0);
  }, [state]);

  useEffect(() => {
    let animId: number;
    let last = performance.now();

    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;

      stepSpring(springs.current.w, dt);
      stepSpring(springs.current.h, dt);
      stepSpring(springs.current.press, dt);

      if (state === "clearing") {
        setTimerProgress((prev) => Math.min(1, prev + dt / 1.8));
      }

      if (islandRef.current) {
        const h = Math.max(springs.current.h.x, 20);
        const give = clamp(-springs.current.h.v / 7000, -0.05, 0.05);
        islandRef.current.style.width = springs.current.w.x * (1 + give) + "px";
        islandRef.current.style.height = h + "px";
        islandRef.current.style.borderRadius = Math.min(h / 2, 24) + "px";
        islandRef.current.style.transform = `scale(${springs.current.press.x})`;
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [state]);

  // Autoplay story loop
  useEffect(() => {
    if (!auto) return;
    const states: IslandState[] = ["evaluating", "clearing", "escalation", "idle"];
    let idx = 0;
    const interval = setInterval(() => {
      go(states[idx % states.length]);
      idx++;
    }, 3800);
    return () => clearInterval(interval);
  }, [auto, go]);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", margin: "1rem 0" }}>
      <div
        ref={islandRef}
        className="morph-island"
        role="status"
        aria-live="polite"
        onClick={() => {
          setAuto(false);
          if (state === "idle") go("evaluating");
          else if (state === "evaluating") go("clearing");
          else if (state === "clearing") go("escalation");
          else go("idle");
        }}
        title="Click to cycle autonomous operator states"
      >
        {/* State 1: IDLE */}
        <div className={`morph-ic ${state === "idle" ? "on" : ""}`} style={{ gap: "8px", width: "132px", justifyContent: "center" }}>
          <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#34d17a", boxShadow: "0 0 8px #34d17a" }} />
          <span style={{ fontSize: "11px", fontFamily: "var(--font-mono, monospace)", fontWeight: 600, color: "#ffffff", letterSpacing: "0.04em" }}>
            ARC ARMED
          </span>
        </div>

        {/* State 2: EVALUATING */}
        <div className={`morph-ic ${state === "evaluating" ? "on" : ""}`} style={{ gap: "8px", width: "206px", justifyContent: "space-between" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "#ff9f0a", fontSize: "12px", fontWeight: 500 }}>
            <Clock size={14} className="animate-spin text-[#ff9f0a]" />
            5/5 Gates Checked
          </span>
          <span style={{ fontSize: "11px", fontFamily: "var(--font-mono, monospace)", fontWeight: 700, color: "#ff9f0a" }}>
            PASS ✓
          </span>
        </div>

        {/* State 3: CLEARING */}
        <div className={`morph-ic ${state === "clearing" ? "on" : ""}`} style={{ gap: "12px", width: "260px" }}>
          <svg className="ring" viewBox="0 0 32 32" style={{ width: "30px", height: "30px", transform: "rotate(-90deg)", flexShrink: 0 }}>
            <circle cx="16" cy="16" r="13" stroke="rgba(255,255,255,0.12)" strokeWidth="3" fill="none" />
            <circle
              cx="16"
              cy="16"
              r="13"
              stroke="#38bdf8"
              strokeWidth="3"
              fill="none"
              strokeDasharray="81.7"
              strokeDashoffset={81.7 * (1 - timerProgress)}
              strokeLinecap="round"
            />
          </svg>
          <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
            <strong style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#ffffff" }}>Settling Arc USDC</strong>
            <span style={{ display: "block", fontSize: "10px", fontFamily: "var(--font-mono, monospace)", color: "rgba(255,255,255,0.5)" }}>
              Subsecond finality · &lt;14ms
            </span>
          </div>
          <span style={{ fontSize: "12px", fontFamily: "var(--font-mono, monospace)", fontWeight: 700, color: "#38bdf8" }}>
            {Math.round(timerProgress * 100)}%
          </span>
        </div>

        {/* State 4: ESCALATION */}
        <div className={`morph-ic ${state === "escalation" ? "on" : ""}`} style={{ gap: "10px", width: "310px", alignItems: "center" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "rgba(255, 90, 95, 0.15)", border: "1px solid rgba(255, 90, 95, 0.4)", display: "grid", placeItems: "center", color: "#ff5a5f", flexShrink: 0 }}>
            <AlertTriangle size={16} />
          </div>
          <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
            <strong style={{ display: "block", fontSize: "12px", fontWeight: 600, color: "#ffffff" }}>Over $25 Auto-Ceiling</strong>
            <span style={{ display: "block", fontSize: "10px", fontFamily: "var(--font-mono, monospace)", color: "#ff5a5f" }}>
              Human Gate Escalated
            </span>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              go("idle", true);
            }}
            style={{ width: "30px", height: "30px", borderRadius: "50%", border: 0, background: "rgba(255,255,255,0.1)", color: "#ffffff", display: "grid", placeItems: "center", cursor: "pointer" }}
            title="Decline order"
          >
            <X size={14} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              go("idle", true);
            }}
            style={{ width: "30px", height: "30px", borderRadius: "50%", border: 0, background: "#34d17a", color: "#050608", display: "grid", placeItems: "center", cursor: "pointer" }}
            title="Approve 1-click execution"
          >
            <Check size={14} strokeWidth={3} />
          </button>
        </div>
      </div>

      {/* Manual interactive pill toggles */}
      <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", justifyContent: "center" }}>
        {(["idle", "evaluating", "clearing", "escalation"] as IslandState[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => go(s, true)}
            style={{
              padding: "3px 9px",
              fontSize: "10px",
              fontFamily: "var(--font-mono, monospace)",
              textTransform: "uppercase",
              borderRadius: "999px",
              border: state === s ? "1px solid #38bdf8" : "1px solid rgba(255,255,255,0.08)",
              background: state === s ? "rgba(56, 189, 248, 0.15)" : "transparent",
              color: state === s ? "#38bdf8" : "rgba(255,255,255,0.45)",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
