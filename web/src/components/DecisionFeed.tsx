"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import Odometer from "@/components/Odometer";
import { evaluatePolicy, percent, tone, usdc, usdcPlain, type PolicyResult, type SupplierState } from "@/lib/policy";

type Intent = {
  agent: string;
  listing: string;
  quantity: string;
  supplier: string;
  amount: number;
  cost: number;
  state: SupplierState;
};

/* A fixed, illustrative sequence. Every row is evaluated by the same evaluatePolicy the terminal uses. */
const INTENTS: Intent[] = [
  { agent: "research-agent", listing: "Cloud Compute Vouchers", quantity: "250 compute hours", supplier: "CloudCore Compute", amount: 2_100, cost: 1_700, state: "verified" },
  { agent: "buyer-agent", listing: "API Credit Bundles", quantity: "1,000 credits", supplier: "Vertex Credit Desk", amount: 860, cost: 720, state: "verified" },
  { agent: "pricing-agent", listing: "Enterprise SaaS Seats", quantity: "12 seat-months", supplier: "Northwind Licensing", amount: 1_800, cost: 1_700, state: "verified" },
  { agent: "ops-agent", listing: "Cloud Compute Vouchers", quantity: "900 compute hours", supplier: "CloudCore Compute", amount: 7_800, cost: 6_200, state: "verified" },
  { agent: "buyer-agent", listing: "API Credit Bundles", quantity: "500 credits", supplier: "Unlisted reseller", amount: 430, cost: 360, state: "uncertain" },
  { agent: "ops-agent", listing: "Enterprise SaaS Seats", quantity: "40 seat-months", supplier: "Northwind Licensing", amount: 3_120, cost: 2_520, state: "verified" },
  { agent: "research-agent", listing: "Cloud Compute Vouchers", quantity: "120 compute hours", supplier: "CloudCore Compute", amount: 1_010, cost: 816, state: "verified" },
  { agent: "scraper-bot", listing: "API Credit Bundles", quantity: "15,000 credits", supplier: "Vertex Credit Desk", amount: 12_900, cost: 10_600, state: "verified" },
  { agent: "ops-agent", listing: "Enterprise SaaS Seats", quantity: "25 seat-months", supplier: "Northwind Licensing", amount: 5_400, cost: 4_320, state: "verified" },
  { agent: "research-agent", listing: "Cloud Compute Vouchers", quantity: "60 compute hours", supplier: "CloudCore Compute", amount: 505, cost: 408, state: "verified" },
];

const FIRST_ID = 2481;
const VISIBLE = 6;
const INITIAL = 4;
const TICK_MS = 2600;
const WAVE_POINTS = 72;

type Row = { seq: number; id: string; intent: Intent; result: PolicyResult; ms: number | null };

const SAMPLE_RUNS = 250;

/* A single evaluation is far below timer resolution, so the cost is averaged over a burst of runs. */
function rowFor(seq: number, measure = false): Row {
  const intent = INTENTS[seq % INTENTS.length];
  const result = evaluatePolicy(intent.amount, intent.cost, intent.state);
  let ms: number | null = null;
  if (measure) {
    const started = performance.now();
    for (let i = 0; i < SAMPLE_RUNS; i += 1) evaluatePolicy(intent.amount, intent.cost, intent.state);
    ms = (performance.now() - started) / SAMPLE_RUNS;
  }
  return { seq, id: "MR-ORD-" + (FIRST_ID + seq), intent, result, ms };
}

const SHORT: Record<string, string> = {
  Cleared: "Cleared",
  "Policy blocked": "Blocked",
  "Human approval required": "Approval",
};

function logLine(row: Row) {
  const passed = row.result.checks.filter((check) => check.state === "pass").length;
  return (
    "> evaluate " +
    row.id +
    " · " +
    row.intent.agent +
    " · " +
    row.intent.listing.toLowerCase() +
    " · " +
    usdc(row.intent.amount) +
    " → " +
    row.result.decision +
    " · " +
    passed +
    "/5 checks" +
    (row.ms !== null ? " · " + (row.ms * 1000).toFixed(1) + " µs per decision in your browser" : "")
  );
}

