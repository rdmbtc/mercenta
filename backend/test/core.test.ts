import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { parseMoney, formatMoney } from "../src/money.js";
import { openDb } from "../src/db.js";
import { evaluate, type PolicyInput } from "../src/services/policy/index.js";
import { projectYield, loanRisk } from "../src/services/app-kit/math.js";
import { postJournal, balance } from "../src/services/ledger/index.js";
import { mutateSandbox } from "../src/services/app-kit/sandbox.js";
import { advise, quota } from "../src/services/agent/index.js";
import { loadConfig } from "../src/config.js";
import { nativeToMicro } from "../src/services/arc/index.js";
import {
  encryptCode,
  decryptCode,
  requestRef,
} from "../src/services/fulfillment/index.js";
const base: PolicyInput = {
  confirmations: 2n,
  paid: 10_000_000n,
  sale: 10_000_000n,
  cost: 8_000_000n,
  replay: false,
  active: true,
  supplierReady: true,
  dailySpent: 0n,
  available: 20_000_000_000n,
  quoteAt: 1000,
  now: 2000,
};
test("money exact round trips including beyond Number.MAX_SAFE_INTEGER", () => {
  for (const x of ["1.000000", "0.000001", "900719925474.123456"])
    assert.equal(formatMoney(parseMoney(x)), x);
  assert.equal(parseMoney("1"), 1000000n);
  for (const x of ["1e6", "NaN", "-1", "1.0000001", " 1", "01"])
    assert.throws(() => parseMoney(x));
});
test("native 18 decimals convert without loss", () => {
  assert.equal(nativeToMicro(10n ** 18n), 1000000n);
  assert.throws(() => nativeToMicro(1n));
});
const failures: Partial<PolicyInput>[] = [
  { confirmations: 1n },
  { paid: 1n },
  { replay: true },
  { active: false },
  { supplierReady: false },
  { cost: 11_000_000n },
  { cost: 9_000_000n },
  { sale: 11_000_000n, paid: 11_000_000n },
  { dailySpent: 2_500_000_000n },
  { available: 10_000_000_000n },
  { quoteAt: 100000 },
];
failures.forEach((change, n) =>
  test("P" + (n + 1) + " blocks or escalates its violation", () => {
    const r = evaluate({ ...base, ...change });
    assert.equal(r.checks[n]?.pass, false);
    assert.equal(r.decision, n === 7 ? "ESCALATED" : "BLOCKED");
  }),
);
test("hard block outranks escalation; fresh boundary is deterministic", () => {
  assert.equal(evaluate(base).decision, "AUTO_APPROVED");
  assert.equal(
    evaluate({ ...base, sale: 100_000_000n, paid: 100_000_000n, active: false })
      .decision,
    "BLOCKED",
  );
  assert.equal(
    evaluate({ ...base, quoteAt: 0, now: 300000 }).checks[10]?.pass,
    true,
  );
});
test("yield pro-rata truncates to micro-units", () => {
  assert.equal(
    projectYield(parseMoney("1000"), 540n, 365).gainUnits,
    "54000000",
  );
  assert.throws(() => projectYield(1n, 540n, 0));
});
test("borrow has strict 75% LTV independent of health", () => {
  assert.equal(loanRisk(10_000_000n, parseMoney("6930")).allowed, true);
  assert.equal(loanRisk(10_000_000n, parseMoney("6930.000001")).allowed, false);
  assert.equal(loanRisk(0n, 1n).allowed, false);
  assert.equal(loanRisk(1n, 0n).healthFactorBps, null);
  assert.equal(
    loanRisk(10_000_000n, parseMoney("5000")).liquidationPriceUnits,
    "60606060607",
  );
});
test("sealed immutable balanced journal and currency isolation", () => {
  const d = openDb(":memory:");
  const lines = [
    {
      account: "arc:usdc:available",
      currency: "USDC" as const,
      direction: "DEBIT" as const,
      amount: 10n,
    },
    {
      account: "revenue:usdc",
      currency: "USDC" as const,
      direction: "CREDIT" as const,
      amount: 10n,
    },
  ];
  postJournal(d, "j", "tx:evidence", lines);
  assert.equal(balance(d, "arc:usdc:available"), 10n);
  assert.throws(() =>
    d.prepare("UPDATE ledger_entries SET amount_units=?").run("20"),
  );
  assert.throws(() => d.exec("DELETE FROM ledger_entries"));
  assert.throws(() =>
    d
      .prepare(
        "INSERT INTO ledger_entries(batch_id,account,currency,direction,amount_units) VALUES(?,?,?,?,?)",
      )
      .run("j", "a", "USDC", "DEBIT", "1"),
  );
  assert.throws(() =>
    postJournal(d, "bad", "w", [lines[0]!, { ...lines[1]!, currency: "USD" }]),
  );
  d.close();
});
test("sandbox idempotency and reserve, no journal pollution", () => {
  const d = openDb(":memory:"),
    id = randomUUID();
  assert.deepEqual(
    mutateSandbox(d, "a", id, "deposit", 1000000000n),
    mutateSandbox(d, "a", id, "deposit", 1000000000n),
  );
  assert.throws(() => mutateSandbox(d, "a", id, "deposit", 1n));
  assert.throws(() =>
    mutateSandbox(d, "a", randomUUID(), "deposit", 10000000000n),
  );
  assert.equal(
    d.prepare("SELECT COUNT(*) AS n FROM ledger_entries").get()?.n,
    0,
  );
  d.close();
});
test("quota 10 then exhausted, request replay does not recharge", async () => {
  const d = openDb(":memory:"),
    c = loadConfig({ NODE_ENV: "test" });
  const id = randomUUID();
  await advise(d, c, "a", id, "help", []);
  await advise(d, c, "a", id, "help", []);
  for (let i = 1; i < 10; i++)
    await advise(d, c, "a", randomUUID(), "help", []);
  assert.equal(quota(d, "a").remaining, 0);
  assert.equal(
    (await advise(d, c, "a", randomUUID(), "help", [])).code,
    "FREE_LIMIT_REACHED",
  );
  assert.equal(quota(d, "b").remaining, 10);
  d.close();
});
test("encrypted delivery authentication and deterministic request reference", () => {
  const key = "12".repeat(32),
    e = encryptCode("private delivery", key);
  assert.equal(decryptCode(e, key), "private delivery");
  assert.throws(() => decryptCode(e, "13".repeat(32)));
  assert.equal(requestRef("secret", "order"), requestRef("secret", "order"));
});
