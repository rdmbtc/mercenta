/**
 * Tiny Spring Physics Engine (DesignBookmark / Motion Studies standard).
 * Pure math: stiffness (k), damping (c), delta-time simulation.
 */

export interface SpringState {
  x: number;
  v: number;
  t: number;
  k: number;
  c: number;
}

export const createSpring = (x: number, k = 400, c = 30): SpringState => ({
  x,
  v: 0,
  t: x,
  k,
  c,
});

export const tuneSpring = (s: SpringState, k: number, c: number, reduceMotion = false) => {
  s.k = k;
  s.c = reduceMotion ? 2 * Math.sqrt(k) : c;
};

export const stepSpring = (s: SpringState, dt: number) => {
  const a = -s.k * (s.x - s.t) - s.c * s.v;
  s.v += a * dt;
  s.x += s.v * dt;
};

export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
