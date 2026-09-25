"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Play, RotateCcw } from "lucide-react";
import {
  CASES,
  ORDER,
  POLICY,
  SCENARIOS,
  credential,
  evaluatePolicy,
  percent,
  tone,
  usdc,
  type Decision,
  type Scenario,
  type SupplierState,
} from "@/lib/policy";

type Phase = "idle" | "emit" | "gate" | "route" | "settled" | "blocked" | "held";

const NEXT_STEP: Record<Decision, string> = {
  Cleared: "The supplier purchase may be submitted; settlement and delivery are then written to the same order record.",
  "Policy blocked": "Nothing is submitted. The intent stays blocked until the failing condition changes.",
  "Human approval required": "Execution pauses. The intent is queued for a human decision and nothing is bought automatically.",
};

const SLIDER_MAX = 20_000;
const EMIT_MS = 460;
const CHECK_MS = 210;
const ROUTE_MS = 480;

/* Circuit geometry, in SVG user units. The packet rides this path; the gate nodes sit on its flat segment. */
const CIRCUIT_PATH = "M28 104 C92 104 108 60 168 60 H432 C492 60 508 104 572 104";
const GATE_IN_X = 168;
const GATE_OUT_X = 432;
const NODE_X = [198, 250, 300, 350, 402];
const NODE_Y = 60;

type Lengths = { total: number; entrance: number; exit: number; nodes: number[] };
type Segment = { from: number; to: number; duration: number; end?: () => void };

const easeOut = (t: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);

