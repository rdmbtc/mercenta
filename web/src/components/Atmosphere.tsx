"use client";

import styles from "./Atmosphere.module.css";

/**
 * Settlement-network atmosphere. One fixed plane behind the whole document,
 * composed of four stacked layers instead of a single centered gradient:
 *
 *   1. depth    - off-axis cold light source, upper-left, plus a floor vignette
 *   2. horizon  - two dashed clearing rings, counter-rotating, off-centre
 *   3. mesh     - asymmetric settlement graph: nodes, links, two live routes
 *   4. grain    - fractal noise plane that kills gradient banding
 *
 * Node coordinates are hand-placed on a 1440x900 viewBox so the graph reads as
 * routed infrastructure rather than scattered particles. Nothing is centered.
 */

type Node = { x: number; y: number; r: number; lit?: boolean };

const NODES: Node[] = [
  { x: 118, y: 176, r: 2.5 },
  { x: 262, y: 96, r: 1.6 },
  { x: 305, y: 322, r: 3.4, lit: true },
  { x: 452, y: 214, r: 1.8 },
  { x: 498, y: 468, r: 2.2 },
  { x: 611, y: 128, r: 2.6 },
  { x: 664, y: 356, r: 1.7 },
  { x: 742, y: 592, r: 3.1, lit: true },
  { x: 858, y: 246, r: 2.3 },
  { x: 946, y: 452, r: 1.6 },
  { x: 1024, y: 158, r: 2.8 },
  { x: 1112, y: 372, r: 2.0 },
  { x: 1208, y: 604, r: 2.4, lit: true },
  { x: 1336, y: 288, r: 1.7 },
];

/** Index pairs into NODES. Routed, not fully connected. */
const LINKS: Array<[number, number]> = [
  [0, 1],
  [0, 2],
  [1, 3],
  [2, 3],
  [2, 4],
  [3, 5],
  [4, 6],
  [4, 7],
  [5, 6],
  [6, 8],
  [7, 9],
  [8, 9],
  [8, 10],
  [9, 11],
  [10, 11],
  [11, 12],
  [10, 13],
  [11, 13],
];

/** Two paths a settlement actually travels, drawn over the static graph. */
const ROUTES = [
  "M118 176 L305 322 L498 468 L742 592",
  "M611 128 L858 246 L1024 158 L1112 372 L1208 604",
];

export default function Atmosphere() {
  return (
    <div className={styles.root} aria-hidden="true">
      <div className={styles.depth} />
      <div className={styles.horizon}>
        <span className={styles.ring} />
        <span className={styles.ringInner} />
      </div>
      <div className={styles.mesh}>
        <svg
          className={styles.meshSvg}
          viewBox="0 0 1440 900"
          preserveAspectRatio="xMidYMin slice"
          focusable="false"
        >
          <g className={styles.links}>
            {LINKS.map(([a, b]) => (
              <line
                key={`${a}-${b}`}
                x1={NODES[a].x}
                y1={NODES[a].y}
                x2={NODES[b].x}
                y2={NODES[b].y}
              />
            ))}
          </g>
          <g className={styles.routes}>
            {ROUTES.map((d, i) => (
              <path key={d} d={d} data-route={i} />
            ))}
          </g>
          <g className={styles.nodes}>
            {NODES.map((n) => (
              <circle
                key={`${n.x}-${n.y}`}
                cx={n.x}
                cy={n.y}
                r={n.r}
                className={n.lit ? styles.nodeLit : undefined}
              />
            ))}
          </g>
        </svg>
      </div>
      <div className={styles.grain} />
    </div>
  );
}
