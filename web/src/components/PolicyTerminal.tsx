"use client";

import { useMemo, useState } from "react";
import { CASES, POLICY, evaluatePolicy, percent, tone, usdc, type SupplierState } from "@/lib/policy";

const NEXT_STEP: Record<string, string> = {
  Cleared: "The supplier purchase may be submitted; settlement and delivery are then written to the same order record.",
  "Policy blocked": "Nothing is submitted. The intent stays blocked until the failing condition changes.",
  "Human approval required": "Execution pauses. The intent is queued for a human decision and nothing is bought automatically.",
};

const PRESETS = [CASES.order, CASES.thin, CASES.uncertain, CASES.overLimit];

export default function PolicyTerminal() {
  const [amount, setAmount] = useState<number>(CASES.order.amount);
  const [cost, setCost] = useState<number>(CASES.order.cost);
  const [supplier, setSupplier] = useState<SupplierState>(CASES.order.supplier);

  const result = useMemo(() => evaluatePolicy(amount, cost, supplier), [amount, cost, supplier]);
  const resultTone = tone(result.decision);
  const marginWidth = Math.max(0, Math.min(1, result.margin / 0.4)) * 100;

  const applyPreset = (preset: (typeof PRESETS)[number]) => {
    setAmount(preset.amount);
    setCost(preset.cost);
    setSupplier(preset.supplier);
  };

  return (
    <div className="terminal">
      <div className="terminal-top">
        <span className="terminal-dot" aria-hidden="true" />
        <span className="terminal-path">agent://policy/evaluate</span>
        <span className="chip">{POLICY.version}</span>
      </div>
      <div className="terminal-body">
        <div className="terminal-controls">
          <p className="terminal-presets" role="group" aria-label="Load a sample order">
            {PRESETS.map((preset) => (
              <button key={preset.label} type="button" onClick={() => applyPreset(preset)}>
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
              onChange={(event) => setAmount(Math.max(0, Number(event.target.value) || 0))}
            />
          </label>
          <input
            className="terminal-range"
            type="range"
            min={0}
            max={20000}
            step={10}
            value={Math.min(amount, 20000)}
            aria-label="Order amount slider"
            onChange={(event) => setAmount(Number(event.target.value))}
          />
          <label className="terminal-field">
            <span>Supplier cost</span>
            <input
              type="number"
              min={0}
              step={10}
              value={cost}
              onChange={(event) => setCost(Math.max(0, Number(event.target.value) || 0))}
            />
          </label>
          <input
            className="terminal-range"
            type="range"
            min={0}
            max={20000}
            step={10}
            value={Math.min(cost, 20000)}
            aria-label="Supplier cost slider"
            onChange={(event) => setCost(Number(event.target.value))}
          />
          <label className="terminal-field">
            <span>Supplier status</span>
            <select
              value={supplier}
              onChange={(event) =>
                setSupplier(event.target.value === "uncertain" ? "uncertain" : "verified")
              }
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
          </dl>
        </div>
        <div className="terminal-output">
          <p className="field-label">Agent decision</p>
          <p className={"terminal-decision tone-" + resultTone} aria-live="polite">
            {result.decision}
          </p>
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
            {result.checks.map((check) => (
              <li key={check.label} className={"check-row check-" + check.state}>
                <span className="check-mark" aria-hidden="true">
                  {check.state === "pass" ? "✓" : check.state === "hold" ? "!" : "×"}
                </span>
                <span className="check-label">{check.label}</span>
                <span className="check-note">{check.note}</span>
              </li>
            ))}
          </ul>
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