export default function DecisionFeed() {
  const rootRef = useRef<HTMLDivElement>(null);
  const waveRef = useRef<SVGPathElement>(null);
  const logRef = useRef<HTMLParagraphElement>(null);
  const spikeRef = useRef(0);
  const firstLogRef = useRef(true);
  const [rows, setRows] = useState<Row[]>(() => Array.from({ length: INITIAL }, (_, i) => rowFor(INITIAL - 1 - i)));
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(true);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.15 });
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (paused || hovered || !inView) return;
    let timer = 0;
    const schedule = () => {
      timer = window.setTimeout(() => {
        if (document.visibilityState === "visible") {
          spikeRef.current = 1;
          setRows((current) => [rowFor(current[0].seq + 1, true), ...current].slice(0, VISIBLE));
        }
        schedule();
      }, TICK_MS);
    };
    schedule();
    return () => window.clearTimeout(timer);
  }, [paused, hovered, inView]);

  /* Latency wave: a decorative oscilloscope trace. It spikes when a decision lands and settles again. */
  useEffect(() => {
    const path = waveRef.current;
    if (!path || !inView) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    let phase = 0;
    const draw = () => {
      phase += 0.06;
      spikeRef.current *= 0.94;
      const spike = spikeRef.current;
      let d = "";
      for (let i = 0; i <= WAVE_POINTS; i += 1) {
        const x = (i / WAVE_POINTS) * 100;
        const env = Math.exp(-Math.pow((i - WAVE_POINTS * 0.5) / (WAVE_POINTS * 0.22), 2));
        const y =
          16 -
          Math.sin(i * 0.5 + phase) * (1.6 + spike * 7 * env) -
          Math.sin(i * 0.19 - phase * 0.7) * 1.2 -
          Math.sin(i * 1.3 + phase * 2.1) * spike * 3 * env;
        d += (i === 0 ? "M" : "L") + x.toFixed(2) + " " + y.toFixed(2);
      }
      path.setAttribute("d", d);
      frame = window.requestAnimationFrame(draw);
    };
    frame = window.requestAnimationFrame(draw);
    return () => window.cancelAnimationFrame(frame);
  }, [inView]);

  /* Typewriter for the newest log line. The first render keeps the full text so the server HTML is complete. */
  const latest = rows[0];
  const line = logLine(latest);
  useEffect(() => {
    const element = logRef.current;
    if (!element) return;
    if (firstLogRef.current) {
      firstLogRef.current = false;
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      element.textContent = line;
      return;
    }
    let index = 0;
    element.textContent = "";
    const timer = window.setInterval(() => {
      index += 2;
      element.textContent = line.slice(0, index);
      if (index >= line.length) window.clearInterval(timer);
    }, 14);
    return () => window.clearInterval(timer);
  }, [line]);

  const tally = useMemo(() => {
    const total = rows[0].seq + 1;
    let cleared = 0;
    let blocked = 0;
    let held = 0;
    let volume = 0;
    for (let seq = 0; seq < total; seq += 1) {
      const row = rowFor(seq);
      if (row.result.decision === "Cleared") {
        cleared += 1;
        volume += row.intent.amount;
      } else if (row.result.decision === "Policy blocked") blocked += 1;
      else held += 1;
    }
    return { total, cleared, blocked, held, volume };
  }, [rows]);

  const lastMs = rows.find((row) => row.ms !== null)?.ms ?? null;

  return (
    <div
      className="feed"
      ref={rootRef}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label="Simulated agent decision feed"
    >
      <div className="feed-top">
        <span className={"dot" + (paused ? " dot--hold" : "")} aria-hidden="true" />
        <span className="feed-path">agent://decisions/stream</span>
        <span className="chip">Simulated · runs in your browser</span>
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

      <div className="feed-telemetry">
        <div className="tele">
          <span className="tag">
            <i className="dot dot--cyan" aria-hidden="true" /> Simulated volume
          </span>
          <p className="tele-value">
            <Odometer value={usdcPlain(tally.volume)} /> <small>USDC</small>
          </p>
          <p className="tele-note">Cleared intents this session</p>
        </div>
        <div className="tele">
          <span className="tag">
            <i className="dot" aria-hidden="true" /> Decisions
          </span>
          <p className="tele-value">
            <Odometer value={String(tally.total)} />
          </p>
          <p className="tele-note">
            <span className="tone-ok">{tally.cleared} cleared</span> · <span className="tone-stop">{tally.blocked} blocked</span> ·{" "}
            <span className="tone-hold">{tally.held} held</span>
          </p>
        </div>
        <div className="tele">
          <span className="tag">
            <i className="dot dot--violet" aria-hidden="true" /> Eval time
          </span>
          <p className="tele-value">
            {lastMs !== null ? (
              <>
                <Odometer value={(lastMs * 1000).toFixed(1)} /> <small>µs</small>
              </>
            ) : (
              <span className="tele-idle">—</span>
            )}
          </p>
          <p className="tele-note">Per decision, averaged over {SAMPLE_RUNS} runs on your machine</p>
        </div>
        <div className="tele tele--wave" aria-hidden="true">
          <span className="tag">
            <i className="dot dot--cyan" aria-hidden="true" /> Decision trace
          </span>
          <svg className="wave" viewBox="0 0 100 32" preserveAspectRatio="none">
            <path ref={waveRef} d="M0 16 L100 16" />
          </svg>
        </div>
      </div>

      <ol className="feed-rows" aria-live="off">
        {rows.map((row, index) => {
          const rowTone = tone(row.result.decision);
          return (
            <li key={row.seq} className={"feed-row tone-" + rowTone + (index === 0 ? " is-new" : "")}>
              <div className="feed-main">
                <span className="feed-id">
                  {row.id} <em>{row.intent.agent}</em>
                </span>
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
              <span className={"badge tone-" + rowTone}>
                <span className="feed-decision-long">{row.result.decision}</span>
                <span className="feed-decision-short">{SHORT[row.result.decision]}</span>
              </span>
            </li>
          );
        })}
      </ol>

      {/* Keyed by line so React mounts a fresh <p> per decision; the typewriter then owns that element's text
          without leaving React holding a detached text node. */}
      <p className="feed-log" key={line} ref={logRef} aria-live="off">
        {line}
      </p>
      <p className="feed-foot">
        Fixed illustrative sequence evaluated by the same rules as the terminal. Nothing is submitted, no funds move,
        and the numbers above are not a record of any real activity.
      </p>
    </div>
  );
}