export default function PolicyTerminal() {
  const [amount, setAmount] = useState<number>(CASES.order.amount);
  const [cost, setCost] = useState<number>(CASES.order.cost);
  const [supplier, setSupplier] = useState<SupplierState>(CASES.order.supplier);
  const [scenarioId, setScenarioId] = useState<string>(SCENARIOS[0].id);
  const [phase, setPhase] = useState<Phase>("idle");
  const [lit, setLit] = useState(0);
  const [pulse, setPulse] = useState(0);

  const pathRef = useRef<SVGPathElement>(null);
  const trailRef = useRef<SVGPathElement>(null);
  const packetRef = useRef<SVGGElement>(null);
  const lengthsRef = useRef<Lengths | null>(null);
  const frameRef = useRef(0);

  const result = useMemo(() => evaluatePolicy(amount, cost, supplier), [amount, cost, supplier]);
  const resultTone = tone(result.decision);
  const passed = result.checks.filter((check) => check.state === "pass").length;
  const marginWidth = Math.max(0, Math.min(1, result.margin / 0.4)) * 100;
  const scenario = SCENARIOS.find((item) => item.id === scenarioId) ?? SCENARIOS[0];
  const matchesScenario = scenario.amount === amount && scenario.cost === cost && scenario.supplier === supplier;
  const token = credential(amount, cost, supplier);
  const isDefault = amount === CASES.order.amount && cost === CASES.order.cost && supplier === CASES.order.supplier;
  const running = phase === "emit" || phase === "gate" || phase === "route";
  const finished = phase === "settled" || phase === "blocked" || phase === "held";

  /* The path is measured once; node positions are found by bisection since x grows monotonically along it. */
  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;
    const total = path.getTotalLength();
    const lengthAtX = (x: number) => {
      let low = 0;
      let high = total;
      for (let i = 0; i < 26; i += 1) {
        const mid = (low + high) / 2;
        if (path.getPointAtLength(mid).x < x) low = mid;
        else high = mid;
      }
      return (low + high) / 2;
    };
    lengthsRef.current = {
      total,
      entrance: lengthAtX(GATE_IN_X),
      exit: lengthAtX(GATE_OUT_X),
      nodes: NODE_X.map(lengthAtX),
    };
  }, []);

  useEffect(() => () => window.cancelAnimationFrame(frameRef.current), []);

  const place = (length: number) => {
    const path = pathRef.current;
    const packet = packetRef.current;
    const trail = trailRef.current;
    const lengths = lengthsRef.current;
    if (!path || !packet || !trail || !lengths) return;
    const point = path.getPointAtLength(Math.max(0, Math.min(lengths.total, length)));
    packet.setAttribute("transform", "translate(" + point.x.toFixed(2) + " " + point.y.toFixed(2) + ")");
    trail.setAttribute("stroke-dasharray", length.toFixed(2) + " " + (lengths.total + 10).toFixed(2));
  };

  const reset = () => {
    window.cancelAnimationFrame(frameRef.current);
    setPhase("idle");
    setLit(0);
    place(0);
  };

  const run = (nextAmount: number, nextCost: number, nextSupplier: SupplierState) => {
    window.cancelAnimationFrame(frameRef.current);
    const snapshot = evaluatePolicy(nextAmount, nextCost, nextSupplier);
    const lengths = lengthsRef.current;
    const finalPhase: Phase =
      snapshot.decision === "Cleared" ? "settled" : snapshot.decision === "Policy blocked" ? "blocked" : "held";
    if (!lengths || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setLit(snapshot.checks.findIndex((check) => check.state === "fail") + 1 || 5);
      setPhase(finalPhase);
      return;
    }

    const segments: Segment[] = [
      {
        from: 0,
        to: lengths.entrance,
        duration: EMIT_MS,
        end: () => {
          setPhase("gate");
          setPulse((value) => value + 1);
          navigator.vibrate?.(8);
        },
      },
    ];
    let previous = lengths.entrance;
    let halted = false;
    snapshot.checks.forEach((check, index) => {
      if (halted) return;
      segments.push({
        from: previous,
        to: lengths.nodes[index],
        duration: CHECK_MS,
        end: () => {
          setLit(index + 1);
          if (check.state === "fail") {
            setPhase("blocked");
            navigator.vibrate?.([12, 40, 12]);
          }
        },
      });
      previous = lengths.nodes[index];
      if (check.state === "fail") halted = true;
    });
    if (!halted) {
      if (finalPhase === "held") {
        segments.push({ from: previous, to: lengths.exit, duration: CHECK_MS, end: () => setPhase("held") });
      } else {
        segments.push({ from: previous, to: lengths.exit, duration: CHECK_MS, end: () => setPhase("route") });
        segments.push({ from: lengths.exit, to: lengths.total, duration: ROUTE_MS, end: () => setPhase("settled") });
      }
    }

    setPhase("emit");
    setLit(0);
    place(0);
    let cursor = 0;
    let segmentStart = performance.now();
    const step = (now: number) => {
      const segment = segments[cursor];
      if (!segment) return;
      const t = (now - segmentStart) / segment.duration;
      if (t >= 1) {
        place(segment.to);
        segment.end?.();
        cursor += 1;
        segmentStart = now;
        if (cursor < segments.length) frameRef.current = window.requestAnimationFrame(step);
        return;
      }
      // Ease only the free legs; inside the gate the packet keeps a steady, mechanical pace.
      const eased = cursor === 0 || cursor === segments.length - 1 ? easeOut(t) : t;
      place(segment.from + (segment.to - segment.from) * eased);
      frameRef.current = window.requestAnimationFrame(step);
    };
    frameRef.current = window.requestAnimationFrame(step);
  };

  const applyScenario = (item: Scenario) => {
    setScenarioId(item.id);
    setAmount(item.amount);
    setCost(item.cost);
    setSupplier(item.supplier);
    run(item.amount, item.cost, item.supplier);
  };

  const edit = (update: () => void) => {
    update();
    if (phase !== "idle") reset();
  };

  const cardTone = phase === "settled" ? "ok" : phase === "held" ? "hold" : phase === "blocked" ? "stop" : resultTone;
  const rowClass = (index: number, state: string) =>
    "check-row check-" + state + (phase === "idle" ? "" : index < lit ? " is-lit" : " is-dim");

  return (
    <div className={"terminal glass phase-" + phase}>
      <div className="terminal-top">
        <span className="terminal-lights" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span className="terminal-path">agent://policy/evaluate</span>
        <span className="chip">{POLICY.version}</span>
        <button
          type="button"
          className="terminal-reset"
          onClick={() => {
            setScenarioId(SCENARIOS[0].id);
            setAmount(CASES.order.amount);
            setCost(CASES.order.cost);
            setSupplier(CASES.order.supplier);
            reset();
          }}
          aria-label="Reset to this page's order"
          disabled={isDefault && phase === "idle"}
        >
          <RotateCcw size={13} aria-hidden="true" /> Reset
        </button>
      </div>

      <div className="terminal-body">
        <div className="terminal-controls">
          <p className="field-label">Run a scenario</p>
          <div className="scenarios" role="group" aria-label="Run a sample scenario">
            {SCENARIOS.map((item) => {
              const outcome = tone(evaluatePolicy(item.amount, item.cost, item.supplier).decision);
              const isActive = scenarioId === item.id && matchesScenario;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={"scenario tone-" + outcome + (isActive ? " is-active" : "")}
                  aria-pressed={isActive}
                  onClick={() => applyScenario(item)}
                >
                  <span className="scenario-agent">{item.agent}</span>
                  <span className="scenario-label">{item.label}</span>
                  <span className="scenario-meta">
                    {item.quantity} · <b>{usdc(item.amount)}</b>
                  </span>
                  <span className="scenario-dot" aria-hidden="true" />
                </button>
              );
            })}
          </div>

          <label className="terminal-field">
            <span>Order amount</span>
            <input
              type="number"
              min={0}
              step={10}
              value={amount}
              onChange={(event) => edit(() => setAmount(Math.max(0, Number(event.target.value) || 0)))}
            />
            <small>USDC</small>
          </label>
          <div className="range" style={{ "--fill": (Math.min(amount, SLIDER_MAX) / SLIDER_MAX) * 100 + "%" } as CSSProperties}>
            <span className="range-track" aria-hidden="true" />
            <span className="range-fill" aria-hidden="true" />
            <input
              type="range"
              min={0}
              max={SLIDER_MAX}
              step={10}
              value={Math.min(amount, SLIDER_MAX)}
              aria-label="Order amount slider"
              onChange={(event) => edit(() => setAmount(Number(event.target.value)))}
            />
          </div>

          <label className="terminal-field">
            <span>Supplier cost</span>
            <input
              type="number"
              min={0}
              step={10}
              value={cost}
              onChange={(event) => edit(() => setCost(Math.max(0, Number(event.target.value) || 0)))}
            />
            <small>USDC</small>
          </label>
          <div className="range" style={{ "--fill": (Math.min(cost, SLIDER_MAX) / SLIDER_MAX) * 100 + "%" } as CSSProperties}>
            <span className="range-track" aria-hidden="true" />
            <span className="range-fill" aria-hidden="true" />
            <input
              type="range"
              min={0}
              max={SLIDER_MAX}
              step={10}
              value={Math.min(cost, SLIDER_MAX)}
              aria-label="Supplier cost slider"
              onChange={(event) => edit(() => setCost(Number(event.target.value)))}
            />
          </div>

          <label className="terminal-field">
            <span>Supplier status</span>
            <select
              value={supplier}
              onChange={(event) => edit(() => setSupplier(event.target.value === "uncertain" ? "uncertain" : "verified"))}
            >
              <option value="verified">Supplier verified</option>
              <option value="uncertain">Supplier uncertain</option>
            </select>
          </label>

          <button type="button" className="btn btn--primary terminal-run" onClick={() => run(amount, cost, supplier)} disabled={running}>
            <Play size={14} aria-hidden="true" /> {running ? "Evaluating…" : finished ? "Run again" : "Run evaluation"}
          </button>

          <dl className="terminal-balance">
            <div>
              <dt>Available to spend</dt>
              <dd>{usdc(POLICY.availableToSpend)}</dd>
            </div>
            <div>
              <dt>Reserved</dt>
              <dd>{usdc(POLICY.reserved)}</dd>
            </div>
            <div>
              <dt>Gross margin</dt>
              <dd>floor {percent(POLICY.grossMarginFloor)}</dd>
            </div>
            <div>
              <dt>Auto-approval limit</dt>
              <dd>{usdc(POLICY.autoApprovalLimit)}</dd>
            </div>
          </dl>
        </div>

        <div className={"terminal-output tone-" + cardTone}>
          <div className="circuit" aria-hidden="true">
            <svg viewBox="0 0 600 150" preserveAspectRatio="xMidYMid meet">
              <defs>
                <filter id="pkt-glow" x="-200%" y="-200%" width="500%" height="500%">
                  <feGaussianBlur stdDeviation="4" />
                </filter>
              </defs>
              <path ref={pathRef} className="circuit-base" d={CIRCUIT_PATH} />
              <path ref={trailRef} className="circuit-trail" d={CIRCUIT_PATH} strokeDasharray="0 2000" />
              <rect className="circuit-gate" x={GATE_IN_X} y="28" width={GATE_OUT_X - GATE_IN_X} height="64" rx="14" />
              <text className="circuit-label" x={(GATE_IN_X + GATE_OUT_X) / 2} y="20" textAnchor="middle">
                POLICY GATE · 5 ORDERED CHECKS
              </text>
              <circle key={pulse} className="circuit-pulse" cx={GATE_IN_X} cy={NODE_Y} r="8" />
              {NODE_X.map((x, index) => {
                const check = result.checks[index];
                const state = phase !== "idle" && index < lit ? check.state : "idle";
                return (
                  <g key={x} className={"circuit-node node-" + state}>
                    <circle cx={x} cy={NODE_Y} r="9" />
                    <text x={x} y={NODE_Y + (index % 2 === 0 ? 24 : -16)} textAnchor="middle">
                      {["BALANCE", "RESERVED", "MARGIN", "SUPPLIER", "LIMIT"][index]}
                    </text>
                  </g>
                );
              })}
              <g className="circuit-end circuit-end--agent">
                <circle cx="28" cy="104" r="10" />
                <text x="28" y="134" textAnchor="middle">
                  AGENT
                </text>
              </g>
              <g className={"circuit-end circuit-end--settle" + (phase === "settled" ? " is-on" : "")}>
                <circle cx="572" cy="104" r="10" />
                <text x="572" y="134" textAnchor="middle">
                  SETTLEMENT
                </text>
              </g>
              <g ref={packetRef} className="packet" transform="translate(28 104)">
                <circle className="packet-glow" r="9" filter="url(#pkt-glow)" />
                <circle className="packet-core" r="4">
                  <animate attributeName="r" values="4;5;4" dur="1.2s" repeatCount="indefinite" />
                </circle>
              </g>
            </svg>
            <span className={"circuit-wave" + (phase === "gate" ? " is-on" : "")}>
              <i />
              <i />
              <i />
              <i />
              <i />
            </span>
          </div>

          <div className="terminal-verdict">
            <div>
              <p className="field-label">Agent decision</p>
              <p className={"terminal-decision " + (running ? "is-running" : "tone-" + resultTone)} aria-live="polite">
                {running ? "Evaluating…" : result.decision}
              </p>
            </div>
            <p className="terminal-score" aria-label={passed + " of 5 checks passed"}>
              <b>{running ? lit : passed}</b>/5
              <small>checks {running ? "run" : "passed"}</small>
            </p>
          </div>

          <div className="terminal-margin">
            <p>
              Projected Gross margin <b>{percent(result.margin)}</b>
            </p>
            <span className={"margin-meter tone-" + resultTone} aria-hidden="true">
              <span style={{ width: marginWidth.toFixed(1) + "%" }} />
              <span className="margin-floor" style={{ left: ((POLICY.grossMarginFloor / 0.4) * 100).toFixed(1) + "%" }} />
            </span>
          </div>

          <div className="terminal-result">
            <ul className="checklist">
              {result.checks.map((check, index) => (
                <li key={check.id} className={rowClass(index, check.state)}>
                  <span className="check-mark" aria-hidden="true">
                    {check.state === "pass" ? "✓" : check.state === "hold" ? "!" : "×"}
                  </span>
                  <span className="check-label">{check.label}</span>
                  <span className="check-note">{check.note}</span>
                </li>
              ))}
            </ul>

            <div className="credential-slot" aria-live="polite">
              <div className={"credential foil is-" + (finished ? phase : "idle")}>
                <div className="credential-face">
                  <p className="credential-brand">
                    <span>
                      mercenta<span className="brand-dot">.</span>
                    </span>
                    <span className="credential-kind">Settlement token</span>
                  </p>
                  <span className="credential-chip" aria-hidden="true" />
                  <p className="credential-number">•••• •••• •••• {finished ? token.tail : "····"}</p>
                  <dl className="credential-rows">
                    <div>
                      <dt>Order</dt>
                      <dd>{matchesScenario && scenario.id === "compute" ? ORDER.id : "MR-ORD-" + (2481 + (Number(token.tail) % 400))}</dd>
                    </div>
                    <div>
                      <dt>Amount</dt>
                      <dd>{usdc(amount)}</dd>
                    </div>
                    <div>
                      <dt>Rail</dt>
                      <dd>USDC · Arc (planned)</dd>
                    </div>
                  </dl>
                  <p className="credential-seal">seal · {finished ? token.seal : "————————————————"}</p>
                  <p className={"credential-state tone-" + cardTone}>
                    {phase === "settled"
                      ? "Issued · settlement recorded"
                      : phase === "held"
                        ? "Not issued · awaiting a human"
                        : phase === "blocked"
                          ? "Void · policy blocked"
                          : "Run an evaluation"}
                  </p>
                </div>
                {phase === "blocked" && (
                  <span className="credential-stamp tone-stop" aria-hidden="true">
                    Void
                  </span>
                )}
                {phase === "held" && (
                  <span className="credential-stamp tone-hold" aria-hidden="true">
                    Held
                  </span>
                )}
              </div>
              <p className="credential-note">
                Illustrative token. Nothing is minted, charged or transmitted: the number, the seal and the ledger line
                are drawn from the inputs in your browser.
              </p>
            </div>
          </div>

          <p className={"terminal-next tone-" + resultTone}>{NEXT_STEP[result.decision]}</p>
          <p className="note">
            Deterministic rules evaluated in order: a failed check blocks the order, then a held check escalates to a
            human. This evaluation runs in the browser against the illustrative configuration above — no order is
            submitted and no funds move.
          </p>
        </div>
      </div>
    </div>
  );
}
