"use client";
import { useEffect, useState } from "react";
import {
  Coins,
  HandCoins,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldCheck,
  Activity,
  RefreshCw,
  ArrowRight,
  Check,
} from "lucide-react";
import {
  parseMoney,
  formatMoney,
  safeParse,
  displayUnits,
  projectYield,
  loanRisk,
} from "@/lib/liquidity-math";
import { Badge, Eyebrow } from "./ProductShell";
type Treasury = {
  available_units: string;
  deposited_units: string;
  debt_units: string;
  collateral_units: string;
};
const tabs = [
  { id: "earn", label: "Earn Vaults", Icon: Coins },
  { id: "borrow", label: "Borrow vs cirBTC", Icon: HandCoins },
  { id: "onramp", label: "Fiat Onramp", Icon: CreditCard },
] as const;
export function LiquidityCockpit({
  onNotify,
}: {
  onNotify?: (s: string) => void;
}) {
  const [tab, setTab] = useState<"earn" | "borrow" | "onramp">("earn"),
    [treasury, setTreasury] = useState<Treasury | null>(null),
    [amount, setAmount] = useState("2500"),
    [days, setDays] = useState(30),
    [collateral, setCollateral] = useState("0.10"),
    [borrow, setBorrow] = useState("5000"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [method, setMethod] = useState("card"),
    [onramp, setOnramp] = useState("250"),
    [session, setSession] = useState(false),
    [discovery, setDiscovery] = useState("");
  useEffect(() => {
    const t = new URLSearchParams(location.search).get("tab");
    if (t === "earn" || t === "borrow" || t === "onramp") setTab(t);
    let cancelled = false;
    fetch("/api/backend/liquidity/summary")
      .then(async (r) => {
        if (!r.ok) throw new Error("Backend unavailable");
        const d = await r.json();
        if (!cancelled) setTreasury(d.treasury);
      })
      .catch(() => {
        if (!cancelled)
          setError(
            "Backend unavailable. Calculators still work; treasury operations are disabled.",
          );
      });
    return () => {
      cancelled = true;
    };
  }, []);
  const yieldEstimate = projectYield(safeParse(amount), 540n, days),
    risk = loanRisk(safeParse(collateral, 8), safeParse(borrow));
  const deposited = treasury ? BigInt(treasury.deposited_units) : 0n,
    debt = treasury ? BigInt(treasury.debt_units) : 0n;
  const noDeposit = deposited === 0n,
    noDebt = debt === 0n,
    hasDebt = debt > 0n;
  const collateralSlider = (safeParse(collateral, 8) / 1000000n).toString(),
    borrowSlider = (safeParse(borrow) / 1000000n).toString();
  const healthDisplay =
    risk.healthFactorBps === null
      ? "∞"
      : (BigInt(risk.healthFactorBps) / 10000n).toString() +
        "." +
        (BigInt(risk.healthFactorBps) % 10000n)
          .toString()
          .padStart(4, "0")
          .slice(0, 2);
  const ltvWidth =
    BigInt(risk.ltvBps) > 10000n
      ? "100%"
      : (BigInt(risk.ltvBps) / 100n).toString() + "%";

  async function action(path: string, body: object) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const r = await fetch("/api/backend/liquidity/" + path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: crypto.randomUUID(),
          mode: "sandbox",
          ...body,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.code ?? "Request rejected");
      if (d.treasury) setTreasury(d.treasury);
      const m = d.message ?? "Simulation saved. No real funds moved.";
      setMessage(m);
      onNotify?.(m);
      return d;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Operation unavailable");
      return null;
    } finally {
      setBusy(false);
    }
  }
  async function checkVaults() {
    setDiscovery("Checking Circle Earn service…");
    try {
      const r = await fetch("/api/backend/liquidity/earn/vaults?source=sdk");
      const d = await r.json();
      setDiscovery(
        d.mode === "sdk-discovery"
          ? "Circle discovery responded. Market data is available through the API; simulation below remains separate."
          : (d.message ?? "No live vault data available."),
      );
    } catch {
      setDiscovery("Circle discovery unavailable. No live yield is shown.");
    }
  }
  return (
    <section className="ml-cockpit" aria-label="Liquidity workspace">
      <div className="ml-topline">
        <div>
          <span className="ml-dot" />
          <Eyebrow>ARC TESTNET / TREASURY LAB</Eyebrow>
        </div>
        <Badge>Sandbox · no funds move</Badge>
      </div>
      <div className="ml-summary">
        <div>
          <span>Model available balance</span>
          <strong>
            {treasury ? displayUnits(treasury.available_units) : "—"}
            <small>USDC</small>
          </strong>
        </div>
        <div>
          <span>Model deposited</span>
          <strong>
            {treasury ? displayUnits(treasury.deposited_units) : "—"}
            <small>USDC</small>
          </strong>
        </div>
        <div>
          <span>Model debt</span>
          <strong>
            {treasury ? displayUnits(treasury.debt_units) : "—"}
            <small>USDC</small>
          </strong>
        </div>
        <div className="ml-summary-note">
          <ShieldCheck size={22} />
          <p>
            Separate from the real ledger.
            <br />
            Your agent has no signing authority.
          </p>
        </div>
      </div>
      <div className="ml-tabs" role="tablist" aria-label="Liquidity products">
        {tabs.map(({ id, label, Icon }) => (
          <button
            key={id}
            id={"ml-tab-" + id}
            role="tab"
            aria-selected={tab === id}
            aria-controls={"ml-panel-" + id}
            tabIndex={tab === id ? 0 : -1}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                e.preventDefault();
                const index = tabs.findIndex((t) => t.id === id),
                  next = tabs[(index + (e.key === "ArrowRight" ? 1 : 2)) % 3];
                setTab(next.id);
                document.getElementById("ml-tab-" + next.id)?.focus();
              }
            }}
            onClick={() => setTab(id)}
          >
            <Icon size={19} />
            {label}
            <ArrowUpRight size={15} />
          </button>
        ))}
      </div>
      {(error || message) && (
        <div
          className={"ml-feedback " + (error ? "is-error" : "")}
          role="status"
        >
          {error || message}
        </div>
      )}
      <div
        className="ml-grid"
        role="tabpanel"
        id={"ml-panel-" + tab}
        aria-labelledby={"ml-tab-" + tab}
      >
        {tab === "earn" ? (
          <>
            <article className="ml-main-card">
              <div className="ml-card-head">
                <Coins size={26} />
                <Badge>Illustrative rate</Badge>
              </div>
              <Eyebrow>01 / IDLE CAPITAL</Eyebrow>
              <h2>
                Let reserves work.
                <br />
                <span>Keep liquidity close.</span>
              </h2>
              <p>
                Model a USDC reserve allocation before you commit capital. The
                sample rate is not a live Arc vault quote.
              </p>
              <div className="ml-rate">
                <strong>
                  5.4<span>%</span>
                </strong>
                <div>
                  APY assumption
                  <small>Variable yield · principal at risk</small>
                </div>
              </div>
              <div className="ml-form-grid">
                <label>
                  Amount / USDC
                  <input
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    aria-label="Earn deposit amount"
                  />
                </label>
                <label>
                  Projection horizon
                  <select
                    value={days}
                    onChange={(e) => setDays(Number(e.target.value))}
                  >
                    <option value="30">30 days</option>
                    <option value="90">90 days</option>
                    <option value="365">365 days</option>
                  </select>
                </label>
              </div>
              <div className="ml-projection">
                <span>Estimated yield · {days} days</span>
                <strong>
                  +{displayUnits(yieldEstimate.gainUnits)}
                  <small>USDC</small>
                </strong>
                <p>
                  Simple pro-rata estimate. No compounding, fees or live
                  accrual.
                </p>
                <div className="ml-yield-bars" aria-hidden="true">
                  {Array.from({ length: 16 }, (_, i) => (
                    <i key={i} style={{ height: 18 + i * 4 }} />
                  ))}
                </div>
              </div>
              <div className="ml-actions">
                <button
                  className="mp-button"
                  disabled={busy || !treasury || safeParse(amount) <= 0n}
                  onClick={() => {
                    try {
                      parseMoney(amount);
                      void action("earn/deposit", { amount });
                    } catch {
                      setError(
                        "Enter a valid decimal amount with up to 6 places.",
                      );
                    }
                  }}
                >
                  <ArrowUpRight size={17} />
                  Simulate deposit
                </button>
                <button
                  className="mp-button outline"
                  disabled={busy || !treasury || noDeposit}
                  onClick={() =>
                    void action("earn/withdraw", {
                      amount: formatMoney(deposited),
                    })
                  }
                >
                  <ArrowDownLeft size={17} />
                  Simulate withdrawal
                </button>
              </div>
            </article>
            <aside className="ml-aside">
              <div className="ml-note-card">
                <Eyebrow>POLICY BEFORE YIELD</Eyebrow>
                <h3>Operating cash first.</h3>
                <p>
                  The simulator preserves 3,150 USDC for operating reserves.
                  Actual treasury allocation needs verified balances, cash-flow
                  forecasts and an approved policy.
                </p>
                <div className="ml-check-row">
                  <Check size={16} />
                  Reserve protected
                </div>
                <div className="ml-check-row">
                  <Check size={16} />
                  Integer micro-unit calculations
                </div>
                <div className="ml-check-row">
                  <Check size={16} />
                  No automated signing
                </div>
              </div>
              <div className="ml-note-card">
                <Eyebrow>CIRCLE APP KIT</Eyebrow>
                <h3>Inspect the source.</h3>
                <p>
                  Query SDK discovery separately. A market response never turns
                  this simulation into a real deposit.
                </p>
                <button
                  className="mp-text-link"
                  onClick={() => void checkVaults()}
                >
                  Check vault discovery <RefreshCw size={16} />
                </button>
                {discovery && (
                  <p className="ml-note" role="status">
                    {discovery}
                  </p>
                )}
              </div>
              <a href="/status" className="ml-status-link">
                <Activity size={18} />
                Monitoring coverage <ArrowRight size={17} />
              </a>
            </aside>
          </>
        ) : tab === "borrow" ? (
          <>
            <article className="ml-main-card">
              <div className="ml-card-head">
                <HandCoins size={26} />
                <Badge>Risk model</Badge>
              </div>
              <Eyebrow>02 / WORKING CAPITAL</Eyebrow>
              <h2>
                Borrow against cirBTC.
                <br />
                <span>Not against your rules.</span>
              </h2>
              <p>
                Explore USDC liquidity without selling the model collateral. No
                live oracle, deployed market or loan execution is implied.
              </p>
              <div className="ml-borrow-top">
                <div>
                  <span>Maximum LTV</span>
                  <strong>
                    75<small>%</small>
                  </strong>
                </div>
                <div>
                  <span>Assumed cirBTC price</span>
                  <strong>
                    92,400<small>USD</small>
                  </strong>
                </div>
              </div>
              <label className="ml-slider-label">
                Collateral / cirBTC
                <input
                  aria-label="cirBTC collateral"
                  inputMode="decimal"
                  value={collateral}
                  onChange={(e) => setCollateral(e.target.value)}
                />
                <input
                  aria-label="Adjust cirBTC collateral"
                  type="range"
                  min="1"
                  max="100"
                  value={collateralSlider}
                  onChange={(e) =>
                    setCollateral(
                      (BigInt(e.target.value) / 100n).toString() +
                        "." +
                        (BigInt(e.target.value) % 100n)
                          .toString()
                          .padStart(2, "0"),
                    )
                  }
                />
              </label>
              <label className="ml-slider-label">
                Borrow amount / USDC
                <input
                  aria-label="USDC borrow amount"
                  inputMode="decimal"
                  value={borrow}
                  onChange={(e) => setBorrow(e.target.value)}
                />
                <input
                  aria-label="Adjust USDC borrow amount"
                  type="range"
                  min="100"
                  max="10000"
                  step="100"
                  value={borrowSlider}
                  onChange={(e) => setBorrow(e.target.value)}
                />
              </label>
              <div className="ml-risk-row">
                <div>
                  <span>Health factor</span>
                  <strong>{healthDisplay}</strong>
                  <small>{risk.status.replace("_", " ")}</small>
                </div>
                <div>
                  <span>Liquidation price / USD</span>
                  <strong>{displayUnits(risk.liquidationPriceUnits)}</strong>
                  <small>82.5% threshold assumption</small>
                </div>
              </div>
              <div className="ml-risk-boundary">
                <div style={{ width: ltvWidth }} />
                <i />
                <span>75% maximum</span>
              </div>
              <p className="ml-note">
                Borrow capacity: {displayUnits(risk.maxBorrowUnits)} USDC. A
                health factor above 1 does not override the 75% LTV limit.
              </p>
              <div className="ml-actions">
                <button
                  className="mp-button"
                  disabled={busy || !treasury || !risk.allowed || hasDebt}
                  onClick={() =>
                    void action("borrow/originate", {
                      amount: borrow,
                      collateral,
                    })
                  }
                >
                  Simulate borrowing <ArrowUpRight size={17} />
                </button>
                <button
                  className="mp-button outline"
                  disabled={busy || !treasury || noDebt}
                  onClick={() =>
                    void action("borrow/repay", { amount: formatMoney(debt) })
                  }
                >
                  Simulate repayment
                </button>
              </div>
            </article>
            <aside className="ml-aside">
              <div className="ml-note-card">
                <Eyebrow>RISK IS NOT OPTIONAL</Eyebrow>
                <h3>Protect the collateral.</h3>
                <p>
                  Price declines can trigger liquidation. Model parameters are
                  assumptions, not current terms, a credit offer or an approval.
                </p>
                <dl>
                  <div>
                    <dt>Borrow asset</dt>
                    <dd>USDC</dd>
                  </div>
                  <div>
                    <dt>Collateral asset</dt>
                    <dd>cirBTC</dd>
                  </div>
                  <div>
                    <dt>Oracle feed</dt>
                    <dd>Not connected</dd>
                  </div>
                  <div>
                    <dt>Transaction signer</dt>
                    <dd>Human only</dd>
                  </div>
                </dl>
              </div>
              <div className="ml-note-card">
                <ShieldCheck size={25} />
                <h3>Proposal, not permission.</h3>
                <p>
                  The advisor can explain the trade-offs. It cannot originate a
                  real loan or authorize a balance mutation.
                </p>
              </div>
            </aside>
          </>
        ) : (
          <>
            <article className="ml-main-card">
              <div className="ml-card-head">
                <CreditCard size={26} />
                <Badge>Widget sandbox</Badge>
              </div>
              <Eyebrow>03 / FIAT → USDC</Eyebrow>
              <h2>
                From card to capital.
                <br />
                <span>One clear entry point.</span>
              </h2>
              <p>
                Preview the funding experience. Hosted Circle checkout requires
                an authenticated wallet and configured onboarding.
              </p>
              <div className="ml-payment-methods">
                <button
                  aria-pressed={method === "card"}
                  onClick={() => setMethod("card")}
                >
                  <CreditCard size={20} />
                  Bank card
                </button>
                <button
                  aria-pressed={method === "apple_pay"}
                  onClick={() => setMethod("apple_pay")}
                >
                  Apple Pay
                </button>
              </div>
              <label className="ml-slider-label">
                Purchase amount / USD
                <input
                  aria-label="Onramp amount"
                  inputMode="decimal"
                  value={onramp}
                  onChange={(e) => setOnramp(e.target.value)}
                />
              </label>
              <div className="ml-card-preview">
                <div>
                  <CreditCard size={26} />
                  <Eyebrow>CHECKOUT PREVIEW / NOT A PAYMENT FORM</Eyebrow>
                </div>
                <strong>•••• &nbsp; •••• &nbsp; •••• &nbsp; 4242</strong>
                <span>Test layout only. Do not enter card details here.</span>
                <small>
                  DESTINATION <b>Arc · USDC</b>
                </small>
              </div>
              <button
                className="mp-button"
                disabled={busy || safeParse(onramp) <= 0n}
                onClick={async () => {
                  const d = await action("onramp/session", {
                    amount: onramp,
                    mode: "sandbox",
                  });
                  if (d) setSession(true);
                }}
              >
                Preview funding session <ArrowRight size={18} />
              </button>
              {session && (
                <div className="ml-feedback" role="status">
                  Sandbox session created. No card charged, no USDC deposited.
                </div>
              )}
            </article>
            <aside className="ml-aside">
              <div className="ml-note-card">
                <Eyebrow>SETTLEMENT NEEDS EVIDENCE</Eyebrow>
                <h3>A notification is not a deposit.</h3>
                <p>
                  A hosted widget event cannot credit your ledger. The backend
                  verifies the transaction on Arc before recognizing payment.
                </p>
                <dl>
                  <div>
                    <dt>Card / Apple Pay</dt>
                    <dd>Preview only</dd>
                  </div>
                  <div>
                    <dt>Hosted Circle widget</dt>
                    <dd>Not configured</dd>
                  </div>
                  <div>
                    <dt>Payment data</dt>
                    <dd>Not collected</dd>
                  </div>
                  <div>
                    <dt>On-chain verifier</dt>
                    <dd>2 confirmations</dd>
                  </div>
                </dl>
              </div>
              <div className="ml-note-card">
                <Eyebrow>UNIFIED BALANCE</Eyebrow>
                <h3>
                  Across chains.
                  <br />
                  Not assumed.
                </h3>
                <p>
                  App Kit Bridge and Gateway integration boundaries cover Base /
                  Arbitrum → Arc. No aggregated live balance is invented.
                </p>
              </div>
            </aside>
          </>
        )}
      </div>
      <footer className="ml-cockpit-footer">
        <span>
          <ShieldCheck size={16} />
          BigInt · 6-decimal USDC · proposal-only AI
        </span>
        <span>Chain 5042002 / testnet</span>
      </footer>
    </section>
  );
}
