"use client";

import { useEffect, useMemo, useState } from "react";
import { RotateCcw } from "lucide-react";
import {
  CASES,
  POLICY,
  evaluatePolicy,
  percent,
  tone,
  usdc,
  type PolicyCase,
  type PolicyCheck,
  type PolicyResult,
  type SupplierState,
} from "@/lib/policy";
import css from "./PolicyTerminal.module.css";

const NEXT_STEP: Record<string, string> = {
  Cleared: "The supplier purchase may be submitted; settlement and delivery are then written to the same order record.",
  "Policy blocked": "Nothing is submitted. The intent stays blocked until the failing condition changes.",
  "Human approval required": "Execution pauses. The intent is queued for a human decision and nothing is bought automatically.",
};

const PRESETS: PolicyCase[] = [CASES.order, CASES.thin, CASES.uncertain, CASES.overLimit];
const SLIDER_MAX = 20_000;

/** Illustrative agent intents. Each loads its numbers into the manual controls; the same rules then judge it. */
type Sim = {
  id: string;
  agent: string;
  hash: string;
  amount: number;
  cost: number;
  supplier: SupplierState;
  intent: string;
};

const SIMS: Sim[] = [
  { id: "devin", agent: "Devin", hash: "8c41", amount: 24_000, cost: 20_400, supplier: "verified", intent: "Purchase 10x H100 GPUs" },
  { id: "openclaw", agent: "OpenClaw", hash: "2d17", amount: 850, cost: 700, supplier: "verified", intent: "API Token Top-up" },
  { id: "rogue", agent: "Rogue Bot", hash: "9f04", amount: 45_000, cost: 37_800, supplier: "uncertain", intent: "Unverified Supplier Spend" },
];

const CHECK_TITLE: Record<PolicyCheck["id"], string> = {
  balance: "Available to spend",
  reserved: "Reserved liquidity",
  margin: "Gross margin floor",
  supplier: "Supplier status",
  limit: "Approval limit",
};

const STATE_WORD: Record<PolicyCheck["state"], string> = { pass: "Pass", fail: "Fail", hold: "Hold" };

/** One honest sentence per outcome, used by the record strip below the route. */
const SPEND_STATE: Record<PolicyResult["decision"], string> = {
  Cleared: "Cleared",
  "Policy blocked": "Blocked, nothing charged",
  "Human approval required": "Pending approval, nothing charged",
};

/** Manual controls stay the source of truth; a simulation only loads its numbers into them. */
type Selection = { id: string; pending: boolean };

const ROUTE_W = 700;
const ROUTE_H = 26;
const NODE_X = [34, 192, 350, 508, 666];
const NODE_Y = 13;
const ROUTE_STEP_MS = 150;

function nodeX(index: number): number {
  return NODE_X[Math.max(0, Math.min(NODE_X.length - 1, index))];
}

function verdictNote(result: PolicyResult): string {
  if (result.decision === "Cleared") return "Every check passed inside the approval limit.";
  if (result.decision === "Policy blocked")
    return "Blocked by " + result.checks.filter((check) => check.state === "fail").length + " of 5 checks.";
  return "Held at check 5 of 5, the auto-approval limit.";
}

/**
 * The SVG route packet: one marker travelling left to right across the five node positions that match the
 * checklist below it. Opacity/state only ever advances while a simulated run is in flight.
 */
