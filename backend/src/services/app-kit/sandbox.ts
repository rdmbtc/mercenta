import { createHash } from "node:crypto";
import type { DB } from "../../db.js";
import { jsonSafe } from "../../money.js";
import { loanRisk } from "./math.js";
export function treasury(db: DB, actor: string) {
  db.prepare(
    "INSERT OR IGNORE INTO sandbox_treasury(actor,available_units) VALUES(?,'12400000000')",
  ).run(actor);
  return db
    .prepare("SELECT * FROM sandbox_treasury WHERE actor=?")
    .get(actor) as {
    available_units: string;
    deposited_units: string;
    debt_units: string;
    collateral_units: string;
  };
}
export function mutateSandbox(
  db: DB,
  actor: string,
  id: string,
  action: string,
  amount: bigint,
  collateral = 0n,
) {
  const fingerprint = createHash("sha256")
    .update(jsonSafe({ action, amount, collateral }))
    .digest("hex");
  return db.transaction(() => {
    const prior = db
      .prepare(
        "SELECT fingerprint,response FROM operations WHERE actor=? AND id=?",
      )
      .get(actor, id) as { fingerprint: string; response: string } | undefined;
    if (prior) {
      if (prior.fingerprint !== fingerprint)
        throw new Error("IDEMPOTENCY_CONFLICT");
      return JSON.parse(prior.response) as object;
    }
    const t = treasury(db, actor);
    let available = BigInt(t.available_units),
      deposited = BigInt(t.deposited_units),
      debt = BigInt(t.debt_units),
      col = BigInt(t.collateral_units);
    if (amount <= 0n) throw new Error("AMOUNT_MUST_BE_POSITIVE");
    if (action === "deposit") {
      if (available - amount < 3_150_000_000n)
        throw new Error("SANDBOX_RESERVE_BREACH");
      available -= amount;
      deposited += amount;
    } else if (action === "withdraw") {
      if (amount > deposited) throw new Error("INSUFFICIENT_DEPOSIT");
      deposited -= amount;
      available += amount;
    } else if (action === "borrow") {
      if (debt > 0n) throw new Error("ACTIVE_LOAN_EXISTS");
      if (!loanRisk(collateral, amount).allowed)
        throw new Error("LOAN_OVER_LTV");
      debt = amount;
      col = collateral;
      available += amount;
    } else if (action === "repay") {
      if (amount !== debt || amount > available)
        throw new Error("INVALID_REPAYMENT");
      available -= amount;
      debt = 0n;
      col = 0n;
    } else throw new Error("UNKNOWN_ACTION");
    db.prepare(
      "UPDATE sandbox_treasury SET available_units=?,deposited_units=?,debt_units=?,collateral_units=? WHERE actor=?",
    ).run(
      available.toString(),
      deposited.toString(),
      debt.toString(),
      col.toString(),
      actor,
    );
    const result = {
      mode: "sandbox",
      id,
      action,
      treasury: treasury(db, actor),
      message:
        "Simulation recorded. No transaction signed and no real funds moved.",
    };
    db.prepare("INSERT INTO operations VALUES(?,?,?,?)").run(
      actor,
      id,
      fingerprint,
      jsonSafe(result),
    );
    return result;
  })();
}
