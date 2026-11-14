"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { createSpring, stepSpring, tuneSpring, clamp } from "./motionEngine";

export interface JellySliderProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  unit?: string;
  onChange: (val: number) => void;
}

export default function JellySlider({
  value,
  min = 0,
  max = 100,
  label = "Threshold",
  unit = "%",
  onChange,
}: JellySliderProps) {
  const [internalVal, setInternalVal] = useState(value);
  const railRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const dropLabelRef = useRef<HTMLDivElement>(null);
  const hitRef = useRef<HTMLDivElement>(null);

  const R = 12;
  const TR = 14;
  const D = 18;
  const OX = 40;
  const OY = 80;
  const CY = 18;
  const RISE = -38;
  const REST_DROP = 0.5;

  const [width, setWidth] = useState(300);

  const span = Math.max(width - 2 * R, 1);
  const toX = useCallback(
    (v: number) => R + ((v - min) / (max - min)) * span,
    [min, max, span]
  );
  const toV = useCallback(
    (x: number) => clamp((x - R) / span, 0, 1) * (max - min) + min,
    [min, max, span]
  );

  const springs = useRef({
    X: createSpring(toX(value), 900, 50),
    DX: createSpring(toX(value), 260, 18),
    DY: createSpring(CY, 420, 22),
    DS: createSpring(REST_DROP, 420, 22),
    PS: createSpring(1, 520, 16),
  });

  const dragging = useRef(false);
  const hover = useRef(false);

  const syncState = () => {
    const up = dragging.current;
    springs.current.DY.t = up ? CY + RISE : CY;
    springs.current.DS.t = up ? 1 : REST_DROP;
    springs.current.PS.t = dragging.current ? 1.16 : hover.current ? 1.08 : 1;
  };

  const rubber = (x: number, minX: number, maxX: number, d = 18) =>
    x < minX
      ? minX - (1 - 1 / (((minX - x) * 0.55) / d + 1)) * d
      : x > maxX
      ? maxX + (1 - 1 / (((x - maxX) * 0.55) / d + 1)) * d
      : x;

  const localX = (e: PointerEvent | React.PointerEvent) => {
    if (!railRef.current) return 0;
    return e.clientX - railRef.current.getBoundingClientRect().left;
  };

  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
    tuneSpring(springs.current.X, 900, 50);
    springs.current.X.t = rubber(localX(e), R, width - R);
    syncState();
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (dragging.current) {
      springs.current.X.t = rubber(localX(e), R, width - R);
    }
  };

  const onPointerUp = () => {
    if (!dragging.current) return;
    dragging.current = false;
    tuneSpring(springs.current.X, 300, 14);
    springs.current.X.t = clamp(springs.current.X.t, R, width - R);
    const v = Math.round(toV(springs.current.X.t));
    setInternalVal(v);
    onChange(v);
    syncState();
  };

  useEffect(() => {
    if (!dragging.current) {
      springs.current.X.t = toX(value);
      setInternalVal(value);
    }
  }, [value, toX]);

  useEffect(() => {
    const measure = () => {
      if (railRef.current) {
        const w = railRef.current.clientWidth;
        if (w > 0) setWidth(w);
      }
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    let animId: number;
    let last = performance.now();

    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 30);
      last = now;

      const { X, DX, DY, DS, PS } = springs.current;
      DX.t = X.x;

      stepSpring(X, dt);
      stepSpring(DX, dt);
      stepSpring(DY, dt);
      stepSpring(DS, dt);
      stepSpring(PS, dt);

      const v = Math.round(toV(X.x));

      if (thumbRef.current && dropRef.current && dropLabelRef.current && fillRef.current && hitRef.current) {
        const x = X.x;
        const st = 1 + Math.min(Math.abs(X.v) / 2400, 0.4);

        thumbRef.current.style.transform = `translate(${x - TR + OX}px, ${CY - TR + OY}px) scale(${st * PS.x}, ${PS.x / st})`;

        const tilt = clamp((DX.x - X.x) * 0.9, -28, 28);
        const dTr = `translate(${DX.x - D}px, ${DY.x - D}px) rotate(${tilt}deg) scale(${DS.x})`;
        dropRef.current.style.transform = `translate(${OX}px, ${OY}px) ` + dTr;
        dropLabelRef.current.style.transform = dTr;
        dropLabelRef.current.style.opacity = String(clamp((DS.x - 0.7) / 0.25, 0, 1));
        dropLabelRef.current.textContent = `${v}${unit}`;

        fillRef.current.style.width = clamp(x, 0, width) * clamp((x - R) / R, 0, 1) + "px";
        hitRef.current.style.left = x - R + "px";
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [width, min, max, unit, toV]);

  return (
    <div className="jelly-slider-wrap">
      {/* SVG Goo Filter for liquid drop effect */}
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
        <filter id="jelly-goo-filter" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
          <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -10" result="goo" />
          <feComposite in="SourceGraphic" in2="goo" operator="atop" />
        </filter>
      </svg>

      <div
        ref={railRef}
        className="jelly-rail"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerEnter={() => {
          hover.current = true;
          syncState();
        }}
        onPointerLeave={() => {
          hover.current = false;
          syncState();
        }}
      >
        <div className="jelly-track">
          <div ref={fillRef} className="jelly-fill" />
        </div>
        <div className="jelly-goo">
          <div ref={dropRef} className="jelly-blob jelly-drop" />
          <div ref={thumbRef} className="jelly-blob jelly-thumb" />
        </div>
        <div ref={dropLabelRef} className="jelly-drop-label">
          {internalVal}
          {unit}
        </div>
        <div
          ref={hitRef}
          className="jelly-hit"
          role="slider"
          tabIndex={0}
          aria-label={label}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={internalVal}
        />
      </div>

      <div className="jelly-ticks" aria-hidden="true">
        <div className="jelly-marks">
          {[0, 25, 50, 75, 100].map((tick) => {
            const p = tick / 100;
            const currentRatio = (internalVal - min) / (max - min);
            const isOn = p <= currentRatio;
            return (
              <i
                key={tick}
                className={`major ${isOn ? "on" : ""}`}
                style={{ "--p": p } as React.CSSProperties}
              />
            );
          })}
        </div>
        <div className="jelly-nums">
          <span style={{ "--p": 0 } as React.CSSProperties} className={internalVal >= min ? "on" : ""}>
            {min}
            {unit}
          </span>
          <span style={{ "--p": 0.5 } as React.CSSProperties}>
            {Math.round((min + max) / 2)}
            {unit}
          </span>
          <span style={{ "--p": 1 } as React.CSSProperties} className={internalVal >= max ? "on" : ""}>
            {max}
            {unit}
          </span>
        </div>
      </div>
    </div>
  );
}