function RoutePacket({
  checks,
  result,
  runKey,
  routed,
}: {
  checks: PolicyCheck[];
  result: PolicyResult;
  runKey: number;
  routed: boolean;
}) {
  // A simulated run shows nothing before its first check; the manual terminal is instant and shows the finished route.
  const [open, setOpen] = useState(routed ? 0 : checks.length);
  const [reduced, setReduced] = useState(true);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    setOpen(reduced || !routed ? checks.length : 0);
  }, [reduced, checks, runKey, routed]);

  useEffect(() => {
    if (reduced || !routed || open >= checks.length) return;
    const timer = window.setTimeout(() => setOpen((value) => value + 1), ROUTE_STEP_MS);
    return () => window.clearTimeout(timer);
  }, [reduced, routed, open, checks.length, runKey]);

  const total = checks.length;
  const at = Math.min(open, total - 1);
  const settled = open >= total;
  const stop = settled && result.decision !== "Cleared";
  // Purple while a rule is being evaluated; the outcome colour only lands once the route settles.
  const dotTone = settled ? (result.decision === "Cleared" ? css.pass : css.fail) : css.evaluating;
  const label = settled
    ? result.decision === "Cleared"
      ? "Route cleared after 5 of 5 checks"
      : "Route stopped at check 5 of 5"
    : "Evaluating check " + (at + 1) + " of " + total + " - " + CHECK_TITLE[checks[at].id];

  return (
    <div className={css.packet}>
      <div className={css.packetHead}>
        <p className={css.packetLabel}>Evaluation route</p>
        <span className={css.packetStep}>{label}</span>
      </div>
      {reduced ? (
        <p className="sr-only">
          Route animation is off because reduced motion is enabled. The five check states below are the completed result.
        </p>
      ) : null}
      <svg
        className={css.route}
        viewBox={"0 0 " + ROUTE_W + " " + ROUTE_H}
        role="img"
        aria-label={"Packet route: " + label}
        focusable="false"
      >
        <path className={css.routeLine} d={"M" + nodeX(0) + " " + NODE_Y + "H" + nodeX(total - 1)} fill="none" />
        {checks.map((check, index) => {
          const state = index < open ? check.state : null;
          const locked = stop && index === total - 1;
          const toneClass = state === null ? css.idle : state === "pass" ? css.pass : state === "fail" ? css.fail : css.hold;
          return (
            <circle
              key={check.id}
              className={css.routeNode + " " + toneClass + (index < open ? " " + css.routeNodeOn : "") + (locked ? " " + css.routeNodeStop : "")}
              cx={nodeX(index)}
              cy={NODE_Y}
              r={locked ? 5 : 4}
            />
          );
        })}
        <g className={css.packetMarker + " " + dotTone} transform={"translate(" + nodeX(at) + " " + NODE_Y + ")"}>
          <circle
            className={css.packetHalo + (reduced ? "" : " " + css.packetHaloRun) + (settled ? " " + css.packetHaloDone : "")}
            r={9}
          />
          <circle className={css.packetDot} r={4.5} />
        </g>
      </svg>
      <ol className={css.checks}>
        {checks.map((check, index) => {
          const state = index < open ? check.state : null;
          const locked = stop && index === total - 1;
          const toneClass =
            index === at && !settled
              ? css.evaluating
              : state === null
                ? css.idle
                : state === "pass"
                  ? css.pass
                  : state === "fail"
                    ? css.fail
                    : css.hold;
          return (
            <li
              key={check.id}
              className={css.check + " " + toneClass + (index < open ? " " + css.checkOn : "")}
              title={check.note}
            >
              <span className={css.checkIndex}>{"0" + (index + 1)}</span>
              <span className={css.checkLabel}>{CHECK_TITLE[check.id]}</span>
              <span className={css.checkState}>{locked ? "Stop" : state === null ? "Queued" : STATE_WORD[state]}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export default function PolicyTerminal() {
  const [amount, setAmount] = useState<number>(CASES.order.amount);
  const [cost, setCost] = useState<number>(CASES.order.cost);
  const [supplier, setSupplier] = useState<SupplierState>(CASES.order.supplier);
  const [sim, setSim] = useState<Sim | null>(null);
  const [runKey, setRunKey] = useState(0);
  const [selection, setSelection] = useState<Selection | null>(null);

  const result = useMemo(() => evaluatePolicy(amount, cost, supplier), [amount, cost, supplier]);
  const resultTone = tone(result.decision);
  const marginWidth = Math.max(0, Math.min(1, result.margin / 0.4)) * 100;
  const activePreset = PRESETS.find(
    (preset) => preset.amount === amount && preset.cost === cost && preset.supplier === supplier,
  );
  const passed = result.checks.filter((check) => check.state === "pass").length;
  const routed = result.checks.map((check) => (check.id === "limit" && check.state === "hold" ? "fail" : check.state));
  const simVerdict = selection !== null && selection.id === "rogue";
  const handoff = routed.indexOf("fail") === routed.length - 1 && result.decision === "Human approval required";
  const shown = result.checks.map((check) => {
    if (check.id !== "limit" || result.decision !== "Human approval required") return check;
    return {
      ...check,
      label: "Requested amount above the auto-approval limit",
      note:
        usdc(amount) +
        " exceeds the auto-approval limit of " +
        usdc(POLICY.autoApprovalLimit) +
        " and is referred to a human; no approval has been given and no spend is authorised.",
    };
  });

  // Illustrative haptic-shaped feedback: a visible buzz, plus navigator.vibrate where the browser exposes it.
  useEffect(() => {
    if (runKey === 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (result.decision === "Cleared") return;
    const frames = [26, 34, 26, 34];
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") navigator.vibrate(frames);
    return () => {
      if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") navigator.vibrate(0);
    };
  }, [runKey, result.decision]);

  const applyPreset = (preset: PolicyCase) => {
    setAmount(preset.amount);
    setCost(preset.cost);
    setSupplier(preset.supplier);
    setSim(null);
    setSelection(null);
  };

  const runSim = (next: Sim) => {
    setAmount(next.amount);
    setCost(next.cost);
    setSupplier(next.supplier);
    setSim(next);
    setRunKey((value) => value + 1);
    setSelection({ id: next.id, pending: false });
  };

  const rerun = () => {
    setRunKey((value) => value + 1);
    if (sim) setSelection({ id: sim.id, pending: false });
  };

  return (
    <div className={css.wrap}>
      <section className={css.sim} aria-labelledby="sim-title">
        <div className={css.simHead}>
          <h3 className={css.title} id="sim-title">
            Agent intent simulation
          </h3>
          <span className="chip">Browser simulation</span>
          <span className="chip">No live settlement</span>
          <span className="chip">No card issued</span>
        </div>
        <p className={css.prose}>
                Illustrative agents, illustrative amounts. Each button loads numbers into the controls below; the same five
                rules judge them, and nothing leaves this page.
        </p>

        <div className={css.presets} role="group" aria-label="Agent intent simulations">
          {SIMS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={css.preset}
              aria-pressed={selection !== null && selection.id === item.id}
              onClick={() => runSim(item)}
            >
              <span className={css.presetName}>{item.agent}: {item.intent}</span>
              <span className={css.presetAmount}>{usdc(item.amount)}</span>
              <span className={css.presetNote}>
                {item.agent} requests {usdc(item.amount)} for this, from a{" "}
                {item.supplier === "verified" ? "verified" : "not yet verified"} supplier quoting {usdc(item.cost)} supply
                cost. Illustrative simulation only.
              </span>
            </button>
          ))}
        </div>

        <div className={css.hud}>
          <p className={css.agentLine}>
            <span className="chip">Simulated route</span>
            <span className={css.agentName}>
              {sim
                ? sim.agent + " \u00b7 agent://policy/evaluate \u00b7 run " + String(runKey).padStart(2, "0")
                : "agent://policy/evaluate \u00b7 awaiting an intent"}
            </span>
          </p>
          <p className={css.prose}>
            {sim
              ? sim.agent + ' requests "' + sim.intent + '" for ' + usdc(sim.amount) + " (" + usdc(sim.cost) + " supplier cost, hash " + sim.hash + ")."
              : "Run a simulated intent to watch the packet cross all five checks."}
            {sim ? " Illustrative simulation only - no order is created and no funds move." : ""}
          </p>

          <RoutePacket checks={shown} result={result} runKey={runKey} routed={sim !== null} />

          <p className={css.record}>
            <span className={css.recordKey}>Illustrative record</span>
            {"Requested " + usdc(amount) + " \u00b7 " + percent(result.margin) + " gross margin \u00b7 "}
            <span className={"tone-" + resultTone}>{SPEND_STATE[result.decision]}</span>
            {
              ". Nothing is issued, stored, charged or settled anywhere on this page - no card, no PAN, no bank, no processor, no on-chain transaction."
            }
          </p>

          <p className={css.verdict} aria-live="polite">
            {sim
              ? sim.agent + ": " + result.decision + " \u00b7 " + passed + " of 5 checks passed \u00b7 " + verdictNote(result)
              : "Nothing has been evaluated since the page loaded."}
          </p>

          <div className={css.actions}>
            <button type="button" className={css.action} onClick={rerun} disabled={sim === null}>
              <RotateCcw size={13} aria-hidden="true" /> Re-run simulation
            </button>
            <button
              type="button"
              className={css.action}
              onClick={() => applyPreset(CASES.order)}
              disabled={sim === null && activePreset === CASES.order}
            >
              Return to this page&apos;s order
            </button>
          </div>

          {handoff ? (
            <p className={css.handoff}>
              Simulated handoff: this intent would leave the automated path at check 5 of 5 and wait for a human. No
              approver exists in this preview, so no approval is recorded and nothing is bought.
            </p>
          ) : null}
          {simVerdict ? (
            <p className={css.handoff}>
              The supplier is not verified here, so this spend fails before the approval limit is ever reached. Its
              45,000.00 USDC figure is illustrative and is not an approved, scheduled or settled spend.
            </p>
          ) : null}
        </div>
      </section>

      <div className={"terminal" + (runKey > 0 && result.decision !== "Cleared" ? " " + css.buzz : "")} key={runKey}>
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
            onClick={() => applyPreset(CASES.order)}
            aria-label="Reset to this page's order"
            disabled={sim === null && activePreset === CASES.order}
          >
            <RotateCcw size={13} aria-hidden="true" /> Reset
          </button>
        </div>
        <div className="terminal-body">
          <div className="terminal-controls">
            <p className="field-label">Load a sample order</p>
            <p className="terminal-presets" role="group" aria-label="Load a sample order">
              {PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  aria-pressed={sim === null && activePreset === preset}
                  className={sim === null && activePreset === preset ? "is-active" : undefined}
                >
                  {preset.label}
                </button>
              ))}
            </p>
            <label className="terminal-field">
              <span>Order amount</span>
              <input
                type="number"
                min={0}
                step={10}
                value={amount}
                onChange={(event) => {
                  setAmount(Math.max(0, Number(event.target.value) || 0));
                  setSelection(null);
                }}
              />
              <small>USDC</small>
            </label>
            <input
              className="terminal-range"
              type="range"
              min={0}
              max={SLIDER_MAX}
              step={10}
              value={Math.min(amount, SLIDER_MAX)}
              aria-label="Order amount slider"
              style={{ "--fill": (Math.min(amount, SLIDER_MAX) / SLIDER_MAX) * 100 + "%" } as React.CSSProperties}
              onChange={(event) => {
                setAmount(Number(event.target.value));
                setSelection(null);
              }}
            />
            <label className="terminal-field">
              <span>Supplier cost</span>
              <input
                type="number"
                min={0}
                step={10}
                value={cost}
                onChange={(event) => {
                  setCost(Math.max(0, Number(event.target.value) || 0));
                  setSelection(null);
                }}
              />
              <small>USDC</small>
            </label>
            <input
              className="terminal-range"
              type="range"
              min={0}
              max={SLIDER_MAX}
              step={10}
              value={Math.min(cost, SLIDER_MAX)}
              aria-label="Supplier cost slider"
              style={{ "--fill": (Math.min(cost, SLIDER_MAX) / SLIDER_MAX) * 100 + "%" } as React.CSSProperties}
              onChange={(event) => {
                setCost(Number(event.target.value));
                setSelection(null);
              }}
            />
            <label className="terminal-field">
              <span>Supplier status</span>
              <select
                value={supplier}
                onChange={(event) => {
                  setSupplier(event.target.value === "uncertain" ? "uncertain" : "verified");
                  setSelection(null);
                }}
              >
                <option value="verified">Supplier verified</option>
                <option value="uncertain">Supplier uncertain</option>
              </select>
            </label>
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
          <div className={"terminal-output tone-" + resultTone}>
            <div className="terminal-verdict">
              <div>
                <p className="field-label">Agent decision</p>
                <p className={"terminal-decision tone-" + resultTone} aria-live="polite">
                  {result.decision}
                </p>
              </div>
              <p className="terminal-score" aria-label={passed + " of 5 checks passed"}>
                <b>{passed}</b>/5
                <small>checks passed</small>
              </p>
            </div>
            <div className="terminal-margin">
              <p>
                Projected Gross margin <b>{percent(result.margin)}</b>
              </p>
              <span className={"margin-meter tone-" + resultTone} aria-hidden="true">
                <span style={{ width: marginWidth.toFixed(1) + "%" }} />
                <span
                  className="margin-floor"
                  style={{ left: ((POLICY.grossMarginFloor / 0.4) * 100).toFixed(1) + "%" }}
                />
              </span>
            </div>
            <ul className="checklist">
              {shown.map((check) => (
                <li
                  key={check.id}
                  className={
                    "check-row check-" + (check.id === "limit" && check.state === "hold" ? "fail" : check.state)
                  }
                >
                  <span className="check-mark" aria-hidden="true">
                    {check.id === "limit" && result.decision === "Human approval required"
                      ? "\u00d7"
                      : check.state === "pass"
                        ? "\u2713"
                        : check.state === "hold"
                          ? "!"
                          : "\u00d7"}
                  </span>
                  <span className="check-label">{check.label}</span>
                  <span className="check-note">{check.note}</span>
                </li>
              ))}
            </ul>
            <p className={"terminal-next tone-" + resultTone}>{NEXT_STEP[result.decision]}</p>
            <p className="note">
            The five rules run in order: a failed rule stops the purchase, a held rule hands it to you. This runs in
              human. This evaluation runs in the browser against the illustrative configuration above - no order is
              submitted and no funds move. The simulation above this terminal and the card it draws are illustrative
              previews; a spend that fails a check stays blocked or pending, with nothing authorised, charged or settled.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
