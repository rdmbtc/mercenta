'use client';

import React from 'react';

export type ThinkingOrbState = 'idle' | 'thinking' | 'searching' | 'evaluating' | 'cleared';

export interface ThinkingOrbProps extends React.HTMLAttributes<HTMLDivElement> {
  state?: ThinkingOrbState;
  size?: number;
  label?: string;
}

export function ThinkingOrb({
  state = 'thinking',
  size = 36,
  label,
  className = '',
  ...props
}: ThinkingOrbProps) {
  const isSearching = state === 'searching';
  const isEvaluating = state === 'evaluating';
  const isCleared = state === 'cleared';

  // Palette based on deterministic state
  const primaryGlow = isCleared
    ? 'rgba(16, 185, 129, 0.45)'
    : isEvaluating
    ? 'rgba(168, 85, 247, 0.45)'
    : isSearching
    ? 'rgba(56, 189, 248, 0.45)'
    : 'rgba(178, 229, 255, 0.45)';

  const ringStroke = isCleared
    ? '#10b981'
    : isEvaluating
    ? '#c084fc'
    : isSearching
    ? '#38bdf8'
    : '#7dd3fc';

  return (
    <div
      data-slot="thinking-orb"
      data-state={state}
      className={`inline-flex items-center gap-2.5 ${className}`}
      {...props}
    >
      <div
        className="relative flex items-center justify-center flex-shrink-0"
        style={{ width: size, height: size }}
        aria-hidden="true"
      >
        {/* Ambient Backlight Glow */}
        <div
          className="absolute inset-0 rounded-full blur-md transition-colors duration-500 animate-pulse"
          style={{ background: primaryGlow }}
        />

        {/* Central Physical Sphere */}
        <div
          className="relative rounded-full border flex items-center justify-center overflow-hidden transition-all duration-300"
          style={{
            width: size * 0.72,
            height: size * 0.72,
            borderColor: ringStroke,
            background: 'radial-gradient(circle at 35% 35%, rgba(255, 255, 255, 0.25) 0%, rgba(13, 20, 29, 0.95) 70%)',
            boxShadow: `0 0 12px ${primaryGlow}`,
          }}
        >
          {/* Inner Scanning / Pulsing core */}
          <div
            className={`w-2 h-2 rounded-full ${
              isCleared
                ? 'bg-emerald-400'
                : isEvaluating
                ? 'bg-purple-400 animate-ping'
                : 'bg-sky-300 animate-ping'
            }`}
            style={{ animationDuration: isEvaluating ? '1.2s' : '1.8s' }}
          />
        </div>

        {/* Orbital SVG particle rings */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 48 48"
          fill="none"
        >
          {/* Outer Orbital Ring 1 */}
          <ellipse
            cx="24"
            cy="24"
            rx="21"
            ry="9"
            stroke={ringStroke}
            strokeWidth="0.85"
            strokeDasharray="3 4"
            className="origin-center animate-[spin_4s_linear_infinite]"
            style={{ opacity: 0.8 }}
          />

          {/* Cross Orbital Ring 2 */}
          <ellipse
            cx="24"
            cy="24"
            rx="9"
            ry="21"
            stroke={ringStroke}
            strokeWidth="0.85"
            strokeDasharray="2 5"
            className="origin-center animate-[spin_6s_linear_infinite_reverse]"
            style={{ opacity: 0.6 }}
          />

          {/* Orbiting Satellite Dot */}
          <circle
            cx="44"
            cy="24"
            r="1.75"
            fill="#ffffff"
            className="origin-center animate-[spin_3s_linear_infinite]"
          />
        </svg>
      </div>

      {label ? (
        <span className="text-xs font-mono tracking-wide text-slate-300">
          {label}
        </span>
      ) : null}
    </div>
  );
}
