"use client";

import { useMemo, useState } from "react";
import { CASES, POLICY, evaluatePolicy, percent, tone, usdc, type SupplierState } from "@/lib/policy";
import { Check, Pause, Reset, X } from "./Icons";

type CaseKey = keyof typeof CASES;
const CASE_KEYS = Object.keys(CASES) as CaseKey[];

const DECISION_COPY = {
  ok: "Every check passed. The order is authorized and moves to settlement.",
  stop: "A hard rule failed. Nothing is spent and the agent gets a precise reason.",
  hold: "Rules pass, but the amount is above the auto-approval limit. A human signs off.",
} as const;

export default function PolicySandbox() {
  const [amount, setAmount] = useState<number>(CASES.order.amount);
  const [cost, setCost] = useState<number>(CASES.order.cost);
  const [supplier, setSupplier] = useState<SupplierState>(CASES.order.supplier);

  const result = useMemo(() => evaluatePolicy(amount, cost, supplier), [amount, cost, supplier]);
  const t = tone(result.decision);
  const passed = result.checks.filter((c) => c.state === "pass").length;
  const active = CASE_KEYS.find(
    (k) => CASES[k].amount === amount && CASES[k].cost === cost && CASES[k].supplier === supplier,
  );

  const apply = (k: CaseKey) => {
    setAmount(CASES[k].amount);
    setCost(CASES[k].cost);
    setSupplier(CASES[k].supplier);
  };

  return (
    <div className="ml-sandbox">
      <div className="ml-sandbox__controls">
        <div className="ml-field">
          <span className="ml-field__label">Scenarios</span>
          <div className="ml-chips" role="group" aria-label="Scenarios">
            {CASE_KEYS.map((k) => (
              <button
                key={k}
                type="button"
                className="ml-chip"
                aria-pressed={active === k}
                onClick={() => apply(k)}
              >
                {CASES[k].label}
              </button>
            ))}
          </div>
        </div>

        <label className="ml-field">
          <span className="ml-field__row">
            <span className="ml-field__label">Client price</span>
            <span className="ml-field__value">{usdc(amount)}</span>
          </span>
          <input
            className="ml-range"
            type="range"
            min={0}
            max={12000}
            step={50}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            style={{ ["--p" as string]: (amount / 12000) * 100 + "%" }}
          />
        </label>

        <label className="ml-field">
          <span className="ml-field__row">
            <span className="ml-field__label">Supplier wholesale cost</span>
            <span className="ml-field__value">{usdc(cost)}</span>
          </span>
          <input
            className="ml-range"
            type="range"
            min={0}
            max={10000}
            step={50}
            value={cost}
            onChange={(e) => setCost(Number(e.target.value))}
            style={{ ["--p" as string]: (cost / 10000) * 100 + "%" }}
          />
        </label>

        <div className="ml-field">
          <span className="ml-field__label">Supplier status</span>
          <div className="ml-segment" role="radiogroup" aria-label="Supplier status">
            {(["verified", "uncertain"] as const).map((s) => (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={supplier === s}
                className="ml-segment__opt"
                onClick={() => setSupplier(s)}
              >
                {s === "verified" ? "Verified" : "Uncertain"}
              </button>
            ))}
          </div>
        </div>

        <dl className="ml-sandbox__limits">
          <div><dt>Available</dt><dd>{usdc(POLICY.availableToSpend)}</dd></div>
          <div><dt>Margin floor</dt><dd>{percent(POLICY.grossMarginFloor)}</dd></div>
          <div><dt>Auto-approve</dt><dd>{usdc(POLICY.autoApprovalLimit)}</dd></div>
        </dl>

        <button type="button" className="ml-link-btn" onClick={() => apply("order")}>
          <Reset size={15} /> Reset to default order
        </button>
      </div>

      <div className={"ml-sandbox__result ml-tone-" + t} aria-live="polite">
        <div className="ml-sandbox__head">
          <span className="ml-eyebrow-sm">Decision</span>
          <span className="ml-mono ml-dim">{passed}/5 checks passed</span>
        </div>
        <p className="ml-decision">
          <span className="ml-decision__dot" aria-hidden="true" />
          {result.decision}
        </p>
        <p className="ml-sandbox__copy">{DECISION_COPY[t]}</p>

        <div className="ml-meter" aria-hidden="true">
          {result.checks.map((c) => (
            <span key={c.id} className={"ml-meter__seg is-" + c.state} />
          ))}
        </div>

        <ol className="ml-checks">
          {result.checks.map((c, i) => (
            <li key={c.id} className={"ml-check is-" + c.state}>
              <span className="ml-check__icon">
                {c.state === "pass" ? <Check size={14} /> : c.state === "fail" ? <X size={14} /> : <Pause size={14} />}
              </span>
              <span className="ml-check__body">
                <span className="ml-check__label">
                  <span className="ml-mono ml-dim">0{i + 1}</span> {c.label}
                </span>
                <span className="ml-check__note">{c.note}</span>
              </span>
            </li>
          ))}
        </ol>

        <div className="ml-sandbox__foot">
          <span>Projected gross margin</span>
          <strong className="ml-mono">{percent(result.margin)}</strong>
        </div>
      </div>
    </div>
  );
}
