"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { evaluatePolicy, percent, tone, usdc, type PolicyResult, type SupplierState } from "@/lib/policy";

type Intent = {
  listing: string;
  quantity: string;
  supplier: string;
  amount: number;
  cost: number;
  state: SupplierState;
};

/* A fixed, illustrative sequence. Every row is evaluated by the same evaluatePolicy the terminal uses. */
const INTENTS: Intent[] = [
  { listing: "Cloud Compute Vouchers", quantity: "250 compute hours", supplier: "CloudCore Compute", amount: 2_100, cost: 1_700, state: "verified" },
  { listing: "API Credit Bundles", quantity: "1,000 credits", supplier: "Vertex Credit Desk", amount: 860, cost: 720, state: "verified" },
  { listing: "Enterprise SaaS Seats", quantity: "12 seat-months", supplier: "Northwind Licensing", amount: 1_800, cost: 1_700, state: "verified" },
  { listing: "Cloud Compute Vouchers", quantity: "900 compute hours", supplier: "CloudCore Compute", amount: 7_800, cost: 6_200, state: "verified" },
  { listing: "API Credit Bundles", quantity: "500 credits", supplier: "Vertex Credit Desk", amount: 430, cost: 360, state: "uncertain" },
  { listing: "Enterprise SaaS Seats", quantity: "40 seat-months", supplier: "Northwind Licensing", amount: 3_120, cost: 2_520, state: "verified" },
  { listing: "Cloud Compute Vouchers", quantity: "120 compute hours", supplier: "CloudCore Compute", amount: 1_010, cost: 816, state: "verified" },
  { listing: "API Credit Bundles", quantity: "15,000 credits", supplier: "Vertex Credit Desk", amount: 12_900, cost: 10_600, state: "verified" },
  { listing: "Enterprise SaaS Seats", quantity: "25 seat-months", supplier: "Northwind Licensing", amount: 5_400, cost: 4_320, state: "verified" },
  { listing: "Cloud Compute Vouchers", quantity: "60 compute hours", supplier: "CloudCore Compute", amount: 505, cost: 408, state: "verified" },
];

const FIRST_ID = 2481;
const VISIBLE = 5;
const INITIAL = 4;
const TICK_MS = 2600;

type Row = { seq: number; id: string; intent: Intent; result: PolicyResult };

function rowFor(seq: number): Row {
  const intent = INTENTS[seq % INTENTS.length];
  return {
    seq,
    id: "MR-ORD-" + (FIRST_ID + seq),
    intent,
    result: evaluatePolicy(intent.amount, intent.cost, intent.state),
  };
}

const SHORT: Record<string, string> = {
  Cleared: "Cleared",
  "Policy blocked": "Blocked",
  "Human approval required": "Approval",
};

export default function DecisionFeed() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [rows, setRows] = useState<Row[]>(() =>
    Array.from({ length: INITIAL }, (_, i) => rowFor(INITIAL - 1 - i)),
  );
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(true);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.2 });
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (paused || hovered || !inView) return;
    let timer = 0;
    const schedule = () => {
      timer = window.setTimeout(() => {
        if (document.visibilityState === "visible") {
          setRows((current) => [rowFor(current[0].seq + 1), ...current].slice(0, VISIBLE));
        }
        schedule();
      }, TICK_MS);
    };
    schedule();
    return () => window.clearTimeout(timer);
  }, [paused, hovered, inView]);

  const tally = useMemo(() => {
    const total = rows[0].seq + 1;
    let cleared = 0;
    let blocked = 0;
    let held = 0;
    for (let seq = 0; seq < total; seq += 1) {
      const decision = rowFor(seq).result.decision;
      if (decision === "Cleared") cleared += 1;
      else if (decision === "Policy blocked") blocked += 1;
      else held += 1;
    }
    return { total, cleared, blocked, held };
  }, [rows]);

  return (
    <div
      className="feed"
      ref={rootRef}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label="Simulated agent decision feed"
    >
      <div className="feed-top">
        <span className={"feed-dot" + (paused ? " is-paused" : "")} aria-hidden="true" />
        <span className="feed-path">agent://decisions/stream</span>
        <span className="chip">Simulated</span>
        <button
          type="button"
          className="feed-toggle"
          onClick={() => setPaused((value) => !value)}
          aria-pressed={paused}
          aria-label={paused ? "Resume the simulated feed" : "Pause the simulated feed"}
        >
          {paused ? <Play size={13} aria-hidden="true" /> : <Pause size={13} aria-hidden="true" />}
        </button>
      </div>

      <ol className="feed-rows" aria-live="off">
        {rows.map((row, index) => {
          const rowTone = tone(row.result.decision);
          return (
            <li key={row.seq} className={"feed-row tone-" + rowTone + (index === 0 ? " is-new" : "")}>
              <div className="feed-main">
                <span className="feed-id">{row.id}</span>
                <span className="feed-listing">
                  {row.intent.listing} <em>· {row.intent.quantity}</em>
                </span>
                <span className="feed-supplier">{row.intent.supplier}</span>
              </div>
              <div className="feed-numbers">
                <span className="feed-amount">{usdc(row.intent.amount)}</span>
                <span className={"feed-margin tone-" + (row.result.checks[2].state === "pass" ? "ok" : "stop")}>
                  {percent(row.result.margin)} margin
                </span>
              </div>
              <span className="feed-checks" aria-label={row.result.checks.map((c) => c.label + ": " + c.state).join(", ")}>
                {row.result.checks.map((check) => (
                  <i key={check.id} className={"check-" + check.state} />
                ))}
              </span>
              <span className={"feed-decision tone-" + rowTone}>
                <span className="feed-decision-long">{row.result.decision}</span>
                <span className="feed-decision-short">{SHORT[row.result.decision]}</span>
              </span>
            </li>
          );
        })}
      </ol>

      <div className="feed-foot">
        <span>
          <b>{tally.total}</b> intents
        </span>
        <span className="tone-ok">
          <b>{tally.cleared}</b> cleared
        </span>
        <span className="tone-stop">
          <b>{tally.blocked}</b> blocked
        </span>
        <span className="tone-hold">
          <b>{tally.held}</b> to a human
        </span>
        <span className="feed-note">Evaluated in your browser. Nothing is submitted; no funds move.</span>
      </div>
    </div>
  );
}
