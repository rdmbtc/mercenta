"use client";

import { useMemo, useState } from "react";
import { RotateCcw } from "lucide-react";
import { CASES, POLICY, evaluatePolicy, percent, tone, usdc, type PolicyCase, type SupplierState } from "@/lib/policy";

const NEXT_STEP: Record<string, string> = {
  Cleared: "The supplier purchase may be submitted; settlement and delivery are then written to the same order record.",
  "Policy blocked": "Nothing is submitted. The intent stays blocked until the failing condition changes.",
  "Human approval required": "Execution pauses. The intent is queued for a human decision and nothing is bought automatically.",
};

const PRESETS: PolicyCase[] = [CASES.order, CASES.thin, CASES.uncertain, CASES.overLimit];
const SLIDER_MAX = 20_000;

export default function PolicyTerminal() {
  const [amount, setAmount] = useState<number>(CASES.order.amount);
  const [cost, setCost] = useState<number>(CASES.order.cost);
  const [supplier, setSupplier] = useState<SupplierState>(CASES.order.supplier);

  const result = useMemo(() => evaluatePolicy(amount, cost, supplier), [amount, cost, supplier]);
  const resultTone = tone(result.decision);
  const marginWidth = Math.max(0, Math.min(1, result.margin / 0.4)) * 100;
  const activePreset = PRESETS.find(
    (preset) => preset.amount === amount && preset.cost === cost && preset.supplier === supplier,
  );
  const passed = result.checks.filter((check) => check.state === "pass").length;

  const applyPreset = (preset: PolicyCase) => {
    setAmount(preset.amount);
    setCost(preset.cost);
    setSupplier(preset.supplier);
  };

  return (
    <div className="terminal">
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
          disabled={activePreset === CASES.order}
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
                aria-pressed={activePreset === preset}
                className={activePreset === preset ? "is-active" : undefined}
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
              onChange={(event) => setAmount(Math.max(0, Number(event.target.value) || 0))}
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
            {result.checks.map((check) => (
              <li key={check.id} className={"check-row check-" + check.state}>
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
